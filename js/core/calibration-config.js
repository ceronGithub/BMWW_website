/*
 * FILE    : js/core/calibration-config.js
 * PURPOSE : Constants ng Calibration correl: ayos ng calibration CSV (After at Master), selector, Excel export, text
 * DEPENDS : js/core/config.js, js/core/master-export-config.js (kulay, autofit, separator)
 * VERSION : v11.2 | 2026-11-22 | GROUP.before at TEXT.typeSuffix: Daily Check record (After blangko) ay gumagamit ng Before bilang Actual
 * VERSION : v11 | 2026-11-22 | LATEST.DATE_READONLY = false: editable ang Date ng Calibration Correl (para sa pag-test)
 * VERSION : v9.0 | 2026-11-22 | bagong file (Calibration correl, kopya ng Master Correl)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.calibrationConfig = Object.freeze({
    SOURCE_KEY: 'source1',
    // Ang unang cell ng row 1 ng calibration CSV ay nagsisimula sa text na ito ("Calibration Status List"); hindi sensitibo sa laki ng letra.
    TITLE_PREFIX: 'calibration status',
    // Row (0 = row 1): title, group (Before / After / Master ...), barcode (header ng bawat reading), simula ng data. DATE_COLUMN: column ng petsa (B).
    ROW: { title: 0, group: 2, barcode: 3, dataStart: 4 },
    DATE_COLUMN: 1,
    // Pangalan ng group sa row 3 (maliit na letra). Ang data ay nagsisimula sa column pagkatapos ng group cell.
    // before = ginagamit na Actual kapag blangko ang After (Daily Check record; tugma ang R2 sa file sa Before vs Master).
    GROUP: { after: 'after', before: 'before', master: 'master' },
    // Mga header na nagtatapos sa listahan ng barcode ng isang group (maliit na letra).
    END_MARKER_LIST: ['avg', 'avg.', 'max', 'max.', 'std. phase', 'slice'],
    // Ilang column pagkatapos ng huling barcode hahanapin ang AVG header.
    AVERAGE_SCAN_COLUMNS: 3,
    // DATE_READONLY true = ang Date ay laging today at hindi mababago (kapareho ng Master Correl). false = puwedeng pumili ng petsa (ngayon: false, para sa pag-test).
    LATEST: { MAX_FILES: 60, DATE_READONLY: false },
    SELECTOR: {
      source: '#calibration-source', date: '#calibration-date', runButton: '#calibration-run',
      status: '#calibration-status', result: '#calibration-result'
    },
    // Excel export: <Saving path>\calibration-correl\<petsa ng export>\ at kopya sa <Server path>\calibration-correl\<machine name>\<petsa>\
    EXPORT: {
      SUBFOLDER: 'calibration-correl',
      FILE_PREFIX: 'calibration-correl',
      FILE_EXTENSION: '.xlsx',
      SERVER: { FILE_NAME: 'calibration-correl_latest.xlsx', SUBFOLDER: 'calibration-correl', NO_MACHINE_FOLDER: 'no-machine-name', UNSAFE_NAME: /[<>:"/\\|?*\u0000-\u001f]/g, TRIM_NAME: /^[\s.]+|[\s.]+$/g },
      AUTO: { ENABLED: true },
      SHEET: 'Calibration Correl',
      // Ayos ng column ng table sa sheet (0 = A): Barcode, Actual, Master
      COLUMN: { barcode: 0, actual: 1, master: 2 },
      CHART: { POINT_COLOR: '2563EB', TREND_COLOR: 'DC2626', TREND_WIDTH: 25400, MARKER_SIZE: 8, GAP_COLUMNS: 1, WIDTH_PIXELS: 760, HEIGHT_PIXELS: 560, DIGITS: 3 },
      LABEL: { title: 'CALIBRATION CORREL', status: 'Status', slope: 'Slope', intercept: 'Intercept', dateRange: 'Date range', dataSource: 'Data source', exportedAt: 'Exported', machine: 'Machine' }
    },
    TEXT: {
      // Dagdag sa pangalan ng file / record: hindi na kailangan sa After (buong calibration); ' (Daily Check)' kapag Before ang ginamit.
      typeSuffix: { after: '', before: ' (Daily Check)' },
      working: 'Binabasa ang mga file...', progress: 'Binabasa: ',
      sourceNotSet: 'Hindi pa naka-set ang Data source 1. Pumunta sa Settings.',
      recordDate: 'Date', fileName: 'File', rSquared: 'R Square', actualAverage: 'Actual AVG', masterAverage: 'Master AVG', worstBarcode: 'Worst slider',
      barcode: 'Barcode', barcodeSelectAria: 'Laki-an ang point ng barcode na ', actual: 'Actual (After)', master: 'Master',
      scatterTitle: 'Calibration Correl', scatterX: 'Master Reading', scatterY: 'Actual Reading',
      barTitle: 'Actual AVG vs Master AVG',
      levelLegendTitle: 'Actual vs Master: ',
      levelGreen: 'Green: ±{low} pababa', levelYellow: 'Yellow: higit ±{low} hanggang ±{high}', levelRed: 'Red: higit ±{high}',
      unreadable: ' file ang hindi nabasa at nilaktawan.',
      exporting: 'Sine-save ang Excel file ng Calibration correl...',
      saved: 'Na-save ang Excel file: ',
      serverSaved: '. Kopya sa Server: ',
      serverFailed: '. Hindi nakopya sa Server path: ',
      serverState: {
        noFolder: 'wala pang Server path sa Settings.',
        noPermission: 'kailangan ng pahintulot sa Server folder.',
        unsupported: 'hindi suportado ng browser ang folder access (gamitin ang Chrome o Edge).',
        error: 'hindi ma-save sa Server folder. Subukan ulit.'
      },
      error: {
        unsupported: 'Gamitin ang Chrome o Edge sa laptop para mabasa ang folder.',
        noSource: 'Piliin muna ang Data source 1 sa Settings.',
        noPermission: 'Hindi pinayagan ang access sa Data source. Subukan ulit at pindutin ang Allow.',
        folderMissing: 'Hindi mahanap ang Data source folder. Piliin ulit ito sa Settings.',
        emptyFolder: 'Walang CSV file sa Data source folder.',
        noCalibrationFile: 'Walang calibration file (Calibration Status List na may After at Master) sa mga file na nabasa.',
        noRecordToday: 'Walang calibration record sa napiling petsa.',
        badDate: 'Maglagay ng valid na Date.',
        noRegression: 'Hindi makalkula ang R Square (kulang o pare-pareho ang data).',
        readFail: 'May problema sa pagbabasa ng mga file. Subukan ulit.',
        noRoot: 'Piliin muna ang Saving path (BMWW) sa Settings.',
        exportFail: 'Hindi na-save ang Excel file. Subukan ulit.'
      }
    }
  });
})();
