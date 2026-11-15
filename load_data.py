"""Step 1: download daily PM2.5 + weather for New Delhi and save data/delhi_daily.csv

Run:  python load_data.py
Needs: pip install pandas requests
Note: Open-Meteo air quality values are model estimates, not station measurements.
      Say this in your write-up and credit Open-Meteo.
"""
import os
import requests
import pandas as pd

CITY = "New Delhi"
LAT, LON = 28.6139, 77.2090      # New Delhi coordinates (no lookup needed)
START = "2024-01-01"             # try an earlier date later to see how far back data goes
END = "2026-11-13"


def get_json(url, params):
    r = requests.get(url, params=params, timeout=60)
    r.raise_for_status()
    return r.json()


# 1) Hourly PM2.5 -> daily average
aq = get_json("https://air-quality-api.open-meteo.com/v1/air-quality", {
    "latitude": LAT, "longitude": LON, "hourly": "pm2_5",
    "start_date": START, "end_date": END, "timezone": "auto"})
hourly = pd.DataFrame(aq["hourly"])
hourly["time"] = pd.to_datetime(hourly["time"])
pm25 = hourly.set_index("time")["pm2_5"].resample("D").mean().rename("pm25")

# 2) Daily weather (wind and rain strongly affect air quality)
wx = get_json("https://archive-api.open-meteo.com/v1/archive", {
    "latitude": LAT, "longitude": LON, "start_date": START, "end_date": END,
    "daily": ("temperature_2m_mean,wind_speed_10m_max,"
              "wind_direction_10m_dominant,precipitation_sum,"
              "relative_humidity_2m_mean,temperature_2m_max,temperature_2m_min"),
    "timezone": "auto"})
weather = pd.DataFrame(wx["daily"])
weather["time"] = pd.to_datetime(weather["time"])
weather = weather.set_index("time")

# 3) Merge and save
df = weather.join(pm25, how="inner")
df.index.name = "date"
os.makedirs("data", exist_ok=True)
df.to_csv("data/delhi_daily.csv")

# 4) Sanity checks
print("City:", CITY)
print("Rows:", len(df), "| from", df.index.min().date(), "to", df.index.max().date())
print("Missing values per column:\n", df.isna().sum())
print("Days with PM2.5 above 35 µg/m³:", int((df["pm25"] > 35).sum()))
print(df.head())