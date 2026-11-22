/*
 * FILE    : js/core/master-shift-config.js
 * PURPOSE : Constants ng mode ng Master Repeatability (All data points o Latest per shift): oras ng shift, selector, text
 * DEPENDS : js/core/config.js, js/core/shift-times.js (oras ng shift mula sa Settings)
 * VERSION : v2.12 | 2026-11-21 | bagong file
 * VERSION : v15 | 2026-11-22 | Yugto 0: ang oras ng shift ay galing na sa Settings (root.shiftTimes) sa pamamagitan ng getter; walang pagbabago sa default; generic na ang text ng noRecordInShift
 */
(function () {
  'use strict';
  const root = window.BMWW;
  // Panlaban lang kung hindi na-load ang shift-times.js: ang dating nakasulat na oras sa minuto ng araw (07:30 = 450).
  const FALLBACK_MINUTES = Object.freeze({ dayStart: 450, dayEnd: 1110, nightStart: 1170, nightEnd: 390 });

  // Oras ng shift sa minuto ng araw mula sa Settings (global na shift); binabasa tuwing ginagamit.
  function getMinutes() {
    return root.shiftTimes ? root.shiftTimes.getMinutes() : FALLBACK_MINUTES;
  }

  root.shiftConfig = Object.freeze({
    MODE: { all: 'all', shift: 'shift' },
    DEFAULT_MODE: 'all',
    // Oras ng shift sa minuto ng araw, galing sa Settings (default: Morning 07:30 hanggang 18:30, Night 19:30 hanggang 06:30). Ang night shift ay tumatawid ng hatinggabi.
    // Ang record na mula 00:00 hanggang sa wakas ng Night ay kabilang sa night shift ng nakaraang petsa. Ang labas sa dalawang shift ay hindi isinasama.
    SHIFT: {
      morning: { name: 'Morning', get startMinute() { return getMinutes().dayStart; }, get endMinute() { return getMinutes().dayEnd; } },
      night: { name: 'Night', get startMinute() { return getMinutes().nightStart; }, get endMinute() { return getMinutes().nightEnd; } }
    },
    FILE_SUFFIX: { all: 'all', shift: 'shift' },
    SELECTOR: { checkedMode: 'input[name="range-mode"]:checked' },
    TEXT: {
      modeLabel: 'Data points',
      modeName: { all: 'All data points (flat)', shift: 'Latest per shift' },
      shiftColumn: 'Shift',
      error: {
        noRecordInShift: 'Walang record sa Morning o Night shift sa napiling petsa (tingnan ang oras ng shift sa Settings).'
      }
    }
  });
})();
