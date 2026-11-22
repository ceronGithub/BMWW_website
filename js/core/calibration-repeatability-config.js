/*
 * FILE    : js/core/calibration-repeatability-config.js
 * PURPOSE : Constants ng Calibration Repeatability (kopya ng Master Repeatability para sa calibration CSV: After laban sa Master): subfolder ng export, selector, text
 * DEPENDS : js/core/config.js, calibration-config.js, master-export-config.js
 * VERSION : v11.4 | 2026-11-22 | RANGE.MIN_BARCODE_OVERLAP (pinakamababang bahagi ng reference na barcode na dapat tugma sa file para ituring na calibration file ng parehong set)
 * VERSION : v9.2 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.calibrationRepeatabilityConfig = Object.freeze({
    // Excel export: <Saving path>\calibration-repeatability\<petsa ng export>\ (bagong file kada export) at kopya sa <Server path>\calibration-repeatability\<machine name>\<petsa ngayon>\ (iisang file, ino-overwrite).
    SUBFOLDER: 'calibration-repeatability',
    FILE_PREFIX: 'calibration-repeatability',
    FILE_EXTENSION: '.xlsx',
    SERVER: { SUBFOLDER: 'calibration-repeatability', FILE_NAME: 'calibration-repeatability_latest.xlsx' },
    AUTO: { ENABLED: true },
    // Reference na barcode = ang pinakamahabang listahan ng barcode sa mga file ng saklaw. Ang file na ang tugmang barcode ay mas mababa sa MIN_BARCODE_OVERLAP (0 hanggang 1) ng reference ay nilalaktawan (hal. 15 slider na 5AHG447 laban sa 30 slider na 5AHG459).
    RANGE: { MIN_BARCODE_OVERLAP: 0.5 },
    SELECTOR: {
      start: '#calibration-range-start', end: '#calibration-range-end', runButton: '#calibration-range-run',
      status: '#calibration-range-status', result: '#calibration-range-result',
      checkedMode: 'input[name="calibration-range-mode"]:checked', modeRadio: 'input[name="calibration-range-mode"]'
    },
    LABEL: { title: 'CALIBRATION REPEATABILITY' },
    TEXT: {
      lineTitle: 'Calibration Repeatability',
      calibrationFiles: 'Calibration files',
      exporting: 'Sine-save ang Excel file ng Calibration Repeatability...',
      chartAria: 'Chart ng Calibration Repeatability. I-scroll pakaliwa, pakanan, pataas o pababa.',
      error: {
        noResult: 'Patakbuhin muna ang Calibration Repeatability bago mag-export.'
      }
    }
  });
})();
