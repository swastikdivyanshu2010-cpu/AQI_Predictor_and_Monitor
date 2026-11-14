"""Step 2: baselines, model, alert-threshold analysis, and results.json export

Run:  python model.py        (needs data/delhi_daily.csv from load_data.py)
Needs: pip install pandas numpy scikit-learn matplotlib
Outputs: results.json (for the app), forecast_vs_actual.png (for the write-up)
"""
import json
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Ridge
from sklearn.metrics import (mean_absolute_error, mean_squared_error,
                             precision_score, recall_score)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

TEST_DAYS = 120          # most recent days, never used for training
ALERT_THRESHOLD = 60     # threshold used for the app (change after you compare)
THRESHOLDS = [35, 60, 90, 120]
CITY = "New Delhi"

# ---------- 1) Load and build features ----------
DATA_PATH = ("data/delhi_daily_openaq.csv" if os.path.exists("data/delhi_daily_openaq.csv")
             else "data/delhi_daily.csv")
print("Using data file:", DATA_PATH)
df = pd.read_csv(DATA_PATH, parse_dates=["date"]).set_index("date").sort_index()
df = df.asfreq("D").interpolate(limit=3)

X = pd.DataFrame(index=df.index)
X["pm25_today"] = df["pm25"]
for k in (1, 2, 3, 6):
    X[f"pm25_lag{k}"] = df["pm25"].shift(k)
X["pm25_mean3"] = df["pm25"].rolling(3).mean()
X["pm25_mean7"] = df["pm25"].rolling(7).mean()
X["temp"] = df["temperature_2m_mean"]
X["wind_speed"] = df["wind_speed_10m_max"]
rad = np.deg2rad(df["wind_direction_10m_dominant"])
X["wind_dir_sin"], X["wind_dir_cos"] = np.sin(rad), np.cos(rad)
X["rain"] = df["precipitation_sum"]
doy = df.index.dayofyear
X["season_sin"] = np.sin(2 * np.pi * doy / 365.25)
X["season_cos"] = np.cos(2 * np.pi * doy / 365.25)

# Target: tomorrow's PM2.5. Each row is "the day the forecast is issued".
data = X.assign(target=df["pm25"].shift(-1)).dropna()
features = [c for c in data.columns if c != "target"]

# ---------- 2) Time-based split (never shuffle) ----------
train, test = data.iloc[:-TEST_DAYS], data.iloc[-TEST_DAYS:]
actual = test["target"]
print(f"Train: {train.index.min().date()} to {train.index.max().date()} ({len(train)} days)")
print(f"Test:  {test.index.min().date()} to {test.index.max().date()} ({len(test)} days)\n")

# ---------- 3) Baselines and models ----------
preds = {
    "Baseline: tomorrow = today": test["pm25_today"],
    "Baseline: 7-day average": test["pm25_mean7"],
}
ridge = make_pipeline(StandardScaler(), Ridge(alpha=1.0)).fit(train[features], train["target"])
gbm = HistGradientBoostingRegressor(max_depth=3, learning_rate=0.05, max_iter=300,
                                    random_state=0).fit(train[features], train["target"])
preds["Ridge regression"] = pd.Series(ridge.predict(test[features]), index=test.index)
preds["Gradient boosting"] = pd.Series(gbm.predict(test[features]), index=test.index)

rows = []
for name, p in preds.items():
    rows.append({"model": name,
                 "MAE": mean_absolute_error(actual, p),
                 "RMSE": mean_squared_error(actual, p) ** 0.5})
print("Test-set error (ug/m3, lower is better):")
print(pd.DataFrame(rows).round(1).to_string(index=False))

# Decide your main model BEFORE looking at test results, to keep the test honest.
model_name = "Gradient boosting"
best = preds[model_name]
base = preds["Baseline: tomorrow = today"]

# ---------- 4) Alert thresholds: missed warnings vs false alarms ----------
print(f"\nAlert analysis ({model_name} vs 'tomorrow = today'):")
alert_rows = []
for t in THRESHOLDS:
    truth = actual > t
    alert_rows.append({
        "threshold": t,
        "days_above": f"{int(truth.sum())} ({truth.mean():.0%})",
        "model_precision": precision_score(truth, best > t, zero_division=0),
        "model_recall": recall_score(truth, best > t, zero_division=0),
        "persist_precision": precision_score(truth, base > t, zero_division=0),
        "persist_recall": recall_score(truth, base > t, zero_division=0),
    })
print(pd.DataFrame(alert_rows).round(2).to_string(index=False))
print("(An 'always alert' rule has recall 1.0 and precision equal to the % of days above.)")

# ---------- 5) Where does it fail? ----------
worst = pd.DataFrame({"actual": actual, "model": best, "persistence": base})
worst["abs_error"] = (worst["actual"] - worst["model"]).abs()
print("\nFive largest errors (index = day the forecast was issued):")
print(worst.sort_values("abs_error", ascending=False).head(5).round(1))

# ---------- 6) What drives the forecast? ----------
imp = permutation_importance(gbm, test[features], actual, n_repeats=20, random_state=0,
                             scoring="neg_mean_absolute_error")
print("\nMost important features (permutation importance, higher = matters more):")
print(pd.Series(imp.importances_mean, index=features).sort_values(ascending=False).head(6).round(2))

# ---------- 7) Plot for the write-up ----------
dates = test.index + pd.Timedelta(days=1)
plt.figure(figsize=(11, 4))
plt.plot(dates, actual, label="Actual", linewidth=2)
plt.plot(dates, best, label=model_name)
plt.plot(dates, base, label="Baseline: tomorrow = today", alpha=0.6)
plt.axhline(ALERT_THRESHOLD, color="red", linestyle="--", label=f"Alert threshold ({ALERT_THRESHOLD})")
plt.ylabel("PM2.5 (ug/m3)")
plt.title(f"{CITY}: next-day PM2.5 forecast on unseen test days")
plt.legend()
plt.tight_layout()
plt.savefig("forecast_vs_actual.png", dpi=150)

# ---------- 8) Export results.json for the app ----------
truth = actual > ALERT_THRESHOLD
results = {
    "city": CITY,
    "data_source": DATA_PATH,
    "threshold": ALERT_THRESHOLD,
    "model_name": model_name,
    "metrics": {
        "mae_model": round(mean_absolute_error(actual, best), 2),
        "mae_baseline": round(mean_absolute_error(actual, base), 2),
        "precision": round(precision_score(truth, best > ALERT_THRESHOLD, zero_division=0), 3),
        "recall": round(recall_score(truth, best > ALERT_THRESHOLD, zero_division=0), 3),
    },
    "days": [
        {"issued_on": i.strftime("%Y-%m-%d"),
         "date": (i + pd.Timedelta(days=1)).strftime("%Y-%m-%d"),
         "actual": round(float(a), 1), "model": round(float(m), 1),
         "baseline": round(float(b), 1), "alert": bool(m > ALERT_THRESHOLD)}
        for i, a, m, b in zip(test.index, actual, best, base)
    ],
}
with open("results.json", "w") as f:
    json.dump(results, f, indent=2)
print("\nSaved results.json and forecast_vs_actual.png")