/*
 * FILE    : js/core/hold-tile-config.js
 * PURPOSE : Constants ng ON HOLD block sa tile ng Dashboard (Sender at LEAD PC)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v1 | 2026-11-24 | bagong file (Task 1B)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.holdTileConfig = Object.freeze({
    // Pinakamaraming unit na ipinapakita sa isang tile (ang sobra ay "at n pa").
    MAX_SHOWN: 6,
    CLASS: Object.freeze({ box: 'dm-hold', hold: 'is-hold', clear: 'is-clear', row: 'dm-hold-row', badge: 'dm-hold-badge', list: 'dm-hold-list', item: 'dm-hold-item', unit: 'dm-hold-unit', meta: 'dm-hold-meta' }),
    TEXT: Object.freeze({
      label: 'ON HOLD',
      none: 'Walang On hold',
      more: 'at {n} pa',
      barcode: 'Barcode ',
      chip: 'On hold',
      reason: Object.freeze({ 'FILE DELETED': 'Nabura ang file', 'NO AVERAGE': 'Walang Average' }),
      manual: 'Manual'
    })
  });
})();
