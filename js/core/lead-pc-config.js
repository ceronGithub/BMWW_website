/*
 * FILE     : js/core/lead-pc-config.js
 * PURPOSE  : Constants ng maraming LEAD PC (pangalan na may numero, field ng id, bilang ng subok, text)
 * DEPENDS  : js/core/config.js
 * USED BY  : js/core/lead-pc.js, js/pages/settings.js
 * VERSION  : v24 | 2026-11-24 | bagong file (Batch D: Task 8)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.leadPcConfig = Object.freeze({
    // Batayang pangalan; ang bawat LEAD PC ay "LEAD PC <numero>" (hal. LEAD PC 1, LEAD PC 2).
    BASE_NAME: 'LEAD PC',
    NUMBERED_PATTERN: /^LEAD PC \d+$/i,
    LABEL_PATTERN: /^LEAD PC\b/i,
    // Field sa settings file na nagpapakilala sa PC na ito (iisa kada LEAD PC, hindi nagbabago).
    FIELD: { id: 'leadPcId' },
    ID_PREFIX: 'lead-',
    MAX_NUMBER: 50,
    MAX_TRIES: 5,
    STATE: { claimed: 'claimed', unchecked: 'unchecked', full: 'full' },
    TEXT: {
      pending: 'LEAD PC (bibigyan ng numero pagka-Save)',
      assigned: ' | Pangalan ng LEAD PC: {name}',
      unchecked: ' | Hindi nasuri ang Server path, kaya pansamantala ang pangalang {name}. I-Save ulit kapag may Server path na.',
      full: 'Puno na ang listahan ng LEAD PC sa Server path. Burahin ang hindi na ginagamit sa settings\\machines\\monitoring.'
    }
  });
})();
