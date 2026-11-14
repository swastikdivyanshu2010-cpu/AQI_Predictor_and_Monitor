import json
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, precision_score, recall_score

# Load OpenAQ + Open-Meteo processed dataset
DATA_PATH = "data/delhi_daily_openaq.csv" if os.path.exists("data/delhi_daily_openaq.csv") else "data/delhi_daily.csv"
print("Reading:", DATA_PATH)
df = pd.read_csv(DATA_PATH, parse_dates=["date"]).set_index("date").sort_index()
df = df.asfreq("D").interpolate(limit=3)

# 1. Feature Engineering
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

# Target is next-day PM2.5
data = X.assign(target=df["pm25"].shift(-1)).dropna()
data["target_date"] = data.index + pd.Timedelta(days=1)
features = [c for c in data.columns if c not in ("target", "target_date")]

TEST_DAYS = 120
train, test = data.iloc[:-TEST_DAYS], data.iloc[-TEST_DAYS:]
actual = test["target"].values
today = test["pm25_today"].values

# Model: HistGradientBoosting
gbm = HistGradientBoostingRegressor(max_depth=3, learning_rate=0.05, max_iter=300, random_state=0)
gbm.fit(train[features], train["target"])
test_preds = gbm.predict(test[features])
train_preds = gbm.predict(train[features])

# Residuals for 80% prediction interval
resids = np.abs(train["target"].values - train_preds)
q80 = float(np.quantile(resids, 0.80))
lower = np.maximum(test_preds - q80, 0.0)
upper = test_preds + q80
mid_risk = test_preds + 0.5 * q80

# 80% Range coverage
in_range = (actual >= lower) & (actual <= upper)
range_coverage_80 = float(np.round(np.mean(in_range), 3))

# Final window MAE
mae_model = float(np.round(mean_absolute_error(actual, test_preds), 2))
mae_baseline = float(np.round(mean_absolute_error(actual, today), 2))

# Walk-forward backtest (5 folds of 60 days)
fold_size = 60
n_folds = 5
bt_actuals, bt_model, bt_base = [], [], []
for i in range(n_folds):
    test_end = len(data) - i * fold_size
    test_start = test_end - fold_size
    tr = data.iloc[:test_start]
    te = data.iloc[test_start:test_end]
    m = HistGradientBoostingRegressor(max_depth=3, learning_rate=0.05, max_iter=200, random_state=0)
    m.fit(tr[features], tr["target"])
    bt_model.extend(m.predict(te[features]))
    bt_base.extend(te["pm25_today"])
    bt_actuals.extend(te["target"])

backtest_mae_model = float(np.round(mean_absolute_error(bt_actuals, bt_model), 2))
backtest_mae_baseline = float(np.round(mean_absolute_error(bt_actuals, bt_base), 2))

# Alert Threshold & Rules
# Standard Indian NAAQS 24-hr threshold for PM2.5 = 60 ug/m3
THRESHOLD = 60
truth = actual > THRESHOLD

# Default alert rule: Conservative (Upper Bound > threshold) to protect school kids
alert_ct = upper > THRESHOLD
alert_pt = test_preds > THRESHOLD

precision = float(np.round(precision_score(truth, alert_ct, zero_division=0), 3))
recall = float(np.round(recall_score(truth, alert_ct, zero_division=0), 3))

# Diwali dates
DIWALI_DATES = ["2023-11-12", "2024-10-31", "2025-10-20", "2026-11-08"]
diwali_dt = pd.to_datetime(DIWALI_DATES)

# Build threshold table
THRESHOLDS = [35, 60, 90, 120, 250]
threshold_table = []
for t in THRESHOLDS:
    act_high = actual > t
    p_high = test_preds > t
    c_high = upper > t
    r_high = mid_risk > t
    threshold_table.append({
        "threshold": t,
        "days_above": int(np.sum(act_high)),
        "pt_hit": int(np.sum(act_high & p_high)),
        "pt_miss": int(np.sum(act_high & ~p_high)),
        "pt_fa": int(np.sum(~act_high & p_high)),
        "ct_hit": int(np.sum(act_high & c_high)),
        "ct_miss": int(np.sum(act_high & ~c_high)),
        "ct_fa": int(np.sum(~act_high & c_high)),
        "pr_hit": int(np.sum(act_high & r_high)),
        "pr_miss": int(np.sum(act_high & ~r_high)),
        "pr_fa": int(np.sum(~act_high & r_high)),
    })

# Build days array
days = []
for i, (issued_idx, row) in enumerate(test.iterrows()):
    target_dt = issued_idx + pd.Timedelta(days=1)
    
    # Check diwali window: within -2 to +5 days of any diwali date
    diffs = [(target_dt - d).days for d in diwali_dt]
    closest_offset = min(diffs, key=abs)
    in_diwali = bool(-2 <= closest_offset <= 5)
    
    # In season: target_date in winter pollution season (from Oct 15 onwards)
    in_season = bool((target_dt.month > 10) or (target_dt.month == 10 and target_dt.day >= 15))
    
    days.append({
        "issued_on": issued_idx.strftime("%Y-%m-%d"),
        "date": target_dt.strftime("%Y-%m-%d"),
        "actual": float(np.round(actual[i], 1)),
        "model": float(np.round(test_preds[i], 1)),
        "lower": float(np.round(lower[i], 1)),
        "upper": float(np.round(upper[i], 1)),
        "baseline": float(np.round(today[i], 1)),
        "alert": bool(upper[i] > THRESHOLD),
        "alert_point_forecast": bool(test_preds[i] > THRESHOLD),
        "in_diwali_window": in_diwali,
        "in_season": in_season
    })

results = {
    "city": "New Delhi",
    "data_source": "OpenAQ (PM2.5 station) + Open-Meteo (Weather)",
    "model_name": "Gradient Boosting Regressor (HistGradientBoosting)",
    "threshold": THRESHOLD,
    "alert_rule": "Conservative: Alert if 80% Upper Bound > threshold (Prioritises Child Safety)",
    "diwali_dates": DIWALI_DATES,
    "metrics": {
        "mae_model": mae_model,
        "mae_baseline": mae_baseline,
        "backtest_mae_model": backtest_mae_model,
        "backtest_mae_baseline": backtest_mae_baseline,
        "range_coverage_80": range_coverage_80,
        "precision": precision,
        "recall": recall
    },
    "threshold_table": threshold_table,
    "days": days
}

with open("results.json", "w") as f:
    json.dump(results, f, indent=2)

print("Saved results.json with", len(days), "days.")
print("Metrics:", results["metrics"])
