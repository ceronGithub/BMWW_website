/*
 * FILE    : js/core/repeatability-tile-config.js
 * PURPOSE : Constants ng tile at Preview ng Master Repeatability sa Dashboard (text, class, limit ng basa)
 * DEPENDS : js/core/config.js
 * VERSION : v8.12 | 2026-11-21 | bagong file
 * VERSION : v8.14 | 2026-11-22 | READINGS (limit ng row ng sheet na Readings para sa chart), CHART (kulay sa Preview tab), ISSUE (limit ng listahan, key ng Sender) at TEXT.issue (dahilan kung bakit walang nabasa)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.repeatabilityTileConfig = Object.freeze({
    // Limitasyon ng basa ng Excel (kapareho ng correl-excel-reader).
    FILE_MAX_BYTES: 5242880,
    LABEL_ROW_LIMIT: 30,
    CELL_ROW_LIMIT: 400,
    SCORE_DIGITS: 2,
    // Sheet na Readings (ikalawang sheet ng Excel): row 1 = header (Record date, [Shift], mga barcode), row 2 = MASTER, row 3 pataas = mga record. READINGS_ROW_LIMIT = hanggang ilang row ang binabasa.
    READINGS: Object.freeze({ SHEET_PATH: 'xl/worksheets/sheet2.xml', HEADER_ROW: 1, MASTER_ROW: 2, FIRST_RECORD_ROW: 3, ROW_LIMIT: 2000 }),
    // Chart sa Preview tab: ang style ng tab ay may 4 na kulay ng linya lang (chart-series-0 hanggang 3), kaya umiikot ang kulay kada COLOR_CYCLE. MIN_BARCODES = pinakakaunting barcode para magkaroon ng chart.
    CHART: Object.freeze({ COLOR_CYCLE: 4, MIN_BARCODES: 1 }),
    // Dahilan kung bakit walang nabasa: FOLDER_LIST_LIMIT = ilang pangalan ng folder ang ipapakita; SENDER_KEY = susi ng Sender sa tala ng dahilan (walang machine name sa folder ng Saving path).
    ISSUE: Object.freeze({ FOLDER_LIST_LIMIT: 5, SENDER_KEY: '@sender' }),
    // Mga class ay galing sa Master Correl tile (css/pages/dashboard-machines.css); walang bagong CSS.
    CLASS: Object.freeze({ box: 'dm-correl', row: 'dm-correl-row', label: 'dm-correl-label', empty: 'dm-correl-empty', badge: 'dm-correl-badge', icon: 'dm-correl-icon', meta: 'dm-correl-meta card-note', none: 'dm-correl-none', tag: 'dm-tag', previewButton: 'btn btn-secondary dm-preview-button' }),
    TEXT: Object.freeze({
      label: 'MASTER REPEATABILITY',
      none: 'Wala pang resulta',
      score: 'Repeatability ',
      worst: 'Worst slider: ',
      range: 'Range: ',
      updated: 'Updated: ',
      stale: 'LUMA',
      // Dahilan kung bakit walang nabasa. Ang may dulong Sender ay para sa Sender (Saving path); ang iba ay para sa LEAD PC (Server path).
      issue: Object.freeze({
        noBaseFolder: 'Walang folder na master-repeatability sa Server path.',
        noBaseFolderSender: 'Wala pang folder na master-repeatability sa Saving path.',
        noFolder: 'Walang folder ng machine sa master-repeatability. Mga folder na nakita: {detail}',
        noDayFolderSender: 'Wala pang folder ng petsa ngayon sa master-repeatability ng Saving path.',
        noFile: 'Walang master-repeatability Excel file sa folder.',
        unreadable: 'Hindi mabasa ang Excel na {detail}.',
        error: 'Pumalya ang pagbasa ng Excel ({detail}).',
        none: '(wala)'
      }),
      previewButton: 'Preview',
      previewAria: 'Buksan sa bagong tab ang pinakabagong Master Repeatability file ng ',
      panel: Object.freeze({
        title: 'Master Repeatability: ',
        stats: Object.freeze({ score: 'Repeatability (%)', averageDifference: 'Avg diff', maxDifference: 'Max diff', worst: 'Worst slider', records: 'Records', range: 'Range', mode: 'Data points', exportedAt: 'Exported', file: 'File' }),
        noFileSender: 'Wala pang Master Repeatability file ngayong araw sa Saving path. Patakbuhin ang Master Repeatability sa Master page.',
        noFileLead: 'Wala pang nabasang Master Repeatability file ng machine na ito sa Server path.',
        noRoot: 'Kailangan ng pahintulot sa Saving path. Pindutin ulit ang Preview at i-Allow.'
      })
    })
  });
})();
