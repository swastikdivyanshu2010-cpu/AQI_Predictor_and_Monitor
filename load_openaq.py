"""Step 1b: real PM2.5 measurements for Delhi from OpenAQ (instead of model estimates)

Set your key as an environment variable:
  Windows cmd:         set OPENAQ_API_KEY=your_key_here
  Windows PowerShell:  $env:OPENAQ_API_KEY="your_key_here"
  Linux/macOS:         export OPENAQ_API_KEY=your_key_here
Then run:  python load_openaq.py [--end YYYY-MM-DD]

Needs: data/delhi_daily.csv (from load_data.py, for the weather columns)
Outputs:
  - data/delhi_daily_openaq.csv
  - data/station.json
"""
import argparse
import datetime
import json
import os
import sys
import time

import pandas as pd
import requests

API_KEY = os.environ.get("OPENAQ_API_KEY")
if not API_KEY:
    sys.exit(
        "ERROR: OPENAQ_API_KEY environment variable is not set.\n"
        "Set it in your shell or CI environment:\n"
        "  PowerShell: $env:OPENAQ_API_KEY=\"<your_key>\"\n"
        "  Bash:       export OPENAQ_API_KEY=\"<your_key>\""
    )

HEADERS = {"X-API-Key": API_KEY}
BASE = "https://api.openaq.org/v3"
LAT, LON, RADIUS = 28.6139, 77.2090, 25000     # 25 km is the API maximum
START = "2024-01-01"

parser = argparse.ArgumentParser(description="Download PM2.5 station data from OpenAQ")
parser.add_argument("--end", default=datetime.date.today().strftime("%Y-%m-%d"),
                    help="End date YYYY-MM-DD (defaults to today)")
parser.add_argument("--station-id", type=int, default=None,
                    help="Force specific location ID")
args = parser.parse_args()
END = args.end
STATION_ID = args.station_id


def api(path, **params):
    time.sleep(1)    # stay under the 1s rate limit
    r = requests.get(f"{BASE}{path}", headers=HEADERS, params=params, timeout=60)
    if r.status_code != 200:
        sys.exit(f"OpenAQ error {r.status_code} on {path}: {r.text[:300]}")
    return r.json()


def to_utc(x):
    if isinstance(x, dict):
        x = x.get("utc")
    return pd.to_datetime(x, utc=True) if x else None


# 1) Find PM2.5 stations within 25 km of the city centre (or reuse data/station.json)
station_file = "data/station.json"
chosen_station = None

if STATION_ID is None and os.path.exists(station_file):
    try:
        with open(station_file) as f:
            saved = json.load(f)
            if "sensor_id" in saved and "loc_id" in saved:
                chosen_station = saved
                print(f"Loaded existing station from {station_file}: {saved.get('name')} (loc {saved.get('loc_id')}, sensor {saved.get('sensor_id')})")
    except Exception as e:
        print(f"Could not read {station_file}: {e}")

if chosen_station is None:
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
        sys.exit("No PM2.5 stations found. Use Open-Meteo fallback.")

    if STATION_ID is not None:
        cands = [c for c in cands if c["loc_id"] == STATION_ID]
    else:
        cutoff = pd.Timestamp(END, tz="UTC") - pd.Timedelta(days=30)
        active = [c for c in cands if c["last"] is not None and c["last"] >= cutoff]
        cands = sorted(active or cands, key=lambda c: (c["first"] is None, c["first"]))[:6]
else:
    cands = [chosen_station]


# 2) Download daily averages for candidates
def fetch_daily(sensor_id):
    rows, page = [], 1
    while True:
        res = api(f"/sensors/{sensor_id}/days", date_from=START, date_to=END, limit=1000, page=page)["results"]
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
    return pd.Series(out, dtype=float).sort_index()


best, best_series = None, pd.Series(dtype=float)
total_days = (pd.Timestamp(END) - pd.Timestamp(START)).days + 1
for c in cands:
    s = fetch_daily(c["sensor_id"])
    print(f"  location {c['loc_id']:>8}  {str(c['name'])[:40]:<40} {len(s):>5}/{total_days} days")
    if len(s) > len(best_series):
        best, best_series = c, s

if best is None or len(best_series) < 200:
    sys.exit("No station has enough data. Use Open-Meteo fallback.")

print(f"\nUsing: {best['name']} (location {best['loc_id']}), {len(best_series)} days")

# Save station metadata
os.makedirs("data", exist_ok=True)
station_info = {
    "loc_id": best["loc_id"],
    "name": best["name"],
    "sensor_id": best["sensor_id"],
    "parameter": "pm25",
    "latitude": LAT,
    "longitude": LON,
    "timezone": "Asia/Kolkata"
}
with open("data/station.json", "w") as f:
    json.dump(station_info, f, indent=2)
print("Saved data/station.json")

# 3) Merge with weather columns
if os.path.exists("data/delhi_daily.csv"):
    weather = pd.read_csv("data/delhi_daily.csv", parse_dates=["date"]).set_index("date")
    weather = weather.rename(columns={"pm25": "pm25_model_estimate"})
    df = weather.join(best_series.rename("pm25"), how="left")
    df = df.dropna(subset=["pm25"])
    df.to_csv("data/delhi_daily_openaq.csv")
    print("Saved data/delhi_daily_openaq.csv with", len(df), "rows")
