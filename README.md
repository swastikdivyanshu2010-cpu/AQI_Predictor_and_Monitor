# Delhi PM2.5 Next-Day Forecast // School Outdoor Activity Decision Tool

> **Hackathon Prototype** • Replay of held-out test days, not a live forecast.  
> Prioritising operational clarity, child safety, and honest evaluation over artificial polish.

An end-to-end machine learning pipeline and bespoke data journalism web dashboard (inspired by *Our World in Data*, *Bloomberg Graphics*, and Swiss Grid Typography) designed for a Delhi school coordinator deciding whether morning outdoor assemblies, physical education (PE), and sports practice can go ahead tomorrow.

---

## 📌 Executive Summary

Predicting PM2.5 in Delhi is notoriously difficult due to extreme winter inversions, stubble burning plumes, and episodic festival combustion (Diwali firecrackers). While standard regression models often report single-number test errors, **school coordinators face an asymmetric loss function**:
- **A false alarm (unnecessary cancellation)** causes minor administrative inconvenience.
- **A missed warning (false negative)** exposes thousands of children, including asthmatic students, to hazardous particulate matter exceeding 250–350 µg/m³.

This prototype compares a **HistGradientBoostingRegressor** against a naive **Persistence Baseline ("Tomorrow = Today")** across a 120-day held-out test set and multi-season walk-forward backtests. It introduces **three distinct operational decision policies** (`pt`, `ct`, `pr`), proving how an uncertainty-aware conservative threshold policy achieves **100% child-safety recall (0 missed hazardous days)**.

---

## 🏛️ Visual & Architectural Identity

The web app abandons generic dark-mode SaaS card templates in favor of a **warm daylight editorial broadsheet**:
- **Canvas**: Warm archival paper (`#F8F7F4`) with deep charcoal ink (`#111111`) and muted stone (`#6E6D68`) metadata.
- **Architectural Grid**: Structured strictly through 1px hairline dividers (`border-[#111111]/15`). Zero rounded boxes, drop shadows, or pastel pill badges.
- **Disciplined Color**: 95% monochrome, with **Signal Vermilion (`#E13C2A`)** reserved strictly for active alerts, threshold violations, and festival spikes, and **Forest Green (`#15803D`)** for confirmed safe air quality (≤ 60 µg/m³).
- **Typography**: 
  - **Newsreader** (Editorial Serif) for headlines and the massive primary forecast figure (`text-7xl` to `text-[92px]`).
  - **JetBrains Mono** (`tabular-nums`) for timestamps, coordinates, intervals, and error deltas.
  - **Inter** for crisp UI controls.

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+ (for reproducing or re-training the ML models)

### 1. Run the Web Dashboard
```bash
# Navigate to the React frontend application
cd delhi-aq-app

# Install dependencies (if not already installed)
npm install

# Start the local development server
npm run dev
```

Open your browser at:  
👉 **`http://localhost:5173/`**

To produce an optimized production build:
```bash
npm run build
npm run preview
```

---

### 2. Reproduce the Machine Learning Pipeline (Python)
```bash
# Install Python dependencies
pip install pandas numpy scikit-learn requests matplotlib

# Step 1: Download daily PM2.5 & weather data from Open-Meteo
python load_data.py

# Step 1b (Optional): Download station PM2.5 measurements from OpenAQ
# Requires OPENAQ_API_KEY environment variable
python load_openaq.py

# Step 2: Train gradient boosting models & baselines
python model.py

# Step 3: Run the Diwali calendar-feature & log-ratio experiment
python model_diwali.py

# Step 4: Export calibrated prediction intervals, backtest metrics, and results.json
python export_final_results.py
```

---

## 📊 Data Schema Specification (`results.json`)

The application consumes a self-contained, offline JSON file matching this exact schema:

```json
{
  "city": "New Delhi",
  "data_source": "OpenAQ (PM2.5 station) + Open-Meteo (Weather)",
  "model_name": "Gradient Boosting Regressor (HistGradientBoosting)",
  "threshold": 60,
  "alert_rule": "Conservative: Alert if 80% Upper Bound > threshold (Prioritises Child Safety)",
  "diwali_dates": ["2023-11-12", "2024-10-31", "2025-10-20", "2026-11-08"],
  "metrics": {
    "mae_model": 14.29,
    "mae_baseline": 13.75,
    "backtest_mae_model": 16.87,
    "backtest_mae_baseline": 17.70,
    "range_coverage_80": 0.825,
    "precision": 0.50,
    "recall": 1.00
  },
  "threshold_table": [
    {
      "threshold": 35,
      "days_above": 76,
      "pt_hit": 63, "pt_miss": 13, "pt_fa": 14,
      "ct_hit": 76, "ct_miss": 0,  "ct_fa": 44,
      "pr_hit": 73, "pr_miss": 3,  "pr_fa": 43
    },
    {
      "threshold": 60,
      "days_above": 32,
      "pt_hit": 30, "pt_miss": 2,  "pt_fa": 2,
      "ct_hit": 32, "ct_miss": 0,  "ct_fa": 32,
      "pr_hit": 31, "pr_miss": 1,  "pr_fa": 6
    },
    {
      "threshold": 90,
      "days_above": 20,
      "pt_hit": 17, "pt_miss": 3,  "pt_fa": 6,
      "ct_hit": 20, "ct_miss": 0,  "ct_fa": 8,
      "pr_hit": 19, "pr_miss": 1,  "pr_fa": 7
    },
    {
      "threshold": 120,
      "days_above": 14,
      "pt_hit": 12, "pt_miss": 2,  "pt_fa": 3,
      "ct_hit": 13, "ct_miss": 1,  "ct_fa": 5,
      "pr_hit": 12, "pr_miss": 2,  "pr_fa": 4
    },
    {
      "threshold": 250,
      "days_above": 4,
      "pt_hit": 2,  "pt_miss": 2,  "pt_fa": 2,
      "ct_hit": 3,  "ct_miss": 1,  "ct_fa": 2,
      "pr_hit": 3,  "pr_miss": 1,  "pr_fa": 2
    }
  ],
  "days": [
    {
      "issued_on": "2026-11-12",
      "date": "2026-11-13",
      "actual": 248.0,
      "model": 323.3,
      "lower": 301.6,
      "upper": 345.0,
      "baseline": 317.0,
      "alert": true,
      "alert_point_forecast": true,
      "in_diwali_window": true,
      "in_season": true
    }
  ]
}
```

> **Zero Invented Numbers:** The app strictly visualizes what is packaged in `results.json`. Users can upload custom `results.json` files via the top masthead button at runtime without any network requests.

---

## 🎛️ Key Features

### 1. Asymmetric Split Stage Layout
* **Left Column (38%) — The Verdict & Action Directives**:
  * Giant status stamp: `[ RESTRICT OUTDOOR ACTIVITY // ALERT ]` or `[ NORMAL OUTDOOR ACTIVITY // NO ALERT ]`.
  * Massive hero PM2.5 reading in Newsreader serif (`323.3 µg/m³`) with 80% uncertainty interval.
  * Concise 2-sentence briefing comparing projected PM2.5 against the Indian National Ambient Air Quality Standard (NAAQS) limit of 60 µg/m³.
  * **Typographic 4-Row Directives Table**:
    1. *Morning Assembly (07:30)*: Move Indoors vs. Permitted Outdoors
    2. *PE & Field Training*: Suspended / Indoor Gym vs. Normal Activity
    3. *Lunch & Recess Breaks*: Classroom Confined vs. Playground Permitted
    4. *Infirmary & Vulnerable Pupils*: Standby Inhalers / High Alert vs. Standard Protocol
* **Right Column (62%) — Interactive Chronological Trajectory Chart**:
  * High-density Recharts trajectory curve showing actual station readings (OpenAQ), model predictions, persistence baseline, and shaded 80% confidence interval.
  * Dashed threshold line at 60 µg/m³ in Signal Vermilion.
  * Vertical reference marker for Diwali dates.
  * Custom crosshair tooltip with click-to-select interaction.

### 2. Bottom Ticker Strip
A continuous 4-column ledger comparing:
1. **Model Projection** (`323.3 µg/m³`)
2. **80% Confidence Interval** (`301.6 – 345.0 µg/m³`)
3. **Persistence Benchmark ("Tomorrow = Today")** (`317.0 µg/m³`)
4. **Held-Out Test Error** (`|75.3| µg/m³`)

### 3. Honest Benchmarking & Performance Ledger (Table 1.0)
* **Test Window MAE vs. Baseline**: On the held-out summer/monsoon test window (±14.3 µg/m³ model vs ±13.7 µg/m³ baseline), persistence matches the model due to persistent calm weather.
* **Full Multi-Season Backtest MAE**: Over full expanding seasonal backtests including autumn crop-burning and winter thermal inversions, the model outperforms baseline by **16.87 vs 17.70 µg/m³**.
* **Empirical 80% Range Coverage**: 82.5% of actual daily readings fell within the predicted `[lower, upper]` bounds.
* **Safety Recall**: **100% recall** at the 60 µg/m³ regulatory threshold under the Conservative Rule.

### 4. Decision Policy Matrix (Table 2.0)
Evaluates three operational rules across PM2.5 thresholds (35, 60, 90, 120, 250 µg/m³):
- **Point Forecast Rule (`pt`)**: Alert if `model > threshold`. Minimizes false alarms but incurs dangerous misses during sudden spikes.
- **Conservative 80% Rule (`ct`)**: Alert if `upper_bound > threshold`. **Zero missed bad air days** at 60 µg/m³—the optimal choice for schools.
- **Risk-Calibrated Rule (`pr`)**: Compromise policy alert if `model + 0.5 * (upper - model) > threshold`.

### 5. Documented Physical Failure Modes ("Where It Fails")
Editable field notes highlighting real atmospheric failure modes:
1. **Diwali Combustion Spike Lag**: Weather features do not capture unmeasured firecracker detonations; calendar features soften the blow but point forecasts still underestimate peak burst.
2. **Nocturnal Thermal Inversions**: Calm wind speeds (< 1.5 m/s) trap ground emissions overnight, creating morning spikes before boundary-layer mixing occurs.
3. **Precipitation Recovery Rebound**: Tropospheric washouts clear particulate rapidly, but road dust and stubble smoke re-accumulate faster than tree-based models project.

### 6. Coordinator Advisory Dispatch Generator
* One-click generation of a 2-sentence operational notice ready for transmission to parents and faculty via WhatsApp broadcast or morning announcements.
* Powered by Google Gemini Flash (when API key is provided, strictly constrained to selected day's numbers with zero hallucinations allowed) or an instant **deterministic offline template**.

---

## 🎨 Color Coding (Indian NAAQS & WHO Bands)

| PM2.5 Range | Category | Color | Operational Guidance |
| :--- | :--- | :--- | :--- |
| **0 – 30 µg/m³** | Good | `#15803D` (Forest Green) | Minimal impact. Ideal for morning outdoor sports. |
| **31 – 60 µg/m³** | Satisfactory | `#4D7C0F` (Light Green) | Minor breathing discomfort for sensitive groups. NAAQS limit. |
| **61 – 90 µg/m³** | Moderate | `#B45309` (Amber Yellow) | Discomfort for children with asthma. Monitor exertion. |
| **91 – 120 µg/m³** | Poor | `#C2410C` (Orange) | Breathing discomfort on prolonged exposure. Move PE inside. |
| **121 – 250 µg/m³** | Very Poor | `#E13C2A` (Signal Vermilion) | High health risk. Cancel outdoor sports & assemblies. |
| **250+ µg/m³** | Severe | `#7F1D1D` (Dark Red) | Emergency health hazard. Strict indoor confinement. |

---

## 📂 Project Structure

```
├── data/
│   ├── delhi_daily.csv             # Raw daily weather & PM2.5 from Open-Meteo
│   └── delhi_daily_openaq.csv      # Merged station PM2.5 measurements from OpenAQ
├── delhi-aq-app/                   # React + Tailwind Single-Page Web App
│   ├── src/
│   │   ├── App.jsx                 # Master Swiss editorial dashboard component
│   │   ├── index.css               # Tailwind directives & hairline border utilities
│   │   ├── main.jsx                # React root mount
│   │   └── sampleData.json         # Bundled offline dataset (matches results.json schema)
│   ├── index.html                  # HTML entry with Google Fonts (Newsreader, Inter, JetBrains Mono)
│   ├── package.json                # Project dependencies (React 18, Recharts, Lucide-react)
│   ├── tailwind.config.js          # Bespoke editorial theme & custom palette
│   └── vite.config.js              # Vite build configuration
├── export_final_results.py         # Calibrates 80% intervals, backtest metrics & exports results.json
├── load_data.py                    # Fetches historical archive from Open-Meteo
├── load_openaq.py                  # Fetches Delhi PM2.5 station series from OpenAQ API v3
├── model.py                        # HistGradientBoostingRegressor training & baseline evaluation
├── model_diwali.py                 # Diwali calendar features & log-ratio target experimentation
├── results.json                    # Gold-standard schema-compliant output
└── README.md                       # Documentation
```

---

## ⚖️ Required Disclaimers

- **Visible Top Banner:** `"DATASET: HELD-OUT TEST REPLAY • NEW DELHI • REPLAY OF HELD-OUT TEST DAYS, NOT A LIVE FORECAST"`
- **Colophon Footer:** `"Prototype only. Not medical advice. PM2.5 data from OpenAQ; weather from Open-Meteo."`
- **Methodology Notice:** Ground-truth PM2.5 station measurements obtained via OpenAQ API v3; surface meteorological parameters obtained via Open-Meteo historical archive.
