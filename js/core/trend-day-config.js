/*
 * FILE    : js/core/trend-day-config.js
 * PURPOSE : Constants ng clickable na petsa at data point ng Trend (data attribute, class, key, text) at ng paghahanap ng petsa sa Data source 1
 * DEPENDS : js/core/trend-config.js
 * VERSION : v9.6 | 2026-11-22 | bagong file (Task 2: click sa point o petsa ng chart, palitan ang petsa, hanapin sa Data source 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.trendDayConfig = Object.freeze({
    // Ang petsa (yyyy-mm-dd) ay nasa data attribute na data-day ng point at ng label ng chart.
    ATTRIBUTE: 'data-day',
    DATASET_KEY: 'day',
    SELECTOR: { clickable: '[data-day]' },
    CLASS: { clickable: 'is-clickable', selected: 'is-selected', hit: 'trend-point-hit' },
    // Mga key na katumbas ng click (keyboard).
    ACTIVATE_KEYS: ['Enter', ' '],
    HIT_RADIUS: 12,
    SCROLL: { block: 'start', cardSelector: '.card' },
    TEXT: {
      searching: 'Hinahanap ang petsa sa Data source 1...',
      progress: 'Binabasa: ',
      found: 'Hinanap sa Data source 1: {files} master file, {records} record sa petsang ito.',
      pointAria: 'Buksan ang mga record ng petsa ',
      labelAria: 'Buksan ang mga record ng petsa ',
      error: {
        noSource: 'Piliin muna ang Data source 1 sa Settings.',
        noPermission: 'Hindi pinayagan ang access sa Data source. Pindutin ulit ang petsa o point at i-click ang Allow. Ipinapakita ang mga record mula sa huling Run Trend.',
        readFail: 'May problema sa paghahanap sa Data source 1. Ipinapakita ang mga record mula sa huling Run Trend.'
      }
    }
  });
})();
