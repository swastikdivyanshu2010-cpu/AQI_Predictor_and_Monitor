"""Parity test: ensure offline live forecast produces the identical prediction
to results.json for the held-out test evaluation days.
"""
import json
import os
import subprocess
import pytest


def test_offline_parity_with_results_json():
    csv_path = "data/delhi_daily_openaq.csv"
    if not os.path.exists(csv_path):
        pytest.skip(f"Test skipped: {csv_path} is absent.")

    results_file = "results.json"
    if not os.path.exists(results_file):
        pytest.fail(f"Missing {results_file} reference file.")

    with open(results_file) as f:
        results = json.load(f)

    # The last row in results.json test window
    last_day = results["days"][-1]
    ref_issued_on = last_day["issued_on"]
    ref_forecast_for = last_day["date"]
    ref_model = float(last_day["model"])
    ref_baseline = float(last_day["baseline"])
    ref_lower = float(last_day["lower"])
    ref_upper = float(last_day["upper"])
    ref_alert = bool(last_day["alert"])

    # Run forecast_live.py --offline --as-of <ref_issued_on> --output tests/latest_test.json
    out_json = "tests/latest_test.json"
    os.makedirs("tests", exist_ok=True)
    cmd = [
        "python",
        "forecast_live.py",
        "--offline",
        "--as-of",
        ref_issued_on,
        "--output",
        out_json,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0, f"forecast_live.py failed: {res.stderr}"

    with open(out_json) as f:
        live = json.load(f)

    # Parity assertions
    assert live["status"] == "ok"
    assert live["issued_on"] == ref_issued_on
    assert live["forecast_for"] == ref_forecast_for
    assert pytest.approx(live["model"], abs=0.1) == ref_model
    assert pytest.approx(live["baseline"], abs=0.1) == ref_baseline
    assert pytest.approx(live["lower"], abs=0.1) == ref_lower
    assert pytest.approx(live["upper"], abs=0.1) == ref_upper
    assert pytest.approx(live["lower_80"], abs=0.1) == ref_lower
    assert pytest.approx(live["upper_80"], abs=0.1) == ref_upper
    assert live["alert"] == ref_alert

    # Specific check for 306.8 on 2026-11-12
    if ref_issued_on == "2026-11-12":
        assert live["model"] == 306.8
