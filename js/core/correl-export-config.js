/*
 * FILE    : js/core/correl-export-config.js
 * PURPOSE : Constants ng Master Correl export (Excel): subfolder, file name, selector, kulay ng chart, text
 * DEPENDS : js/core/master-export-config.js (kulay, autofit, separator at protocol ay galing doon)
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
    NO_FILE_CODE: 'noLatestCorrelFile',
    SELECTOR: { exportButton: '#latest-export', openLatestButton: '#latest-open' },
    SHEET: 'Correl',
    // Chart (scatter, x = master, y = actual). Kulay ng point ay green / yellow / red ayon sa level, kapareho ng screen.
    CHART: {
      POINT_COLOR: '2563EB', TREND_COLOR: 'DC2626', TREND_WIDTH: 25400, MARKER_SIZE: 8,
      GAP_COLUMNS: 1, WIDTH_PIXELS: 760, HEIGHT_PIXELS: 560
    },
    LABEL: { title: 'MASTER CORREL', status: 'Status', slope: 'Slope', intercept: 'Intercept', dateRange: 'Date range', dataSource: 'Data source', exportedAt: 'Exported' },
    TEXT: {
      exporting: 'Sine-save ang Excel file ng Master Correl...',
      saved: 'Na-save ang Excel file: ',
      openingLatest: 'Hinahanap ang pinakabagong Correl file...',
      openedLatest: 'Ipinadala ang utos na buksan: ',
      error: {
        noResult: 'Patakbuhin muna ang Master Correl bago mag-export.',
        noLatestCorrelFile: 'Wala pang na-export na Correl file. Pindutin muna ang Export to Excel.',
        exportFail: 'Hindi na-save ang Excel file. Subukan ulit.',
        openFail: 'Hindi nabuksan ang pinakabagong Correl file. Subukan ulit.'
      }
    }
  });
})();
