/*
 * FILE    : js/core/shift-freshness-config.js
 * PURPOSE : Constants ng shift freshness (oras ng shift, interval ng pagbabantay, class at text ng OUTDATED indicator)
 * DEPENDS : js/core/config.js (window.BMWW)
 * VERSION : v11 | 2026-11-22 | bagong file (Task 1: OUTDATED indicator kapag galing sa nakaraang shift)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.shiftFreshnessConfig = Object.freeze({
    // Simula ng shift sa minuto ng araw (07:30 = 450, 19:30 = 1170). Ang Day ay 7:30 AM hanggang bago mag-7:30 PM; ang Night ay 7:30 PM hanggang bago mag-7:30 AM.
    SHIFT: {
      day: { name: 'Day', startMinute: 450 },
      night: { name: 'Night', startMinute: 1170 }
    },
    // Gaano kadalas tinitingnan kung nagpalit na ng shift (ms).
    WATCH_MS: 10000,
    CLASS: { block: 'sf-block-outdated', badge: 'sf-badge' },
    TEXT: {
      badge: 'OUTDATED',
      note: 'Galing sa nakaraang shift ({shift}, {date}). Kailangang i-update.',
      aria: 'Outdated: data mula sa nakaraang shift'
    }
  });
})();
