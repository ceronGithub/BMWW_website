/*
 * FILE    : js/core/lot-config.js
 * PURPOSE : Lahat ng constant ng LOT Tracking Yugto 1 (LOT Unit, RESULT column, imbakan ng aktibong lote)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.lotConfig = Object.freeze({
    UNIT: Object.freeze({
      // Ang X_Time.csv o X_Time (folder) ay kasama ng unit na X; hindi ito ang pangunahing file.
      TIME_PATTERN: /_time(\.[^.\\/]*)?$/i,
      // true: ang file/folder na hindi tumama sa pangalan ng LOT Unit ay nakikita pa rin sa RESULT (walang LOT Unit).
      SHOW_UNMATCHED: true
    }),
    RESULT: Object.freeze({
      // Posisyon ng Path column (0-based) sa table ng RESULT.
      PATH_COLUMN: 5
    }),
    ACTIVE_STORE: Object.freeze({
      KEY: 'bmww.activeLote',
      VERSION: 1,
      MAX_FIRST_SEEN: 500
    })
  });
})();
