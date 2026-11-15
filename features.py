"""Shared feature engineering module for PM2.5 forecasting in New Delhi.

Used by both training (export_final_results.py, train_and_save.py) and
live inference (forecast_live.py) to prevent train/serve skew.
"""
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "pm25_today",
    "pm25_lag1",
    "pm25_lag2",
    "pm25_lag3",
    "pm25_lag6",
    "pm25_mean3",
    "pm25_mean7",
    "temp",
    "wind_speed",
    "wind_dir_sin",
    "wind_dir_cos",
    "rain",
    "season_sin",
    "season_cos",
    "humidity",
    "temp_range",
    "wind_calm",
    "diwali_window",
]

DIWALI_DATES = ["2023-11-12", "2024-10-31", "2025-10-20", "2026-11-08"]


def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build the 18 feature columns from daily PM2.5 and weather data.
    
    Expects df with DatetimeIndex and columns:
      - pm25
      - temperature_2m_mean
      - wind_speed_10m_max
      - wind_direction_10m_dominant
      - precipitation_sum
    Optional (gracefully handled if missing):
      - relative_humidity_2m_mean
      - temperature_2m_max
      - temperature_2m_min
    """
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

    # New atmospheric features (backward compatible)
    if "relative_humidity_2m_mean" in df.columns:
        X["humidity"] = df["relative_humidity_2m_mean"]
    else:
        X["humidity"] = np.nan

    if "temperature_2m_max" in df.columns and "temperature_2m_min" in df.columns:
        X["temp_range"] = df["temperature_2m_max"] - df["temperature_2m_min"]
    else:
        X["temp_range"] = np.nan

    if "wind_speed_10m_max" in df.columns:
        X["wind_calm"] = (df["wind_speed_10m_max"] < 1.5).astype(float)
    else:
        X["wind_calm"] = np.nan

    X["diwali_window"] = [
        1.0 if is_diwali_window(dt) else 0.0 for dt in df.index
    ]

    return X[FEATURE_COLUMNS]


def is_diwali_window(target_date: pd.Timestamp) -> bool:
    """Check if target_date falls within -2 to +5 days of any known Diwali date."""
    diwali_dt = pd.to_datetime(DIWALI_DATES)
    diffs = [(target_date - d).days for d in diwali_dt]
    closest_offset = min(diffs, key=abs)
    return bool(-2 <= closest_offset <= 5)
