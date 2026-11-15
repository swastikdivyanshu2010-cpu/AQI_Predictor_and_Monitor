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

// Hook to detect prefers-reduced-motion
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

// Hook for mouse parallax (subtle shift)
function useMouseParallax(enabled = true) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      setOffset({ x: Math.round(x * 14), y: Math.round(y * 14) });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  return offset;
}

// Hero number count-up component
function HeroCounter({ targetValue, disabled }) {
  const [val, setVal] = useState(targetValue);
  const targetRef = useRef(targetValue);

  useEffect(() => {
    targetRef.current = targetValue;
    if (disabled || typeof targetValue !== 'number' || isNaN(targetValue)) {
      setVal(targetValue);
      return;
    }

    const start = 0;
    const end = targetValue;
    const startTime = performance.now();
    const duration = 900; // 900ms

    let frameId;
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const current = start + (end - start) * ease;

      if (progress < 1) {
        setVal(current);
        frameId = requestAnimationFrame(tick);
      } else {
        // ALWAYS land EXACTLY on the true value from data
        setVal(targetRef.current);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, disabled]);

  return <>{fmt(val)}</>;
}

// Background Motion Layer: floating editorial typography & sparse hairline boxes
function BackgroundMotionLayer({ mouseOffset, disabled, isDark }) {
  if (disabled) return null;

  const typoClass = isDark ? 'text-[#F4F3EE]/[0.035]' : 'text-[#111111]/[0.04]';
  const typoClassMuted = isDark ? 'text-[#F4F3EE]/[0.03]' : 'text-[#111111]/[0.035]';
  const boxBorder = isDark ? 'border-[#F4F3EE]/15' : 'border-[#111111]/15';

  return (
    <div
      aria-hidden="true"
      className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      {/* 1. Oversized floating editorial typography (4-6% opacity) */}
      <div
        className={`absolute top-20 left-10 font-serif font-light text-[150px] leading-none ${typoClass} animate-float-1`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px, 0)`,
        }}
      >
        PM2.5
      </div>
      <div
        className={`absolute top-96 right-12 font-mono text-[130px] leading-none ${typoClassMuted} animate-float-2`}
        style={{
          transform: `translate3d(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px, 0)`,
        }}
      >
        µg/m³
      </div>
      <div
        className={`absolute top-[680px] left-1/4 font-serif font-light text-[210px] leading-none ${typoClassMuted} animate-float-3`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.3}px, ${mouseOffset.y * 0.3}px, 0)`,
        }}
      >
        60
      </div>
      <div
        className={`absolute top-[1100px] left-8 font-serif italic text-[160px] leading-none ${typoClass} animate-float-1`}
        style={{
          transform: `translate3d(${mouseOffset.x * -0.4}px, ${mouseOffset.y * -0.4}px, 0)`,
        }}
      >
        DELHI
      </div>
      <div
        className={`absolute top-[1520px] right-12 font-mono text-[110px] tracking-widest leading-none ${typoClassMuted} animate-float-2`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px, 0)`,
        }}
      >
        AIRSHIELD
      </div>

      {/* 2. Floating hairline boxes: 8 sparse 1px rectangles, square corners */}
      <div
        className={`absolute top-32 right-1/4 w-36 h-24 border ${boxBorder} animate-float-1`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px, 0)`,
        }}
      />
      <div
        className={`absolute top-84 left-24 w-48 h-32 border ${boxBorder} animate-float-3`}
        style={{
          transform: `translate3d(${mouseOffset.x * -0.4}px, ${mouseOffset.y * -0.4}px, 0)`,
        }}
      />
      <div
        className={`absolute top-[480px] right-20 w-28 h-40 border ${boxBorder} animate-float-2`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.3}px, ${mouseOffset.y * 0.3}px, 0)`,
        }}
      />
      <div
        className={`absolute top-[820px] left-1/3 w-56 h-20 border ${boxBorder} animate-float-1`}
        style={{
          transform: `translate3d(${mouseOffset.x * -0.6}px, ${mouseOffset.y * -0.6}px, 0)`,
        }}
      />
      <div
        className={`absolute top-[1250px] right-1/3 w-40 h-28 border ${boxBorder} animate-float-3`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px, 0)`,
        }}
      />
      <div
        className={`absolute top-[1650px] left-16 w-32 h-32 border ${boxBorder} animate-float-2`}
        style={{
          transform: `translate3d(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px, 0)`,
        }}
      />
      <div
        className={`absolute top-[2000px] right-24 w-44 h-24 border ${boxBorder} animate-float-1`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.3}px, ${mouseOffset.y * 0.3}px, 0)`,
        }}
      />
      <div
        className={`absolute top-[2300px] left-1/4 w-52 h-36 border ${boxBorder} animate-float-3`}
        style={{
          transform: `translate3d(${mouseOffset.x * -0.4}px, ${mouseOffset.y * -0.4}px, 0)`,
        }}
      />
    </div>
  );
}

// Marquee Strip: displays key facts from loaded data with screen reader support
function MarqueeStrip({ mode, liveData, currentDay, disabled }) {
  let items = [];

  if (mode === 'live' && liveData?.status === 'ok') {
    items = [
      `TARGET: DELHI NCT`,
      `FORECAST FOR: ${liveData.forecast_for}`,
      `MODEL: ${fmt(liveData.model)} µg/m³`,
      `80% INTERVAL: ${fmt(liveData.lower)}–${fmt(liveData.upper)} µg/m³`,
      `NAAQS LIMIT: 60.0 µg/m³`,
      `STATUS: ${liveData.alert ? 'RESTRICT OUTDOOR ACTIVITY // ALERT' : 'NORMAL OUTDOOR ACTIVITY // SAFE'}`,
      `CADENCE: 4× DAILY`,
      `STREAM: OPENAQ + OPEN-METEO`,
    ];
  } else if (mode === 'replay' && currentDay) {
    items = [
      `TARGET: DELHI NCT`,
      `EVALUATION DATE: ${currentDay.date}`,
      `MODEL: ${fmt(currentDay.model)} µg/m³`,
      `80% INTERVAL: ${fmt(currentDay.lower)}–${fmt(currentDay.upper)} µg/m³`,
      `GROUND TRUTH: ${fmt(currentDay.actual)} µg/m³`,
      `NAAQS LIMIT: 60.0 µg/m³`,
      `STATUS: ${currentDay.alert ? 'RESTRICT OUTDOOR ACTIVITY // ALERT' : 'NORMAL OUTDOOR ACTIVITY // SAFE'}`,
      `DATASET: 120-DAY HELD-OUT TEST WINDOW`,
    ];
  } else {
    items = [
      `AIRSHIELD 1.0`,
      `CO-DEVELOPERS: SWASTIK DIVYANSHU • KRISHNENDU PATRO`,
      `INSTITUTION: DAV CHANDRASEKHARPUR BHUBANESWAR`,
      `DECISION ACCURACY: 97.5%`,
      `CHILD SAFETY RECALL: 96.9%`,
      `NAAQS THRESHOLD: 60.0 µg/m³`,
      `STATUS: ACTIVE AUTOMATION`,
    ];
  }

  const plainText = items.join(' • ');

  return (
    <div className="border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.025] py-2 overflow-hidden select-none transition-colors duration-150">
      {/* Accessible plain text for screen readers */}
      <span className="sr-only">{plainText}</span>

      {disabled ? (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 font-mono text-[11px] text-[#6E6D68] dark:text-[#9E9D96] overflow-x-auto whitespace-nowrap">
          {items.map((item, idx) => (
            <span key={idx} className="mr-6 inline-flex items-center gap-1.5">
              <span className="text-[#111111] dark:text-[#F4F3EE] font-bold">▪</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="animate-marquee font-mono text-[11px] text-[#6E6D68] dark:text-[#9E9D96] whitespace-nowrap flex items-center"
        >
          {[0, 1].map((copyIndex) => (
            <div key={copyIndex} className="flex items-center">
              {items.map((item, idx) => (
                <span key={idx} className="mx-6 flex items-center gap-2">
                  <span className="text-[#111111] dark:text-[#F4F3EE] font-bold">▪</span>
                  <span>{item}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
4. कैलिब्रेटेड सुरक्षा निर्देश: +6 µg/m³ का सुरक्षा बफर 120 दिनों में केवल 2 झूठे अलार्मों के साथ 96.9% खतरनाक दिनों की सही पहचान करता है।`,
};

export default function App() {
  // Theme state: dark | light (persisted in localStorage)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('airshield_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync dark class on html root and persist
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('airshield_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('airshield_theme', 'light');
    }
  }, [isDark]);

  // Language selection: 'en' | 'hi'
  const [lang, setLang] = useState('en');

  // Translation lookup helper with parameter substitution
  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations.en[key] || key;
    Object.keys(params).forEach((p) => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
    return text;
  };

  // Mode: 'landing' | 'live' | 'replay' (defaults to 'landing')
  const [mode, setMode] = useState('landing');

  // Motion hooks
  const prefersReducedMotion = usePrefersReducedMotion();
  const mouseOffset = useMouseParallax(!prefersReducedMotion);

  // Live forecast data state
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(null);

  // Replay data state
  const [data, setData] = useState(sampleData);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Operational policy selector for replay mode: 'calibrated' (+6 buffer, 2 FAs) | 'balanced' (point) | 'conservative' (80% upper)
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

  // Compute staleness info for liveData
  const liveStaleInfo = useMemo(() => {
    if (!liveData || !liveData.generated_at) {
      return { isStale: false, diffHours: 0, istString: '—' };
    }
    try {
      const genTime = new Date(liveData.generated_at);
      const now = new Date();
      const diffMs = now - genTime;
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const istString = genTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        isStale: diffHours > 24,
        diffHours,
        istString: `${istString} IST`,
      };
    } catch {
      return { isStale: false, diffHours: 0, istString: liveData.generated_at };
    }
  }, [liveData]);

  // Current day in replay mode
  const currentDayIndex = useMemo(() => {
    if (!data.days) return -1;
    return data.days.findIndex((d) => d.date === selectedDate);
  }, [data.days, selectedDate]);

  const currentDay = useMemo(() => {
    if (currentDayIndex >= 0 && data.days) {
      return data.days[currentDayIndex];
    }
    return data.days && data.days.length > 0 ? data.days[data.days.length - 1] : null;
  }, [data.days, currentDayIndex]);

  // Alert evaluation in replay mode
  const isReplayAlert = useMemo(() => {
    if (!currentDay) return false;
    if (policy === 'balanced') {
      return Boolean(currentDay.alert_point_forecast);
    }
    if (policy === 'conservative') {
      return Boolean(currentDay.alert_80 ?? currentDay.alert);
    }
    return Boolean(currentDay.alert_calibrated ?? currentDay.alert);
  }, [currentDay, policy]);

  // Alert evaluation in live mode
  const isLiveAlert = useMemo(() => {
    if (!liveData) return false;
    return Boolean(liveData.alert);
  }, [liveData]);

  // Dynamic SVG Colors for Recharts adhering strictly to Swiss Broadsheet Palette
  const chartColors = useMemo(() => {
    return {
      axis: isDark ? '#9E9D96' : '#111111',
      tick: isDark ? '#9E9D96' : '#6E6D68',
      model: isDark ? '#60A5FA' : '#1D4ED8',
      actual: isDark ? '#F4F3EE' : '#111111',
      baseline: isDark ? '#7E7D76' : '#6E6D68',
      band: isDark ? '#F4F3EE' : '#111111',
      bandOpacity: isDark ? 0.08 : 0.07,
      cursor: isDark ? '#F4F3EE' : '#111111',
      naaqs: isDark ? '#FF4D36' : '#E13C2A',
      diwali: isDark ? '#F4F3EE' : '#111111',
      tooltipBg: isDark ? '#181816' : '#F8F7F4',
      tooltipBorder: isDark ? '#F4F3EE' : '#111111',
      tooltipText: isDark ? '#F4F3EE' : '#111111',
      tooltipMuted: isDark ? '#9E9D96' : '#6E6D68',
      tooltipDivider: isDark ? 'rgba(244, 243, 238, 0.15)' : 'rgba(17, 17, 17, 0.15)',
    };
  }, [isDark]);

  // Replay Date Stepper handlers
  const handlePrevDay = () => {
    if (currentDayIndex > 0 && data.days) {
      setSelectedDate(data.days[currentDayIndex - 1].date);
    }
  };

  const handleNextDay = () => {
    if (data.days && currentDayIndex < data.days.length - 1) {
      setSelectedDate(data.days[currentDayIndex + 1].date);
    }
  };

  // Quick jump presets in replay mode
  const handleJumpDiwali = () => {
    if (!data.days) return;
    const diwaliDay = data.days.find((d) => d.in_diwali_window);
    if (diwaliDay) setSelectedDate(diwaliDay.date);
  };

  const handleJumpPeak = () => {
    if (!data.days || data.days.length === 0) return;
    let peak = data.days[0];
    for (const d of data.days) {
      if (d.actual > peak.actual) peak = d;
    }
    setSelectedDate(peak.date);
  };

  const handleJumpCleanest = () => {
    if (!data.days || data.days.length === 0) return;
    let clean = data.days[0];
    for (const d of data.days) {
      if (d.actual < clean.actual) clean = d;
    }
    setSelectedDate(clean.date);
  };

  // Handle custom results.json file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
          throw new Error("Invalid schema: missing 'days' array.");
        }
        setData(parsed);
        setSelectedDate(parsed.days[parsed.days.length - 1].date);
      } catch (err) {
        setUploadError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Field notes copy handler
  const copyNotes = () => {
    navigator.clipboard.writeText(failureNotes);
    setNotesCopied(true);
    setTimeout(() => setNotesCopied(false), 2000);
  };

  // Advisory synthesis function
  const generateAdvisory = async () => {
    const targetObj = mode === 'live' && liveData?.status === 'ok' ? liveData : currentDay;
    if (!targetObj) return;
    setAdvisoryLoading(true);

    const isAlertActive = mode === 'live' ? isLiveAlert : isReplayAlert;
    const targetDate = mode === 'live' ? targetObj.forecast_for : targetObj.date;
    const thresholdVal = targetObj.threshold || 60;
    const lowerVal = targetObj.lower_80 ?? targetObj.lower;
    const upperVal = targetObj.upper_80 ?? targetObj.upper;
    const diwaliNote = targetObj.in_diwali_window
      ? (lang === 'hi' ? ' (दीवाली उत्सर्जन का प्रभाव)' : ' heightened particulate burden due to festival emissions')
      : '';

    const fallbackText = isAlertActive
      ? (lang === 'hi'
          ? `कल के लिए (${targetDate}): मॉडल पूर्वानुमान ${fmt(targetObj.model)} µg/m³ (80% दायरा ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) राष्ट्रीय सीमा ${thresholdVal} µg/m³ से अधिक है${diwaliNote}। अनुशंसा: बाहरी खेलकूद व सुबह की प्रार्थना सभा स्थगित कर इनडोर आयोजित करें, तथा स्कूल के एयर प्यूरीफायर चालू रखें।`
          : `TOMORROW (${targetDate}): Model forecast of ${fmt(targetObj.model)} µg/m³ (80% interval ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) exceeds the national limit of ${thresholdVal} µg/m³${diwaliNote}. Recommended: cancel outdoor sports, relocate morning assembly to classrooms, and keep school air filters operational. Staff should monitor asthmatic pupils closely.`)
      : (lang === 'hi'
          ? `कल के लिए (${targetDate}): मॉडल पूर्वानुमान ${fmt(targetObj.model)} µg/m³ (80% दायरा ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) राष्ट्रीय मानक ${thresholdVal} µg/m³ के सुरक्षित दायरे में है${diwaliNote}। सुबह की प्रार्थना सभा और खेलकूद अभ्यास सामान्य रूप से मैदान में जारी रखने की अनुमति है।`
          : `TOMORROW (${targetDate}): Model forecast of ${fmt(targetObj.model)} µg/m³ (80% interval ${fmt(lowerVal)}–${fmt(upperVal)} µg/m³) remains within the ${thresholdVal} µg/m³ threshold${diwaliNote}. Outdoor morning assembly and physical education training are approved to proceed as scheduled. Standard routine monitoring applies.`);

    if (!apiKey) {
      setTimeout(() => {
        setAdvisory(fallbackText);
        setAdvisorySource(mode === 'live' ? 'Deterministic live template' : 'Deterministic replay template');
        setAdvisoryLoading(false);
      }, 150);
      return;
    }

    try {
      const promptText = `You are a school operations director in Delhi.
Write exactly 2 to 3 concise, authoritative sentences. Never invent external facts.
Strict inputs:
Language: ${lang === 'hi' ? 'Hindi (Devanagari script)' : 'English'}
Target Date: ${targetDate}
Forecast PM2.5: ${fmt(targetObj.model)} µg/m³
80% Range: ${fmt(lowerVal)} to ${fmt(upperVal)} µg/m³
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

  // Recharts data transformation for replay chart (uses single 80% interval)
  const chartData = useMemo(() => {
    if (!data.days) return [];
    return data.days.map((d) => {
      const lowerVal = d.lower_80 !== undefined ? d.lower_80 : d.lower;
      const upperVal = d.upper_80 !== undefined ? d.upper_80 : d.upper;
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

  return (
    <div className="relative min-h-screen bg-[#F8F7F4] dark:bg-[#121210] text-[#111111] dark:text-[#F4F3EE] font-sans flex flex-col overflow-x-hidden selection:bg-[#111111] selection:text-[#F8F7F4] dark:selection:bg-[#F4F3EE] dark:selection:text-[#121210] transition-colors duration-150">
      {/* Background Motion Layer: floating editorial typography and boxes (pointer-events: none, z-0) */}
      <BackgroundMotionLayer mouseOffset={mouseOffset} disabled={prefersReducedMotion} isDark={isDark} />

      {/* Main Content sits above background motion layer */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* ==========================================
            TOP MASTHEAD (Swiss Editorial Broadsheet)
            ========================================== */}
        <header className="border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 px-4 sm:px-8 py-4 bg-[#F8F7F4]/90 dark:bg-[#121210]/90 backdrop-blur-[2px] transition-colors duration-150">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
            {/* Left: Masthead Title & Metadata */}
            <div className="min-w-0">
              <div className="font-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-[#6E6D68] dark:text-[#9E9D96] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  {mode === 'landing'
                    ? 'AIRSHIELD 1.0 // PEDIATRIC SPECIFICATION'
                    : mode === 'live'
                    ? t('datasetLive')
                    : t('datasetReplay')}
                </span>
                <span>•</span>
                <span>{t('location')}</span>
                <span>•</span>
                <span className="text-[#111111] dark:text-[#F4F3EE] font-bold">
                  {mode === 'landing'
                    ? 'CO-DEVELOPERS: SWASTIK DIVYANSHU • KRISHNENDU PATRO'
                    : mode === 'live'
                    ? t('unverifiedNotice')
                    : t('replayNotice')}
                </span>
              </div>
              <h1 className="font-mono text-sm sm:text-base font-bold tracking-tight text-[#111111] dark:text-[#F4F3EE] uppercase mt-1">
                {t('appTitle')}
              </h1>
            </div>

            {/* Center: 3-Way Mode Navigation Bar */}
            <nav
              aria-label="Mode Navigation"
              className="flex items-center self-start md:self-end border border-[#111111]/20 dark:border-[#F4F3EE]/20 font-mono text-xs"
            >
              <button
                type="button"
                onClick={() => setMode('landing')}
                className={`px-3 py-1.5 uppercase font-bold tracking-wider transition ${
                  mode === 'landing'
                    ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210]'
                    : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                }`}
              >
                AirShield 1.0
              </button>
              <div className="w-[1px] h-6 bg-[#111111]/20 dark:bg-[#F4F3EE]/20" />
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 uppercase font-bold tracking-wider transition ${
                  mode === 'live'
                    ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210]'
                    : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                }`}
              >
                {t('liveModeBtn')}
              </button>
              <div className="w-[1px] h-6 bg-[#111111]/20 dark:bg-[#F4F3EE]/20" />
              <button
                type="button"
                onClick={() => setMode('replay')}
                className={`px-3 py-1.5 uppercase font-bold tracking-wider transition ${
                  mode === 'replay'
                    ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210]'
                    : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                }`}
              >
                {t('replayModeBtn')}
              </button>
            </nav>

            {/* Right: Theme Switcher, Language Switcher & Upload / Schedule Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono self-start md:self-end">
              {/* Theme Switcher: LIGHT | DARK */}
              <div className="flex items-center border border-[#111111]/25 dark:border-[#F4F3EE]/25 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsDark(false)}
                  className={`px-2 py-1 font-bold tracking-wider transition ${
                    !isDark
                      ? 'bg-[#111111] text-[#F8F7F4]'
                      : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                  }`}
                  title={lang === 'hi' ? 'दिन (लाइट मोड)' : 'Light Paper Broadsheet'}
                >
                  {lang === 'hi' ? '☀ दिन' : '☀ LIGHT'}
                </button>
                <div className="w-[1px] h-4 bg-[#111111]/25 dark:bg-[#F4F3EE]/25" />
                <button
                  type="button"
                  onClick={() => setIsDark(true)}
                  className={`px-2 py-1 font-bold tracking-wider transition ${
                    isDark
                      ? 'bg-[#F4F3EE] text-[#121210]'
                      : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                  }`}
                  title={lang === 'hi' ? 'रात (डार्क मोड)' : 'Dark Inverted Broadsheet'}
                >
                  {lang === 'hi' ? '☾ रात' : '☾ DARK'}
                </button>
              </div>

              {/* Language Switcher: EN | हिन्दी */}
              <div className="flex items-center border border-[#111111]/25 dark:border-[#F4F3EE]/25 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 font-bold tracking-wider transition ${
                    lang === 'en'
                      ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210]'
                      : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                  }`}
                  title="English Language"
                >
                  EN
                </button>
                <div className="w-[1px] h-4 bg-[#111111]/25 dark:bg-[#F4F3EE]/25" />
                <button
                  type="button"
                  onClick={() => setLang('hi')}
                  className={`px-2.5 py-1 font-bold font-sans transition ${
                    lang === 'hi'
                      ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210]'
                      : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE]'
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
                    className="text-[11px] uppercase tracking-wider text-[#111111] dark:text-[#F4F3EE] hover:text-[#E13C2A] dark:hover:text-[#FF4D36] border-b border-[#111111]/40 dark:border-[#F4F3EE]/40 pb-0.5 transition"
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
                <div className="font-mono text-[11px] text-[#6E6D68] dark:text-[#9E9D96]">
                  {t('refreshSchedule')}
                </div>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="max-w-[1440px] mx-auto mt-2 font-mono text-xs text-[#E13C2A] dark:text-[#FF4D36]">
              ERROR: {uploadError}
            </div>
          )}
        </header>

        {/* Marquee Ticker Strip: Key facts from loaded data with screen reader support */}
        <MarqueeStrip
          mode={mode}
          liveData={liveData}
          currentDay={currentDay}
          disabled={prefersReducedMotion}
        />

        {/* =========================================================================
            VIEW 1: AIRSHIELD 1.0 LANDING PAGE
            ========================================================================= */}
        {mode === 'landing' && (
          <main className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex-1 flex flex-col animate-fade-rise transition-colors duration-150">
            {/* Hero Section */}
            <div className="p-6 sm:p-10 lg:p-12 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96] uppercase">
                <span className="font-bold text-[#111111] dark:text-[#F4F3EE] tracking-wider">{t('landingTag')}</span>
                <span>{t('landingSchool')}</span>
              </div>

              <div className="pt-8 pb-6 max-w-5xl">
                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#111111] dark:text-[#F4F3EE] leading-tight font-normal">
                  {t('landingHeadline')}
                </h2>
                <p className="font-sans text-base sm:text-lg text-[#6E6D68] dark:text-[#9E9D96] mt-6 leading-relaxed max-w-4xl">
                  {t('landingSubheadline')}
                </p>
              </div>

              {/* Author & Institution Dossier: Equal Importance to Both Developers */}
              <div className="pt-6 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 border border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03]">
                  <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">CO-DEVELOPER // 01</span>
                  <div className="mt-1 font-bold text-[#111111] dark:text-[#F4F3EE] text-sm">Swastik Divyanshu</div>
                  <div className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] mt-0.5">DAV Chandrasekharpur</div>
                </div>

                <div className="p-4 border border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03]">
                  <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">CO-DEVELOPER // 02</span>
                  <div className="mt-1 font-bold text-[#111111] dark:text-[#F4F3EE] text-sm">Krishnendu Patro</div>
                  <div className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] mt-0.5">DAV Chandrasekharpur</div>
                </div>

                <div className="p-4 border border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03]">
                  <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">INSTITUTION</span>
                  <div className="mt-1 font-bold text-[#111111] dark:text-[#F4F3EE] text-sm">DAV Public School</div>
                  <div className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] mt-0.5">Chandrasekharpur, Bhubaneswar</div>
                </div>

                <div className="p-4 border border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03]">
                  <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">CORE VALIDATION</span>
                  <div className="mt-1 font-bold text-[#15803D] dark:text-[#22C55E] text-sm">97.5% Accuracy</div>
                  <div className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] mt-0.5">96.9% Recall • 2 False Alarms</div>
                </div>
              </div>

              {/* Two Direct Action Portals */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode('live')}
                  className="p-6 text-left border-2 border-[#111111] dark:border-[#F4F3EE] hover:bg-[#111111] hover:text-[#F8F7F4] dark:hover:bg-[#F4F3EE] dark:hover:text-[#121210] transition duration-200 group"
                >
                  <div className="font-mono text-xs uppercase tracking-wider text-[#E13C2A] dark:text-[#FF4D36] group-hover:text-[#F8F7F4] dark:group-hover:text-[#121210] font-bold">
                    OPERATIONAL DEPLOYMENT
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl mt-1 text-[#111111] dark:text-[#F4F3EE] group-hover:text-[#F8F7F4] dark:group-hover:text-[#121210]">
                    {t('landingCtaLive')}
                  </div>
                  <p className="font-sans text-xs mt-2 text-[#6E6D68] dark:text-[#9E9D96] group-hover:text-[#F8F7F4]/80 dark:group-hover:text-[#121210]/80">
                    {t('landingCtaLiveSub')}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('replay')}
                  className="p-6 text-left border border-[#111111] dark:border-[#F4F3EE] hover:bg-[#111111] hover:text-[#F8F7F4] dark:hover:bg-[#F4F3EE] dark:hover:text-[#121210] transition duration-200 group bg-[#111111]/[0.015] dark:bg-[#F4F3EE]/[0.02]"
                >
                  <div className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] group-hover:text-[#F8F7F4] dark:group-hover:text-[#121210] font-bold">
                    EMPIRICAL AUDIT TRAIL
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl mt-1 text-[#111111] dark:text-[#F4F3EE] group-hover:text-[#F8F7F4] dark:group-hover:text-[#121210]">
                    {t('landingCtaReplay')}
                  </div>
                  <p className="font-sans text-xs mt-2 text-[#6E6D68] dark:text-[#9E9D96] group-hover:text-[#F8F7F4]/80 dark:group-hover:text-[#121210]/80">
                    {t('landingCtaReplaySub')}
                  </p>
                </button>
              </div>
            </div>

            {/* Detailed Project Overview Grid (5 Pillars) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#111111]/15 dark:divide-[#F4F3EE]/15">
              {/* Pillar 1 & 2 (Left) */}
              <div className="lg:col-span-6 p-6 sm:p-10 space-y-10">
                <section>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                    {t('landingSec1Title')}
                  </span>
                  <h3 className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-1 mb-3">
                    {t('landingSec1Sub')}
                  </h3>
                  <p className="font-sans text-sm text-[#111111] dark:text-[#F4F3EE] leading-relaxed">
                    {t('landingSec1Text')}
                  </p>
                </section>

                <section className="pt-8 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                    {t('landingSec2Title')}
                  </span>
                  <h3 className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-1 mb-3">
                    {t('landingSec2Sub')}
                  </h3>
                  <p className="font-sans text-sm text-[#111111] dark:text-[#F4F3EE] leading-relaxed">
                    {t('landingSec2Text')}
                  </p>
                </section>
              </div>

              {/* Pillar 3, 4 & 5 (Right) */}
              <div className="lg:col-span-6 p-6 sm:p-10 space-y-10">
                <section>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                    {t('landingSec3Title')}
                  </span>
                  <h3 className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-1 mb-3">
                    {t('landingSec3Sub')}
                  </h3>
                  <p className="font-sans text-sm text-[#111111] dark:text-[#F4F3EE] leading-relaxed">
                    {t('landingSec3Text')}
                  </p>
                </section>

                <section className="pt-8 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                    {t('landingSec4Title')}
                  </span>
                  <h3 className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-1 mb-3">
                    {t('landingSec4Sub')}
                  </h3>
                  <p className="font-sans text-sm text-[#111111] dark:text-[#F4F3EE] leading-relaxed">
                    {t('landingSec4Text')}
                  </p>
                </section>

                <section className="pt-8 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                    {t('landingSec5Title')}
                  </span>
                  <h3 className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-1 mb-3">
                    {t('landingSec5Sub')}
                  </h3>
                  <p className="font-sans text-sm text-[#111111] dark:text-[#F4F3EE] leading-relaxed">
                    {t('landingSec5Text')}
                  </p>
                </section>
              </div>
            </div>

            {/* Developer & Institution Credits Section (Equal Importance to Both Developers) */}
            <div className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 p-6 sm:p-10 bg-[#111111]/[0.015] dark:bg-[#F4F3EE]/[0.02]">
              <div className="pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96]">
                    {lang === 'hi' ? 'परियोजना सह-विकासकर्ता व शोधकर्ता' : 'PROJECT CO-DEVELOPERS & RESEARCHERS'}
                  </span>
                  <h3 className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-0.5">
                    {lang === 'hi' ? 'समान सहयोग व संस्थान विवरण' : 'Equal Collaboration & Institutional Affiliation'}
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                  DAV CHANDRASEKHARPUR BHUBANESWAR
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                {/* Developer 1: Swastik Divyanshu */}
                <div className="p-6 border border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#F8F7F4] dark:bg-[#181816] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 pb-2">
                      <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase tracking-wider">CO-DEVELOPER // 01</span>
                      <span className="text-[10px] text-[#15803D] dark:text-[#22C55E] font-bold">CORE AUTHOR</span>
                    </div>
                    <div className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-3">Swastik Divyanshu</div>
                    <p className="font-sans text-xs text-[#6E6D68] dark:text-[#9E9D96] mt-2 leading-relaxed">
                      {lang === 'hi'
                        ? 'मशीन लर्निंग आर्किटेक्चर, असंतुलित बाल स्वास्थ्य सुरक्षा बफर और पूर्ण-स्टैक स्विस संपादकीय इंटरफेस का सह-विकास।'
                        : 'Co-development of machine learning architecture, pediatric safety buffer optimization, and the Swiss editorial interface.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#111111]/10 dark:border-[#F4F3EE]/10 text-[11px] text-[#111111] dark:text-[#F4F3EE] font-bold">
                    DAV Public School, Chandrasekharpur
                  </div>
                </div>

                {/* Developer 2: Krishnendu Patro */}
                <div className="p-6 border border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#F8F7F4] dark:bg-[#181816] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 pb-2">
                      <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase tracking-wider">CO-DEVELOPER // 02</span>
                      <span className="text-[10px] text-[#15803D] dark:text-[#22C55E] font-bold">CORE AUTHOR</span>
                    </div>
                    <div className="font-serif text-2xl text-[#111111] dark:text-[#F4F3EE] mt-3">Krishnendu Patro</div>
                    <p className="font-sans text-xs text-[#6E6D68] dark:text-[#9E9D96] mt-2 leading-relaxed">
                      {lang === 'hi'
                        ? 'मौसम विज्ञान डेटा पाइपलाइन, 80% सांख्यिकीय अंतराल गणना और स्वचालित गिटहब एक्शन्स का सह-विकास।'
                        : 'Co-development of meteorological data pipeline, 80% statistical interval evaluation, and automated GitHub Actions.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#111111]/10 dark:border-[#F4F3EE]/10 text-[11px] text-[#111111] dark:text-[#F4F3EE] font-bold">
                    DAV Public School, Chandrasekharpur
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            VIEW 2: LIVE FORECAST MODE (UNVERIFIED NEXT-DAY OPERATIONAL FORECAST)
            ========================================================================= */}
        {mode === 'live' && (
          <main className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex-1 flex flex-col animate-fade-rise transition-colors duration-150">
            {/* Stale warning banner if generated_at is > 24 hours old */}
            {liveStaleInfo.isStale && (
              <div className="bg-[#E13C2A]/10 dark:bg-[#FF4D36]/10 border-b border-[#E13C2A]/30 dark:border-[#FF4D36]/30 px-6 sm:px-8 py-2.5 font-mono text-xs text-[#E13C2A] dark:text-[#FF4D36] flex items-center justify-between">
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
              <div className="p-12 text-center font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                {lang === 'hi'
                  ? 'नवीनतम स्टेशन प्रेक्षणों का अंतर्ग्रहण व मॉडल पूर्वानुमान तैयार किया जा रहा है...'
                  : 'INGESTING LATEST STATION OBSERVATIONS & REFRESHING MODEL INFERENCE...'}
              </div>
            )}

            {!liveLoading && (liveError || liveData?.status === 'unavailable') && (
              <div className="p-8 sm:p-12 font-mono space-y-4">
                <div className="border border-[#E13C2A] dark:border-[#FF4D36] p-6 max-w-2xl bg-[#E13C2A]/[0.03] dark:bg-[#FF4D36]/[0.05]">
                  <div className="text-xs uppercase tracking-widest text-[#E13C2A] dark:text-[#FF4D36] font-bold">
                    {t('liveUnavailableTitle')}
                  </div>
                  <p className="font-sans text-sm text-[#111111] dark:text-[#F4F3EE] mt-2 leading-relaxed">
                    {liveError
                      ? (lang === 'hi' ? `डेटा अंतर्ग्रहण त्रुटि: ${liveError}` : `Live ingest error: ${liveError}.`)
                      : t('liveUnavailableMsg')}
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-[#6E6D68] dark:text-[#9E9D96]">
                      {lang === 'hi' ? 'कोई अवास्तविक संख्या नहीं गढ़ी जाती।' : 'No ungrounded numbers are invented.'}
                    </span>
                    <button
                      onClick={() => setMode('replay')}
                      className="font-bold text-[#111111] dark:text-[#F4F3EE] hover:text-[#E13C2A] dark:hover:text-[#FF4D36] underline underline-offset-4"
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
                  <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      {/* Meta Stamp Header */}
                      <div className="flex items-center justify-between font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96] uppercase pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15">
                        <span>{lang === 'hi' ? `पूर्वानुमान // ${liveData.forecast_for}` : `FORECAST FOR // ${liveData.forecast_for}`}</span>
                        <span>{lang === 'hi' ? `जारी // ${liveData.issued_on} (IST)` : `ISSUED // ${liveData.issued_on} (IST)`}</span>
                      </div>

                      {/* Massive Hero PM2.5 Number with CountUp */}
                      <div className="pt-6 pb-4">
                        <div className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] mb-1">
                          {t('projectedNextDay')}
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="font-serif text-7xl sm:text-8xl md:text-[92px] leading-none text-[#111111] dark:text-[#F4F3EE] tabular-nums tracking-tight">
                            <HeroCounter targetValue={liveData.model} disabled={prefersReducedMotion} />
                          </span>
                          <span className="font-mono text-sm sm:text-base text-[#6E6D68] dark:text-[#9E9D96] normal-case">
                            µg/m³
                          </span>
                        </div>
                        <div className="font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96] mt-2 flex items-center gap-2">
                          <span>{t('intervalLabel')}</span>
                          <strong className="text-[#111111] dark:text-[#F4F3EE] font-mono">
                            {fmt(liveData.lower_80 ?? liveData.lower)} – {fmt(liveData.upper_80 ?? liveData.upper)} <span className="normal-case">µg/m³</span>
                          </strong>
                        </div>
                      </div>

                      {/* Giant Status Stamp with Vermilion Outline Pulse on Alert */}
                      <div className="my-4">
                        {isLiveAlert ? (
                          <div
                            className={`border-2 border-[#E13C2A] dark:border-[#FF4D36] px-3.5 py-2 inline-block ${
                              !prefersReducedMotion ? 'animate-alert-pulse' : ''
                            }`}
                          >
                            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E13C2A] dark:text-[#FF4D36]">
                              {t('alertStamp')}
                            </span>
                          </div>
                        ) : (
                          <div className="border-2 border-[#15803D] dark:border-[#22C55E] px-3.5 py-2 inline-block">
                            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#15803D] dark:text-[#22C55E]">
                              {t('noAlertStamp')}
                            </span>
                          </div>
                        )}

                        {liveData.in_diwali_window && (
                          <span className="ml-2 font-mono text-[11px] font-bold text-[#E13C2A] dark:text-[#FF4D36] uppercase border border-[#E13C2A]/40 dark:border-[#FF4D36]/40 px-2 py-1 align-middle">
                            {lang === 'hi' ? '★ दीवाली अवधि' : '★ DIWALI WINDOW'}
                          </span>
                        )}
                      </div>

                      {/* Concise 2-Sentence Briefing */}
                      <p className="font-serif text-base sm:text-lg text-[#111111] dark:text-[#F4F3EE] leading-snug my-4">
                        {isLiveAlert
                          ? (lang === 'hi'
                              ? `कल के लिए अनुमानित ${fmt(liveData.model)} µg/m³ सांद्रता राष्ट्रीय मानक (${liveData.threshold} µg/m³) से ${(liveData.model - liveData.threshold).toFixed(1)} µg/m³ अधिक है। सुबह के समय खुली हवा में शारीरिक श्रम से छात्रों के श्वसन स्वास्थ्य पर तत्काल जोखिम हो सकता है।`
                              : `Tomorrow's forecasted ${fmt(liveData.model)} µg/m³ concentration exceeds the National Ambient Air Quality 24-hour limit (${liveData.threshold} µg/m³) by ${(liveData.model - liveData.threshold).toFixed(1)} µg/m³. Outdoor physical exertion poses immediate respiratory risks to school pupils.`)
                          : (lang === 'hi'
                              ? `कल के लिए अनुमानित ${fmt(liveData.model)} µg/m³ सांद्रता राष्ट्रीय मानक (${liveData.threshold} µg/m³) के सुरक्षित दायरे में है। वायुमंडलीय प्रसार से प्रदूषण स्तर सुबह की नियमित स्कूल गतिविधियों के अनुकूल रहने की संभावना है।`
                              : `Tomorrow's forecasted ${fmt(liveData.model)} µg/m³ concentration remains within the ${liveData.threshold} µg/m³ national limit. Atmospheric dispersion is expected to keep particulate density in the permissible zone for regular outdoor school operations.`)}
                      </p>

                      {/* Clean Typographic 4-Row Directives Table with Staggered Entrance */}
                      <div className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 mt-6 font-mono text-xs">
                        <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('assemblyLabel')}</span>
                          <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#15803D] dark:text-[#22C55E]'}`}>
                            {isLiveAlert ? t('assemblyAlert') : t('assemblySafe')}
                          </span>
                        </div>
                        <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('sportsLabel')}</span>
                          <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#15803D] dark:text-[#22C55E]'}`}>
                            {isLiveAlert ? t('sportsAlert') : t('sportsSafe')}
                          </span>
                        </div>
                        <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('recessLabel')}</span>
                          <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#15803D] dark:text-[#22C55E]'}`}>
                            {isLiveAlert ? t('recessAlert') : t('recessSafe')}
                          </span>
                        </div>
                        <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('infirmaryLabel')}</span>
                          <span className={`font-bold ${isLiveAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#111111] dark:text-[#F4F3EE]'}`}>
                            {isLiveAlert ? t('infirmaryAlert') : t('infirmarySafe')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attribution Line */}
                    <div className="pt-6 font-mono text-[11px] text-[#6E6D68] dark:text-[#9E9D96] flex justify-between items-center">
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
                      <div className="pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                          {lang === 'hi' ? 'स्थिति // असत्यापित परिचालन पूर्वानुमान' : 'STATUS // UNVERIFIED OPERATIONAL FORECAST'}
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl text-[#111111] dark:text-[#F4F3EE] mt-0.5">
                          {t('liveStatusTitle')}
                        </h2>
                      </div>

                      {/* Transparency Disclaimers */}
                      <div className="border border-[#111111]/15 dark:border-[#F4F3EE]/15 p-5 font-mono text-xs space-y-3 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03]">
                        <div className="flex justify-between items-baseline border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 pb-2">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('ingestTimestamp')}</span>
                          <span className="font-bold text-[#111111] dark:text-[#F4F3EE]">{liveStaleInfo.istString}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 pb-2">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('latestObservation')}</span>
                          <span className="font-bold text-[#111111] dark:text-[#F4F3EE]">
                            {fmt(liveData.pm25_today)} <span className="normal-case">µg/m³</span> ({lang === 'hi' ? 'दिनांक' : 'on'} {liveData.issued_on})
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 pb-2">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('uncertaintyBounds')}</span>
                          <span className="text-[#111111] dark:text-[#F4F3EE]">
                            {lang === 'hi' ? 'प्रशिक्षण अवशिष्टों से 80% दायरा (±20.7 µg/m³)' : '80% interval from training residuals (fixed width: ±20.7 µg/m³)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('trainingHorizon')}</span>
                          <span className="text-[#111111] dark:text-[#F4F3EE]">
                            {lang === 'hi' ? `उत्पादन मॉडल: ${liveData.model_trained_through} तक प्रशिक्षित` : `Production model trained through ${liveData.model_trained_through}`}
                          </span>
                        </div>
                      </div>

                      <p className="font-sans text-xs text-[#6E6D68] dark:text-[#9E9D96] leading-relaxed">
                        {t('liveHonestyNote')}
                      </p>

                      {/* Operational Advisory Box in Live Mode */}
                      <div className="border border-[#111111] dark:border-[#F4F3EE] p-4 font-mono text-xs space-y-2">
                        <div className="flex items-baseline justify-between border-b border-[#111111]/20 dark:border-[#F4F3EE]/20 pb-1.5 text-[10px] text-[#6E6D68] dark:text-[#9E9D96]">
                          <span>{lang === 'hi' ? `समन्वयक निर्देश // ${liveData.forecast_for} हेतु` : `COORDINATOR ADVISORY // FOR ${liveData.forecast_for}`}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={generateAdvisory}
                              disabled={advisoryLoading}
                              className="text-[#E13C2A] dark:text-[#FF4D36] font-bold hover:underline"
                            >
                              {advisoryLoading ? t('sec4Generating') : t('sec4GenerateBtn')}
                            </button>
                            {advisory && (
                              <button onClick={copyAdvisory} className="text-[#111111] dark:text-[#F4F3EE] font-bold hover:text-[#E13C2A] dark:hover:text-[#FF4D36]">
                                {advisoryCopied ? t('sec4CopiedBtn') : t('sec4CopyBtn')}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="font-serif text-base text-[#111111] dark:text-[#F4F3EE] leading-relaxed pt-1">
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

                    <div className="pt-4 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-center justify-between text-xs font-mono text-[#6E6D68] dark:text-[#9E9D96]">
                      <span>{lang === 'hi' ? 'स्वचालन // गिटहब एक्शन्स द्वारा प्रतिदिन 4 बार' : 'AUTOMATION CADENCE // 4× DAILY VIA GITHUB ACTIONS'}</span>
                      <button onClick={() => setMode('replay')} className="text-[#111111] dark:text-[#F4F3EE] underline font-bold">
                        {lang === 'hi' ? '120-दिवसीय टेस्ट रीप्ले मूल्यांकन देखें →' : 'View 120-Day Held-Out Test Evaluation →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ticker Strip for Live Mode */}
                <div className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 grid grid-cols-2 md:grid-cols-4 font-mono divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 dark:divide-[#F4F3EE]/15 text-xs">
                  <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerModel')}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                        {fmt(liveData.model)}
                      </span>
                      <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                    </div>
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                      {t('tickerForecastFor')} {liveData.forecast_for}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerInterval')}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                        {fmt(liveData.lower_80 ?? liveData.lower)} – {fmt(liveData.upper_80 ?? liveData.upper)}
                      </span>
                      <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                    </div>
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                      {t('tickerSpread')} {fmt((liveData.upper_80 ?? liveData.upper) - (liveData.lower_80 ?? liveData.lower))} <span className="normal-case">µg/m³</span>
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerBaseline')}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                        {fmt(liveData.baseline)}
                      </span>
                      <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                    </div>
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                      {t('tickerObserved')} {liveData.issued_on}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">
                      {lang === 'hi' ? '04 // मॉडल स्थिति' : '04 // MODEL STATUS'}
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#15803D] dark:bg-[#22C55E] inline-block mb-0.5"></span>
                      <span className="text-base sm:text-lg font-bold text-[#15803D] dark:text-[#22C55E] tracking-wide">
                        {lang === 'hi' ? 'सक्रिय' : 'ACTIVE'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                      {lang === 'hi' ? `उत्पादन मॉडल • ${liveData.model_trained_through} तक प्रशिक्षित` : `Production • Trained through ${liveData.model_trained_through}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* =========================================================================
            VIEW 3: HELD-OUT REPLAY MODE (EVALUATED HISTORICAL BENCHMARKING)
            ========================================================================= */}
        {mode === 'replay' && currentDay && (
          <main className="max-w-[1440px] mx-auto w-full border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex-1 flex flex-col animate-fade-rise transition-colors duration-150">
            {/* Replay Date Navigation Bar */}
            <div className="border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 px-6 sm:px-8 py-3 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-1 border-b border-[#111111] dark:border-[#F4F3EE] pb-0.5">
                <button
                  onClick={handlePrevDay}
                  disabled={currentDayIndex <= 0}
                  className="hover:text-[#E13C2A] dark:hover:text-[#FF4D36] disabled:opacity-30 px-1 font-bold"
                  title="Previous Day"
                >
                  ←
                </button>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[#111111] dark:text-[#F4F3EE] font-mono font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {data.days &&
                    data.days.map((d) => {
                      const hasAlert = policy === 'balanced'
                        ? Boolean(d.alert_point_forecast)
                        : policy === 'conservative'
                        ? Boolean(d.alert_80 ?? d.alert)
                        : Boolean(d.alert_calibrated ?? d.alert);
                      return (
                        <option key={d.date} value={d.date} className="bg-[#F8F7F4] dark:bg-[#181816] text-[#111111] dark:text-[#F4F3EE] font-mono">
                          {d.date} {d.in_diwali_window ? '• Diwali' : ''} {hasAlert ? '• Alert' : ''}
                        </option>
                      );
                    })}
                </select>
                <button
                  onClick={handleNextDay}
                  disabled={currentDayIndex < 0 || currentDayIndex >= (data.days?.length || 0) - 1}
                  className="hover:text-[#E13C2A] dark:hover:text-[#FF4D36] disabled:opacity-30 px-1 font-bold"
                  title="Next Day"
                >
                  →
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#6E6D68] dark:text-[#9E9D96]">
                <span>{t('jumpLabel')}</span>
                <button
                  onClick={handleJumpDiwali}
                  className="hover:text-[#E13C2A] dark:hover:text-[#FF4D36] underline underline-offset-2 decoration-[#111111]/30 dark:decoration-[#F4F3EE]/30 hover:decoration-[#E13C2A] dark:hover:decoration-[#FF4D36]"
                >
                  {t('jumpDiwali')}
                </button>
                <button
                  onClick={handleJumpPeak}
                  className="hover:text-[#E13C2A] dark:hover:text-[#FF4D36] underline underline-offset-2 decoration-[#111111]/30 dark:decoration-[#F4F3EE]/30 hover:decoration-[#E13C2A] dark:hover:decoration-[#FF4D36]"
                >
                  {t('jumpPeak')}
                </button>
                <button
                  onClick={handleJumpCleanest}
                  className="hover:text-[#15803D] dark:hover:text-[#22C55E] underline underline-offset-2 decoration-[#111111]/30 dark:decoration-[#F4F3EE]/30 hover:decoration-[#15803D] dark:hover:decoration-[#22C55E]"
                >
                  {t('jumpClean')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
              {/* --------------------------------------
                  LEFT COLUMN (38% width: cols 1 to 5)
                  -------------------------------------- */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  {/* Meta Stamp Header */}
                  <div className="flex items-center justify-between font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96] uppercase pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15">
                    <span>{lang === 'hi' ? `लक्ष्य तिथि // ${currentDay.date}` : `TARGET DATE // ${currentDay.date}`}</span>
                    <span>{lang === 'hi' ? `जारी // ${currentDay.issued_on}` : `ISSUED // ${currentDay.issued_on}`}</span>
                  </div>

                  {/* Massive Hero PM2.5 Number with CountUp */}
                  <div className="pt-6 pb-4">
                    <div className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96] mb-1">
                      {t('projectedMean')}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-7xl sm:text-8xl md:text-[92px] leading-none text-[#111111] dark:text-[#F4F3EE] tabular-nums tracking-tight">
                        <HeroCounter targetValue={currentDay.model} disabled={prefersReducedMotion} />
                      </span>
                      <span className="font-mono text-sm sm:text-base text-[#6E6D68] dark:text-[#9E9D96] normal-case">
                        µg/m³
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96] mt-2 flex items-center gap-2">
                      <span>{t('intervalLabel')}</span>
                      <strong className="text-[#111111] dark:text-[#F4F3EE] font-mono">
                        {fmt(currentDay.lower_80 ?? currentDay.lower)} – {fmt(currentDay.upper_80 ?? currentDay.upper)} <span className="normal-case">µg/m³</span>
                      </strong>
                    </div>
                  </div>

                  {/* Giant Status Stamp with Vermilion Outline Pulse on Alert */}
                  <div className="my-4">
                    {isReplayAlert ? (
                      <div
                        className={`border-2 border-[#E13C2A] dark:border-[#FF4D36] px-3.5 py-2 inline-block ${
                          !prefersReducedMotion ? 'animate-alert-pulse' : ''
                        }`}
                      >
                        <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E13C2A] dark:text-[#FF4D36]">
                              {t('alertStamp')}
                        </span>
                      </div>
                    ) : (
                      <div className="border-2 border-[#15803D] dark:border-[#22C55E] px-3.5 py-2 inline-block">
                        <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#15803D] dark:text-[#22C55E]">
                          {t('noAlertStamp')}
                        </span>
                      </div>
                    )}

                    {currentDay.in_diwali_window && (
                      <span className="ml-2 font-mono text-[11px] font-bold text-[#E13C2A] dark:text-[#FF4D36] uppercase border border-[#E13C2A]/40 dark:border-[#FF4D36]/40 px-2 py-1 align-middle">
                        {lang === 'hi' ? '★ दीवाली अवधि' : '★ DIWALI WINDOW'}
                      </span>
                    )}
                  </div>

                  {/* Concise 2-Sentence Briefing */}
                  <p className="font-serif text-base sm:text-lg text-[#111111] dark:text-[#F4F3EE] leading-snug my-4">
                    {isReplayAlert
                      ? (lang === 'hi'
                          ? `कल के लिए अनुमानित ${fmt(currentDay.model)} µg/m³ सांद्रता ${
                              policy === 'conservative'
                                ? `(80% ऊपरी सीमा ${fmt(currentDay.upper_80 ?? currentDay.upper)} µg/m³)`
                                : ''
                            } राष्ट्रीय मानक (${data.threshold} µg/m³) से अधिक है। सुबह के समय खुली हवा में शारीरिक श्रम से छात्रों में सांस संबंधी समस्याएं हो सकती हैं।`
                          : `Tomorrow's forecasted ${fmt(currentDay.model)} µg/m³ concentration ${
                              policy === 'conservative'
                                ? `(80% upper bound ${fmt(currentDay.upper_80 ?? currentDay.upper)} µg/m³)`
                                : ''
                            } exceeds the National Ambient Air Quality 24-hour limit (${data.threshold} µg/m³). Outdoor physical exertion poses immediate respiratory risks to school pupils.`)
                      : (lang === 'hi'
                          ? `कल के लिए अनुमानित ${fmt(currentDay.model)} µg/m³ सांद्रता राष्ट्रीय मानक (${data.threshold} µg/m³) के सुरक्षित दायरे में है। वायुमंडलीय प्रसार से प्रदूषण स्तर सुबह की नियमित गतिविधियों के अनुकूल रहने की संभावना है।`
                          : `Tomorrow's forecasted ${fmt(currentDay.model)} µg/m³ concentration remains within the ${data.threshold} µg/m³ national limit. Atmospheric dispersion is expected to keep particulate density in the permissible zone for regular outdoor school operations.`)}
                  </p>

                  {/* Clean Typographic 4-Row Directives Table */}
                  <div className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 mt-6 font-mono text-xs">
                    <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                      <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('assemblyLabel')}</span>
                      <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#15803D] dark:text-[#22C55E]'}`}>
                        {isReplayAlert ? t('assemblyAlert') : t('assemblySafe')}
                      </span>
                    </div>
                    <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                      <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('sportsLabel')}</span>
                      <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#15803D] dark:text-[#22C55E]'}`}>
                        {isReplayAlert ? t('sportsAlert') : t('sportsSafe')}
                      </span>
                    </div>
                    <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                      <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('recessLabel')}</span>
                      <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#15803D] dark:text-[#22C55E]'}`}>
                        {isReplayAlert ? t('recessAlert') : t('recessSafe')}
                      </span>
                    </div>
                    <div className="py-2.5 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 flex items-baseline justify-between hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                      <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">{t('infirmaryLabel')}</span>
                      <span className={`font-bold ${isReplayAlert ? 'text-[#E13C2A] dark:text-[#FF4D36]' : 'text-[#111111] dark:text-[#F4F3EE]'}`}>
                        {isReplayAlert ? t('infirmaryAlert') : t('infirmarySafe')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attribution Line & Policy Selector */}
                <div className="pt-6 font-mono text-[11px] text-[#6E6D68] dark:text-[#9E9D96] flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="uppercase font-bold text-[#111111] dark:text-[#F4F3EE]">{t('policyLabel')}</span>
                    {/* Option 1: Calibrated Safety Buffer (Default) */}
                    <button
                      type="button"
                      onClick={() => setPolicy('calibrated')}
                      className={`px-2 py-0.5 border text-[10px] tracking-wide transition ${
                        policy === 'calibrated'
                          ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210] border-[#111111] dark:border-[#F4F3EE] font-bold'
                          : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] border-[#111111]/20 dark:border-[#F4F3EE]/20 hover:text-[#111111] dark:hover:text-[#F4F3EE]'
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
                          ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210] border-[#111111] dark:border-[#F4F3EE] font-bold'
                          : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] border-[#111111]/20 dark:border-[#F4F3EE]/20 hover:text-[#111111] dark:hover:text-[#F4F3EE]'
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
                          ? 'bg-[#111111] text-[#F8F7F4] dark:bg-[#F4F3EE] dark:text-[#121210] border-[#111111] dark:border-[#F4F3EE] font-bold'
                          : 'bg-transparent text-[#6E6D68] dark:text-[#9E9D96] border-[#111111]/20 dark:border-[#F4F3EE]/20 hover:text-[#111111] dark:hover:text-[#F4F3EE]'
                      }`}
                      title="Precautionary: Alert if 80% Upper Bound > 60 µg/m³"
                    >
                      {t('policyConservative')}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span>METEO: OPEN-METEO // OPENAQ</span>
                    <span className="font-bold text-[#111111] dark:text-[#F4F3EE]">
                      {policy === 'calibrated'
                        ? '★ CALIBRATED POLICY ACTIVE'
                        : policy === 'balanced'
                        ? 'BALANCED POINT ACTIVE'
                        : 'CONSERVATIVE ACTIVE'}
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
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15">
                    <div>
                      <span className="font-mono text-xs tracking-wider text-[#6E6D68] dark:text-[#9E9D96] block">
                        <span className="uppercase">FIG. 1 // CHRONOLOGICAL CONCENTRATION CURVE</span> (<span className="normal-case">µg/m³</span>)
                      </span>
                      <h2 className="font-serif text-lg text-[#111111] dark:text-[#F4F3EE] font-normal">
                        {lang === 'hi' ? '120-दिवसीय टेस्ट रीप्ले व अनिश्चितता दायरा' : 'Held-Out Test Replay Trajectory & Uncertainty Envelope'}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <button
                        onClick={() => setShowModel(!showModel)}
                        className={`hover:text-[#111111] dark:hover:text-[#F4F3EE] ${showModel ? 'text-[#1D4ED8] dark:text-[#60A5FA] font-bold underline' : 'text-[#6E6D68] dark:text-[#9E9D96]'}`}
                      >
                        [Model]
                      </button>
                      <button
                        onClick={() => setShowActual(!showActual)}
                        className={`hover:text-[#111111] dark:hover:text-[#F4F3EE] ${showActual ? 'text-[#111111] dark:text-[#F4F3EE] font-bold underline' : 'text-[#6E6D68] dark:text-[#9E9D96]'}`}
                      >
                        [Actual]
                      </button>
                      <button
                        onClick={() => setShowBaseline(!showBaseline)}
                        className={`hover:text-[#111111] dark:hover:text-[#F4F3EE] ${showBaseline ? 'text-[#111111] dark:text-[#F4F3EE] font-bold underline' : 'text-[#6E6D68] dark:text-[#9E9D96]'}`}
                      >
                        [Baseline]
                      </button>
                      <button
                        onClick={() => setShowBand(!showBand)}
                        className={`hover:text-[#111111] dark:hover:text-[#F4F3EE] ${showBand ? 'text-[#111111] dark:text-[#F4F3EE] font-bold underline' : 'text-[#6E6D68] dark:text-[#9E9D96]'}`}
                      >
                        [80% Band]
                      </button>
                    </div>
                  </div>

                  {/* Full-Height Interactive Chart: Animates only on mode/date change */}
                  <div className="h-80 sm:h-[400px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        key={`${mode}-${selectedDate}-${isDark ? 'dark' : 'light'}`}
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
                          stroke={chartColors.axis}
                          strokeWidth={1}
                          tickLine={{ stroke: chartColors.axis }}
                          tick={{ fontSize: 10, fill: chartColors.tick, fontFamily: 'JetBrains Mono' }}
                          tickFormatter={(val) => {
                            const parts = val.split('-');
                            return `${parts[1]}/${parts[2]}`;
                          }}
                          minTickGap={28}
                        />
                        <YAxis
                          stroke={chartColors.axis}
                          strokeWidth={1}
                          tickLine={{ stroke: chartColors.axis }}
                          tick={{ fontSize: 10, fill: chartColors.tick, fontFamily: 'JetBrains Mono' }}
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
                                ? Boolean(d.alert_80 ?? d.alert)
                                : Boolean(d.alert_calibrated ?? d.alert);
                              return (
                                <div className="bg-[#F8F7F4] dark:bg-[#181816] border border-[#111111] dark:border-[#F4F3EE] p-3 text-xs font-mono shadow-none max-w-[260px]">
                                  <div className="border-b border-[#111111]/20 dark:border-[#F4F3EE]/20 pb-1 font-bold text-[#111111] dark:text-[#F4F3EE] flex justify-between">
                                    <span>{d.date}</span>
                                    {d.in_diwali_window && <span className="text-[#E13C2A] dark:text-[#FF4D36]">★ DIWALI</span>}
                                  </div>
                                  <div className="pt-1.5 space-y-1 text-[#111111] dark:text-[#F4F3EE]">
                                    <div className="flex justify-between">
                                      <span className="text-[#6E6D68] dark:text-[#9E9D96]">Actual:</span>
                                      <span className="font-bold">{fmt(d.actual)} <span className="normal-case">µg/m³</span></span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#6E6D68] dark:text-[#9E9D96]">Model Forecast:</span>
                                      <span className="font-bold text-[#1D4ED8] dark:text-[#60A5FA]">{fmt(d.model)} <span className="normal-case">µg/m³</span></span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#6E6D68] dark:text-[#9E9D96]">Baseline:</span>
                                      <span>{fmt(d.baseline)} <span className="normal-case">µg/m³</span></span>
                                    </div>
                                    <div className="flex justify-between text-[#6E6D68] dark:text-[#9E9D96]">
                                      <span>80% Range:</span>
                                      <span>{fmt(d.lower_80 ?? d.lower)}–{fmt(d.upper_80 ?? d.upper)} <span className="normal-case">µg/m³</span></span>
                                    </div>
                                    <div className="pt-1 border-t border-[#111111]/20 dark:border-[#F4F3EE]/20 flex justify-between text-[11px]">
                                      <span>Verdict ({policy === 'balanced' ? 'Point' : policy === 'conservative' ? '80% Upper' : 'Calibrated'}):</span>
                                      <span className={verdictAlert ? 'text-[#E13C2A] dark:text-[#FF4D36] font-bold' : 'text-[#15803D] dark:text-[#22C55E] font-bold'}>
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

                        {/* Single 80% Shaded Uncertainty Band */}
                        {showBand && (
                          <>
                            <Area
                              type="monotone"
                              dataKey="rangeBase"
                              stackId="range"
                              stroke="transparent"
                              fill="transparent"
                              legendType="none"
                              isAnimationActive={!prefersReducedMotion}
                              animationDuration={800}
                              animationEasing="ease-out"
                            />
                            <Area
                              name="80% Range"
                              type="monotone"
                              dataKey="rangeDelta"
                              stackId="range"
                              stroke="transparent"
                              fill={chartColors.band}
                              fillOpacity={chartColors.bandOpacity}
                              isAnimationActive={!prefersReducedMotion}
                              animationDuration={800}
                              animationEasing="ease-out"
                            />
                          </>
                        )}

                        {/* Actual Station Ground Truth */}
                        {showActual && (
                          <Line
                            name="Actual"
                            type="monotone"
                            dataKey="actual"
                            stroke={chartColors.actual}
                            strokeWidth={1.75}
                            dot={{ r: 2, fill: chartColors.actual, stroke: chartColors.actual }}
                            activeDot={{ r: 5, fill: chartColors.actual }}
                            isAnimationActive={!prefersReducedMotion}
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                        )}

                        {/* Model Prediction: BLUE #1D4ED8 / #60A5FA */}
                        {showModel && (
                          <Line
                            name="Model"
                            type="monotone"
                            dataKey="model"
                            stroke={chartColors.model}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, fill: chartColors.model }}
                            isAnimationActive={!prefersReducedMotion}
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                        )}

                        {/* Persistence Baseline */}
                        {showBaseline && (
                          <Line
                            name="Baseline"
                            type="monotone"
                            dataKey="baseline"
                            stroke={chartColors.baseline}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            dot={false}
                            isAnimationActive={!prefersReducedMotion}
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                        )}

                        {/* NAAQS Limit 60 ug/m3 */}
                        <ReferenceLine
                          y={data.threshold}
                          stroke={chartColors.naaqs}
                          strokeDasharray="4 4"
                          strokeWidth={1.25}
                          label={{
                            value: `NAAQS LIMIT (${data.threshold} µg/m³)`,
                            fill: chartColors.naaqs,
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
                              stroke={chartColors.diwali}
                              strokeWidth={1}
                              label={{
                                value: `DIWALI (${dw})`,
                                fill: chartColors.diwali,
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
                            stroke={chartColors.cursor}
                            strokeWidth={1.5}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart Caption & Legend */}
                <div className="pt-4 border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[#6E6D68] dark:text-[#9E9D96] gap-2">
                  <span>
                    SOURCE: OPENAQ AIR SENSORS &amp; OPEN-METEO ARCHIVES • INTERPOLATED DAILY (24H UTC MEAN)
                  </span>
                  <span className="text-[#111111] dark:text-[#F4F3EE]">
                    {lang === 'hi' ? 'विशिष्ट तिथि देखने के लिए चार्ट पर क्लिक करें।' : 'Click chart point to inspect that date.'}
                  </span>
                </div>
              </div>
            </div>

            {/* ==========================================
                BOTTOM TICKER STRIP (REPLAY)
                ========================================== */}
            <div className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 grid grid-cols-2 md:grid-cols-4 font-mono divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 dark:divide-[#F4F3EE]/15 text-xs">
              <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerModel')}</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                    {fmt(currentDay.model)}
                  </span>
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                </div>
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                  {lang === 'hi' ? 'ग्रेडिएंट बूस्टिंग रिग्रेसर' : 'Gradient boosting regressor'}
                </span>
              </div>

              <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerInterval')}</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                    {fmt(currentDay.lower_80 ?? currentDay.lower)} – {fmt(currentDay.upper_80 ?? currentDay.upper)}
                  </span>
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                </div>
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                  {t('tickerSpread')} {fmt((currentDay.upper_80 ?? currentDay.upper) - (currentDay.lower_80 ?? currentDay.lower))} <span className="normal-case">µg/m³</span>
                </span>
              </div>

              <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerBaseline')}</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                    {fmt(currentDay.baseline)}
                  </span>
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                </div>
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                  {lang === 'hi' ? 'बेंचमार्क (कल = आज)' : 'Naive "Tomorrow = Today"'}
                </span>
              </div>

              <div className="p-4 sm:p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('tickerError')}</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                    |{fmt(Math.abs(currentDay.actual - currentDay.model))}|
                  </span>
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                </div>
                <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] mt-1 block">
                  {t('tickerGroundTruth')} {fmt(currentDay.actual)} <span className="normal-case">µg/m³</span>
                </span>
              </div>
            </div>

            {/* ==========================================
                TECHNICAL SECTION A: EVALUATION METRICS LEDGER (REPLAY ONLY)
                ========================================== */}
            <section className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 mb-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96]">
                    {t('table1Title')}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#111111] dark:text-[#F4F3EE] mt-0.5">
                    {t('table1Sub')}
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                  {t('table1Caption')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#111111]/15 dark:divide-[#F4F3EE]/15 border border-[#111111]/15 dark:border-[#F4F3EE]/15 font-mono text-xs">
                <div className="p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] block">
                    <span className="uppercase">{t('cardAccuracyTitle')}</span>
                  </span>
                  <div className="mt-2 text-3xl font-serif font-normal text-[#15803D] dark:text-[#22C55E] tabular-nums">
                    {((data.metrics?.decision_accuracy || 0.975) * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1 text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                    {t('cardAccuracySub')} {((data.metrics?.decision_accuracy_pt || 0.958) * 100).toFixed(1)}%
                  </div>
                  <p className="font-sans text-xs text-[#111111] dark:text-[#F4F3EE] mt-3 leading-relaxed">
                    {t('cardAccuracyDesc')}
                  </p>
                </div>

                <div className="p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('cardCoverageTitle')}</span>
                  <div className="mt-2 text-3xl font-serif font-normal text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                    {((data.metrics?.range_coverage_80 || 0.808) * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1 text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                    {t('cardCoverageSub')} 80.0%
                  </div>
                  <p className="font-sans text-xs text-[#111111] dark:text-[#F4F3EE] mt-3 leading-relaxed">
                    {t('cardCoverageDesc')}
                  </p>
                </div>

                <div className="p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] uppercase block">{t('cardMaeTitle')}</span>
                  <div className="mt-2 text-3xl font-serif font-normal text-[#111111] dark:text-[#F4F3EE] tabular-nums">
                    ±{fmt(data.metrics?.mae_model)} <span className="text-xs font-mono text-[#6E6D68] dark:text-[#9E9D96] normal-case">µg/m³</span>
                  </div>
                  <div className="mt-1 text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                    {t('cardMaeBaseline')} ±{fmt(data.metrics?.mae_baseline)} <span className="normal-case">µg/m³</span>
                  </div>
                  <p className="font-sans text-xs text-[#111111] dark:text-[#F4F3EE] mt-3 leading-relaxed">
                    {t('cardMaeDesc')}
                  </p>
                </div>

                <div className="p-5 hover:bg-[#111111]/[0.02] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors">
                  <span className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96] block">
                    <span className="uppercase">{t('cardRecallTitle')}</span>
                  </span>
                  <div className="mt-2 text-3xl font-serif font-normal text-[#15803D] dark:text-[#22C55E] tabular-nums">
                    {((data.metrics?.recall || 0.969) * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1 text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                    {t('cardRecallPrecision')} {((data.metrics?.precision || 0.939) * 100).toFixed(1)}% (FA: {data.metrics?.false_alarms ?? 2})
                  </div>
                  <p className="font-sans text-xs text-[#111111] dark:text-[#F4F3EE] mt-3 leading-relaxed">
                    {t('cardRecallDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* ==========================================
                TECHNICAL SECTION B: THRESHOLD POLICY MATRIX (REPLAY ONLY)
                ========================================== */}
            <section className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 mb-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96]">
                    {t('table2Title')}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#111111] dark:text-[#F4F3EE] mt-0.5">
                    {t('table2Sub')}
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96]">
                  {t('table2Caption')}
                </span>
              </div>

              <div className="overflow-x-auto border border-[#111111]/15 dark:border-[#F4F3EE]/15">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 bg-[#111111]/[0.02] dark:bg-[#F4F3EE]/[0.03] text-[#6E6D68] dark:text-[#9E9D96]">
                      <th className="p-3 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 font-bold text-[#111111] dark:text-[#F4F3EE]">{t('colThreshold')}</th>
                      <th className="p-3 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15">{t('colDaysAbove')}</th>
                      <th
                        colSpan={3}
                        className={`p-3 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 text-center text-[#111111] dark:text-[#F4F3EE] font-bold ${
                          policy === 'balanced' ? 'bg-[#111111]/10 dark:bg-[#F4F3EE]/15 underline underline-offset-4' : 'bg-[#111111]/[0.03] dark:bg-[#F4F3EE]/[0.05]'
                        }`}
                      >
                        {t('colPointRule')} {policy === 'balanced' ? '• [ACTIVE]' : ''}
                      </th>
                      <th
                        colSpan={3}
                        className={`p-3 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 text-center text-[#111111] dark:text-[#F4F3EE] font-bold ${
                          policy === 'conservative' ? 'bg-[#111111]/10 dark:bg-[#F4F3EE]/15 underline underline-offset-4' : 'bg-[#111111]/[0.05] dark:bg-[#F4F3EE]/[0.07]'
                        }`}
                      >
                        {t('colConservative')} {policy === 'conservative' ? '• [ACTIVE]' : ''}
                      </th>
                      <th
                        colSpan={3}
                        className={`p-3 text-center text-[#111111] dark:text-[#F4F3EE] font-bold ${
                          policy === 'calibrated' ? 'bg-[#111111]/10 dark:bg-[#F4F3EE]/15 underline underline-offset-4' : 'bg-[#111111]/[0.03] dark:bg-[#F4F3EE]/[0.05]'
                        }`}
                      >
                        {t('colRiskRule')} {policy === 'calibrated' ? '• [ACTIVE]' : ''}
                      </th>
                    </tr>
                    <tr className="border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 text-[10px] text-[#6E6D68] dark:text-[#9E9D96]">
                      <th className="p-2 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 normal-case">µg/m³</th>
                      <th className="p-2 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15">{t('thGroundTruth')}</th>
                      <th className="p-2 text-center text-[#111111] dark:text-[#F4F3EE]">{t('thHit')}</th>
                      <th className="p-2 text-center text-[#E13C2A] dark:text-[#FF4D36]">{t('thMiss')}</th>
                      <th className="p-2 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 text-center">{t('thFA')}</th>
                      <th className="p-2 text-center text-[#111111] dark:text-[#F4F3EE]">{t('thHit')}</th>
                      <th className="p-2 text-center text-[#E13C2A] dark:text-[#FF4D36] font-bold">{t('thMiss')}</th>
                      <th className="p-2 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 text-center">{t('thFA')}</th>
                      <th className="p-2 text-center text-[#111111] dark:text-[#F4F3EE]">{t('thHit')}</th>
                      <th className="p-2 text-center text-[#E13C2A] dark:text-[#FF4D36]">{t('thMiss')}</th>
                      <th className="p-2 text-center">{t('thFA')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111111]/15 dark:divide-[#F4F3EE]/15">
                    {data.threshold_table &&
                      data.threshold_table.map((r) => {
                        const isActive = r.threshold === data.threshold;
                        return (
                          <tr
                            key={r.threshold}
                            className={`hover:bg-[#111111]/[0.025] dark:hover:bg-[#F4F3EE]/[0.04] transition-colors ${isActive ? 'bg-[#111111]/[0.04] dark:bg-[#F4F3EE]/[0.06] font-bold' : ''}`}
                          >
                            <td className="p-3 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 font-bold">
                              {r.threshold} <span className="normal-case">µg/m³</span> {isActive ? '• [ACTIVE]' : ''}
                            </td>
                            <td className="p-3 border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 tabular-nums">{r.days_above}</td>
                            <td className="p-3 text-center tabular-nums text-[#111111] dark:text-[#F4F3EE]">{r.pt_hit}</td>
                            <td className="p-3 text-center tabular-nums text-[#E13C2A] dark:text-[#FF4D36] font-bold">{r.pt_miss}</td>
                            <td className="p-3 text-center tabular-nums border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 text-[#6E6D68] dark:text-[#9E9D96]">{r.pt_fa}</td>
                            <td className="p-3 text-center tabular-nums text-[#111111] dark:text-[#F4F3EE] font-bold">{r.ct_hit}</td>
                            <td className="p-3 text-center tabular-nums text-[#E13C2A] dark:text-[#FF4D36] font-extrabold">{r.ct_miss}</td>
                            <td className="p-3 text-center tabular-nums border-r border-[#111111]/15 dark:border-[#F4F3EE]/15 text-[#6E6D68] dark:text-[#9E9D96]">{r.ct_fa}</td>
                            <td className="p-3 text-center tabular-nums text-[#111111] dark:text-[#F4F3EE]">{r.pr_hit}</td>
                            <td className="p-3 text-center tabular-nums text-[#E13C2A] dark:text-[#FF4D36]">{r.pr_miss}</td>
                            <td className="p-3 text-center tabular-nums text-[#6E6D68] dark:text-[#9E9D96]">{r.pr_fa}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 font-mono text-[11px] text-[#6E6D68] dark:text-[#9E9D96] grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <strong>{t('legendHit')}</strong>
                </div>
                <div>
                  <strong className="text-[#E13C2A] dark:text-[#FF4D36]">{t('legendMiss')}</strong>
                </div>
                <div>
                  <strong>{t('legendFA')}</strong>
                </div>
              </div>
            </section>

            {/* ==========================================
                TECHNICAL SECTION C: WHERE IT FAILS & REPLAY NOTICE (REPLAY ONLY)
                ========================================== */}
            <section className="border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#111111]/15 dark:divide-[#F4F3EE]/15">
              <div className="lg:col-span-6 p-6 sm:p-8">
                <div className="flex items-baseline justify-between pb-2 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 mb-4">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96]">
                      {t('sec3Title')}
                    </span>
                    <h4 className="font-serif text-xl text-[#111111] dark:text-[#F4F3EE] mt-0.5">
                      {t('sec3Sub')}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={copyNotes}
                      className="hover:text-[#E13C2A] dark:hover:text-[#FF4D36] underline underline-offset-2"
                    >
                      {notesCopied ? t('sec3Copied') : t('sec3Copy')}
                    </button>
                    <button
                      onClick={() => setFailureNotes(DEFAULT_FAILURE_NOTES[lang] || DEFAULT_FAILURE_NOTES.en)}
                      className="hover:text-[#111111] dark:hover:text-[#F4F3EE] text-[#6E6D68] dark:text-[#9E9D96]"
                    >
                      {t('sec3Reset')}
                    </button>
                  </div>
                </div>

                <p className="font-sans text-xs text-[#6E6D68] dark:text-[#9E9D96] mb-3 leading-relaxed">
                  {t('sec3Desc')}
                </p>

                <textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-transparent border border-[#111111]/20 dark:border-[#F4F3EE]/20 text-[#111111] dark:text-[#F4F3EE] focus:outline-none focus:border-[#111111] dark:focus:border-[#F4F3EE] leading-relaxed resize-none"
                />
              </div>

              <div className="lg:col-span-6 p-6 sm:p-8">
                <div className="flex items-baseline justify-between pb-2 border-b border-[#111111]/15 dark:border-[#F4F3EE]/15 mb-4">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] dark:text-[#9E9D96]">
                      {t('sec4Title')}
                    </span>
                    <h4 className="font-serif text-xl text-[#111111] dark:text-[#F4F3EE] mt-0.5">
                      {t('sec4Sub')}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="text-[#6E6D68] dark:text-[#9E9D96] hover:text-[#111111] dark:hover:text-[#F4F3EE] underline"
                    >
                      {showKeyInput ? t('sec4HideKey') : t('sec4ApiKey')}
                    </button>
                    <button
                      type="button"
                      onClick={generateAdvisory}
                      disabled={advisoryLoading}
                      className="text-[#E13C2A] dark:text-[#FF4D36] font-bold hover:underline"
                    >
                      {advisoryLoading ? t('sec4Generating') : t('sec4GenerateBtn')}
                    </button>
                  </div>
                </div>

                {showKeyInput && (
                  <div className="mb-3 p-3 border border-[#111111]/20 dark:border-[#F4F3EE]/20 font-mono text-xs space-y-1">
                    <label className="text-[#6E6D68] dark:text-[#9E9D96] block uppercase text-[10px]">Optional Google Gemini Key:</label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-transparent border-b border-[#111111]/40 dark:border-[#F4F3EE]/40 py-1 font-mono text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] block">
                      {lang === 'hi'
                        ? 'कुंजी न देने पर स्थानीय सत्यापित टेम्पलेट का प्रयोग किया जाएगा (शून्य नेटवर्क निर्भरता)।'
                        : 'If omitted, uses the deterministic verified template with zero network dependence.'}
                    </span>
                  </div>
                )}

                {advisory ? (
                  <div className="border border-[#111111] dark:border-[#F4F3EE] p-4 font-mono text-xs space-y-2">
                    <div className="flex items-baseline justify-between border-b border-[#111111]/20 dark:border-[#F4F3EE]/20 pb-1.5 text-[10px] text-[#6E6D68] dark:text-[#9E9D96]">
                      <span>REPLAY SAMPLE // {selectedDate}</span>
                      <div className="flex items-center gap-2">
                        <span>{advisorySource}</span>
                        <button
                          onClick={copyAdvisory}
                          className="text-[#111111] dark:text-[#F4F3EE] hover:text-[#E13C2A] dark:hover:text-[#FF4D36] font-bold"
                        >
                          {advisoryCopied ? t('sec4CopiedBtn') : t('sec4CopyBtn')}
                        </button>
                      </div>
                    </div>
                    <p className="font-serif text-base text-[#111111] dark:text-[#F4F3EE] leading-relaxed pt-1">
                      "{advisory}"
                    </p>
                    <div className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] pt-1">
                      {t('sec4Footer')}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#111111]/25 dark:border-[#F4F3EE]/25 p-6 text-center font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96]">
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
        <footer className="max-w-[1440px] mx-auto w-full px-6 sm:px-8 py-8 font-mono text-xs text-[#6E6D68] dark:text-[#9E9D96] space-y-2 transition-colors duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#111111]/15 dark:border-[#F4F3EE]/15 pt-4 gap-2">
            <p className="text-[#111111] dark:text-[#F4F3EE] font-bold uppercase">
              {t('footerDisclaimer')}
            </p>
            <p className="text-[11px] text-[#6E6D68] dark:text-[#9E9D96]">
              {t('footerColophon')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-2 border-t border-[#111111]/10 dark:border-[#F4F3EE]/10 gap-2 font-mono">
            <span className="text-[#111111] dark:text-[#F4F3EE] font-bold uppercase">
              CO-DEVELOPERS: SWASTIK DIVYANSHU • KRISHNENDU PATRO
            </span>
            <span className="text-[#6E6D68] dark:text-[#9E9D96] uppercase">
              DAV PUBLIC SCHOOL, CHANDRASEKHARPUR, BHUBANESWAR
            </span>
          </div>
          <p className="text-[10px] text-[#6E6D68] dark:text-[#9E9D96] leading-normal pt-1">
            {t('footerDetails')}
          </p>
        </footer>
      </div>
    </div>
  );
}
