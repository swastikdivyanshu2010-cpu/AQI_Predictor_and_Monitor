"""Step 1b: real PM2.5 measurements for Delhi from OpenAQ (instead of model estimates)

Set your key as an environment variable so it never ends up on GitHub:
  Windows cmd:         set OPENAQ_API_KEY=your_key_here
  Windows PowerShell:  $env:OPENAQ_API_KEY="your_key_here"
Then run:  python load_openaq.py

Needs: data/delhi_daily.csv (from load_data.py, for the weather columns)
Output: data/delhi_daily_openaq.csv
"""
import os
import sys
import time

import pandas as pd
import requests

API_KEY = "ad87c26a2a37137be4868e459cf58ae214015a79c360d6b061c2f10e52b57ee7"
LAT, LON, RADIUS = 28.6139, 77.2090, 25000     # 25 km is the API maximum
START, END = "2024-01-01", "2026-11-13"
STATION_ID = None        # optionally set a location id from the printout to force a station
BASE = "https://api.openaq.org/v3"

if not API_KEY:
    sys.exit("Set the OPENAQ_API_KEY environment variable first (see top of this file).")
HEADERS = {"X-API-Key": API_KEY}


def api(path, **params):
    time.sleep(1)    # stay under the rate limit
    r = requests.get(f"{BASE}{path}", headers=HEADERS, params=params, timeout=60)
    if r.status_code != 200:
        sys.exit(f"OpenAQ error {r.status_code} on {path}: {r.text[:300]}")
    return r.json()


def to_utc(x):
    if isinstance(x, dict):
        x = x.get("utc")
    return pd.to_datetime(x, utc=True) if x else None


# 1) Find PM2.5 stations within 25 km of the city centre
locs = api("/locations", coordinates=f"{LAT},{LON}", radius=RADIUS,
           parameters_id=2, limit=1000)["results"]
cands = []
for loc in locs:
    sensor = next((s for s in loc.get("sensors", [])
                   if str(s.get("parameter", {}).get("name", "")).lower() in ("pm25", "pm2.5")),
                  None)
    if sensor is None:
        continue
    cands.append({"loc_id": loc["id"], "name": loc.get("name"), "sensor_id": sensor["id"],
                  "first": to_utc(loc.get("datetimeFirst")), "last": to_utc(loc.get("datetimeLast"))})
print(f"Found {len(cands)} PM2.5 stations near the centre.")
if not cands:
    sys.exit("No PM2.5 stations found. Use the Open-Meteo data (load_data.py) as your fallback.")

if STATION_ID is not None:
    cands = [c for c in cands if c["loc_id"] == STATION_ID]
else:
    cutoff = pd.Timestamp(END, tz="UTC") - pd.Timedelta(days=30)
    active = [c for c in cands if c["last"] is not None and c["last"] >= cutoff]
    cands = sorted(active or cands, key=lambda c: (c["first"] is None, c["first"]))[:6]


# 2) Download daily averages for each candidate and keep the most complete one
def fetch_daily(sensor_id):
    rows, page = [], 1
    while True:
        res = api(f"/sensors/{sensor_id}/days", datetime_from=f"{START}T00:00:00Z",
                  datetime_to=f"{END}T23:59:59Z", limit=1000, page=page)["results"]
        rows += res
        if len(res) < 1000:
            break
        page += 1
    out = {}
    for it in rows:
        s = ((it.get("period") or {}).get("datetimeFrom") or {}).get("local")
        v = it.get("value")
        if s and v is not None and v >= 0:
            out[pd.to_datetime(s[:10])] = v
    if rows and not out:
        print("Could not read this response format. First raw item:", rows[0])
    return pd.Series(out, dtype=float).sort_index()


best, best_series = None, pd.Series(dtype=float)
total_days = (pd.Timestamp(END) - pd.Timestamp(START)).days + 1
print("\nStation coverage (days with a PM2.5 reading in the date range):")
for c in cands:
    s = fetch_daily(c["sensor_id"])
    print(f"  location {c['loc_id']:>8}  {str(c['name'])[:40]:<40} {len(s):>5}/{total_days} days")
    if len(s) > len(best_series):
        best, best_series = c, s

if best is None or len(best_series) < 200:
    sys.exit("No station has enough data. Use the Open-Meteo data (load_data.py) as your fallback.")
print(f"\nUsing: {best['name']} (location {best['loc_id']}), {len(best_series)} days")

# 3) Merge with the weather columns and keep the model estimate for comparison
weather = pd.read_csv("data/delhi_daily.csv", parse_dates=["date"]).set_index("date")
weather = weather.rename(columns={"pm25": "pm25_model_estimate"})
df = weather.join(best_series.rename("pm25"), how="left")
print("Days without a measured value (dropped):", int(df["pm25"].isna().sum()))
df = df.dropna(subset=["pm25"])
df.to_csv("data/delhi_daily_openaq.csv")

# 4) Sanity checks, including how close the model estimates are to real measurements
print("\nRows:", len(df), "| from", df.index.min().date(), "to", df.index.max().date())
print("Days with measured PM2.5 above 35 ug/m3:", int((df["pm25"] > 35).sum()))
print("Mean measured PM2.5:", round(df["pm25"].mean(), 1),
      "| mean Open-Meteo estimate:", round(df["pm25_model_estimate"].mean(), 1))
print("Correlation (measured vs estimate):",
      round(df["pm25"].corr(df["pm25_model_estimate"]), 2))
print("Saved data/delhi_daily_openaq.csv")