/*
 * FILE    : js/core/correl-sync-config.js
 * PURPOSE : Constants ng status ng Master Correl (PASS / WARNING / FAIL) na ipinapadala sa LEAD PC: subfolder, limit, text, class
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v7.3 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.correlSyncConfig = Object.freeze({
    // File sa Server path: <Server path>\correl\<machine name>.json (isang file kada machine).
    SUBFOLDER: 'correl',
    FILE_VERSION: 1,
    TEXT_MAX: 60,
    FILE_MAX_BYTES: 65536,
    MAX_FILES: 200,
    // Luma na ang status kapag lampas dito ang edad ng file (ms).
    STALE_MS: 86400000,
    R_SQUARED_DIGITS: 4,
    // Class ng badge sa Dashboard (PASS / WARNING / FAIL).
    STATUS_CLASS: { PASS: 'dm-correl-pass', WARNING: 'dm-correl-warning', FAIL: 'dm-correl-fail' },
    // Kulay ng mensahe sa Master page ayon sa resulta ng pagpapadala.
    MESSAGE_KIND: { ok: 'success', skippedLead: 'info', noName: 'error', noFolder: 'error', noPermission: 'error', unsupported: 'error', error: 'error' },
    TEXT: {
      ok: 'LEAD PC: na-update ang Master Correl ({status}, R Square {rSquared}).',
      skippedLead: 'LEAD PC: hindi isinulat sa Server (ito mismo ang LEAD PC).',
      noName: 'LEAD PC: hindi na-update, walang machine name sa Settings.',
      noFolder: 'LEAD PC: hindi na-update, wala pang Server path sa Settings.',
      noPermission: 'LEAD PC: hindi na-update, kailangan ng pahintulot sa Server folder. Mag-Master Correl ulit para subukan.',
      unsupported: 'LEAD PC: hindi na-update, hindi suportado ng browser ang folder access (gamitin ang Chrome o Edge).',
      error: 'LEAD PC: hindi na-update. Mag-Master Correl ulit para subukan.'
    }
  });
})();
