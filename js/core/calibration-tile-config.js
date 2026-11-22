/*
 * FILE    : js/core/calibration-tile-config.js
 * PURPOSE : Constants ng Calibration Correl at Calibration Repeatability sa tile ng Dashboard (folder, prefix, text, class) at ng opsyon ng Dashboard (naka-save sa localStorage)
 * DEPENDS : js/core/config.js
 * VERSION : v12 | 2026-11-22 | bagong file (Task 1: Calibration Correl at opsyonal na Repeatability sa Dashboard)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.calibrationTileConfig = Object.freeze({
    // Tipo ng block. SUBFOLDER at FILE_PREFIX ay kapareho ng export ng Calibration page (<Saving path>\<SUBFOLDER>\<petsa> at <Server path>\<SUBFOLDER>\<machine>\<petsa>).
    KIND: Object.freeze({
      correl: Object.freeze({ key: 'correl', SUBFOLDER: 'calibration-correl', FILE_PREFIX: 'calibration-correl', FILE_EXTENSION: '.xlsx' }),
      repeatability: Object.freeze({ key: 'repeatability', SUBFOLDER: 'calibration-repeatability', FILE_PREFIX: 'calibration-repeatability', FILE_EXTENSION: '.xlsx' })
    }),
    // Limitasyon ng basa ng Excel (kapareho ng repeatability-reader).
    SCORE_DIGITS: 2,
    R_SQUARED_DIGITS: 4,
    MIN_POINTS: 2,
    CHART: Object.freeze({ COLOR_CYCLE: 4 }),
    ISSUE: Object.freeze({ FOLDER_LIST_LIMIT: 5, SENDER_PREFIX: '@sender|' }),
    // Opsyon ng Dashboard (nasa localStorage). Opsyonal ang Repeatability, kaya naka-OFF bilang default.
    OPTION: Object.freeze({
      STORAGE_KEY: 'bmww.dashboardOptions',
      DEFAULT: Object.freeze({ masterRepeatability: false, calibrationRepeatability: false }),
      FIELD_LIST: Object.freeze(['masterRepeatability', 'calibrationRepeatability'])
    }),
    SELECTOR: Object.freeze({ options: '#dm-options' }),
    // Mga class ay galing sa Master Correl tile (css/pages/dashboard-machines.css). Ang dm-options ay nasa css/pages/dashboard-options.css.
    CLASS: Object.freeze({ box: 'dm-correl', row: 'dm-correl-row', label: 'dm-correl-label', empty: 'dm-correl-empty', badge: 'dm-correl-badge', icon: 'dm-correl-icon', meta: 'dm-correl-meta card-note', none: 'dm-correl-none', tag: 'dm-tag', previewButton: 'btn btn-secondary dm-preview-button' }),
    TEXT: Object.freeze({
      correl: Object.freeze({
        label: 'CALIBRATION CORREL', rSquared: 'R Square ', record: 'Record: ', updated: 'Updated: ', worst: 'Worst slider: ',
        panelTitle: 'Calibration Correl: ',
        previewAria: 'Buksan sa bagong tab ang pinakabagong Calibration Correl file ng ',
        noFileSender: 'Wala pang Calibration Correl file ngayong araw sa Saving path. Patakbuhin ang Calibration Correl sa Calibration page.',
        noFileLead: 'Wala pang nabasang Calibration Correl file ng machine na ito sa Server path.'
      }),
      repeatability: Object.freeze({
        label: 'CALIBRATION REPEATABILITY', score: 'Repeatability ', range: 'Range: ', updated: 'Updated: ', worst: 'Worst slider: ',
        panelTitle: 'Calibration Repeatability: ',
        lineTitle: 'Calibration Repeatability',
        previewAria: 'Buksan sa bagong tab ang pinakabagong Calibration Repeatability file ng ',
        noFileSender: 'Wala pang Calibration Repeatability file ngayong araw sa Saving path. Patakbuhin ang Calibration Repeatability sa Calibration page.',
        noFileLead: 'Wala pang nabasang Calibration Repeatability file ng machine na ito sa Server path.'
      }),
      none: 'Wala pang resulta',
      stale: 'LUMA',
      previewButton: 'Preview',
      noRoot: 'Kailangan ng pahintulot sa Saving path. Pindutin ulit ang Preview at i-Allow.',
      stats: Object.freeze({ rSquared: 'R Square', record: 'Record', actualAverage: 'Actual AVG', masterAverage: 'Master AVG', worst: 'Worst slider', score: 'Repeatability (%)', averageDifference: 'Avg diff', maxDifference: 'Max diff', records: 'Records', range: 'Range', mode: 'Data points', exportedAt: 'Exported', file: 'File' }),
      // Dahilan kung bakit walang nabasa. Ang may dulong Sender ay para sa Sender (Saving path).
      issue: Object.freeze({
        noBaseFolder: 'Walang folder na {folder} sa Server path.',
        noBaseFolderSender: 'Wala pang folder na {folder} sa Saving path.',
        noFolder: 'Walang folder ng machine sa {folder}. Mga folder na nakita: {detail}',
        noDayFolderSender: 'Wala pang folder ng petsa ngayon sa {folder} ng Saving path.',
        noFile: 'Walang Excel file sa folder ng {folder}.',
        unreadable: 'Hindi mabasa ang Excel na {detail}.',
        error: 'Pumalya ang pagbasa ng Excel ({detail}).',
        none: '(wala)'
      }),
      option: Object.freeze({
        legend: 'Ipakita sa tile (opsyonal)',
        masterRepeatability: 'Master Repeatability',
        calibrationRepeatability: 'Calibration Repeatability'
      })
    })
  });
})();
