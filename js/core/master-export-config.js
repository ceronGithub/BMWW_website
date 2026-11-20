/*
 * FILE    : js/core/master-export-config.js
 * PURPOSE : Constants ng Master Repeatability export (Excel): subfolder, file name, selector, kulay, text
 * DEPENDS : js/core/config.js
 * VERSION : v2.8 | 2026-11-20 | bagong file (para hindi galawin ang config.js; puwedeng ilipat doon kapag pinayagan)
 * VERSION : v2.13 | 2026-11-21 | CHART (kulay, kapal, laki, posisyon) para sa chart sa sheet na Readings
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.exportConfig = Object.freeze({
    // Subfolder sa loob ng Saving path (BMWW) kung saan nase-save ang Excel file.
    SUBFOLDER: 'master-repeatability',
    FILE_PREFIX: 'master-repeatability',
    FILE_EXTENSION: '.xlsx',
    PATH_SEPARATOR: '\\',
    SELECTOR: { exportButton: '#range-export' },
    // Kulay ng Excel (hex, walang #). Kapareho ng --level-green / --level-yellow / --level-red sa master.css.
    COLOR: { header: 'DCFCE7', green: '16A34A', yellow: 'EAB308', red: 'DC2626' },
    // Chart sa sheet na Readings. Kulay ay kapareho ng --chart-1..8 sa master.css; ang MASTER ay makapal at itim.
    CHART: {
      PALETTE: ['2563EB', '16A34A', 'D97706', '9333EA', '0891B2', 'DB2777', '65A30D', 'EA580C'],
      MASTER_COLOR: '111827', LINE_WIDTH: 19050, MASTER_LINE_WIDTH: 44450, MARKER_SIZE: 5, MASTER_MARKER_SIZE: 7,
      GAP_COLUMNS: 1, COLUMN_SPAN: 13, ROW_SPAN: 32, X_TITLE: 'Barcode', Y_TITLE: 'Reading'
    },
    SHEET: { summary: 'Repeatability', readings: 'Readings' },
    COLUMN_WIDTH: { label: 24, value: 22, date: 20, reading: 12 },
    ERROR_BY_NAME: { NotAllowedError: 'noPermission', SecurityError: 'noPermission', NotFoundError: 'folderMissing', QuotaExceededError: 'diskFull' },
    LABEL: { title: 'MASTER REPEATABILITY', chartRecords: 'Chart records', status: 'Status', exportedAt: 'Exported', dataSource: 'Data source' },
    TEXT: {
      exporting: 'Sine-save ang Excel file...',
      saved: 'Na-save ang Excel file: ',
      chartAria: 'Chart ng Master Repeatability. I-scroll pakaliwa, pakanan, pataas o pababa.',
      dateLegendAria: 'Listahan ng petsa (legend). I-scroll pataas o pababa.',
      dateLegendTitle: 'Legend (petsa ng record): ',
      error: {
        unsupported: 'Gamitin ang Chrome o Edge sa laptop para makapag-save ng file sa folder.',
        noRoot: 'Piliin muna ang Saving path (BMWW) sa Settings.',
        noPermission: 'Hindi pinayagan ang access sa Saving path. Subukan ulit at pindutin ang Allow.',
        folderMissing: 'Hindi mahanap ang Saving path folder. Piliin ulit ito sa Settings.',
        diskFull: 'Puno na ang disk o hindi makapagsulat ng file.',
        noResult: 'Patakbuhin muna ang Master Repeatability bago mag-export.',
        exportFail: 'Hindi na-save ang Excel file. Subukan ulit.'
      }
    }
  });
})();
