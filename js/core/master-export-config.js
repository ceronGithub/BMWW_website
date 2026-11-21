/*
 * FILE    : js/core/master-export-config.js
 * PURPOSE : Constants ng Master Repeatability export (Excel): subfolder, file name, selector, kulay, text
 * DEPENDS : js/core/config.js
 * VERSION : v2.8 | 2026-11-20 | bagong file (para hindi galawin ang config.js; puwedeng ilipat doon kapag pinayagan)
 * VERSION : v2.13 | 2026-11-21 | CHART (kulay, kapal, laki, posisyon) para sa chart sa sheet na Readings
 * VERSION : v2.15 | 2026-11-21 | PROTOCOL (bmww-open:) para sa Open latest; bagong text at error (walang download)
 * VERSION : v2.20 | 2026-11-21 | REVEAL_PREFIX at OPEN_MODE_FOLDER (pagbukas ng folder sa Master Correl)
 * VERSION : v2.14 | 2026-11-21 | puting cell (COLOR.cell, COLOR.border), AUTOFIT ng column, CHART WIDTH/HEIGHT_PIXELS (mas malaki, fixed), button at text ng Open latest file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.exportConfig = Object.freeze({
    // Subfolder sa loob ng Saving path (BMWW) kung saan nase-save ang Excel file.
    SUBFOLDER: 'master-repeatability',
    FILE_PREFIX: 'master-repeatability',
    FILE_EXTENSION: '.xlsx',
    // Protocol ng Windows handler (tools/open-handler) na nagbubukas ng Excel.
    PROTOCOL: 'bmww-open:',
    // Kapag nasa unahan ng path (bmww-open:reveal:<path>), folder ang bubuksan ng handler. OPEN_MODE_FOLDER ang halaga ng OPEN_MODE sa target.
    REVEAL_PREFIX: 'reveal:',
    OPEN_MODE_FOLDER: 'folder',
    PATH_SEPARATOR: '\\',
    SELECTOR: { exportButton: '#range-export', openLatestButton: '#range-open-latest' },
    // Kulay ng Excel (hex, walang #). Kapareho ng --level-green / --level-yellow / --level-red sa master.css.
    // header at cell ay puti (FFFFFF); ang green / yellow / red lang ang may kulay (level ng reading).
    COLOR: { header: 'FFFFFF', cell: 'FFFFFF', border: 'D1D5DB', green: '16A34A', yellow: 'EAB308', red: 'DC2626' },
    // Chart sa sheet na Readings. Kulay ay kapareho ng --chart-1..8 sa master.css; ang MASTER ay makapal at itim.
    CHART: {
      PALETTE: ['2563EB', '16A34A', 'D97706', '9333EA', '0891B2', 'DB2777', '65A30D', 'EA580C'],
      MASTER_COLOR: '111827', LINE_WIDTH: 19050, MASTER_LINE_WIDTH: 44450, MARKER_SIZE: 5, MASTER_MARKER_SIZE: 7,
      // Laki ng chart sa pixel (fixed; hindi lumiliit kapag nag-autofit ang column). Dati ay mga 830 x 640.
      GAP_COLUMNS: 1, WIDTH_PIXELS: 1000, HEIGHT_PIXELS: 720, X_TITLE: 'Barcode', Y_TITLE: 'Reading'
    },
    SHEET: { summary: 'Repeatability', readings: 'Readings' },
    // Autofit ng column: lapad = pinakamahabang text sa column * BOLD_FACTOR (kung bold) + EXTRA, sa pagitan ng MIN at MAX.
    AUTOFIT: { MIN: 8, MAX: 45, EXTRA: 3, BOLD_FACTOR: 1.15 },
    ERROR_BY_NAME: { NotAllowedError: 'noPermission', SecurityError: 'noPermission', NotFoundError: 'folderMissing', QuotaExceededError: 'diskFull' },
    LABEL: { title: 'MASTER REPEATABILITY', chartRecords: 'Chart records', status: 'Status', exportedAt: 'Exported', dataSource: 'Data source' },
    TEXT: {
      exporting: 'Sine-save ang Excel file...',
      openingLatest: 'Hinahanap ang pinakabagong Repeatability file...',
      openedLatest: 'Ipinadala ang utos na buksan: ',
      openedHint: ' | Kung walang bumukas: i-install muna ang tools\\open-handler\\install-open-handler.bat, at sa tanong ng browser piliin ang Open.',
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
        exportFail: 'Hindi na-save ang Excel file. Subukan ulit.',
        noRootPath: 'Ilagay ang FULL PATH ng Saving path sa Settings (hal. C:\\BMWW) para mabuksan ang file sa Excel.',
        noLatestFile: 'Wala pang na-export na Repeatability file. Pindutin muna ang Export to Excel.',
        openFail: 'Hindi nabuksan ang pinakabagong file. Subukan ulit.'
      }
    }
  });
})();
