/*
 * FILE    : js/core/lot-config.js
 * PURPOSE : Lahat ng constant ng LOT Tracking (source, LOT Unit, RESULT column, imbakan ng aktibong lote, validation, beep)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 * VERSION : v2 | 2026-11-22 | Yugto 1: SOURCE (Data source 2 at 3), SHOW_UNMATCHED = false, VALIDATION (Operator), BEEP
 * VERSION : v3 | 2026-11-23 | Yugto 2: SHIFT at MONITORING (imbakan ng monitoring: JSON at Excel, column, status, kulay, text)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.lotConfig = Object.freeze({
    SOURCE: Object.freeze({
      // Mga folder na binabantayan ng LOT Tracking: File Path 1 = Data source 2, File Path 2 = Data source 3 (kapareho ng Search Files).
      KEYS: Object.freeze(['source2', 'source3'])
    }),
    UNIT: Object.freeze({
      // Ang X_Time.csv o X_Time (folder) ay kasama ng unit na X; hindi ito ang pangunahing file.
      TIME_PATTERN: /_time(\.[^.\\/]*)?$/i,
      // false: nilalaktawan ang file/folder na hindi tumama sa pangalan ng LOT Unit (hindi lalabas sa RESULT). true: lalabas ito na walang LOT Unit.
      SHOW_UNMATCHED: false
    }),
    RESULT: Object.freeze({
      // Posisyon ng Path column (0-based) sa table ng RESULT.
      PATH_COLUMN: 5
    }),
    ACTIVE_STORE: Object.freeze({
      KEY: 'bmww.activeLote',
      VERSION: 1,
      MAX_FIRST_SEEN: 500
    }),
    VALIDATION: Object.freeze({
      // Operator: titik (kasama ang may tuldik), numero, espasyo, ., - at _ lang. Ang haba (2 hanggang 30) ay nasa CONFIG.LOT.
      OPERATOR_PATTERN: /^[\p{L}\p{N} ._-]+$/u
    }),
    BEEP: Object.freeze({
      // Beep kapag natapos ang lote (END MEASUREMENT). Gawing false para patayin.
      ENABLED: true,
      WAVE: 'sine',
      FREQUENCY_HZ: 880,
      DURATION_MS: 200,
      VOLUME: 0.2
    }),
    SHIFT: Object.freeze({
      // Pangalan ng shift na isinusulat sa monitoring. Ang oras ng simula ay galing sa Settings (root.shiftTimes).
      DAY: 'Day',
      NIGHT: 'Night'
    }),
    MONITORING: Object.freeze({
      VERSION: 1,
      FOLDER: 'monitoring',
      JSON_SUFFIX: '_MONITORING.json',
      XLSX_SUFFIX: '_MONITORING.xlsx',
      JSON_INDENT: 2,
      SHEET_NAME: 'LOT_TRACKING',
      TEXT_MAX: 300,
      ROWS_MAX: 20000,
      MS_PER_MINUTE: 60000,
      DURATION_DECIMALS: 2,
      // Paghihintay sa tumatakbong hanap bago tapusin ang lote (para kasama ang huling unit).
      FINISH_WAIT_MS: 50,
      FINISH_WAIT_MAX_MS: 5000,
      STATUS: Object.freeze({ ongoing: 'ONGOING', done: 'DONE' }),
      SENT: Object.freeze({ notSent: 'NOT SENT', sent: 'SENT' }),
      // Ayos ng 16 na column ng macro. type: text | time (ms) | number.
      COLUMN_LIST: Object.freeze([
        Object.freeze({ field: 'wafer', header: 'Wafer', type: 'text' }),
        Object.freeze({ field: 'barcode', header: 'Barcode', type: 'text' }),
        Object.freeze({ field: 'lotUnit', header: 'LOT Unit', type: 'text' }),
        Object.freeze({ field: 'blk', header: 'Blk', type: 'text' }),
        Object.freeze({ field: 'layerNo', header: 'Layer No.', type: 'text' }),
        Object.freeze({ field: 'startMs', header: 'Start-Time', type: 'time' }),
        Object.freeze({ field: 'endMs', header: 'End-Time', type: 'time' }),
        Object.freeze({ field: 'operator', header: 'Operator', type: 'text' }),
        Object.freeze({ field: 'machine', header: 'Machine', type: 'text' }),
        Object.freeze({ field: 'filePath', header: 'File Path', type: 'text' }),
        Object.freeze({ field: 'status', header: 'Status', type: 'text' }),
        Object.freeze({ field: 'sentStatus', header: 'Sent Status', type: 'text' }),
        Object.freeze({ field: 'shift', header: 'Shift', type: 'text' }),
        Object.freeze({ field: 'remarks', header: 'Remarks', type: 'text' }),
        Object.freeze({ field: 'sentMs', header: 'Sent Time', type: 'time' }),
        Object.freeze({ field: 'lotDurationMin', header: 'Lot Duration (min)', type: 'number' })
      ]),
      // handleKey = susi sa CONFIG.HANDLE_KEY (root = Saving path, server = Server path).
      TARGET: Object.freeze({
        saving: Object.freeze({ handleKey: 'root', label: 'Saving path' }),
        server: Object.freeze({ handleKey: 'server', label: 'Server path' })
      }),
      // Kulay ng Excel (hex, walang #). Madilim ang green at yellow(kahel) dahil puti ang letra ng style na iyon.
      COLOR: Object.freeze({ header: 'D9E1F2', cell: 'FFFFFF', border: 'D1D5DB', green: '16A34A', yellow: 'D97706', red: 'DC2626' }),
      AUTOFIT: Object.freeze({ MIN: 8, MAX: 60, EXTRA: 2, BOLD_FACTOR: 1.2 }),
      TEXT: Object.freeze({
        noFolder: ': walang folder na naka-set sa Settings, hindi naisulat ang monitoring.',
        noPermission: ': walang permission sa folder, hindi naisulat ang monitoring.',
        jsonError: ': hindi maisulat ang monitoring JSON.',
        excelError: ': hindi maisulat ang monitoring Excel (baka bukas ito sa Excel).',
        buildError: 'Hindi magawa ang monitoring Excel.',
        notLoaded: 'Monitoring: hindi pa nababasa ang file ng araw na ito (walang permission sa folder). Pindutin ang Enter sa Barcode para humingi ulit.'
      })
    })
  });
})();
