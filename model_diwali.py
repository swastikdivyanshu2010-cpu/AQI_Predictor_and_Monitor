"""Diwali experiment: do calendar features and a log-ratio target help?

Run:  python model_diwali.py     (same data file logic as model.py)
Needs: pip install pandas numpy scikit-learn

It trains five variants on the same train/test split and reports error overall,
in the pollution season, and in the Diwali window, so you can show where a model
fails and whether knowing the Diwali date helps. Report ALL variants in your
write-up, not just the best one.
"""
import os

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

TEST_DAYS = 120
# Diwali (Lakshmi Puja) dates in Delhi. Cite your sources in the write-up.
DIWALI = pd.to_datetime(["2023-11-12", "2024-10-31", "2025-10-20", "2026-11-08"])

DATA_PATH = ("data/delhi_daily_openaq.csv" if os.path.exists("data/delhi_daily_openaq.csv")
             else "data/delhi_daily.csv")
print("Using data file:", DATA_PATH)
df = pd.read_csv(DATA_PATH, parse_dates=["date"]).set_index("date").sort_index()
df = df.asfreq("D").interpolate(limit=3)

# ---------- Features (same as model.py) ----------
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

# ---------- Diwali features, relative to the day being forecast ----------
# The Diwali date is known in advance, so this is legitimate (no leakage).
target_date = df.index + pd.Timedelta(days=1)
diffs = np.array([[(td - d).days for d in DIWALI] for td in target_date])
offset = diffs[np.arange(len(diffs)), np.abs(diffs).argmin(axis=1)]
X["diwali_offset"] = np.clip(offset, -10, 10)                     # days from Diwali, capped
X["diwali_window"] = ((offset >= -2) & (offset <= 5)).astype(int)  # 2 days before to 5 after

data = X.assign(target=df["pm25"].shift(-1)).dropna()
data["target_date"] = data.index + pd.Timedelta(days=1)
all_feats = [c for c in data.columns if c not in ("target", "target_date")]
base_feats = [c for c in all_feats if not c.startswith("diwali")]

train, test = data.iloc[:-TEST_DAYS], data.iloc[-TEST_DAYS:]
actual = test["target"]
print(f"Train: {train.index.min().date()} to {train.index.max().date()} ({len(train)} days, "
      f"{int(train['diwali_window'].sum())} in a Diwali window)")
print(f"Test:  {test.index.min().date()} to {test.index.max().date()} ({len(test)} days, "
      f"{int(test['diwali_window'].sum())} in a Diwali window)\n")


def gbm():
    return HistGradientBoostingRegressor(max_depth=3, learning_rate=0.05, max_iter=300,
                                         random_state=0)


# ---------- Five variants ----------
ratio_train = np.log(train["target"] / train["pm25_today"])   # log(tomorrow / today)
today = test["pm25_today"]
preds = {"Persistence (tomorrow = today)": today}
preds["GBM"] = pd.Series(gbm().fit(train[base_feats], train["target"])
                         .predict(test[base_feats]), index=test.index)
preds["GBM + Diwali features"] = pd.Series(gbm().fit(train[all_feats], train["target"])
                                           .predict(test[all_feats]), index=test.index)
preds["GBM log-ratio"] = today * np.exp(gbm().fit(train[base_feats], ratio_train)
                                        .predict(test[base_feats]))
preds["GBM log-ratio + Diwali"] = today * np.exp(gbm().fit(train[all_feats], ratio_train)
                                                 .predict(test[all_feats]))

# ---------- Evaluate by period ----------
td = test["target_date"]
in_season = (td.dt.month > 10) | ((td.dt.month == 10) & (td.dt.day >= 15))
in_diwali = test["diwali_window"] == 1
periods = {"all": pd.Series(True, index=test.index), "season (from 15 Oct)": in_season,
           "Diwali window": in_diwali, "before 15 Oct": ~in_season}
print("Days per period:", {k: int(v.sum()) for k, v in periods.items()})

rows = []
for name, p in preds.items():
    r = {"variant": name,
         "RMSE all": mean_squared_error(actual, p) ** 0.5}
    for pname, mask in periods.items():
        r[f"MAE {pname}"] = mean_absolute_error(actual[mask], p[mask]) if mask.any() else np.nan
    rows.append(r)
print("\nError by period (µg/m³, lower is better):")
print(pd.DataFrame(rows).round(1).to_string(index=False))

# ---------- Day-by-day view of the Diwali window ----------
show = pd.DataFrame({"forecast_for": td.dt.strftime("%Y-%m-%d"), "actual": actual,
                     "persistence": preds["Persistence (tomorrow = today)"],
                     "GBM": preds["GBM"], "GBM+Diwali": preds["GBM + Diwali features"],
                     "logratio+Diwali": preds["GBM log-ratio + Diwali"]})
print("\nDiwali window, day by day:")
print(show[in_diwali].round(0).to_string(index=False))
print("\nCaution: training has only a few Diwali windows, and this test has one. "
      "Treat differences as suggestive, not proven.")