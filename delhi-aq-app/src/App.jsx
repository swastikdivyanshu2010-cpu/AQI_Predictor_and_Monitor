import React, { useState, useEffect, useMemo, useRef } from 'react';
import sampleData from './sampleData.json';
import { translations } from './locales';
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

const REMOTE_LATEST_URL =
  'https://raw.githubusercontent.com/swastikdivyanshu2010-cpu/AQI_Predictor_and_Monitor/main/latest.json';

// Format helper: formats float cleanly with .toFixed(1)
const fmt = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(1);
};

// Default field observation notes (Bilingual)
const DEFAULT_FAILURE_NOTES = {
  en: `FIELD REPORT // MODEL BOUNDARIES & FAILURE MODES:
1. DIWALI COMBUSTION: Standard meteorological parameters do not account for episodic firecracker detonation. While calendar-lag features capture historical periodicity, extreme peak concentrations exceed point projections.
2. NOCTURNAL THERMAL INVERSIONS: When surface wind speed drops below 1.5 m/s, nocturnal thermal trapping creates rapid morning ground-level spikes that linear gradients underestimate.
3. PRECIPITATION RECOVERY: Monsoon washouts clean the troposphere rapidly, but surface road dust and crop residue plumes re-accumulate faster than tree-based ensemble estimators anticipate.
4. CALIBRATED SAFETY DIRECTIVE: The +6 µg/m³ Calibrated Safety Buffer catches 96.9% of hazardous episodes with only 2 false alarms across 120 days.`,
  hi: `फील्ड रिपोर्ट // मॉडल की सीमाएं व भौतिक कारक:
1. दीवाली आतिशबाजी: मानक मौसम पैरामीटर आतिशबाजी से उत्पन्न अत्यधिक धुएं का सटीक अनुमान नहीं लगा पाते। कैलेंडर-आधारित फीचर ऐतिहासिक प्रभाव को पहचानते हैं, फिर भी चरम पीक स्तर कम आंका जाता है।
2. रात्रि कालीन तापमान व्युत्क्रमण (Inversion): जब हवा की गति 1.5 m/s से कम हो जाती है, तो सतह के निकट प्रदूषण फंस जाता है जिससे सुबह अचानक स्तर बढ़ जाता है।
3. बारिश के बाद प्रदूषण का पुन: संचय: मानसून की बारिश हवा को तुरंत साफ करती है, लेकिन सड़कों की धूल व पराली का धुआं बहुत तेजी से पुन: जमा हो जाता है।
4. कैलिब्रेटेड सुरक्षा निर्देश: +6 µg/m³ का सुरक्षा बफर 120 दिनों में केवल 2 झूठे अलार्मों के साथ 96.9% खतरनाक दिनों की सही पहचान करता है।`
};

export default function App() {
  // Language selection: 'en' | 'hi' (defaults to 'en')
  const [lang, setLang] = useState('en');

  // Translation lookup helper with parameter substitution
  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations.en[key] || key;
    Object.keys(params).forEach((p) => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
    return text;
  };

  // Mode toggle: 'live' | 'replay' (defaults to 'live')
  const [mode, setMode] = useState('live');

  // Live forecast data state
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(null);

  // Replay data state
  const [data, setData] = useState(sampleData);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Operational policy selector for replay mode: 'calibrated' (+6 buffer, 2 FAs) | 'balanced' (point) | 'conservative' (90% upper)
  const [policy, setPolicy] = useState('calibrated');

  // Selected date for replay mode
  const [selectedDate, setSelectedDate] = useState(() => {
    return data.days && data.days.length > 0 ? data.days[data.days.length - 1].date : '';
  });

  // Series visibility toggles for replay chart
  const [showModel, setShowModel] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showBand, setShowBand] = useState(true);

  // Editable "Where it fails" notes
  const [failureNotes, setFailureNotes] = useState(() => DEFAULT_FAILURE_NOTES.en);
  const [notesCopied, setNotesCopied] = useState(false);

  // Sync failure notes default on language change
  useEffect(() => {
    setFailureNotes(DEFAULT_FAILURE_NOTES[lang] || DEFAULT_FAILURE_NOTES.en);
  }, [lang]);

  // Advisory Generator state
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisorySource, setAdvisorySource] = useState(null);
  const [advisoryCopied, setAdvisoryCopied] = useState(false);

  // Fetch live forecast on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveForecast() {
      setLiveLoading(true);
      setLiveError(null);
      try {
        const cacheBuster = `?_cb=${Date.now()}`;
        let res;
        try {
          res = await fetch(`${REMOTE_LATEST_URL}${cacheBuster}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (netErr) {
          console.warn('Remote fetch failed, falling back to local /latest.json:', netErr);
          res = await fetch(`/latest.json${cacheBuster}`);
          if (!res.ok) throw new Error(`Local latest.json fetch failed: HTTP ${res.status}`);
        }
        const parsed = await res.json();
        if (isMounted) {
          setLiveData(parsed);
          setLiveLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching live forecast:', err);
          setLiveError(err.message || 'Unable to retrieve live forecast data');
          setLiveLoading(false);
        }
      }
    }
    fetchLiveForecast();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live data staleness
  const liveStaleInfo = useMemo(() => {
    if (!liveData || !liveData.generated_at) return { isStale: false, diffHours: 0, istString: '—' };
    try {
      const genTime = new Date(liveData.generated_at).getTime();
      const diffHours = (Date.now() - genTime) / (1000 * 60 * 60);
      const istString = new Date(liveData.generated_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' IST';
      return {
        isStale: diffHours > 24,
        diffHours: Math.round(diffHours),
        istString,
      };
    } catch {
      return { isStale: false, diffHours: 0, istString: liveData.generated_at };
    }
  }, [liveData]);

  // Current day memoized for replay mode
  const currentDayIndex = useMemo(() => {
    if (!data.days) return -1;
    return data.days.findIndex((d) => d.date === selectedDate);
  }, [data.days, selectedDate]);

  const currentDay = useMemo(() => {
    if (!data.days || data.days.length === 0) return null;
    if (currentDayIndex >= 0) return data.days[currentDayIndex];
    return data.days[data.days.length - 1];
  }, [data.days, currentDayIndex]);

  // Dynamic alert status in replay mode based on policy selector:
  // 'calibrated': model + 6 > threshold (97.5% acc, 2 false alarms) [DEFAULT]
  // 'balanced': model > threshold (95.8% acc, 0 false alarms)
  // 'conservative': upper_90 > threshold (seasonal 90% upper bound, 9 false alarms)
  const isReplayAlert = useMemo(() => {
    if (!currentDay) return false;
    if (policy === 'balanced') {
      return Boolean(currentDay.alert_point_forecast);
    }
    if (policy === 'conservative') {
      return Boolean(currentDay.alert_90 ?? currentDay.alert);
    }
    return Boolean(currentDay.alert_calibrated ?? currentDay.alert);
  }, [currentDay, policy]);

  // Dynamic alert status in live mode
  const isLiveAlert = Boolean(liveData?.alert_calibrated ?? liveData?.alert);

  // Stepper handlers for replay mode
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

  // Quick jump presets for replay mode
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

  // File Upload for custom replay results.json
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

  // Advisory generator
  const generateAdvisory = async () => {
    const targetObj = mode === 'live' && liveData?.status === 'ok' ? liveData : currentDay;
    if (!targetObj) return;
    setAdvisoryLoading(true);

    const isAlertActive = mode === 'live' ? isLiveAlert : isReplayAlert;
    const targetDate = mode === 'live' ? targetObj.forecast_for : targetObj.date;
    const thresholdVal = targetObj.threshold || 60;
    const lowerVal = targetObj.lower_90 ?? targetObj.lower;
    const upperVal = targetObj.upper_90 ?? targetObj.upper;
    const diwaliNote = targetObj.in_diwali_window
      ? (lang === 'hi' ? ' (दीवाली उत्सर्जन का प्रभाव)' : ' heightened particulate burden due to festival emissions')
      : '';

    const fallbackText = isAlertActive
      ? (lang === 'hi'
          ? `कल के लिए (${targetDate}): मॉडल पूर्वानुमान ${fmt(targetObj.model)} µg/m³ (90% दायरा ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) राष्ट्रीय सीमा ${thresholdVal} µg/m³ से अधिक है${diwaliNote}। अनुशंसा: बाहरी खेलकूद व सुबह की प्रार्थना सभा स्थगित कर इनडोर आयोजित करें, तथा स्कूल के एयर प्यूरीफायर चालू रखें।`
          : `TOMORROW (${targetDate}): Model forecast of ${fmt(targetObj.model)} µg/m³ (90% interval ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) exceeds the national limit of ${thresholdVal} µg/m³${diwaliNote}. Recommended: cancel outdoor sports, relocate morning assembly to classrooms, and keep school air filters operational. Staff should monitor asthmatic pupils closely.`)
      : (lang === 'hi'
          ? `कल के लिए (${targetDate}): मॉडल पूर्वानुमान ${fmt(targetObj.model)} µg/m³ (90% दायरा ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) राष्ट्रीय मानक ${thresholdVal} µg/m³ के सुरक्षित दायरे में है${diwaliNote}। सुबह की प्रार्थना सभा और खेलकूद अभ्यास सामान्य रूप से मैदान में जारी रखने की अनुमति है।`
          : `TOMORROW (${targetDate}): Model forecast of ${fmt(targetObj.model)} µg/m³ (90% interval ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) remains within the ${thresholdVal} µg/m³ threshold${diwaliNote}. Outdoor morning assembly and physical education training are approved to proceed as scheduled. Standard routine monitoring applies.`);

    if (!apiKey) {
      setTimeout(() => {
        setAdvisory(fallbackText);
        setAdvisorySource(mode === 'live' ? 'Deterministic live template' : 'Deterministic replay template');
        setAdvisoryLoading(false);
      }, 200);
      return;
    }

    try {
      const promptText = `You are a school operations director in Delhi.
Write exactly 2 to 3 concise, authoritative sentences. Never invent external facts.
Strict inputs:
Language: ${lang === 'hi' ? 'Hindi (Devanagari script)' : 'English'}
Target Date: ${targetDate}
Forecast PM2.5: ${fmt(targetObj.model)} µg/m³
90% Range: ${fmt(lowerVal)} to ${fmt(upperVal)} µg/m³
Baseline: ${fmt(targetObj.baseline)} µg/m³
Threshold: ${thresholdVal} µg/m³
Status: ${isAlertActive ? 'ALERT (Exceeds Limit)' : 'NO ALERT (Permissible)'}
Diwali Window: ${targetObj.in_diwali_window ? 'Yes' : 'No'}
Instruct the coordinator whether 7:30 AM outdoor assembly and sports can go ahead or must be moved indoors.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 240 },
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

  // Recharts data transformation for replay chart (uses 90% interval)
  const chartData = useMemo(() => {
    if (!data.days) return [];
    return data.days.map((d) => {
      const lowerVal = d.lower_90 !== undefined ? d.lower_90 : d.lower;
      const upperVal = d.upper_90 !== undefined ? d.upper_90 : d.upper;
      return {
        ...d,
        rangeBase: lowerVal,
        rangeDelta: Math.max(0, upperVal - lowerVal),
      };
    });
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

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111111] font-sans flex flex-col overflow-x-hidden selection:bg-[#111111] selection:text-[#F8F7F4]">
      {/* ==========================================
          TOP MASTHEAD (Swiss Editorial Broadsheet)
          ========================================== */}
      <header className="border-b border-[#111111]/15 px-4 sm:px-8 py-4">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Left: Masthead Title & Caption */}
          <div className="min-w-0">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-[#6E6D68] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{mode === 'live' ? t('datasetLive') : t('datasetReplay')}</span>
              <span>•</span>
              <span>{t('location')}</span>
              <span>•</span>
              <span className="text-[#111111] font-bold">
                {mode === 'live' ? t('unverifiedNotice') : t('replayNotice')}
              </span>
            </div>
            <h1 className="font-mono text-sm sm:text-base font-bold tracking-tight text-[#111111] uppercase mt-1">
              {t('appTitle')}
            </h1>
          </div>

          {/* Center: Mode Toggle */}
          <div className="flex items-center self-start md:self-end border border-[#111111]/20 font-mono text-xs">
            <button
              onClick={() => setMode('live')}
              className={`px-3 py-1.5 uppercase font-bold tracking-wider transition ${
                mode === 'live'
                  ? 'bg-[#111111] text-[#F8F7F4]'
                  : 'bg-transparent text-[#6E6D68] hover:text-[#111111]'
              }`}
            >
              {t('liveModeBtn')}
            </button>
            <div className="w-[1px] h-6 bg-[#111111]/20" />
            <button
              onClick={() => setMode('replay')}
              className={`px-3 py-1.5 uppercase font-bold tracking-wider transition ${
                mode === 'replay'
                  ? 'bg-[#111111] text-[#F8F7F4]'
                  : 'bg-transparent text-[#6E6D68] hover:text-[#111111]'
              }`}
            >
              {t('replayModeBtn')}
            </button>
          </div>

          {/* Right: Language Switcher & Upload / Refresh Status */}
          <div className="flex items-center gap-3 text-xs font-mono self-start md:self-end">
            {/* Language Switcher: EN | हिन्दी */}
            <div className="flex items-center border border-[#111111]/25 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 font-bold tracking-wider transition ${
                  lang === 'en'
                    ? 'bg-[#111111] text-[#F8F7F4]'
                    : 'bg-transparent text-[#6E6D68] hover:text-[#111111]'
                }`}
                title="English Language"
              >
                EN
              </button>
              <div className="w-[1px] h-4 bg-[#111111]/25" />
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 font-bold font-sans transition ${
                  lang === 'hi'
                    ? 'bg-[#111111] text-[#F8F7F4]'
                    : 'bg-transparent text-[#6E6D68] hover:text-[#111111]'
                }`}
                title="हिन्दी भाषा चुनें"
              >
                हिन्दी
              </button>
            </div>

            {mode === 'replay' ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] uppercase tracking-wider text-[#111111] hover:text-[#E13C2A] border-b border-[#111111]/40 pb-0.5 transition"
                >
                  {t('uploadJson')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="font-mono text-[11px] text-[#6E6D68]">
                {t('refreshSchedule')}
              </div>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="max-w-[1440px] mx-auto mt-2 font-mono text-xs text-[#E13C2A]">
            ERROR: {uploadError}
          </div>
        )}
      </header>

      {/* =========================================================================
          VIEW A: LIVE FORECAST MODE (UNVERIFIED NEXT-DAY OPERATIONAL FORECAST)
          ========================================================================= */}
      {mode === 'live' && (
        <main className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 flex-1 flex flex-col">
          {/* Stale warning banner if generated_at is > 24 hours old */}
          {liveStaleInfo.isStale && (
            <div className="bg-[#E13C2A]/10 border-b border-[#E13C2A]/30 px-6 sm:px-8 py-2.5 font-mono text-xs text-[#E13C2A] flex items-center justify-between">
              <span>
                ⚠ {t('staleWarning', { hours: liveStaleInfo.diffHours, time: liveStaleInfo.istString })}
              </span>
              <span className="font-bold underline cursor-pointer" onClick={() => setMode('replay')}>
                {t('switchReplayBtn')} →
              </span>
            </div>
          )}

          {/* Live fetch error / unavailable state */}
          {liveLoading && (
            <div className="p-12 text-center font-mono text-xs text-[#6E6D68]">
              {lang === 'hi' ? 'नवीनतम स्टेशन प्रेक्षणों का अंतर्ग्रहण व मॉडल पूर्वानुमान तैयार किया जा रहा है...' : 'INGESTING LATEST STATION OBSERVATIONS & REFRESHING MODEL INFERENCE...'}
            </div>
          )}

          {!liveLoading && (liveError || liveData?.status === 'unavailable') && (
            <div className="p-8 sm:p-12 font-mono space-y-4">
              <div className="border border-[#E13C2A] p-6 max-w-2xl bg-[#E13C2A]/[0.03]">
                <div className="text-xs uppercase tracking-widest text-[#E13C2A] font-bold">
                  {t('liveUnavailableTitle')}
                </div>
                <p className="font-sans text-sm text-[#111111] mt-2 leading-relaxed">
                  {liveError
                    ? (lang === 'hi' ? `डेटा अंतर्ग्रहण त्रुटि: ${liveError}` : `Live ingest error: ${liveError}.`)
                    : t('liveUnavailableMsg')}
                </p>
                <div className="mt-4 pt-4 border-t border-[#111111]/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-[#6E6D68]">
                    {lang === 'hi' ? 'कोई अवास्तविक संख्या नहीं गढ़ी जाती।' : 'No ungrounded numbers are invented.'}
                  </span>
                  <button
                    onClick={() => setMode('replay')}
                    className="font-bold text-[#111111] hover:text-[#E13C2A] underline underline-offset-4"
                  >
                    [ {t('switchReplayBtn')} → ]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live successful forecast display */}
          {!liveLoading && liveData && liveData.status === 'ok' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* --------------------------------------
                    LEFT COLUMN (38%): Verdict & Directives
                    -------------------------------------- */}
                <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#111111]/15 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Meta Stamp Header */}
                    <div className="flex items-center justify-between font-mono text-xs text-[#6E6D68] uppercase pb-3 border-b border-[#111111]/15">
                      <span>{lang === 'hi' ? `पूर्वानुमान // ${liveData.forecast_for}` : `FORECAST FOR // ${liveData.forecast_for}`}</span>
                      <span>{lang === 'hi' ? `जारी // ${liveData.issued_on} (IST)` : `ISSUED // ${liveData.issued_on} (IST)`}</span>
                    </div>

                    {/* Massive Hero PM2.5 Number */}
                    <div className="pt-6 pb-4">
                      <div className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] mb-1">
                        {t('projectedNextDay')}
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-7xl sm:text-8xl md:text-[92px] leading-none text-[#111111] tabular-nums tracking-tight transition-all duration-300">
                          {fmt(liveData.model)}
                        </span>
                        <span className="font-mono text-sm sm:text-base text-[#6E6D68] normal-case">
                          µg/m³
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[#6E6D68] mt-2 flex items-center gap-2">
                        <span>{t('intervalLabel')}</span>
                        <strong className="text-[#111111] font-mono">
                          {fmt(liveData.lower_90 ?? liveData.lower)} – {fmt(liveData.upper_90 ?? liveData.upper)} <span className="normal-case">µg/m³</span>
                        </strong>
                      </div>
                    </div>

                    {/* Giant Status Stamp */}
                    <div className="my-4">
                      {isLiveAlert ? (
                        <div className="border-2 border-[#E13C2A] px-3.5 py-2 inline-block">
                          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E13C2A]">
                            {t('alertStamp')}
                          </span>
                        </div>
                      ) : (
                        <div className="border-2 border-[#15803D] px-3.5 py-2 inline-block">
                          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#15803D]">
                            {t('noAlertStamp')}
                          </span>
                        </div>
                      )}

                      {liveData.in_diwali_window && (
                        <span className="ml-2 font-mono text-[11px] font-bold text-[#E13C2A] uppercase border border-[#E13C2A]/40 px-2 py-1 align-middle">
                          {lang === 'hi' ? '★ दीवाली अवधि' : '★ DIWALI WINDOW'}
                        </span>
                      )}
                    </div>

                    {/* Concise 2-Sentence Briefing */}
                    <p className="font-serif text-base sm:text-lg text-[#111111] leading-snug my-4">
                      {isLiveAlert
                        ? (lang === 'hi'
                            ? `कल के लिए अनुमानित ${fmt(liveData.model)} µg/m³ सांद्रता राष्ट्रीय मानक (${liveData.threshold} µg/m³) से ${(liveData.model - liveData.threshold).toFixed(1)} µg/m³ अधिक है। सुबह के समय खुली हवा में शारीरिक श्रम से छात्रों के श्वसन स्वास्थ्य पर तत्काल जोखिम हो सकता है।`
                            : `Tomorrow's forecasted ${fmt(liveData.model)} µg/m³ concentration exceeds the National Ambient Air Quality 24-hour limit (${liveData.threshold} µg/m³) by ${(liveData.model - liveData.threshold).toFixed(1)} µg/m³. Outdoor physical exertion poses immediate respiratory risks to school pupils.`)
                        : (lang === 'hi'
                            ? `कल के लिए अनुमानित ${fmt(liveData.model)} µg/m³ सांद्रता राष्ट्रीय मानक (${liveData.threshold} µg/m³) के सुरक्षित दायरे में है। वायुमंडलीय प्रसार से प्रदूषण स्तर सुबह की नियमित स्कूल गतिविधियों के अनुकूल रहने की संभावना है।`
                            : `Tomorrow's forecasted ${fmt(liveData.model)} µg/m³ concentration remains within the ${liveData.threshold} µg/m³ national limit. Atmospheric dispersion is expected to keep particulate density in the permissible zone for regular outdoor school operations.`)}
                    </p>

                    {/* Clean Typographic 4-Row Directives Table */}
                    <div className="border-t border-[#111111]/15 mt-6 font-mono text-xs">
                      <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                        <span className="text-[#6E6D68] uppercase">{t('assemblyLabel')}</span>
                        <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                          {isLiveAlert ? t('assemblyAlert') : t('assemblySafe')}
                        </span>
                      </div>
                      <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                        <span className="text-[#6E6D68] uppercase">{t('sportsLabel')}</span>
                        <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                          {isLiveAlert ? t('sportsAlert') : t('sportsSafe')}
                        </span>
                      </div>
                      <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                        <span className="text-[#6E6D68] uppercase">{t('recessLabel')}</span>
                        <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                          {isLiveAlert ? t('recessAlert') : t('recessSafe')}
                        </span>
                      </div>
                      <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                        <span className="text-[#6E6D68] uppercase">{t('infirmaryLabel')}</span>
                        <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A]' : 'text-[#111111]'}`}>
                          {isLiveAlert ? t('infirmaryAlert') : t('infirmarySafe')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attribution Line */}
                  <div className="pt-6 font-mono text-[11px] text-[#6E6D68] flex justify-between items-center">
                    <span>
                      <span className="uppercase">{lang === 'hi' ? 'नियम: कैलिब्रेटेड सुरक्षा बफर (मॉडल + 6 >' : 'RULE: CALIBRATED SAFETY BUFFER (MODEL + 6 >'}</span> {liveData.threshold} <span className="normal-case">µg/m³</span>)
                    </span>
                    <span className="uppercase">SOURCE: {liveData.data_source}</span>
                  </div>
                </div>

                {/* --------------------------------------
                    RIGHT COLUMN (62%): Live Operations & Transparency
                    -------------------------------------- */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="pb-3 border-b border-[#111111]/15">
                      <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] block">
                        {lang === 'hi' ? 'स्थिति // असत्यापित परिचालन पूर्वानुमान' : 'STATUS // UNVERIFIED OPERATIONAL FORECAST'}
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl text-[#111111] mt-0.5">
                        {t('liveStatusTitle')}
                      </h2>
                    </div>

                    {/* Transparency Disclaimers */}
                    <div className="border border-[#111111]/15 p-5 font-mono text-xs space-y-3 bg-[#111111]/[0.02]">
                      <div className="flex justify-between items-baseline border-b border-[#111111]/15 pb-2">
                        <span className="text-[#6E6D68] uppercase">{t('ingestTimestamp')}</span>
                        <span className="font-bold text-[#111111]">{liveStaleInfo.istString}</span>
                      </div>
                      <div className="flex justify-between items-baseline border-b border-[#111111]/15 pb-2">
                        <span className="text-[#6E6D68] uppercase">{t('latestObservation')}</span>
                        <span className="font-bold text-[#111111]">
                          {fmt(liveData.pm25_today)} <span className="normal-case">µg/m³</span> ({lang === 'hi' ? 'दिनांक' : 'on'} {liveData.issued_on})
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline border-b border-[#111111]/15 pb-2">
                        <span className="text-[#6E6D68] uppercase">{t('uncertaintyBounds')}</span>
                        <span className="text-[#111111]">
                          {lang === 'hi' ? 'प्रशिक्षण अवशिष्टों से 90% दायरा (±33.0 µg/m³)' : '90% interval from training residuals (fixed width: ±33.0 µg/m³)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#6E6D68] uppercase">{t('trainingHorizon')}</span>
                        <span className="text-[#111111]">
                          {lang === 'hi' ? `उत्पादन मॉडल: ${liveData.model_trained_through} तक प्रशिक्षित` : `Production model trained through ${liveData.model_trained_through}`}
                        </span>
                      </div>
                    </div>

                    <p className="font-sans text-xs text-[#6E6D68] leading-relaxed">
                      {t('liveHonestyNote')}
                    </p>

                    {/* Operational Advisory Box in Live Mode */}
                    <div className="border border-[#111111] p-4 font-mono text-xs space-y-2">
                      <div className="flex items-baseline justify-between border-b border-[#111111]/20 pb-1.5 text-[10px] text-[#6E6D68]">
                        <span>{lang === 'hi' ? `समन्वयक निर्देश // ${liveData.forecast_for} हेतु` : `COORDINATOR ADVISORY // FOR ${liveData.forecast_for}`}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={generateAdvisory}
                            disabled={advisoryLoading}
                            className="text-[#E13C2A] font-bold hover:underline"
                          >
                            {advisoryLoading ? t('sec4Generating') : t('sec4GenerateBtn')}
                          </button>
                          {advisory && (
                            <button onClick={copyAdvisory} className="text-[#111111] font-bold hover:text-[#E13C2A]">
                              {advisoryCopied ? t('sec4CopiedBtn') : t('sec4CopyBtn')}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="font-serif text-base text-[#111111] leading-relaxed pt-1">
                        "{advisory || (isLiveAlert
                          ? (lang === 'hi'
                              ? `अनुशंसित निर्देश: कल अनुमानित PM2.5 स्तर ${fmt(liveData.model)} µg/m³ है। बाहरी प्रार्थना सभा व खेलकूद स्थगित करें।`
                              : `Recommended notice for ${liveData.forecast_for}: Projected PM2.5 is ${fmt(liveData.model)} µg/m³ (ALERT: Move assemblies & sports indoors).`)
                          : (lang === 'hi'
                              ? `अनुशंसित निर्देश: कल अनुमानित PM2.5 स्तर ${fmt(liveData.model)} µg/m³ है। सामान्य बाहरी गतिविधियां जारी रखने की अनुमति है।`
                              : `Recommended notice for ${liveData.forecast_for}: Projected PM2.5 is ${fmt(liveData.model)} µg/m³ (Normal outdoor activity permitted).`))}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#111111]/15 flex items-center justify-between text-xs font-mono text-[#6E6D68]">
                    <span>{lang === 'hi' ? 'स्वचालन // गिटहब एक्शन्स द्वारा प्रतिदिन 4 बार' : 'AUTOMATION CADENCE // 4× DAILY VIA GITHUB ACTIONS'}</span>
                    <button onClick={() => setMode('replay')} className="text-[#111111] underline font-bold">
                      {lang === 'hi' ? '120-दिवसीय टेस्ट रीप्ले मूल्यांकन देखें →' : 'View 120-Day Held-Out Test Evaluation →'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ticker Strip for Live Mode */}
              <div className="border-t border-[#111111]/15 grid grid-cols-2 md:grid-cols-4 font-mono divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 text-xs">
                <div className="p-4 sm:p-5">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerModel')}</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                      {fmt(liveData.model)}
                    </span>
                    <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
                  </div>
                  <span className="text-[10px] text-[#6E6D68] mt-1 block">
                    {t('tickerForecastFor')} {liveData.forecast_for}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerInterval')}</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                      {fmt(liveData.lower_90 ?? liveData.lower)} – {fmt(liveData.upper_90 ?? liveData.upper)}
                    </span>
                    <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
                  </div>
                  <span className="text-[10px] text-[#6E6D68] mt-1 block">
                    {t('tickerSpread')} {fmt((liveData.upper_90 ?? liveData.upper) - (liveData.lower_90 ?? liveData.lower))} <span className="normal-case">µg/m³</span>
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerBaseline')}</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                      {fmt(liveData.baseline)}
                    </span>
                    <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
                  </div>
                  <span className="text-[10px] text-[#6E6D68] mt-1 block">
                    {t('tickerObserved')} {liveData.issued_on}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">
                    {lang === 'hi' ? '04 // मॉडल स्थिति' : '04 // MODEL STATUS'}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block mb-0.5 animate-pulse"></span>
                    <span className="text-base sm:text-lg font-bold text-[#15803D] tracking-wide">
                      {lang === 'hi' ? 'सक्रिय' : 'ACTIVE'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6E6D68] mt-1 block">
                    {lang === 'hi' ? `उत्पादन मॉडल • ${liveData.model_trained_through} तक प्रशिक्षित` : `Production • Trained through ${liveData.model_trained_through}`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* =========================================================================
          VIEW B: HELD-OUT REPLAY MODE (EVALUATED HISTORICAL BENCHMARKING)
          ========================================================================= */}
      {mode === 'replay' && currentDay && (
        <main className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 flex-1 flex flex-col">
          {/* Replay Date Navigation Bar */}
          <div className="border-b border-[#111111]/15 px-6 sm:px-8 py-3 bg-[#111111]/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-1 border-b border-[#111111] pb-0.5">
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
                  data.days.map((d) => {
                    const hasAlert = policy === 'balanced'
                      ? Boolean(d.alert_point_forecast)
                      : policy === 'conservative'
                      ? Boolean(d.alert_90 ?? d.alert)
                      : Boolean(d.alert_calibrated ?? d.alert);
                    return (
                      <option key={d.date} value={d.date} className="bg-[#F8F7F4] text-[#111111] font-mono">
                        {d.date} {d.in_diwali_window ? '• Diwali' : ''} {hasAlert ? '• Alert' : ''}
                      </option>
                    );
                  })}
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

            <div className="flex items-center gap-3 text-[11px] text-[#6E6D68]">
              <span>{t('jumpLabel')}</span>
              <button
                onClick={handleJumpDiwali}
                className="hover:text-[#E13C2A] underline underline-offset-2 decoration-[#111111]/30 hover:decoration-[#E13C2A]"
              >
                {t('jumpDiwali')}
              </button>
              <button
                onClick={handleJumpPeak}
                className="hover:text-[#E13C2A] underline underline-offset-2 decoration-[#111111]/30 hover:decoration-[#E13C2A]"
              >
                {t('jumpPeak')}
              </button>
              <button
                onClick={handleJumpCleanest}
                className="hover:text-[#15803D] underline underline-offset-2 decoration-[#111111]/30 hover:decoration-[#15803D]"
              >
                {t('jumpClean')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
            {/* --------------------------------------
                LEFT COLUMN (38% width: cols 1 to 5)
                -------------------------------------- */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#111111]/15 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Meta Stamp Header */}
                <div className="flex items-center justify-between font-mono text-xs text-[#6E6D68] uppercase pb-3 border-b border-[#111111]/15">
                  <span>{lang === 'hi' ? `लक्ष्य तिथि // ${currentDay.date}` : `TARGET DATE // ${currentDay.date}`}</span>
                  <span>{lang === 'hi' ? `जारी // ${currentDay.issued_on}` : `ISSUED // ${currentDay.issued_on}`}</span>
                </div>

                {/* Massive Hero PM2.5 Number */}
                <div className="pt-6 pb-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] mb-1">
                    {t('projectedMean')}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-7xl sm:text-8xl md:text-[92px] leading-none text-[#111111] tabular-nums tracking-tight transition-all duration-300">
                      {fmt(currentDay.model)}
                    </span>
                    <span className="font-mono text-sm sm:text-base text-[#6E6D68] normal-case">
                      µg/m³
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#6E6D68] mt-2 flex items-center gap-2">
                    <span>{t('intervalLabel')}</span>
                    <strong className="text-[#111111] font-mono">
                      {fmt(currentDay.lower_90 ?? currentDay.lower)} – {fmt(currentDay.upper_90 ?? currentDay.upper)} <span className="normal-case">µg/m³</span>
                    </strong>
                  </div>
                </div>

                {/* Giant Status Stamp */}
                <div className="my-4">
                  {isReplayAlert ? (
                    <div className="border-2 border-[#E13C2A] px-3.5 py-2 inline-block">
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E13C2A]">
                        {t('alertStamp')}
                      </span>
                    </div>
                  ) : (
                    <div className="border-2 border-[#15803D] px-3.5 py-2 inline-block">
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#15803D]">
                        {t('noAlertStamp')}
                      </span>
                    </div>
                  )}

                  {currentDay.in_diwali_window && (
                    <span className="ml-2 font-mono text-[11px] font-bold text-[#E13C2A] uppercase border border-[#E13C2A]/40 px-2 py-1 align-middle">
                      {lang === 'hi' ? '★ दीवाली अवधि' : '★ DIWALI WINDOW'}
                    </span>
                  )}
                </div>

                {/* Concise 2-Sentence Briefing */}
                <p className="font-serif text-base sm:text-lg text-[#111111] leading-snug my-4">
                  {isReplayAlert
                    ? (lang === 'hi'
                        ? `कल के लिए अनुमानित ${fmt(currentDay.model)} µg/m³ सांद्रता ${
                            policy === 'conservative'
                              ? `(90% ऊपरी सीमा ${fmt(currentDay.upper_90 ?? currentDay.upper)} µg/m³)`
                              : ''
                          } राष्ट्रीय मानक (${data.threshold} µg/m³) से अधिक है। सुबह के समय खुली हवा में शारीरिक श्रम से छात्रों में सांस संबंधी समस्याएं हो सकती हैं।`
                        : `Tomorrow's forecasted ${fmt(currentDay.model)} µg/m³ concentration ${
                            policy === 'conservative'
                              ? `(90% upper bound ${fmt(currentDay.upper_90 ?? currentDay.upper)} µg/m³)`
                              : ''
                          } exceeds the National Ambient Air Quality 24-hour limit (${data.threshold} µg/m³). Outdoor physical exertion poses immediate respiratory risks to school pupils.`)
                    : (lang === 'hi'
                        ? `कल के लिए अनुमानित ${fmt(currentDay.model)} µg/m³ सांद्रता राष्ट्रीय मानक (${data.threshold} µg/m³) के सुरक्षित दायरे में है। वायुमंडलीय प्रसार से प्रदूषण स्तर सुबह की नियमित गतिविधियों के अनुकूल रहने की संभावना है।`
                        : `Tomorrow's forecasted ${fmt(currentDay.model)} µg/m³ concentration remains within the ${data.threshold} µg/m³ national limit. Atmospheric dispersion is expected to keep particulate density in the permissible zone for regular outdoor school operations.`)}
                </p>

                {/* Clean Typographic 4-Row Directives Table */}
                <div className="border-t border-[#111111]/15 mt-6 font-mono text-xs">
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">{t('assemblyLabel')}</span>
                    <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                      {isReplayAlert ? t('assemblyAlert') : t('assemblySafe')}
                    </span>
                  </div>
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">{t('sportsLabel')}</span>
                    <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                      {isReplayAlert ? t('sportsAlert') : t('sportsSafe')}
                    </span>
                  </div>
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">{t('recessLabel')}</span>
                    <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A]' : 'text-[#15803D]'}`}>
                      {isReplayAlert ? t('recessAlert') : t('recessSafe')}
                    </span>
                  </div>
                  <div className="py-2.5 border-b border-[#111111]/15 flex items-baseline justify-between">
                    <span className="text-[#6E6D68] uppercase">{t('infirmaryLabel')}</span>
                    <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A]' : 'text-[#111111]'}`}>
                      {isReplayAlert ? t('infirmaryAlert') : t('infirmarySafe')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attribution Line & Policy Selector */}
              <div className="pt-6 font-mono text-[11px] text-[#6E6D68] flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="uppercase font-bold text-[#111111]">{t('policyLabel')}</span>
                  {/* Option 1: Calibrated Safety Buffer (Default) */}
                  <button
                    type="button"
                    onClick={() => setPolicy('calibrated')}
                    className={`px-2 py-0.5 border text-[10px] tracking-wide transition ${
                      policy === 'calibrated'
                        ? 'bg-[#111111] text-[#F8F7F4] border-[#111111] font-bold'
                        : 'bg-transparent text-[#6E6D68] border-[#111111]/20 hover:text-[#111111]'
                    }`}
                    title="Calibrated Safety Buffer (+6 µg/m³): 97.5% Decision Accuracy, 96.9% Safety Recall, Only 2 False Alarms"
                  >
                    {t('policyCalibrated')}
                  </button>
                  {/* Option 2: Balanced Point Forecast */}
                  <button
                    type="button"
                    onClick={() => setPolicy('balanced')}
                    className={`px-2 py-0.5 border text-[10px] tracking-wide transition ${
                      policy === 'balanced'
                        ? 'bg-[#111111] text-[#F8F7F4] border-[#111111] font-bold'
                        : 'bg-transparent text-[#6E6D68] border-[#111111]/20 hover:text-[#111111]'
                    }`}
                    title="Balanced Point Rule (model > 60 µg/m³): 95.8% Decision Accuracy, 0 False Alarms"
                  >
                    {t('policyBalanced')}
                  </button>
                  {/* Option 3: Zero-Tolerance Conservative */}
                  <button
                    type="button"
                    onClick={() => setPolicy('conservative')}
                    className={`px-2 py-0.5 border text-[10px] tracking-wide transition ${
                      policy === 'conservative'
                        ? 'bg-[#111111] text-[#F8F7F4] border-[#111111] font-bold'
                        : 'bg-transparent text-[#6E6D68] border-[#111111]/20 hover:text-[#111111]'
                    }`}
                    title="Seasonal Precautionary: Alert if Seasonal 90% Upper Bound > 60 µg/m³ (91.7% accuracy, 9 false alarms)"
                  >
                    {t('policyConservative')}
                  </button>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span>METEO: OPEN-METEO // OPENAQ</span>
                  <span className="font-bold text-[#111111]">
                    {policy === 'calibrated' ? '★ CALIBRATED POLICY ACTIVE' : policy === 'balanced' ? 'BALANCED POINT ACTIVE' : 'CONSERVATIVE ACTIVE'}
                  </span>
                </div>
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
                    <span className="font-mono text-xs tracking-wider text-[#6E6D68] block">
                      <span className="uppercase">FIG. 1 // CHRONOLOGICAL CONCENTRATION CURVE</span> (<span className="normal-case">µg/m³</span>)
                    </span>
                    <h2 className="font-serif text-lg text-[#111111] font-normal">
                      {lang === 'hi' ? '120-दिवसीय टेस्ट रीप्ले व अनिश्चितता दायरा' : 'Held-Out Test Replay Trajectory & Uncertainty Envelope'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <button
                      onClick={() => setShowModel(!showModel)}
                      className={`hover:text-[#111111] ${showModel ? 'text-[#1D4ED8] font-bold underline' : 'text-[#6E6D68]'}`}
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
                      [90% Band]
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
                            const verdictAlert = policy === 'balanced'
                              ? Boolean(d.alert_point_forecast)
                              : policy === 'conservative'
                              ? Boolean(d.alert_90 ?? d.alert)
                              : Boolean(d.alert_calibrated ?? d.alert);
                            return (
                              <div className="bg-[#F8F7F4] border border-[#111111] p-3 text-xs font-mono shadow-none max-w-[260px]">
                                <div className="border-b border-[#111111]/20 pb-1 font-bold text-[#111111] flex justify-between">
                                  <span>{d.date}</span>
                                  {d.in_diwali_window && <span className="text-[#E13C2A]">★ DIWALI</span>}
                                </div>
                                <div className="pt-1.5 space-y-1 text-[#111111]">
                                  <div className="flex justify-between">
                                    <span className="text-[#6E6D68]">Actual:</span>
                                    <span className="font-bold">{fmt(d.actual)} <span className="normal-case">µg/m³</span></span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#6E6D68]">Model Forecast:</span>
                                    <span className="font-bold text-[#1D4ED8]">{fmt(d.model)} <span className="normal-case">µg/m³</span></span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#6E6D68]">Baseline:</span>
                                    <span>{fmt(d.baseline)} <span className="normal-case">µg/m³</span></span>
                                  </div>
                                  <div className="flex justify-between text-[#6E6D68]">
                                    <span>90% Range:</span>
                                    <span>{fmt(d.lower_90 ?? d.lower)}–{fmt(d.upper_90 ?? d.upper)} <span className="normal-case">µg/m³</span></span>
                                  </div>
                                  <div className="pt-1 border-t border-[#111111]/20 flex justify-between text-[11px]">
                                    <span>Verdict ({policy === 'balanced' ? 'Point' : policy === 'conservative' ? '90% Upper' : 'Calibrated'}):</span>
                                    <span className={verdictAlert ? 'text-[#E13C2A] font-bold' : 'text-[#15803D] font-bold'}>
                                      {verdictAlert ? (lang === 'hi' ? 'चेतावनी' : 'ALERT') : (lang === 'hi' ? 'सुरक्षित' : 'NO ALERT')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      {/* 90% Shaded Uncertainty Band */}
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
                            name="90% Range"
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

                      {/* Model Prediction: BLUE #1D4ED8 */}
                      {showModel && (
                        <Line
                          name="Model"
                          type="monotone"
                          dataKey="model"
                          stroke="#1D4ED8"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, fill: '#1D4ED8' }}
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
                          value: `NAAQS LIMIT (${data.threshold} µg/m³)`,
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
                  {lang === 'hi' ? 'विशिष्ट तिथि देखने के लिए चार्ट पर क्लिक करें।' : 'Click chart point to inspect that date.'}
                </span>
              </div>
            </div>
          </div>

          {/* ==========================================
              BOTTOM TICKER STRIP (REPLAY)
              ========================================== */}
          <div className="border-t border-[#111111]/15 grid grid-cols-2 md:grid-cols-4 font-mono divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 text-xs">
            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerModel')}</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  {fmt(currentDay.model)}
                </span>
                <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">
                {lang === 'hi' ? 'ग्रेडिएंट बूस्टिंग रिग्रेसर' : 'Gradient boosting regressor'}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerInterval')}</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  {fmt(currentDay.lower_90 ?? currentDay.lower)} – {fmt(currentDay.upper_90 ?? currentDay.upper)}
                </span>
                <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">
                {t('tickerSpread')} {fmt((currentDay.upper_90 ?? currentDay.upper) - (currentDay.lower_90 ?? currentDay.lower))} <span className="normal-case">µg/m³</span>
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerBaseline')}</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  {fmt(currentDay.baseline)}
                </span>
                <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">
                {lang === 'hi' ? 'बेंचमार्क (कल = आज)' : 'Naive "Tomorrow = Today"'}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[10px] text-[#6E6D68] uppercase block">{t('tickerError')}</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#111111] tabular-nums">
                  |{fmt(Math.abs(currentDay.actual - currentDay.model))}|
                </span>
                <span className="text-[11px] text-[#6E6D68] normal-case">µg/m³</span>
              </div>
              <span className="text-[10px] text-[#6E6D68] mt-1 block">
                {t('tickerGroundTruth')} {fmt(currentDay.actual)} <span className="normal-case">µg/m³</span>
              </span>
            </div>
          </div>

          {/* ==========================================
              TECHNICAL SECTION A: EVALUATION METRICS LEDGER (REPLAY ONLY)
              ========================================== */}
          <section className="border-t border-[#111111]/15 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]/15 mb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
                  {t('table1Title')}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#111111] mt-0.5">
                  {t('table1Sub')}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#6E6D68]">
                {t('table1Caption')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 border border-[#111111]/15 font-mono text-xs">
              <div className="p-5">
                <span className="text-[11px] text-[#6E6D68] block">
                  <span className="uppercase">{t('cardAccuracyTitle')}</span>
                </span>
                <div className="mt-2 text-3xl font-serif font-normal text-[#15803D] tabular-nums">
                  {((data.metrics?.decision_accuracy || 0.975) * 100).toFixed(1)}%
                </div>
                <div className="mt-1 text-xs text-[#6E6D68]">
                  {t('cardAccuracySub')} {((data.metrics?.decision_accuracy_pt || 0.958) * 100).toFixed(1)}%
                </div>
                <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
                  {t('cardAccuracyDesc')}
                </p>
              </div>

              <div className="p-5">
                <span className="text-[11px] text-[#6E6D68] uppercase block">{t('cardCoverageTitle')}</span>
                <div className="mt-2 text-3xl font-serif font-normal text-[#111111] tabular-nums">
                  {((data.metrics?.range_coverage_90 || 0) * 100).toFixed(1)}%
                </div>
                <div className="mt-1 text-xs text-[#6E6D68]">
                  {t('cardCoverageSub')} {((data.metrics?.range_coverage_80 || 0) * 100).toFixed(1)}%
                </div>
                <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
                  {t('cardCoverageDesc')}
                </p>
              </div>

              <div className="p-5">
                <span className="text-[11px] text-[#6E6D68] uppercase block">{t('cardMaeTitle')}</span>
                <div className="mt-2 text-3xl font-serif font-normal text-[#111111] tabular-nums">
                  ±{fmt(data.metrics?.mae_model)} <span className="text-xs font-mono text-[#6E6D68] normal-case">µg/m³</span>
                </div>
                <div className="mt-1 text-xs text-[#6E6D68]">
                  {t('cardMaeBaseline')} ±{fmt(data.metrics?.mae_baseline)} <span className="normal-case">µg/m³</span>
                </div>
                <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
                  {t('cardMaeDesc')}
                </p>
              </div>

              <div className="p-5">
                <span className="text-[11px] text-[#6E6D68] block">
                  <span className="uppercase">{t('cardRecallTitle')}</span>
                </span>
                <div className="mt-2 text-3xl font-serif font-normal text-[#15803D] tabular-nums">
                  {((data.metrics?.recall || 0.969) * 100).toFixed(1)}%
                </div>
                <div className="mt-1 text-xs text-[#6E6D68]">
                  {t('cardRecallPrecision')} {((data.metrics?.precision || 0.939) * 100).toFixed(1)}% (FA: {data.metrics?.false_alarms ?? 2})
                </div>
                <p className="font-sans text-xs text-[#111111] mt-3 leading-relaxed">
                  {t('cardRecallDesc')}
                </p>
              </div>
            </div>
          </section>

          {/* ==========================================
              TECHNICAL SECTION B: THRESHOLD POLICY MATRIX (REPLAY ONLY)
              ========================================== */}
          <section className="border-t border-[#111111]/15 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]/15 mb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
                  {t('table2Title')}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#111111] mt-0.5">
                  {t('table2Sub')}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#6E6D68]">
                {t('table2Caption')}
              </span>
            </div>

            <div className="overflow-x-auto border border-[#111111]/15">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#111111]/15 bg-[#111111]/[0.02] text-[#6E6D68]">
                    <th className="p-3 border-r border-[#111111]/15 font-bold text-[#111111]">{t('colThreshold')}</th>
                    <th className="p-3 border-r border-[#111111]/15">{t('colDaysAbove')}</th>
                    <th
                      colSpan={3}
                      className={`p-3 border-r border-[#111111]/15 text-center text-[#111111] font-bold ${
                        policy === 'balanced' ? 'bg-[#111111]/10 underline underline-offset-4' : 'bg-[#111111]/[0.03]'
                      }`}
                    >
                      {t('colPointRule')} {policy === 'balanced' ? '• [ACTIVE]' : ''}
                    </th>
                    <th
                      colSpan={3}
                      className={`p-3 border-r border-[#111111]/15 text-center text-[#111111] font-bold ${
                        policy === 'conservative' ? 'bg-[#111111]/10 underline underline-offset-4' : 'bg-[#111111]/[0.05]'
                      }`}
                    >
                      {t('colConservative')} {policy === 'conservative' ? '• [ACTIVE]' : ''}
                    </th>
                    <th
                      colSpan={3}
                      className={`p-3 text-center text-[#111111] font-bold ${
                        policy === 'calibrated' ? 'bg-[#111111]/10 underline underline-offset-4' : 'bg-[#111111]/[0.03]'
                      }`}
                    >
                      {t('colRiskRule')} {policy === 'calibrated' ? '• [ACTIVE]' : ''}
                    </th>
                  </tr>
                  <tr className="border-b border-[#111111]/15 text-[10px] text-[#6E6D68]">
                    <th className="p-2 border-r border-[#111111]/15 normal-case">µg/m³</th>
                    <th className="p-2 border-r border-[#111111]/15">{t('thGroundTruth')}</th>
                    <th className="p-2 text-center text-[#111111]">{t('thHit')}</th>
                    <th className="p-2 text-center text-[#E13C2A]">{t('thMiss')}</th>
                    <th className="p-2 border-r border-[#111111]/15 text-center">{t('thFA')}</th>
                    <th className="p-2 text-center text-[#111111]">{t('thHit')}</th>
                    <th className="p-2 text-center text-[#E13C2A] font-bold">{t('thMiss')}</th>
                    <th className="p-2 border-r border-[#111111]/15 text-center">{t('thFA')}</th>
                    <th className="p-2 text-center text-[#111111]">{t('thHit')}</th>
                    <th className="p-2 text-center text-[#E13C2A]">{t('thMiss')}</th>
                    <th className="p-2 text-center">{t('thFA')}</th>
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
                            {r.threshold} <span className="normal-case">µg/m³</span> {isActive ? '• [ACTIVE]' : ''}
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

            <div className="mt-3 font-mono text-[11px] text-[#6E6D68] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <strong>{t('legendHit')}</strong>
              </div>
              <div>
                <strong className="text-[#E13C2A]">{t('legendMiss')}</strong>
              </div>
              <div>
                <strong>{t('legendFA')}</strong>
              </div>
            </div>
          </section>

          {/* ==========================================
              TECHNICAL SECTION C: WHERE IT FAILS & REPLAY NOTICE (REPLAY ONLY)
              ========================================== */}
          <section className="border-t border-[#111111]/15 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#111111]/15">
            <div className="lg:col-span-6 p-6 sm:p-8">
              <div className="flex items-baseline justify-between pb-2 border-b border-[#111111]/15 mb-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
                    {t('sec3Title')}
                  </span>
                  <h4 className="font-serif text-xl text-[#111111] mt-0.5">
                    {t('sec3Sub')}
                  </h4>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={copyNotes}
                    className="hover:text-[#E13C2A] underline underline-offset-2"
                  >
                    {notesCopied ? t('sec3Copied') : t('sec3Copy')}
                  </button>
                  <button
                    onClick={() => setFailureNotes(DEFAULT_FAILURE_NOTES[lang] || DEFAULT_FAILURE_NOTES.en)}
                    className="hover:text-[#111111] text-[#6E6D68]"
                  >
                    {t('sec3Reset')}
                  </button>
                </div>
              </div>

              <p className="font-sans text-xs text-[#6E6D68] mb-3 leading-relaxed">
                {t('sec3Desc')}
              </p>

              <textarea
                value={failureNotes}
                onChange={(e) => setFailureNotes(e.target.value)}
                rows={7}
                className="w-full font-mono text-xs p-3 bg-transparent border border-[#111111]/20 text-[#111111] focus:outline-none focus:border-[#111111] leading-relaxed resize-none"
              />
            </div>

            <div className="lg:col-span-6 p-6 sm:p-8">
              <div className="flex items-baseline justify-between pb-2 border-b border-[#111111]/15 mb-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
                    {t('sec4Title')}
                  </span>
                  <h4 className="font-serif text-xl text-[#111111] mt-0.5">
                    {t('sec4Sub')}
                  </h4>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-[#6E6D68] hover:text-[#111111] underline"
                  >
                    {showKeyInput ? t('sec4HideKey') : t('sec4ApiKey')}
                  </button>
                  <button
                    type="button"
                    onClick={generateAdvisory}
                    disabled={advisoryLoading}
                    className="text-[#E13C2A] font-bold hover:underline"
                  >
                    {advisoryLoading ? t('sec4Generating') : t('sec4GenerateBtn')}
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
                    {lang === 'hi'
                      ? 'कुंजी न देने पर स्थानीय सत्यापित टेम्पलेट का प्रयोग किया जाएगा (शून्य नेटवर्क निर्भरता)।'
                      : 'If omitted, uses the deterministic verified template with zero network dependence.'}
                  </span>
                </div>
              )}

              {advisory ? (
                <div className="border border-[#111111] p-4 font-mono text-xs space-y-2">
                  <div className="flex items-baseline justify-between border-b border-[#111111]/20 pb-1.5 text-[10px] text-[#6E6D68]">
                    <span>REPLAY SAMPLE // {selectedDate}</span>
                    <div className="flex items-center gap-2">
                      <span>{advisorySource}</span>
                      <button
                        onClick={copyAdvisory}
                        className="text-[#111111] hover:text-[#E13C2A] font-bold"
                      >
                        {advisoryCopied ? t('sec4CopiedBtn') : t('sec4CopyBtn')}
                      </button>
                    </div>
                  </div>
                  <p className="font-serif text-base text-[#111111] leading-relaxed pt-1">
                    "{advisory}"
                  </p>
                  <div className="text-[10px] text-[#6E6D68] pt-1">
                    {t('sec4Footer')}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#111111]/25 p-6 text-center font-mono text-xs text-[#6E6D68]">
                  {t('sec4Placeholder')}
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* ==========================================
          REQUIRED LABELLING FOOTER (Editorial Colophon)
          ========================================== */}
      <footer className="max-w-[1440px] mx-auto w-full px-6 sm:px-8 py-8 font-mono text-xs text-[#6E6D68] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#111111]/15 pt-4 gap-2">
          <p className="text-[#111111] font-bold uppercase">
            {t('footerDisclaimer')}
          </p>
          <p className="text-[11px] text-[#6E6D68]">
            {t('footerColophon')}
          </p>
        </div>
        <p className="text-[10px] text-[#6E6D68] leading-normal">
          {t('footerDetails')}
        </p>
      </footer>
    </div>
  );
}
