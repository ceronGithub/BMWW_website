/*
 * FILE    : js/core/lot-config.js
 * PURPOSE : Lahat ng constant ng LOT Tracking (source, LOT Unit, RESULT column, imbakan ng aktibong lote, validation, beep)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 * VERSION : v2 | 2026-11-22 | Yugto 1: SOURCE (Data source 2 at 3), SHOW_UNMATCHED = false, VALIDATION (Operator), BEEP
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.lotConfig = Object.freeze({
    SOURCE: Object.freeze({
      // Mga folder na binabantayan ng LOT Tracking: File Path 1 = Data source 2, File Path 2 = Data source 3 (kapareho ng Search Files).
      KEYS: Object.freeze(['source2', 'source3'])
    }),
    UNIT: Object.freeze({
      // Ang X_Time.csv o X_Time (folder) ay kasama ng unit na X; hindi ito ang pangunahing file.
      TIME_PATTERN: /_time(\.[^.\\/]*)?$/i,
      // false: nilalaktawan ang file/folder na hindi tumama sa pangalan ng LOT Unit (hindi lalabas sa RESULT). true: lalabas ito na walang LOT Unit.
      SHOW_UNMATCHED: false
    }),
    RESULT: Object.freeze({
      // Posisyon ng Path column (0-based) sa table ng RESULT.
      PATH_COLUMN: 5
    }),
    ACTIVE_STORE: Object.freeze({
      KEY: 'bmww.activeLote',
      VERSION: 1,
      MAX_FIRST_SEEN: 500
    }),
    VALIDATION: Object.freeze({
      // Operator: titik (kasama ang may tuldik), numero, espasyo, ., - at _ lang. Ang haba (2 hanggang 30) ay nasa CONFIG.LOT.
      OPERATOR_PATTERN: /^[\p{L}\p{N} ._-]+$/u
    }),
    BEEP: Object.freeze({
      // Beep kapag natapos ang lote (END MEASUREMENT). Gawing false para patayin.
      ENABLED: true,
      WAVE: 'sine',
      FREQUENCY_HZ: 880,
      DURATION_MS: 200,
      VOLUME: 0.2
    })
  });
})();
