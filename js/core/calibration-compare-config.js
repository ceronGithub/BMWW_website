/*
 * FILE    : js/core/calibration-compare-config.js
 * PURPOSE : Constants ng Compare sliders ng Calibration (Calibration correl ngayon laban sa nakaraang calibration record): subfolder ng export, selector, text
 * DEPENDS : js/core/master-compare-config.js (lookback, threshold, trend, label), calibration-config.js, master-export-config.js
 * VERSION : v9.1 | 2026-11-22 | bagong file (kopya ng master-compare-config.js, para sa Calibration; walang LEAD PC sync)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.calibrationCompareConfig = Object.freeze({
    // false = hindi kusang tumatakbo ang compare pagkatapos ng Calibration Correl; pinipindot ang Compare vs previous.
    AUTO_RUN: false,
    // Kusang export ng Excel pagkatapos ng Compare vs previous. Saving path: bagong file kada click; Server path: iisang file na ino-overwrite.
    AUTO_EXPORT: true,
    SUBFOLDER: 'calibration-compare',
    FILE_PREFIX: 'calibration-compare',
    FILE_EXTENSION: '.xlsx',
    SERVER: { SUBFOLDER: 'calibration-compare', FILE_NAME: 'calibration-compare_latest.xlsx' },
    SELECTOR: { runButton: '#calibration-compare-run', status: '#calibration-compare-status', result: '#calibration-compare-result' },
    SHEET: { compare: 'Compare', chart: 'Chart' },
    LABEL: { title: 'CALIBRATION CORREL COMPARE' },
    TEXT: {
      chartTitle: 'Calibration Diff vs Master: Previous at Today',
      exporting: 'Sine-save ang Excel file ng Calibration Compare...',
      error: {
        noCurrent: 'Patakbuhin muna ang Calibration Correl bago mag-compare.',
        noPreviousRecord: 'Walang naunang calibration record sa nakaraang {n} araw bago ang napiling Date.',
        exportFail: 'Hindi na-save ang Excel file ng Calibration Compare. Subukan ulit.'
      }
    }
  });
})();
