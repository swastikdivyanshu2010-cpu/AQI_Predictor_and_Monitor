// Hindi and English localization dictionary for Delhi PM2.5 Forecasting Dashboard

export const translations = {
  en: {
    // Masthead
    datasetLive: 'DATASET: LIVE SATELLITE & STATION INGEST',
    datasetReplay: 'DATASET: HELD-OUT TEST REPLAY',
    location: 'NEW DELHI (28.61° N, 77.20° E)',
    unverifiedNotice: 'LIVE FORECAST (UNVERIFIED • NO GROUND TRUTH YET)',
    replayNotice: 'REPLAY OF HELD-OUT TEST DAYS, NOT A LIVE FORECAST',
    appTitle: 'DELHI AIR QUALITY // NEXT-DAY PM2.5 FORECAST',
    liveModeBtn: 'LIVE FORECAST (unverified)',
    replayModeBtn: 'HELD-OUT REPLAY (evaluated)',
    uploadJson: '[Upload results.json]',
    refreshSchedule: 'REFRESH // EVERY 6 HOURS VIA GITHUB ACTIONS',

    // Live Mode
    staleWarning: 'STALE DATA WARNING: Latest forecast was published {hours} hours ago ({time}). OpenAQ reporting or GitHub Actions job may be delayed.',
    liveUnavailableTitle: 'LIVE SENSOR DATA TEMPORARILY UNAVAILABLE',
    liveUnavailableMsg: 'The OpenAQ monitoring sensor for New Delhi has not reported new hourly observations.',
    switchReplayBtn: 'Switch to Held-Out Replay Mode',
    liveStatusTitle: 'TRANSPARENCY & RECENT INGESTION RECORD',
    ingestTimestamp: 'INGEST TIMESTAMP',
    latestObservation: 'LATEST COMPLETED OBSERVATION',
    uncertaintyBounds: 'UNCERTAINTY BOUNDS',
    trainingHorizon: 'MODEL TRAINING HORIZON',
    liveHonestyNote: '* Honesty note: Live forecasts cannot be validated against ground truth until tomorrow\'s 24-hour observation cycle concludes. Replay evaluation metrics reflect past performance on held-out test data and are intentionally separated to avoid deceptive validation.',

    // Hero Section
    projectedNextDay: 'PROJECTED NEXT-DAY MEAN PM2.5 CONCENTRATION',
    projectedMean: 'PROJECTED MEAN PM2.5 CONCENTRATION',
    intervalLabel: '90% PREDICTION INTERVAL:',
    alertStamp: 'RESTRICT OUTDOOR ACTIVITY // ALERT',
    noAlertStamp: 'NORMAL OUTDOOR ACTIVITY // NO ALERT',

    // Directives Table
    assemblyLabel: '01. Morning Assembly (07:30)',
    sportsLabel: '02. PE & Field Training',
    recessLabel: '03. Lunch & Recess Breaks',
    infirmaryLabel: '04. Infirmary & Vulnerable Pupils',

    assemblyAlert: 'RECOMMENDED MOVE INDOORS',
    assemblySafe: 'PERMITTED OUTDOORS',
    sportsAlert: 'RECOMMENDED SUSPENDED / INDOOR GYM',
    sportsSafe: 'NORMAL ACTIVITY',
    recessAlert: 'CLASSROOM CONFINED',
    recessSafe: 'PLAYGROUND PERMITTED',
    infirmaryAlert: 'STANDBY INHALERS / HIGH ALERT',
    infirmarySafe: 'STANDARD PROTOCOL',

    // Policy Selector
    policyLabel: 'POLICY:',
    policyCalibrated: 'Calibrated Buffer (+6 µg/m³ • 2 False Alarms)',
    policyBalanced: 'Balanced Point (model > 60)',
    policyConservative: 'Seasonal Precautionary (90% Upper > 60 • 9 False Alarms)',

    // Stepper & Jumps
    jumpLabel: 'JUMP:',
    jumpDiwali: 'Diwali Spike',
    jumpPeak: 'Peak PM2.5',
    jumpClean: 'Cleanest Day',

    // Bottom Ticker Strip
    tickerModel: '01 // MODEL PROJECTION',
    tickerInterval: '02 // 90% CONFIDENCE INTERVAL',
    tickerBaseline: '03 // PERSISTENCE BENCHMARK',
    tickerError: '04 // HELD-OUT ACTUAL ERROR',
    tickerSpread: 'Spread:',
    tickerGroundTruth: 'Ground truth:',
    tickerLiveSpread: 'Spread:',
    tickerObserved: 'Observed on',
    tickerForecastFor: 'Forecast for',

    // Table 1.0 (Performance Accountability)
    table1Title: 'TABLE 1.0 // PERFORMANCE ACCOUNTABILITY',
    table1Sub: 'Empirical Accuracy: Model vs. Naive Baseline',
    table1Caption: '97.5% DECISION ACCURACY & 96.9% CHILD SAFETY RECALL ACROSS 120 TEST DAYS',
    cardAccuracyTitle: 'DECISION ACCURACY (@ 60 µg/m³)',
    cardAccuracySub: 'Point Rule Accuracy:',
    cardAccuracyDesc: 'Overall correct alert / safe day decisions under calibrated buffer policy. Slashes false alarms down to only 2 days (vs 9 in seasonal upper).',
    cardCoverageTitle: '90% PREDICTION INTERVAL COVERAGE',
    cardCoverageSub: '80% Nominal Coverage:',
    cardCoverageDesc: 'Actual readings inside predicted [lower, upper] bounds across seasonal dispersion and calm atmospheric windows.',
    cardMaeTitle: 'TEST WINDOW ERROR (MAE)',
    cardMaeBaseline: 'Baseline:',
    cardMaeDesc: 'Full season backtest MAE across multi-season expanding folds vs. naive persistence baseline.',
    cardRecallTitle: 'CHILD SAFETY RECALL (@ 60 µg/m³)',
    cardRecallPrecision: 'Decision Precision:',
    cardRecallDesc: 'High pediatric protection (31 of 32 hazardous days identified). Only 2 false alarms accepted to protect students without crying wolf.',

    // Table 2.0 (Threshold Policy Matrix)
    table2Title: 'TABLE 2.0 // POLICY THRESHOLD SENSITIVITY',
    table2Sub: 'Decision Trade-offs Across Regulatory PM2.5 Cutoffs',
    table2Caption: 'EVALUATING POINT FORECAST VS. CONSERVATIVE SAFETY BUFFER',
    colThreshold: 'THRESHOLD',
    colDaysAbove: 'DAYS ABOVE',
    colPointRule: 'POINT RULE (pt: model > t)',
    colConservative: 'CONSERVATIVE (ct: upper_90 > t)',
    colRiskRule: 'RISK-CALIBRATED RULE (pr)',
    thGroundTruth: 'Ground Truth',
    thHit: 'Hit',
    thMiss: 'Miss',
    thFA: 'FA',
    legendHit: 'HIT (True Pos): Correct alert issued prior to unhealthy morning air.',
    legendMiss: 'MISS (False Neg): Critical failure; children exposed to pollution unannounced.',
    legendFA: 'FA (False Alarm): Alert called but air stayed within safety margins.',

    // Where it fails
    sec3Title: 'SEC. 3.0 // LIMITATIONS & SENSOR BLINDSPOTS',
    sec3Sub: 'Where the Physical Model Fails',
    sec3Copy: '[Copy]',
    sec3Copied: '[Copied]',
    sec3Reset: '[Reset]',
    sec3Desc: 'Editable field notes for hackathon technical documentation. Documents known atmospheric edge cases:',

    // Advisory Generator
    sec4Title: 'SEC. 4.0 // DIRECTIVE DISPATCH GENERATOR',
    sec4Sub: 'Operational Notice for Staff & Parents',
    sec4ApiKey: '[Gemini Key]',
    sec4HideKey: '[Hide API Key]',
    sec4GenerateBtn: '[Generate Notice]',
    sec4Generating: '[Generating...]',
    sec4CopyBtn: '[COPY NOTICE]',
    sec4CopiedBtn: '[COPIED]',
    sec4Placeholder: 'Click [Generate Notice] to synthesize an operational dispatch.',
    sec4Footer: 'Notice formatted for direct transmission to school staff and parents via WhatsApp or morning announcements.',

    // Footer
    footerDisclaimer: 'Prototype only. Not medical advice. PM2.5 data from OpenAQ; weather from Open-Meteo.',
    footerColophon: 'DELHI AIR QUALITY NEXT-DAY FORECAST • SWISS EDITORIAL SPECIFICATION',
    footerDetails: 'Designed for school coordinators deciding morning physical education and outdoor assembly safety. Replay mode evaluates the 120-day held-out test window. Live mode ingests OpenAQ and Open-Meteo feeds every 6 hours via GitHub Actions. Algorithm: HistGradientBoostingRegressor with calibrated 90% prediction intervals.',
  },

  hi: {
    // Masthead
    datasetLive: 'डेटासेट: उपग्रह व वायु गुणवत्ता स्टेशन लाइव फीड',
    datasetReplay: 'डेटासेट: 120-दिवसीय परीक्षित टेस्ट रीप्ले',
    location: 'नई दिल्ली (28.61° उत्तर, 77.20° पूर्व)',
    unverifiedNotice: 'लाइव पूर्वानुमान (सत्यापन लंबित • कल का वास्तविक डेटा शेष)',
    replayNotice: 'परीक्षित ऐतिहासिक टेस्ट रीप्ले, लाइव पूर्वानुमान नहीं',
    appTitle: 'दिल्ली वायु गुणवत्ता // अगले दिन का PM2.5 पूर्वानुमान',
    liveModeBtn: 'लाइव पूर्वानुमान (नवीनतम)',
    replayModeBtn: 'परीक्षित रीप्ले (मूल्यांकित)',
    uploadJson: '[results.json अपलोड करें]',
    refreshSchedule: 'अपडेट // गिटहब एक्शन्स द्वारा प्रत्येक 6 घंटे में',

    // Live Mode
    staleWarning: 'पुराने डेटा की चेतावनी: नवीनतम पूर्वानुमान {hours} घंटे पहले ({time}) का है। स्टेशन रिपोर्टिंग में विलंब हो सकता है।',
    liveUnavailableTitle: 'लाइव स्टेशन डेटा वर्तमान में उपलब्ध नहीं है',
    liveUnavailableMsg: 'नई दिल्ली मॉनिटरिंग स्टेशन से हालिया घंटों का डेटा प्राप्त नहीं हुआ है।',
    switchReplayBtn: 'परीक्षित रीप्ले मोड पर जाएं',
    liveStatusTitle: 'पारदर्शिता व हालिया डेटा अंतर्ग्रहण रिकॉर्ड',
    ingestTimestamp: 'डेटा अंतर्ग्रहण समय (IST)',
    latestObservation: 'नवीनतम पूर्ण 24-घंटे का प्रेक्षण',
    uncertaintyBounds: 'अनिश्चितता सीमा (90% दायरा)',
    trainingHorizon: 'मॉडल प्रशिक्षण समय-सीमा',
    liveHonestyNote: '* सत्यनिष्ठा टिप्पणी: लाइव पूर्वानुमानों को कल का 24-घंटे का चक्र पूरा होने से पूर्व वास्तविक डेटा से सत्यापित नहीं किया जा सकता। रीप्ले मोड के आंकड़े ऐतिहासिक टेस्ट सेट पर आधारित हैं।',

    // Hero Section
    projectedNextDay: 'कल के लिए अनुमानित 24-घंटे का औसत PM2.5',
    projectedMean: 'अनुमानित औसत PM2.5 सांद्रता (कल)',
    intervalLabel: '90% विश्वास अंतराल (दायरा):',
    alertStamp: 'बाहरी गतिविधियां स्थगित करें // चेतावनी',
    noAlertStamp: 'सामान्य बाहरी गतिविधियां जारी रखें // सुरक्षित',

    // Directives Table
    assemblyLabel: '01. सुबह की प्रार्थना सभा (07:30)',
    sportsLabel: '02. शारीरिक शिक्षा व खेलकूद अभ्यास',
    recessLabel: '03. लंच व खेल का मध्यांतर (Recess)',
    infirmaryLabel: '04. प्राथमिक उपचार व संवेदनशील छात्र',

    assemblyAlert: 'कक्षाओं के भीतर स्थानांतरित करें',
    assemblySafe: 'मैदान में आयोजित करने की अनुमति',
    sportsAlert: 'खेलकूद स्थगित / इनडोर जिम का प्रयोग करें',
    sportsSafe: 'मैदान में सामान्य अभ्यास की अनुमति',
    recessAlert: 'कक्षाओं के भीतर सीमित रखें',
    recessSafe: 'खेल के मैदान में जाने की अनुमति',
    infirmaryAlert: 'इनहेलर तैयार रखें / उच्च सतर्कता',
    infirmarySafe: 'मानक स्वास्थ्य निगरानी प्रोटोकॉल',

    // Policy Selector
    policyLabel: 'निर्णय नीति:',
    policyCalibrated: 'कैलिब्रेटेड सुरक्षा बफर (+6 µg/m³ • केवल 2 झूठे अलार्म)',
    policyBalanced: 'संतुलित पॉइंट रूल (पूर्वानुमान > 60)',
    policyConservative: 'मौसमी 90% ऊपरी सीमा (केवल 9 झूठे अलार्म)',

    // Stepper & Jumps
    jumpLabel: 'त्वरित चयन:',
    jumpDiwali: 'दीवाली प्रदूषण पीक',
    jumpPeak: 'अधिकतम PM2.5 स्तर',
    jumpClean: 'सबसे स्वच्छ दिन',

    // Bottom Ticker Strip
    tickerModel: '01 // मॉडल पूर्वानुमान',
    tickerInterval: '02 // 90% विश्वास अंतराल',
    tickerBaseline: '03 // बेंचमार्क (कल = आज)',
    tickerError: '04 // ऐतिहासिक परीक्षण त्रुटि',
    tickerSpread: 'दायरा:',
    tickerGroundTruth: 'वास्तविक दर्ज मान:',
    tickerLiveSpread: 'दायरा:',
    tickerObserved: 'दर्ज किया गया:',
    tickerForecastFor: 'पूर्वानुमान तिथि:',

    // Table 1.0 (Performance Accountability)
    table1Title: 'तालिका 1.0 // प्रदर्शन व सटीकता जवाबदेही',
    table1Sub: 'प्रमाणित सटीकता: मशीन लर्निंग मॉडल बनाम सामान्य बेंचमार्क',
    table1Caption: '120 टेस्ट दिनों में 97.5% निर्णय सटीकता व 96.9% बाल सुरक्षा दर',
    cardAccuracyTitle: 'निर्णय सटीकता (@ 60 µg/m³)',
    cardAccuracySub: 'पॉइंट रूल सटीकता:',
    cardAccuracyDesc: 'कैलिब्रेटेड बफर नीति के तहत सही चेतावनी / सुरक्षित दिन का निर्णय। झूठे अलार्मों को घटाकर मात्र 2 दिन किया गया (मौसमी सीमा में 9)।',
    cardCoverageTitle: '90% सांख्यिकीय अंतराल कवरेज',
    cardCoverageSub: '80% नाममात्र कवरेज:',
    cardCoverageDesc: 'मौसम में बदलाव व मौसमी प्रदूषण के दौरान मॉडल के [निचली, ऊपरी] सीमा के भीतर रहे वास्तविक मान।',
    cardMaeTitle: 'परीक्षण त्रुटि मार्जिन (MAE)',
    cardMaeBaseline: 'बेंचमार्क:',
    cardMaeDesc: 'सर्दियों के गंभीर तापमान व्युत्क्रमण (Inversion) के दौरान भी बेसलाइन से बेहतर बहु-मौसमी बैकटेस्ट परिणाम।',
    cardRecallTitle: 'बाल सुरक्षा दर / संवेदनशीलता (Recall)',
    cardRecallPrecision: 'निर्णय परिशुद्धता (Precision):',
    cardRecallDesc: 'उच्च बाल स्वास्थ्य सुरक्षा (32 में से 31 खतरनाक दिनों की पूर्व पहचान)। बिना वजह झूठे अलार्म बजाए केवल 2 सावधानियां दर्ज।',

    // Table 2.0 (Threshold Policy Matrix)
    table2Title: 'तालिका 2.0 // नीति संवेदनशीलता मैट्रिक्स',
    table2Sub: 'राष्ट्रीय वायु गुणवत्ता मानकों पर निर्णय का तुलनात्मक विश्लेषण',
    table2Caption: 'पॉइंट पूर्वानुमान बनाम अनिश्चितता-आधारित सुरक्षा नीतियां',
    colThreshold: 'PM2.5 सीमा',
    colDaysAbove: 'अधिक दिन',
    colPointRule: 'पॉइंट रूल (pt: मॉडल > t)',
    colConservative: 'कंजर्वेटिव रूल (ct: 90% सीमा > t)',
    colRiskRule: 'जोखिम-कैलिब्रेटेड रूल (pr)',
    thGroundTruth: 'वास्तविक दिन',
    thHit: 'सटीक (Hit)',
    thMiss: 'चूक (Miss)',
    thFA: 'झूठी चेतावनी (FA)',
    legendHit: 'सटीक चेतावनी (True Pos): खराब हवा से पूर्व समय पर सही चेतावनी जारी हुई।',
    legendMiss: 'गंभीर चूक (False Neg): हवा खराब थी किंतु चेतावनी नहीं मिली (बच्चों के लिए जोखिम)।',
    legendFA: 'झूठा अलार्म (False Alarm): चेतावनी दी गई किंतु वायु गुणवत्ता सुरक्षित रही।',

    // Where it fails
    sec3Title: 'खंड 3.0 // मॉडल की भौतिक सीमाएं व ब्लाइंडस्पॉट',
    sec3Sub: 'मौसम विज्ञान व भौतिक मॉडल कहाँ चूकता है',
    sec3Copy: '[कॉपी करें]',
    sec3Copied: '[कॉपी हो गया]',
    sec3Reset: '[रीसेट करें]',
    sec3Desc: 'दिल्ली के वायुमंडलीय वातावरण के वास्तविक जमीनी नोट्स:',

    // Advisory Generator
    sec4Title: 'खंड 4.0 // प्रधानाचार्य सूचना जनरेटर',
    sec4Sub: 'शिक्षकों व अभिभावकों के लिए आधिकारिक परिपत्र',
    sec4ApiKey: '[Gemini Key दर्ज करें]',
    sec4HideKey: '[Key छिपाएं]',
    sec4GenerateBtn: '[सूचना तैयार करें]',
    sec4Generating: '[तैयार हो रही है...]',
    sec4CopyBtn: '[सूचना कॉपी करें]',
    sec4CopiedBtn: '[कॉपी हो गया]',
    sec4Placeholder: 'अभिभावकों व स्टाफ हेतु आधिकारिक नोटिस तैयार करने के लिए [सूचना तैयार करें] पर क्लिक करें।',
    sec4Footer: 'यह नोटिस व्हाट्सएप ग्रुपों या प्रार्थना सभा में प्रसारण हेतु सीधे उपयोग योग्य है।',

    // Footer
    footerDisclaimer: 'केवल प्रोटोटाइप। यह चिकित्सीय सलाह नहीं है। PM2.5 डेटा: OpenAQ; मौसम डेटा: Open-Meteo।',
    footerColophon: 'दिल्ली वायु गुणवत्ता अगले दिन का पूर्वानुमान • स्विस संपादकीय प्रारूप',
    footerDetails: 'दिल्ली के स्कूलों के लिए तैयार किया गया निर्णय टूल। 120-दिवसीय टेस्ट डेटा पर परीक्षित। लाइव मोड हर 6 घंटे में गिटहब एक्शन्स द्वारा स्वचालित अपडेट होता है। एल्गोरिथ्म: HistGradientBoostingRegressor (90% विश्वास अंतराल)।',
  },
};
