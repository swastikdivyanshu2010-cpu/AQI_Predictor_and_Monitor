1. **Executive Summary & Decision Context**:
   - The operational problem facing Delhi school coordinators making morning outdoor activity decisions (assemblies, PE, sports training).
   - The asymmetric cost of false alarms vs. missed warnings for children with respiratory vulnerabilities.

2. **Visual & Architectural Identity**:
   - The Swiss broadsheet data-journalism design language (archival warm paper `#F8F7F4`, charcoal ink `#111111`, hairline grid dividers, Signal Vermilion `#E13C2A`, and Forest Green `#15803D`).
   - Typographic scale featuring **Newsreader** (serif), **JetBrains Mono** (`tabular-nums`), and **Inter**.

3. **Quick Start Guide**:
   - Step-by-step instructions to run the React + Tailwind frontend (`npm run dev`).
   - Instructions to reproduce the complete Python data and ML pipeline (`load_data.py`, `load_openaq.py`, `model.py`, `model_diwali.py`, and `export_final_results.py`).

4. **Exact JSON Schema Documentation**:
   - Full specification of `results.json` (`city`, `data_source`, `model_name`, `threshold`, `alert_rule`, `diwali_dates`, `metrics`, `threshold_table`, and `days`).

5. **Deep Dive into Features**:
   - Asymmetric split stage layout (38% Verdict & 4-row directives table, 62% Recharts trajectory chart with shaded 80% range band and crosshair tooltip).
   - Bottom 4-column ticker strip.
   - Honest evaluation metrics ledger (Table 1.0) comparing model vs. persistence baseline across both the 120-day window and multi-season backtest.
   - Decision policy matrix (Table 2.0) comparing Point (`pt`), Conservative (`ct`), and Risk (`pr`) rules.
   - Documented physical failure modes ("Where It Fails") covering Diwali firecracker bursts, nocturnal thermal inversions, and rain rebounds.
   - School Coordinator Advisory Notice generator (Gemini Flash + deterministic fallback template).

6. **Regulatory Reference & Disclaimers**:
   - CPCB / Indian NAAQS PM2.5 band definitions and operational health guidance.
   - Required disclaimers and data provenance credits (OpenAQ and Open-Meteo).
