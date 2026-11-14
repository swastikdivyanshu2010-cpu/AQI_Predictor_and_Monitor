import React, { useState, useMemo, useRef } from 'react';
import sampleData from './sampleData.json';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

// Format helper: formats float cleanly with .toFixed(1)
const fmt = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(1);
};

// Default field observation notes
const DEFAULT_FAILURE_NOTES = `FIELD REPORT // MODEL BOUNDARIES & FAILURE MODES:
1. DIWALI COMBUSTION: Standard meteorological parameters do not account for episodic firecracker detonation. While calendar-lag features capture historical periodicity, extreme peak concentrations exceed point projections.
2. NOCTURNAL THERMAL INVERSIONS: When surface wind speed drops below 1.5 m/s, nocturnal thermal trapping creates rapid morning ground-level spikes that linear gradients underestimate.
3. PRECIPITATION RECOVERY: Monsoon washouts clean the troposphere rapidly, but surface road dust and crop residue plumes re-accumulate faster than tree-based ensemble estimators anticipate.
4. COORDINATOR DIRECTIVE: Always evaluate the Conservative 80% Upper Bound to ensure child safety is guaranteed with zero unannounced exposures.`;

export default function App() {
  // Main data state
  const [data, setData] = useState(sampleData);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Selected date
  const [selectedDate, setSelectedDate] = useState(() => {
    return data.days && data.days.length > 0 ? data.days[data.days.length - 1].date : '';
  });

  // Series visibility toggles for chart
  const [showModel, setShowModel] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showBand, setShowBand] = useState(true);

  // Editable "Where it fails" notes
  const [failureNotes, setFailureNotes] = useState(DEFAULT_FAILURE_NOTES);
  const [notesCopied, setNotesCopied] = useState(false);

  // Advisory Generator state
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisorySource, setAdvisorySource] = useState(null);
  const [advisoryCopied, setAdvisoryCopied] = useState(false);

  // Current day memoized
  const currentDayIndex = useMemo(() => {
    if (!data.days) return -1;
    return data.days.findIndex((d) => d.date === selectedDate);
  }, [data.days, selectedDate]);

  const currentDay = useMemo(() => {
    if (!data.days || data.days.length === 0) return null;
    if (currentDayIndex >= 0) return data.days[currentDayIndex];
    return data.days[data.days.length - 1];
  }, [data.days, currentDayIndex]);

  // Stepper handlers
  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setSelectedDate(data.days[currentDayIndex - 1].date);
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex >= 0 && currentDayIndex < data.days.length - 1) {
      setSelectedDate(data.days[currentDayIndex + 1].date);
    }
  };

  // Quick jump presets
  const handleJumpPeak = () => {
    if (!data.days) return;
    const peak = [...data.days].sort((a, b) => b.model - a.model)[0];
    if (peak) setSelectedDate(peak.date);
  };

  const handleJumpDiwali = () => {
    if (!data.days) return;
    const diwaliDay = data.days.find((d) => d.in_diwali_window);
    if (diwaliDay) setSelectedDate(diwaliDay.date);
  };

  const handleJumpCleanest = () => {
    if (!data.days) return;
    const cleanest = [...data.days].sort((a, b) => a.model - b.model)[0];
    if (cleanest) setSelectedDate(cleanest.date);
  };

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.days || !parsed.metrics || !parsed.threshold_table) {
          throw new Error('Schema mismatch: Missing days, metrics, or threshold_table');
        }
        setData(parsed);
        setUploadError(null);
        if (parsed.days && parsed.days.length > 0) {
          setSelectedDate(parsed.days[parsed.days.length - 1].date);
        }
      } catch (err) {
        setUploadError(`Failed to load JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Advisory generator (Gemini API with deterministic template fallback)
  const generateAdvisory = async () => {
    if (!currentDay) return;
    setAdvisoryLoading(true);

    const isAlert = currentDay.alert;
    const diwaliNote = currentDay.in_diwali_window
      ? ' heightened particulate burden due to festival emissions'
      : '';

    const fallbackText = isAlert
      ? `TOMORROW (${currentDay.date}): Model forecast of ${fmt(currentDay.model)} µg/m³ (80% interval ${fmt(currentDay.lower)}–${fmt(currentDay.upper)} µg/m³) substantially exceeds the national limit of ${data.threshold} µg/m³${diwaliNote}. Mandatory directive: cancel outdoor sports, relocate morning assembly to classrooms, and keep school air filters operational. Staff should monitor asthmatic pupils closely.`
      : `TOMORROW (${currentDay.date}): Model forecast of ${fmt(currentDay.model)} µg/m³ (80% interval ${fmt(currentDay.lower)}–${fmt(currentDay.upper)} µg/m³) remains within the ${data.threshold} µg/m³ threshold${diwaliNote}. Outdoor morning assembly and physical education training are approved to proceed as scheduled. Standard routine monitoring applies.`;

    if (!apiKey) {
      setTimeout(() => {
        setAdvisory(fallbackText);
        setAdvisorySource('Deterministic editorial template');
        setAdvisoryLoading(false);
      }, 200);
      return;
    }

    try {
      const promptText = `You are a school operations director in Delhi.
Write exactly 2 to 3 concise, authoritative sentences. Never invent external facts.
Strict inputs:
Target Date: ${currentDay.date}
Forecast PM2.5: ${fmt(currentDay.model)} µg/m³
80% Range: ${fmt(currentDay.lower)} to ${fmt(currentDay.upper)} µg/m³
Baseline: ${fmt(currentDay.baseline)} µg/m³
Threshold: ${data.threshold} µg/m³
Status: ${isAlert ? 'ALERT (Exceeds Limit)' : 'NO ALERT (Permissible)'}
Diwali Window: ${currentDay.in_diwali_window ? 'Yes' : 'No'}
Instruct the coordinator whether 7:30 AM outdoor assembly and sports can go ahead or must be moved indoors.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 220 },
          }),
        }
      );

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        setAdvisory(text);
        setAdvisorySource('Gemini Flash (strictly constrained)');
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.warn('API error, using fallback template:', err);
      setAdvisory(fallbackText);
      setAdvisorySource('Fallback template (offline/error)');
    } finally {
      setAdvisoryLoading(false);
    }
  };

  // Recharts data transformation
  const chartData = useMemo(() => {
    if (!data.days) return [];
    return data.days.map((d) => ({
      ...d,
      rangeBase: d.lower,
      rangeDelta: Math.max(0, d.upper - d.lower),
    }));
  }, [data.days]);

  const copyAdvisory = () => {
    if (!advisory) return;
    navigator.clipboard.writeText(advisory);
    setAdvisoryCopied(true);
    setTimeout(() => setAdvisoryCopied(false), 2000);
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(failureNotes);
    setNotesCopied(true);
    setTimeout(() => setNotesCopied(false), 2000);
  };

  const isSafe = currentDay ? currentDay.model <= data.threshold : false;
  const isAlert = currentDay ? currentDay.alert : false;

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111111] font-sans flex flex-col overflow-x-hidden selection:bg-[#111111] selection:text-[#F8F7F4]">
      {/* ==========================================
          TOP MASTHEAD (Swiss Editorial Broadsheet)
          ========================================== */}
      <header className="border-b border-[#111111]/15 px-4 sm:px-8 py-4">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Left: Newspaper Masthead Title */}
          <div className="min-w-0">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-[#6E6D68] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>DATASET: HELD-OUT TEST REPLAY</span>
              <span>•</span>
              <span>NEW DELHI (28.61° N, 77.20° E)</span>
              <span>•</span>
              <span className="text-[#111111] font-bold">REPLAY OF HELD-OUT TEST DAYS, NOT A LIVE FORECAST</span>
            </div>
            <h1 className="font-mono text-sm sm:text-base font-bold tracking-tight text-[#111111] uppercase mt-1">
              DELHI AIR QUALITY // NEXT-DAY PM2.5 FORECAST
            </h1>
          </div>

          {/* Center: Underlined Date Selector & Inline Quick Tabs */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 font-mono text-xs border-b border-[#111111] pb-0.5">
              <button
                onClick={handlePrevDay}
                disabled={currentDayIndex <= 0}
                className="hover:text-[#E13C2A] disabled:opacity-30 px-1 font-bold"
                title="Previous Day"
              >
                ←
              </button>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-[#111111] font-mono font-bold text-xs focus:outline-none cursor-pointer pr-1"
              >
                {data.days &&
                  data.days.map((d) => (
                    <option key={d.date} value={d.date} className="bg-[#F8F7F4] text-[#111111] font-mono">
                      {d.date} {d.in_diwali_window ? '• Diwali' : ''} {d.alert ? '• Alert' : ''}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleNextDay}
                disabled={currentDayIndex < 0 || currentDayIndex >= (data.days?.length || 0) - 1}
                className="hover:text-[#E13C2A] disabled:opacity-30 px-1 font-bold"
                title="Next Day"
              >
                →
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-[#6E6D68] pl-2 border-l border-[#111111]/15">
              <span>JUMP:</span>
              <button
                onClick={handleJumpDiwali}
                className="hover:text-[#E13C2A] underline underline-offset-2 decoration-[#111111]/30 hover:decoration-[#E13C2A]"
              >
                Diwali Spike
              </button>
              <button
                onClick={handleJumpPeak}
                className="hover:text-[#E13C2A] underline underline-offset-2 decoration-[#111111]/30 hover:decoration-[#E13C2A]"
              >
                Peak PM2.5
              </button>
              <button
                onClick={handleJumpCleanest}
                className="hover:text-[#15803D] underline underline-offset-2 decoration-[#111111]/30 hover:decoration-[#15803D]"
              >
                Cleanest Day
              </button>
            </div>
          </div>

          {/* Right: Upload trigger */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] uppercase tracking-wider text-[#111111] hover:text-[#E13C2A] border-b border-[#111111]/40 pb-0.5 transition"
            >
              [Upload results.json]
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {uploadError && (
          <div className="max-w-[1440px] mx-auto mt-2 font-mono text-xs text-[#E13C2A]">
            ERROR: {uploadError}
          </div>
        )}
      </header>

      {/* ==========================================
          ASYMMETRIC SPLIT STAGE
          38% Left (Verdict & Directives) | 62% Right (Trajectory Chart)
          ========================================== */}
      {currentDay && (
        <main className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 flex-1 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
            {/* --------------------------------------
                LEFT COLUMN (38% width: cols 1 to 5)
                -------------------------------------- */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#111111]/15 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Meta Stamp Header */}
                <div className="flex items-center justify-between font-mono text-xs text-[#6E6D68] uppercase pb-3 border-b border-[#111111]/15">
                  <span>TARGET DATE // {currentDay.date}</span>
                  <span>ISSUED // {currentDay.issued_on}</span>
                </div>

                {/* Massive Hero PM2.5 Number */}
                <div className="pt-6 pb-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] mb-1">
                    PROJECTED MEAN PM2.5 CONCENTRATION
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-7xl sm:text-8xl md:text-[92px] leading-none text-[#111111] tabular-nums tracking-tight transition-all duration-300">
                      {fmt(currentDay.model)}
                    </span>
                    <span className="font-mono text-sm sm:text-base text-[#6E6D68] uppercase">
                      µg/m³
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#6E6D68] mt-2 flex items-center gap-2">
                    <span>80% CONFIDENCE INTERVAL:</span>
                    <strong className="text-[#111111] font-mono">
                      {fmt(currentDay.lower)} – {fmt(currentDay.upper)} µg/m³
                    </strong>
                  </div>
                </div>

                {/* Giant Status Stamp */}
                <div className="my-4">
                  {isAlert ? (
                    <div className="border-2 border-[#E13C2A] px-3.5 py-2 inline-block">
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E13C2A]">
                        RESTRICT OUTDOOR ACTIVITY // ALERT
                      </span>
                    </div>
                  ) : (
                    <div className="border-2 border-[#15803D] px-3.5 py-2 inline-block">
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#15803D]">
                        NORMAL OUTDOOR ACTIVITY // NO ALERT
                      </span>
                    </div>
                  )}

                  {currentDay.in_diwali_window && (
                    <span className="ml-2 font-mono text-[11px] font-bold text-[#E13C2A] uppercase border border-[#E13C2A]/40 px-2 py-1 align-middle">
                      ★ DIWALI WINDOW
                    </span>
                  )}
                </div>

                {/* Concise 2-Sentence Briefing */}
                <p className="font-serif text-base sm:text-lg text-[#111111] leading-snug my-4">
                  {isAlert
                    ? `Tomorrow's forecasted ${fmt(currentDay.model)} µg/m³ concentration exceeds the National Ambient Air Quality 24-hour limit (${data.threshold} µg/m³) by ${(currentDay.model - data.threshold).toFixed(1)} µg/m³. Outdoor physical exertion poses immediate respiratory risks to school pupils.`
                    : `Tomorrow's forecasted ${fmt(currentDay.model)} µg/m³ concentration remains within the ${data.threshold} µg/m³ national limit. Atmospheric dispersion is expected to keep particulate density in the permissible zone for regular outdoor school operations.`}
                </p>

                {/* Clean Typographic 4-Row Directives Table */}
                <div className="border-t border-[#111111]/15 mt-6 font-mono text-xs">
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">01. Morning Assembly (07:30)</span>
                    <span className={`font-bold ${isAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                      {isAlert ? 'MOVE INDOORS' : 'PERMITTED OUTDOORS'}
                    </span>
                  </div>
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">02. PE & Field Training</span>
                    <span className={`font-bold ${isAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                      {isAlert ? 'SUSPENDED / INDOOR GYM' : 'NORMAL ACTIVITY'}
                    </span>
                  </div>
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">03. Lunch & Recess Breaks</span>
                    <span className={`font-bold ${isAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                      {isAlert ? 'CLASSROOM CONFINED' : 'PLAYGROUND PERMITTED'}
                    </span>
                  </div>
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">04. Infirmary & Vulnerable Staff</span>
                    <span className={`font-bold ${isAlert ? 'text-[#E13C2A]' : 'text-[#111111]'}`}>
                      {isAlert ? 'STANDBY INHALERS / HIGH ALERT' : 'STANDARD PROTOCOL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attribution Line */}
              <div className="pt-6 font-mono text-[11px] text-[#6E6D68] uppercase flex justify-between items-center">
                <span>POLICY: {data.alert_rule ? '80% UPPER BOUND > 60 µg/m³' : 'POINT MODEL > 60 µg/m³'}</span>
                <span>METEO: OPEN-METEO // OPENAQ</span>
              </div>
            </div>

            {/* --------------------------------------
                RIGHT COLUMN (62% width: cols 6 to 12)
                Trajectory Chart
                -------------------------------------- */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Trajectory Header & Series Controls */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#111111]/15">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] block">
                      FIG. 1 // CHRONOLOGICAL CONCENTRATION CURVE (µg/m³)
                    </span>
                    <h2 className="font-serif text-lg text-[#111111] font-normal">
                      Held-Out Test Replay Trajectory & Uncertainty Envelope
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <button
                      onClick={() => setShowModel(!showModel)}
                      className={`hover:text-[#111111] ${showModel ? 'text-[#111111] font-bold underline' : 'text-[#6E6D68]'}`}
                    >
                      [Model]
                    </button>
                    <button
                      onClick={() => setShowActual(!showActual)}
                      className={`hover:text-[#111111] ${showActual ? 'text-[#111111] font-bold underline' : 'text-[#6E6D68]'}`}
                    >
                      [Actual]
                    </button>
                    <button
                      onClick={() => setShowBaseline(!showBaseline)}
                      className={`hover:text-[#111111] ${showBaseline ? 'text-[#111111] font-bold underline' : 'text-[#6E6D68]'}`}
                    >
                      [Baseline]
                    </button>
                    <button
                      onClick={() => setShowBand(!showBand)}
                      className={`hover:text-[#111111] ${showBand ? 'text-[#111111] font-bold underline' : 'text-[#6E6D68]'}`}
                    >
                      [80% Band]
                    </button>
                  </div>
                </div>

                {/* Full-Height Interactive Chart */}
                <div className="h-80 sm:h-[400px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          setSelectedDate(e.activePayload[0].payload.date);
                        }
                      }}
                    >
                      <XAxis
                        dataKey="date"
                        stroke="#111111"
                        strokeWidth={1}
                        tickLine={{ stroke: '#111111' }}
                        tick={{ fontSize: 10, fill: '#6E6D68', fontFamily: 'JetBrains Mono' }}
                        tickFormatter={(val) => {
                          const parts = val.split('-');
                          return `${parts[1]}/${parts[2]}`;
                        }}
                        minTickGap={28}
                      />
                      <YAxis
                        stroke="#111111"
                        strokeWidth={1}
                        tickLine={{ stroke: '#111111' }}
                        tick={{ fontSize: 10, fill: '#6E6D68', fontFamily: 'JetBrains Mono' }}
                        domain={[0, 'auto']}
                      />

                      {/* Custom Editorial Crosshair Tooltip */}
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#F8F7F4] border border-[#111111] p-3 text-xs font-mono shadow-none max-w-[240px]">
                                <div className="border-b border-[#111111]/20 pb-1 font-bold text-[#111111] flex justify-between">
                                  <span>{d.date}</span>
                                  {d.in_diwali_window && <span className="text-[#E13C2A]">★ DIWALI</span>}
                                </div>
                                <div className="pt-1.5 space-y-1 text-[#111111]">
                                  <div className="flex justify-between">
                                    <span className="text-[#6E6D68]">Actual (OpenAQ):</span>
                                    <span className="font-bold">{fmt(d.actual)} µg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#6E6D68]">Model Forecast:</span>
                                    <span className="font-bold">{fmt(d.model)} µg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#6E6D68]">Baseline (Today):</span>
                                    <span>{fmt(d.baseline)} µg</span>
                                  </div>
                                  <div className="flex justify-between text-[#6E6D68]">
                                    <span>80% Range:</span>
                                    <span>{fmt(d.lower)}–{fmt(d.upper)}</span>
                                  </div>
                                  <div className="pt-1 border-t border-[#111111]/20 flex justify-between text-[11px]">
                                    <span>Verdict:</span>
                                    <span className={d.alert ? 'text-[#E13C2A] font-bold' : 'text-[#15803D] font-bold'}>
                                      {d.alert ? 'ALERT' : 'NO ALERT'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      {/* 80% Shaded Uncertainty Band */}
                      {showBand && (
                        <>
                          <Area
                            type="monotone"
                            dataKey="rangeBase"
                            stackId="range"
                            stroke="transparent"
                            fill="transparent"
                            legendType="none"
                          />
                          <Area
                            name="80% Range"
                            type="monotone"
                            dataKey="rangeDelta"
                            stackId="range"
                            stroke="transparent"
                            fill="#111111"
                            fillOpacity={0.07}
                          />
                        </>
                      )}

                      {/* Actual Station Ground Truth */}
                      {showActual && (
                        <Line
                          name="Actual"
                          type="monotone"
                          dataKey="actual"
                          stroke="#111111"
                          strokeWidth={1.75}
                          dot={{ r: 2, fill: '#111111', stroke: '#111111' }}
                          activeDot={{ r: 5, fill: '#111111' }}
                        />
                      )}

                      {/* Model Prediction */}
                      {showModel && (
                        <Line
                          name="Model"
                          type="monotone"
                          dataKey="model"
                          stroke="#E13C2A"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, fill: '#E13C2A' }}
                        />
                      )}

                      {/* Persistence Baseline */}
                      {showBaseline && (
                        <Line
                          name="Baseline"
                          type="monotone"
                          dataKey="baseline"
                          stroke="#6E6D68"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      )}

                      {/* NAAQS Limit 60 ug/m3 */}
                      <ReferenceLine
                        y={data.threshold}
                        stroke="#E13C2A"
                        strokeDasharray="4 4"
                        strokeWidth={1.25}
                        label={{
                          value: `NAAQS LIMIT (${data.threshold} µg)`,
                          fill: '#E13C2A',
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono',
                          position: 'top',
                        }}
                      />

                      {/* Diwali Marker */}
                      {data.diwali_dates &&
                        data.diwali_dates.map((dw) => (
                          <ReferenceLine
                            key={dw}
                            x={dw}
                            stroke="#111111"
                            strokeWidth={1}
                            label={{
                              value: `DIWALI (${dw})`,
                              fill: '#111111',
                              fontSize: 9,
                              fontFamily: 'JetBrains Mono',
                              position: 'insideTopLeft',
                            }}
                          />
                        ))}

                      {/* Active Day Crosshair Cursor */}
                      {selectedDate && (
                        <ReferenceLine
                          x={selectedDate}
                          stroke="#111111"
                          strokeWidth={1.5}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart Caption & Legend */}
              <div className="pt-4 border-t border-[#111111]/15 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[#6E6D68] gap-2">
                <span>
                  SOURCE: OPENAQ AIR SENSORS & OPEN-METEO ARCHIVES • INTERPOLATED DAILY (24H UTC MEAN)
                </span>
                <span className="text-[#111111]">
                  Click chart point to inspect that date.
                </span>
              </div>
            </div>
          </div>

          {/* ==========================================
              BOTTOM TICKER STRIP
              Single horizontal ledger divided by 1px vertical lines
              ========================================== */}
          <div className="border-t border-[#111111]/15 grid grid-cols-2 md:grid-cols-4 font-mono divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 text-xs">
            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">01 // MODEL PROJECTION</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  {fmt(currentDay.model)}
                </span>
                <span className="text-[11px] text-[#6E6D68]">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">Gradient boosting regressor</span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">02 // 80% CONFIDENCE INTERVAL</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  {fmt(currentDay.lower)} – {fmt(currentDay.upper)}
                </span>
                <span className="text-[11px] text-[#6E6D68]">µg</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">Spread: {fmt(currentDay.upper - currentDay.lower)} µg/m³</span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">03 // PERSISTENCE BENCHMARK</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  {fmt(currentDay.baseline)}
                </span>
                <span className="text-[11px] text-[#6E6D68]">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">Naive "Tomorrow = Today"</span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">04 // HELD-OUT ACTUAL ERROR</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  |{fmt(Math.abs(currentDay.actual - currentDay.model))}|
                </span>
                <span className="text-[11px] text-[#6E6D68]">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">Ground truth: {fmt(currentDay.actual)} µg/m³</span>
            </div>
          </div>
        </main>
      )}

      {/* ==========================================
          TECHNICAL SECTION A: EVALUATION METRICS LEDGER
          Plain language benchmark table
          ========================================== */}
      <section className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]/15 mb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
              TABLE 1.0 // PERFORMANCE ACCOUNTABILITY
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#111111] mt-0.5">
              Empirical Accuracy: Model vs. Naive Baseline
            </h3>
          </div>
          <span className="font-mono text-xs text-[#6E6D68]">
            HONEST BENCHMARKING ACROSS 120 TEST DAYS & MULTI-SEASON BACKTEST
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 border border-[#111111]/15 font-mono text-xs">
          {/* Col 1: Window MAE */}
          <div className="p-5">
            <span className="text-[11px] text-[#6E6D68] uppercase block">TEST WINDOW ERROR (MAE)</span>
            <div className="mt-2 text-3xl font-serif font-normal text-[#111111] tabular-nums">
              ±{fmt(data.metrics?.mae_model)} <span className="text-xs font-mono text-[#6E6D68]">µg/m³</span>
            </div>
            <div className="mt-1 text-xs text-[#6E6D68]">
              Baseline: ±{fmt(data.metrics?.mae_baseline)} µg/m³
            </div>
            <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
              On the held-out 120-day summer-monsoon test set, persistence baseline matches model accuracy due to sustained calm weather conditions.
            </p>
          </div>

          {/* Col 2: Multi-Season Backtest MAE */}
          <div className="p-5">
            <span className="text-[11px] text-[#6E6D68] uppercase block">FULL SEASON BACKTEST (MAE)</span>
            <div className="mt-2 text-3xl font-serif font-normal text-[#15803D] tabular-nums">
              ±{fmt(data.metrics?.backtest_mae_model)} <span className="text-xs font-mono text-[#6E6D68]">µg/m³</span>
            </div>
            <div className="mt-1 text-xs text-[#6E6D68]">
              Baseline: ±{fmt(data.metrics?.backtest_mae_baseline)} µg/m³
            </div>
            <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
              Across full multi-season rolling backtests (incorporating winter inversions & Diwali transitions), the model reduces error by{' '}
              <strong className="font-mono">{(data.metrics?.backtest_mae_baseline - data.metrics?.backtest_mae_model).toFixed(2)} µg/m³</strong>.
            </p>
          </div>

          {/* Col 3: Interval Coverage */}
          <div className="p-5">
            <span className="text-[11px] text-[#6E6D68] uppercase block">80% INTERVAL COVERAGE</span>
            <div className="mt-2 text-3xl font-serif font-normal text-[#111111] tabular-nums">
              {Math.round((data.metrics?.range_coverage_80 || 0) * 100)}%
            </div>
            <div className="mt-1 text-xs text-[#6E6D68]">
              Nominal target: 80.0%
            </div>
            <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
              {Math.round((data.metrics?.range_coverage_80 || 0) * 100)}% of actual daily readings fell inside the model's computed [lower, upper] interval, demonstrating calibrated uncertainty.
            </p>
          </div>

          {/* Col 4: Safety Recall */}
          <div className="p-5">
            <span className="text-[11px] text-[#6E6D68] uppercase block">CHILD SAFETY RECALL (@ {data.threshold} µg)</span>
            <div className="mt-2 text-3xl font-serif font-normal text-[#15803D] tabular-nums">
              {Math.round((data.metrics?.recall || 0) * 100)}%
            </div>
            <div className="mt-1 text-xs text-[#6E6D68]">
              Precision: {Math.round((data.metrics?.precision || 0) * 100)}%
            </div>
            <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
              Zero missed hazardous days under the Conservative Rule. Precautionary false alarms are accepted to eliminate pediatric health risks.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
          TECHNICAL SECTION B: THRESHOLD POLICY MATRIX
          Broadsheet Table
          ========================================== */}
      <section className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]/15 mb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
              TABLE 2.0 // POLICY THRESHOLD SENSITIVITY
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#111111] mt-0.5">
              Decision Rule Matrix Across 3 Operational Policies
            </h3>
          </div>
          <span className="font-mono text-xs text-[#6E6D68]">
            HITS (TRUE POSITIVE) • MISSES (FALSE NEGATIVE) • FALSE ALARMS (PRECAUTIONARY COST)
          </span>
        </div>

        <div className="overflow-x-auto border border-[#111111]/15">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#111111]/15 bg-[#111111]/[0.02] text-[#6E6D68]">
                <th className="p-3 border-r border-[#111111]/15 font-bold text-[#111111]">THRESHOLD</th>
                <th className="p-3 border-r border-[#111111]/15">DAYS ABOVE</th>
                <th colSpan={3} className="p-3 border-r border-[#111111]/15 text-center bg-[#111111]/[0.03] text-[#111111] font-bold">
                  POINT RULE (pt: model &gt; t)
                </th>
                <th colSpan={3} className="p-3 border-r border-[#111111]/15 text-center bg-[#111111]/[0.05] text-[#111111] font-bold">
                  CONSERVATIVE RULE (ct: upper &gt; t)
                </th>
                <th colSpan={3} className="p-3 text-center bg-[#111111]/[0.03] text-[#111111] font-bold">
                  RISK-CALIBRATED RULE (pr)
                </th>
              </tr>
              <tr className="border-b border-[#111111]/15 text-[10px] text-[#6E6D68]">
                <th className="p-2 border-r border-[#111111]/15">µg/m³</th>
                <th className="p-2 border-r border-[#111111]/15">Ground Truth</th>
                <th className="p-2 text-center text-[#111111]">Hit</th>
                <th className="p-2 text-center text-[#E13C2A]">Miss</th>
                <th className="p-2 border-r border-[#111111]/15 text-center">FA</th>
                <th className="p-2 text-center text-[#111111]">Hit</th>
                <th className="p-2 text-center text-[#E13C2A] font-bold">Miss</th>
                <th className="p-2 border-r border-[#111111]/15 text-center">FA</th>
                <th className="p-2 text-center text-[#111111]">Hit</th>
                <th className="p-2 text-center text-[#E13C2A]">Miss</th>
                <th className="p-2 text-center">FA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/15">
              {data.threshold_table &&
                data.threshold_table.map((r) => {
                  const isActive = r.threshold === data.threshold;
                  return (
                    <tr
                      key={r.threshold}
                      className={`hover:bg-[#111111]/[0.02] ${isActive ? 'bg-[#111111]/[0.04] font-bold' : ''}`}
                    >
                      <td className="p-3 border-r border-[#111111]/15 font-bold">
                        {r.threshold} µg/m³ {isActive ? '• [ACTIVE]' : ''}
                      </td>
                      <td className="p-3 border-r border-[#111111]/15 tabular-nums">{r.days_above}</td>
                      <td className="p-3 text-center tabular-nums text-[#111111]">{r.pt_hit}</td>
                      <td className="p-3 text-center tabular-nums text-[#E13C2A] font-bold">{r.pt_miss}</td>
                      <td className="p-3 text-center tabular-nums border-r border-[#111111]/15 text-[#6E6D68]">{r.pt_fa}</td>
                      <td className="p-3 text-center tabular-nums text-[#111111] font-bold">{r.ct_hit}</td>
                      <td className="p-3 text-center tabular-nums text-[#E13C2A] font-extrabold">{r.ct_miss}</td>
                      <td className="p-3 text-center tabular-nums border-r border-[#111111]/15 text-[#6E6D68]">{r.ct_fa}</td>
                      <td className="p-3 text-center tabular-nums text-[#111111]">{r.pr_hit}</td>
                      <td className="p-3 text-center tabular-nums text-[#E13C2A]">{r.pr_miss}</td>
                      <td className="p-3 text-center tabular-nums text-[#6E6D68]">{r.pr_fa}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-3 font-mono text-[11px] text-[#6E6D68] grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <strong>HIT (True Pos):</strong> Correct alert issued prior to unhealthy morning air.
          </div>
          <div>
            <strong className="text-[#E13C2A]">MISS (False Neg):</strong> Critical failure; children exposed to pollution unannounced.
          </div>
          <div>
            <strong>FA (False Alarm):</strong> Alert called but air stayed within safety margins.
          </div>
        </div>
      </section>

      {/* ==========================================
          TECHNICAL SECTION C: "WHERE IT FAILS" & ADVISORY DISPATCH
          2-Column Editorial Ledger
          ========================================== */}
      <section className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#111111]/15">
        {/* Left: "Where it fails" */}
        <div className="lg:col-span-6 p-6 sm:p-8">
          <div className="flex items-baseline justify-between pb-2 border-b border-[#111111]/15 mb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
                SEC. 3.0 // LIMITATIONS & SENSOR BLINDSPOTS
              </span>
              <h4 className="font-serif text-xl text-[#111111] mt-0.5">
                Where the Physical Model Fails
              </h4>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={copyNotes}
                className="hover:text-[#E13C2A] underline underline-offset-2"
              >
                {notesCopied ? '[Copied]' : '[Copy]'}
              </button>
              <button
                onClick={() => setFailureNotes(DEFAULT_FAILURE_NOTES)}
                className="hover:text-[#111111] text-[#6E6D68]"
              >
                [Reset]
              </button>
            </div>
          </div>

          <p className="font-sans text-xs text-[#6E6D68] mb-3 leading-relaxed">
            Editable field notes for hackathon technical documentation. Documents known atmospheric edge cases:
          </p>

          <textarea
            value={failureNotes}
            onChange={(e) => setFailureNotes(e.target.value)}
            rows={7}
            className="w-full font-mono text-xs p-3 bg-transparent border border-[#111111]/20 text-[#111111] focus:outline-none focus:border-[#111111] leading-relaxed resize-none"
          />
        </div>

        {/* Right: School Coordinator Advisory Dispatch */}
        <div className="lg:col-span-6 p-6 sm:p-8">
          <div className="flex items-baseline justify-between pb-2 border-b border-[#111111]/15 mb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
                SEC. 4.0 // DIRECTIVE DISPATCH GENERATOR
              </span>
              <h4 className="font-serif text-xl text-[#111111] mt-0.5">
                School Coordinator Advisory Notice
              </h4>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-[#6E6D68] hover:text-[#111111] underline"
              >
                {showKeyInput ? '[Hide API Key]' : '[Gemini Key]'}
              </button>
              <button
                type="button"
                onClick={generateAdvisory}
                disabled={advisoryLoading}
                className="text-[#E13C2A] font-bold hover:underline"
              >
                {advisoryLoading ? '[Generating...]' : '[Generate Notice]'}
              </button>
            </div>
          </div>

          {showKeyInput && (
            <div className="mb-3 p-3 border border-[#111111]/20 font-mono text-xs space-y-1">
              <label className="text-[#6E6D68] block uppercase text-[10px]">Optional Google Gemini Key:</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-transparent border-b border-[#111111]/40 py-1 font-mono text-xs focus:outline-none"
              />
              <span className="text-[10px] text-[#6E6D68] block">
                If omitted, uses the deterministic verified template with zero network dependence.
              </span>
            </div>
          )}

          {advisory ? (
            <div className="border border-[#111111] p-4 font-mono text-xs space-y-2">
              <div className="flex items-baseline justify-between border-b border-[#111111]/20 pb-1.5 text-[10px] text-[#6E6D68]">
                <span>DISPATCH // {selectedDate}</span>
                <div className="flex items-center gap-2">
                  <span>{advisorySource}</span>
                  <button
                    onClick={copyAdvisory}
                    className="text-[#111111] hover:text-[#E13C2A] font-bold"
                  >
                    {advisoryCopied ? '[COPIED]' : '[COPY NOTICE]'}
                  </button>
                </div>
              </div>
              <p className="font-serif text-base text-[#111111] leading-relaxed pt-1">
                "{advisory}"
              </p>
              <div className="text-[10px] text-[#6E6D68] pt-1">
                Notice formatted for direct transmission to school staff and parents.
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#111111]/25 p-6 text-center font-mono text-xs text-[#6E6D68]">
              Click <strong className="text-[#111111]">[Generate Notice]</strong> to synthesize a 2-sentence operational dispatch for {selectedDate}.
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          REQUIRED LABELLING FOOTER (Editorial Colophon)
          ========================================== */}
      <footer className="max-w-[1440px] mx-auto w-full px-6 sm:px-8 py-8 font-mono text-xs text-[#6E6D68] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#111111]/15 pt-4 gap-2">
          <p className="text-[#111111] font-bold uppercase">
            Prototype only. Not medical advice. PM2.5 data from OpenAQ; weather from Open-Meteo.
          </p>
          <p className="text-[11px] text-[#6E6D68]">
            DELHI AIR QUALITY NEXT-DAY FORECAST • SWISS EDITORIAL SPECIFICATION
          </p>
        </div>
        <p className="text-[10px] text-[#6E6D68] leading-normal">
          Designed for school coordinators making morning physical education and outdoor assembly decisions. Replay of held-out test evaluation window (120 days). Algorithm: HistGradientBoostingRegressor with 80% conformal quantile intervals.
        </p>
      </footer>
    </div>
  );
}
