/*
 * FILE    : js/core/repeatability-tile-config.js
 * PURPOSE : Constants ng tile at Preview ng Master Repeatability sa Dashboard (text, class, limit ng basa)
 * DEPENDS : js/core/config.js
 * VERSION : v8.12 | 2026-11-21 | bagong file
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
