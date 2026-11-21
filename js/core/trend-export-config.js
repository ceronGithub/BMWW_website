/*
 * FILE    : js/core/trend-export-config.js
 * PURPOSE : Constants ng Trend export: Excel (Saving path lang), picture ng 6 chart (Saving path at Server path), meta file, Trend block sa Dashboard at lahat ng text
 * DEPENDS : js/core/config.js, js/core/trend-config.js
 * VERSION : v9.4 | 2026-11-22 | bagong file (Export to Excel sa Trend page, picture papunta sa LEAD PC, UPDATED badge sa Dashboard)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.trendExportConfig = Object.freeze({
    // Lugar ng file. Saving path: <Saving path>\trend\<yyyy-mm-dd>\<excel>; <Saving path>\trend\trend_latest.png at trend_latest.json.
    // Server path: <Server path>\trend\<machine name>\trend_latest.png at trend_latest.json (walang Excel sa Server).
    SUBFOLDER: 'trend',
    FILE_PREFIX: 'trend',
    FILE_EXTENSION: '.xlsx',
    IMAGE_NAME: 'trend_latest.png',
    META_NAME: 'trend_latest.json',
    PATH_SEPARATOR: '\\',
    // Pangalan ng folder ng machine sa Server (kapareho ng Master Correl): bawal na character ay pinapalitan ng _.
    NO_MACHINE_FOLDER: 'no-machine-name',
    UNSAFE_NAME: /[<>:"/\\|?*\u0000-\u001f]/g,
    TRIM_NAME: /^[\s.]+|[\s.]+$/g,
    ERROR_BY_NAME: { NotAllowedError: 'noPermission', SecurityError: 'noPermission', NotFoundError: 'folderMissing', QuotaExceededError: 'diskFull' },
    // Meta file (trend_latest.json): VERSION ng format, limit ng laki ng file at ng text.
    META: { VERSION: 1, FILE_MAX_BYTES: 262144, IMAGE_MAX_BYTES: 31457280, TEXT_MAX: 200 },
    // Alaala ng huling nakita ng browser na ito (para sa UPDATED badge): { "<key>": "<updatedAt>" } sa localStorage.
    SEEN: { KEY: 'bmww.trendSeen', MAX: 200, OWN_KEY: '@own' },
    SELECTOR: { exportButton: '#trend-export', exportStatus: '#trend-export-status' },
    // Excel. Kulay ay hex na walang #. Isang chart lang kada sheet ang kaya ng xlsx-writer, kaya may sheet ang bawat value.
    XLSX: {
      COLOR: { header: 'FFFFFF', cell: 'FFFFFF', border: 'D1D5DB', green: '16A34A', yellow: 'EAB308', red: 'DC2626' },
      AUTOFIT: { MIN: 8, MAX: 45, EXTRA: 3, BOLD_FACTOR: 1.15 },
      SHEET: { summary: 'Summary', points: 'Points' },
      CHART: {
        WIDTH_PIXELS: 1000, HEIGHT_PIXELS: 480, ANCHOR_ROW: 6, Y_PAD_RATIO: 0.12,
        LINE_WIDTH: 19050, LIMIT_WIDTH: 19050, MARKER_SIZE: 5, LIMIT_MARKER_SIZE: 2,
        COLOR: { line: '2563EB', ucl: 'DC2626', cl: '15803D', lcl: 'D97706' },
        X_TITLE: 'Point', Y_TITLE: 'Value'
      },
      LABEL: {
        title: 'TREND', machine: 'Machine', range: 'Range', points: 'Mga point', records: 'Mga record', files: 'Master file', out: 'Labas sa limit (lahat)',
        dataSource: 'Data source', exportedAt: 'Exported', value: 'Value', outColumn: 'Labas sa limit',
        point: 'Point', shiftDay: 'Petsa ng shift', shift: 'Shift', cantilever: 'Cantilever', recordTime: 'Oras ng record', file: 'File', set: 'Set ng user', yes: 'Oo',
        above: '> UCL', below: '< LCL'
      }
    },
    // Picture (PNG) ng 6 chart: iginuguhit sa canvas, walang library. COLUMNS = ilang chart kada row.
    IMAGE: {
      MIME: 'image/png', COLUMNS: 2, CHART_WIDTH: 760, CHART_HEIGHT: 310, GAP: 16, MARGIN: 24, HEADER_HEIGHT: 78,
      PADDING: { top: 52, right: 74, bottom: 66, left: 70 },
      TICK_COUNT: 5, PAD_RATIO: 0.12, POINT_RADIUS: 3.5, OVERRIDE_RADIUS: 6, LINE_WIDTH: 2, LIMIT_WIDTH: 1.5, MAX_X_LABELS: 12, LABEL_ANGLE_DEGREES: -40, MAX_LABEL_CHARS: 14,
      FONT_FAMILY: '"Segoe UI", Roboto, Arial, sans-serif',
      COLOR: {
        background: '#ffffff', text: '#111827', muted: '#6b7280', grid: '#e5e7eb', axis: '#9ca3af', cell: '#d1d5db',
        line: '#2563eb', out: '#dc2626', ucl: '#dc2626', cl: '#15803d', lcl: '#d97706', set: '#9333ea', change: '#0891b2'
      },
      LEGEND: [['line', 'Point'], ['out', 'Labas sa limit'], ['set', 'Set ng user'], ['change', 'Pagpalit ng cantilever']]
    },
    CLASS: {
      box: 'dm-correl dm-trend', updated: 'is-updated', none: 'dm-correl-none', row: 'dm-correl-row', label: 'dm-correl-label', empty: 'dm-correl-empty',
      badge: 'dm-trend-badge', meta: 'dm-correl-meta card-note', thumb: 'dm-trend-thumb', image: 'dm-trend-image', previewButton: 'btn btn-secondary dm-preview-button'
    },
    TEXT: {
      exporting: 'Ginagawa ang Excel at picture...',
      noRun: 'Pindutin muna ang Run Trend bago mag-export.',
      saved: 'Na-save ang Excel: ',
      serverSaved: '. Naipadala ang picture sa Server: ',
      serverFailed: '. Hindi naipadala ang picture sa Server path: ',
      serverState: {
        noFolder: 'wala pang Server path sa Settings.',
        noPermission: 'kailangan ng pahintulot sa Server folder.',
        unsupported: 'hindi suportado ng browser ang folder access (gamitin ang Chrome o Edge).',
        error: 'hindi ma-save sa Server folder. Subukan ulit.'
      },
      error: {
        unsupported: 'Gamitin ang Chrome o Edge sa laptop para makapag-save ng file sa folder.',
        noRoot: 'Piliin muna ang Saving path (BMWW) sa Settings.',
        noPermission: 'Hindi pinayagan ang access sa Saving path. Subukan ulit at pindutin ang Allow.',
        folderMissing: 'Hindi mahanap ang Saving path folder. Piliin ulit ito sa Settings.',
        diskFull: 'Puno na ang disk o hindi makapagsulat ng file.',
        imageFail: 'Hindi nagawa ang picture ng Trend. Subukan ulit.',
        exportFail: 'Hindi na-export ang Trend. Subukan ulit.'
      },
      tile: {
        label: 'TREND', none: 'Wala pang Trend export', updatedBadge: 'UPDATED', previewButton: 'Preview',
        previewAria: 'Buksan sa bagong tab ang picture ng Trend ng ', imageAlt: 'Trend ng ', noImage: 'Hindi mabasa ang picture ng Trend. Subukan ulit.',
        range: 'Range: ', points: 'Mga point: ', out: 'Labas sa limit: ', exported: 'Exported: '
      }
    }
  });
})();
