/*
 * FILE    : js/core/master-shift-config.js
 * PURPOSE : Constants ng mode ng Master Repeatability (All data points o Latest per shift): oras ng shift, selector, text
 * DEPENDS : js/core/config.js
 * VERSION : v2.12 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.shiftConfig = Object.freeze({
    MODE: { all: 'all', shift: 'shift' },
    DEFAULT_MODE: 'all',
    // Oras ng shift sa minuto ng araw (07:30 = 450). Ang night shift ay tumatawid ng hatinggabi.
    // Ang record na 00:00 hanggang 06:30 ay kabilang sa night shift ng nakaraang petsa. Ang labas sa dalawang shift ay hindi isinasama.
    SHIFT: {
      morning: { name: 'Morning', startMinute: 450, endMinute: 1110 },
      night: { name: 'Night', startMinute: 1170, endMinute: 390 }
    },
    FILE_SUFFIX: { all: 'all', shift: 'shift' },
    SELECTOR: { checkedMode: 'input[name="range-mode"]:checked' },
    TEXT: {
      modeLabel: 'Data points',
      modeName: { all: 'All data points (flat)', shift: 'Latest per shift' },
      shiftColumn: 'Shift',
      error: {
        noRecordInShift: 'Walang record sa Morning (7:30 AM - 6:30 PM) o Night (7:30 PM - 6:30 AM) shift sa napiling petsa.'
      }
    }
  });
})();
