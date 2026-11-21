/*
 * FILE    : js/core/trend-config.js
 * PURPOSE : Constants ng Trend: column ng master CSV (Mean Offset, Stdev, CV, Slope, Intercept, R2), limits (UCL, CL, LCL), saklaw ng petsa, chart, selector, text
 * DEPENDS : js/core/config.js
 * VERSION : v9.3 | 2026-11-22 | bagong file (Trend page at Trend limits sa Settings)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const MASTER = root.CONFIG.MASTER;

  root.trendConfig = Object.freeze({
    SOURCE_KEY: MASTER.SOURCE_KEY,
    // Row (0 = row 1) ng header ng mga column (Date, Cantilever no., Mean Offset ...) at simula ng data. Pareho sa master CSV.
    ROW: { header: MASTER.BARCODE_ROW, dataStart: MASTER.DATA_START_ROW },
    // Column ng petsa (B) at ng Cantilever no. (C), 0 = A.
    COLUMN: { date: MASTER.DATE_COLUMN, cantilever: 2 },
    // Mga value ng Trend. header = pangalan sa header row (maliit na letra). Kapag hindi nahanap ang header, ginagamit ang fallbackColumn (Y hanggang AD).
    METRIC_LIST: [
      { key: 'meanOffset', label: 'Mean Offset', header: 'mean offset', fallbackColumn: 24, digits: 4 },
      { key: 'stdev', label: 'Stdev', header: 'stdev', fallbackColumn: 25, digits: 4 },
      { key: 'cv', label: 'CV', header: 'cv', fallbackColumn: 26, digits: 4 },
      { key: 'slope', label: 'Slope', header: 'slope', fallbackColumn: 27, digits: 4 },
      { key: 'intercept', label: 'Intercept', header: 'intercept', fallbackColumn: 28, digits: 4 },
      { key: 'r2', label: 'R2', header: 'r2', fallbackColumn: 29, digits: 5 }
    ],
    LIMIT_FIELD_LIST: [
      { key: 'ucl', label: 'UCL' },
      { key: 'cl', label: 'CL' },
      { key: 'lcl', label: 'LCL' }
    ],
    LIMIT_MAX_LENGTH: 20,
    NUMBER_PATTERN: /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/,
    // Saan naka-save: limits sa settings ng machine (<machine>.json at localStorage); ang mga Set ng user sa localStorage.
    STORAGE: { LIMITS_FIELD: 'trendLimits', OVERRIDE_KEY: 'bmww.trendOverrides', OVERRIDE_MAX: 500 },
    // Saklaw ng petsa. FILE_LOOKAHEAD_DAYS: ilang araw pagkatapos ng End date ang tinitingnang file (may record ng nakaraang araw ang mas bagong file).
    RANGE: { DEFAULT_DAYS: 14, MAX_DAYS: 62, MAX_FILES: 300, FILE_LOOKAHEAD_DAYS: 2 },
    // Ang pangalan ng shift ay galing sa shiftConfig (Morning / Night); ito ang ipinapakita.
    SHIFT_DISPLAY: { Morning: 'Day', Night: 'Night' },
    POINT_STATE: { above: 'above', below: 'below', ok: 'ok' },
    CHART: {
      MIN_WIDTH: 640, HEIGHT: 320, POINT_GAP: 38,
      PADDING: { top: 58, right: 64, bottom: 78, left: 76 },
      TICK_COUNT: 5, PAD_RATIO: 0.12, POINT_RADIUS: 4.5, OVERRIDE_RADIUS: 7,
      LABEL_SLANT: -40, MAX_LABEL_CHARS: 18
    },
    SELECTOR: {
      source: '#trend-source', start: '#trend-start', end: '#trend-end', runButton: '#trend-run', resetButton: '#trend-reset-all',
      status: '#trend-status', summary: '#trend-summary', changes: '#trend-changes', charts: '#trend-charts',
      dayDate: '#trend-day-date', dayStatus: '#trend-day-status', dayResult: '#trend-day-result',
      settingsCard: '#trend-limits-card'
    },
    TEXT: {
      working: 'Binabasa ang mga file...', progress: 'Binabasa: ',
      sourceNotSet: 'Hindi pa naka-set ang Data source 1. Pumunta sa Settings.',
      badDate: 'Maglagay ng tamang Start date at End date.',
      badRange: 'Ang Start date ay hindi puwedeng lampas sa End date.',
      tooLong: 'Masyadong mahaba ang saklaw. Hanggang {days} araw lang.',
      unreadable: ' file ang hindi nabasa at nilaktawan.',
      summaryPoints: 'Mga point', summaryRecords: 'Mga record', summaryFiles: 'Master file', summaryOut: 'Labas sa limit', summaryOverride: 'Mga Set ng user',
      noLimits: 'Wala pang UCL, CL, LCL na naka-set. Itakda ang mga ito sa Settings (Trend limits).',
      limitsLink: 'Buksan ang Settings',
      limitLine: { ucl: 'UCL', cl: 'CL', lcl: 'LCL' },
      outCount: 'Labas sa limit: ',
      noData: 'Walang data',
      changesTitle: 'Pagpalit ng cantilever',
      changesNone: 'Walang pagpalit ng cantilever sa saklaw na ito: ',
      changeItem: ' (nagbago sa ',
      legendPoint: 'Point', legendOut: 'Labas sa limit', legendSet: 'Set ng user', legendChange: 'Pagpalit ng cantilever',
      dayEmpty: 'Walang record sa araw na ito.',
      dayPick: 'Pumili ng petsa para makita ang mga record ng araw na iyon.',
      dayRun: 'Pindutin muna ang Run Trend.',
      dayNote: 'Mga record ng araw na ito (galing sa master file). Ang Set ay papalit sa point ng shift sa chart.',
      dayColumn: { time: 'Oras', shift: 'Shift', cantilever: 'Cantilever', file: 'File', point: 'Sa chart', action: '' },
      pointDefault: 'Oo (pinakahuli)', pointSet: 'Oo (Set)', pointNo: '-', outsideShift: 'Labas sa shift', outsideRange: 'Labas sa saklaw',
      setButton: 'Set', resetButton: 'Reset', setAria: 'I-set ang record na ito bilang point sa chart: ', resetAria: 'Ibalik sa pinakahuling record ang shift ng record na ito: ',
      setDone: 'Na-set ang record sa chart.', resetDone: 'Ibinalik sa pinakahuling record.', resetAllDone: 'Naibalik na lahat sa pinakahuling record.',
      error: {
        unsupported: 'Gamitin ang Chrome o Edge sa laptop para mabasa ang folder.',
        noSource: 'Piliin muna ang Data source 1 sa Settings.',
        noPermission: 'Hindi pinayagan ang access sa Data source. Subukan ulit at pindutin ang Allow.',
        folderMissing: 'Hindi mahanap ang Data source folder. Piliin ulit ito sa Settings.',
        emptyFolder: 'Walang CSV file sa Data source folder.',
        noMasterFile: 'Walang master file na may 15 headers sa mga file na nabasa.',
        noFileInRange: 'Walang file sa napiling saklaw ng petsa.',
        noRecordInRange: 'Walang master record sa Day o Night shift sa napiling saklaw ng petsa.',
        tooManyFiles: 'Masyadong maraming file sa saklaw na ito. Paikliin ang saklaw ng petsa.',
        readFail: 'May problema sa pagbabasa ng mga file. Subukan ulit.'
      },
      settings: {
        title: 'Trend limits',
        note: 'UCL, CL at LCL ng bawat value ng Trend. Iisa ito para sa lahat ng cantilever. Puwedeng iwanang blangko ang hindi kailangan. Pindutin ang Save settings para ma-save.',
        valueColumn: 'Value',
        invalid: ': numero lang ang puwede (hal. 0.5 o -2).',
        order: 'dapat UCL ay hindi bababa sa CL, at ang CL ay hindi bababa sa LCL.'
      }
    }
  });
})();
