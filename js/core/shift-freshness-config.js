/*
 * FILE    : js/core/shift-freshness-config.js
 * PURPOSE : Constants ng shift freshness (oras ng shift, interval ng pagbabantay, class at text ng OUTDATED indicator)
 * DEPENDS : js/core/config.js (window.BMWW), js/core/shift-times.js (oras ng shift mula sa Settings)
 * VERSION : v11 | 2026-11-22 | bagong file (Task 1: OUTDATED indicator kapag galing sa nakaraang shift)
 * VERSION : v15 | 2026-11-22 | Yugto 0: ang simula ng Day at Night ay galing na sa Settings (root.shiftTimes) sa pamamagitan ng getter; walang pagbabago sa default
 */
(function () {
  'use strict';
  const root = window.BMWW;
  // Panlaban lang kung hindi na-load ang shift-times.js: ang dating nakasulat na simula ng shift sa minuto ng araw.
  const FALLBACK_MINUTES = Object.freeze({ dayStart: 450, nightStart: 1170 });

  // Simula ng Day at Night sa minuto ng araw mula sa Settings (global na shift); binabasa tuwing ginagamit.
  function getMinutes() {
    return root.shiftTimes ? root.shiftTimes.getMinutes() : FALLBACK_MINUTES;
  }

  root.shiftFreshnessConfig = Object.freeze({
    // Simula ng shift sa minuto ng araw, galing sa Settings (default 07:30 = 450, 19:30 = 1170). Ang Day ay mula sa simula nito hanggang bago ang simula ng Night; ang Night ay mula sa simula nito hanggang bago ang simula ng Day.
    SHIFT: {
      day: { name: 'Day', get startMinute() { return getMinutes().dayStart; } },
      night: { name: 'Night', get startMinute() { return getMinutes().nightStart; } }
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
