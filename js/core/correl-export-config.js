/*
 * FILE    : js/core/correl-export-config.js
 * PURPOSE : Constants ng Master Correl export (Excel): subfolder, file name, selector, kulay ng chart, text
 * DEPENDS : js/core/master-export-config.js (kulay, autofit, separator at protocol ay galing doon)
 * VERSION : v8.1 | 2026-11-21 | AUTO.SKIP_SAME (false = laging bagong export kada click ng Master Correl)
 * VERSION : v8 | 2026-11-21 | AUTO (kusang export pagkatapos ng Run Latest Master), SERVER.FILE_NAME (iisang file sa Server na ino-overwrite), TEXT.autoSkipped
 * VERSION : v7.2 | 2026-11-21 | SERVER (subfolder ng kopya sa Server path, pangalan ng folder ng machine) at TEXT.serverSaved / serverFailed / serverState
 * VERSION : v2.21 | 2026-11-21 | CHART.SHOW_LEGEND = false (walang legend sa Excel chart)
 * VERSION : v2.20 | 2026-11-21 | OPEN_MODE: 'folder'; openedLatest ay para sa folder
 * VERSION : v2.19 | 2026-11-21 | COLUMN (ayos ng table), CHART.LEGEND_DIGITS at LEGEND_SEPARATOR
 * VERSION : v2.16 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.correlConfig = Object.freeze({
    // Subfolder sa loob ng Saving path (BMWW), hiwalay sa master-repeatability.
    SUBFOLDER: 'master-correl',
    FILE_PREFIX: 'master-correl',
    FILE_EXTENSION: '.xlsx',
    // Kopya sa Server path: <Server path>\<SUBFOLDER>\<machine name>\<petsa ng export>\<file>. UNSAFE_NAME = mga character na bawal sa pangalan ng folder (pinapalitan ng _); TRIM_NAME = tinatanggal na espasyo at tuldok sa dulo.
    SERVER: { FILE_NAME: 'master-correl_latest.xlsx', SUBFOLDER: 'master-correl', NO_MACHINE_FOLDER: 'no-machine-name', UNSAFE_NAME: /[<>:"/\\|?*\u0000-\u001f]/g, TRIM_NAME: /^[\s.]+|[\s.]+$/g },
    // Kusang export pagkatapos ng Run Latest Master. SKIP_SAME false = laging gumagawa ng bagong file sa Saving path at ino-overwrite ang kopya sa Server; true = nilalaktawan kapag pareho pa ang record. STORAGE_KEY = localStorage (huling na-export na record).
    AUTO: { ENABLED: true, SKIP_SAME: false, STORAGE_KEY: 'bmww.correlAutoExport' },
    NO_FILE_CODE: 'noLatestCorrelFile',
    // 'folder' = ang Open latest correl file ay nagbubukas ng FOLDER (naka-highlight ang pinakabagong file). Alisin ito para Excel ang bumukas.
    OPEN_MODE: 'folder',
    SELECTOR: { exportButton: '#latest-export', openLatestButton: '#latest-open' },
    SHEET: 'Correl',
    // Chart (scatter, x = master, y = actual). Kulay ng point ay green / yellow / red ayon sa level, kapareho ng screen.
    CHART: {
      POINT_COLOR: '2563EB', TREND_COLOR: 'DC2626', TREND_WIDTH: 25400, MARKER_SIZE: 8,
      GAP_COLUMNS: 1, WIDTH_PIXELS: 760, HEIGHT_PIXELS: 560,
      // Text ng legend kada point: <Actual> / <Master>
      // SHOW_LEGEND: false = walang legend sa chart ng Excel. Gawing true para bumalik ang legend (kulay + Actual / Master kada point).
      SHOW_LEGEND: false, LEGEND_DIGITS: 3, LEGEND_SEPARATOR: ' / '
    },
    // Ayos ng column ng table sa sheet (0 = A): Barcode, Actual, Master
    COLUMN: { barcode: 0, actual: 1, master: 2 },
    LABEL: { title: 'MASTER CORREL', status: 'Status', slope: 'Slope', intercept: 'Intercept', dateRange: 'Date range', dataSource: 'Data source', exportedAt: 'Exported' },
    TEXT: {
      exporting: 'Sine-save ang Excel file ng Master Correl...',
      saved: 'Na-save ang Excel file: ',
      autoSkipped: 'Walang bagong record mula sa huling na-export, kaya hindi na nag-export ulit. Pindutin ang Export to Excel kung gusto mo pa ring mag-export.',
      serverSaved: '. Kopya sa Server: ',
      serverFailed: '. Hindi nakopya sa Server path: ',
      serverState: {
        noFolder: 'wala pang Server path sa Settings.',
        noPermission: 'kailangan ng pahintulot sa Server folder.',
        unsupported: 'hindi suportado ng browser ang folder access (gamitin ang Chrome o Edge).',
        error: 'hindi ma-save sa Server folder. Subukan ulit.'
      },
      openingLatest: 'Hinahanap ang pinakabagong Correl file...',
      openedLatest: 'Ipinadala ang utos na buksan ang folder: ',
      error: {
        noResult: 'Patakbuhin muna ang Master Correl bago mag-export.',
        noLatestCorrelFile: 'Wala pang na-export na Correl file. Pindutin muna ang Export to Excel.',
        exportFail: 'Hindi na-save ang Excel file. Subukan ulit.',
        openFail: 'Hindi nabuksan ang pinakabagong Correl file. Subukan ulit.'
      }
    }
  });
})();
