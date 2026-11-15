"""Reproduce training from export_final_results.py and serialize the frozen model.

Outputs:
  - models/model.joblib
  - models/meta.json
"""
import datetime
import json
import os
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import HistGradientBoostingRegressor

from features import FEATURE_COLUMNS, compute_features

DATA_PATH = "data/delhi_daily_openaq.csv" if os.path.exists("data/delhi_daily_openaq.csv") else "data/delhi_daily.csv"
print(f"Loading training dataset from: {DATA_PATH}")

df = pd.read_csv(DATA_PATH, parse_dates=["date"]).set_index("date").sort_index()
df = df.asfreq("D").interpolate(limit=3)

# 1. Feature Engineering
X = compute_features(df)
data = X.assign(target=df["pm25"].shift(-1)).dropna()

TEST_DAYS = 120
train, test = data.iloc[:-TEST_DAYS], data.iloc[-TEST_DAYS:]

print(f"Train date range: {train.index.min().date()} to {train.index.max().date()} ({len(train)} days)")
print(f"Test date range:  {test.index.min().date()} to {test.index.max().date()} ({len(test)} days)")

# 2. Train frozen HistGradientBoostingRegressor
gbm = HistGradientBoostingRegressor(
    max_depth=3,
    learning_rate=0.05,
    max_iter=300,
    random_state=0,
)
gbm.fit(train[FEATURE_COLUMNS], train["target"])

# 3. Compute 80th and 90th percentile of absolute training residuals (overall and monthly)
train_preds = gbm.predict(train[FEATURE_COLUMNS])
train_resids = np.abs(train["target"].values - train_preds)
q80 = float(np.round(np.quantile(train_resids, 0.80), 4))
q90 = float(np.round(np.quantile(train_resids, 0.90), 4))
print(f"Computed q80 margin: {q80:.2f} µg/m³")
print(f"Computed q90 margin: {q90:.2f} µg/m³")

monthly_q80 = {}
monthly_q90 = {}
train_months = train.index.month
for m in range(1, 13):
    m_mask = train_months == m
    if np.sum(m_mask) > 0:
        monthly_q80[str(m)] = float(np.round(np.quantile(train_resids[m_mask], 0.80), 2))
        monthly_q90[str(m)] = float(np.round(np.quantile(train_resids[m_mask], 0.90), 2))
    else:
        monthly_q80[str(m)] = q80
        monthly_q90[str(m)] = q90

# 4. Serialize model and metadata
os.makedirs("models", exist_ok=True)
model_path = "models/model.joblib"
joblib.dump(gbm, model_path)
print(f"Saved model to: {model_path}")

meta = {
    "model_name": "HistGradientBoostingRegressor",
    "model_params": {
        "max_depth": 3,
        "learning_rate": 0.05,
        "max_iter": 300,
        "random_state": 0,
    },
    "features": FEATURE_COLUMNS,
    "feature_count": len(FEATURE_COLUMNS),
    "q80": q80,
    "q90": q90,
    "monthly_q80": monthly_q80,
    "monthly_q90": monthly_q90,
    "train_date_range": [str(train.index.min().date()), str(train.index.max().date())],
    "train_rows": len(train),
    "test_rows": len(test),
    "model_trained_through": str(train.index.max().date()),
    "sklearn_version": sklearn.__version__,
    "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}

meta_path = "models/meta.json"
with open(meta_path, "w") as f:
    json.dump(meta, f, indent=2)
print(f"Saved metadata to: {meta_path}")
