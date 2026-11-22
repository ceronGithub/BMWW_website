/*
 * FILE    : js/core/shift-settings-config.js
 * PURPOSE : Constants ng card na "Shift" sa Settings (selector, label ng bawat oras, text)
 * DEPENDS : js/core/config.js (window.BMWW)
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 0: global na shift sa Settings)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.shiftSettingsConfig = Object.freeze({
    SELECTOR: Object.freeze({ card: '#shift-settings-card' }),
    INPUT_ID_PREFIX: 'shift-time-',
    // Ayos at label ng apat na oras sa form.
    FIELD_LIST: Object.freeze([
      { key: 'dayStart', label: 'Day (Morning): simula' },
      { key: 'dayEnd', label: 'Day (Morning): wakas (Master lang)' },
      { key: 'nightStart', label: 'Night: simula' },
      { key: 'nightEnd', label: 'Night: wakas (Master lang)' }
    ]),
    TEXT: Object.freeze({
      title: 'Shift',
      note: 'Oras ng shift para sa lahat ng page (LOT Tracking, Master, Calibration, Trend at OUTDATED). Ang simula ay ginagamit ng lahat. Ang wakas ay para sa Master Repeatability lang: ang oras sa pagitan ng wakas at simula ng susunod na shift ay hindi isinasama doon. Gawing pareho sa Sender at LEAD PC.',
      resetButton: 'Ibalik sa default',
      format: 'Shift: ilagay ang oras (HH:MM) sa lahat ng field.',
      order: 'Shift: Day simula < Day wakas < Night simula, at Night wakas < Day simula.'
    })
  });
})();
