/*
 * FILE    : js/core/repeatability-sync-config.js
 * PURPOSE : Constants ng kusang export ng Master Repeatability at kopya nito sa <Server path>\master-repeatability\<machine name>\<petsa ngayon>\
 * DEPENDS : js/core/config.js
 * VERSION : v8.11 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.repeatabilitySyncConfig = Object.freeze({
    // Kusang export pagkatapos ng Master Repeatability. ENABLED = false para patayin (manual na Export to Excel na lang).
    AUTO: Object.freeze({ ENABLED: true }),
    // Kopya sa Server path: <Server path>\<SUBFOLDER>\<machine name>\<petsa ngayon>\<FILE_NAME>. Iisang file na ino-overwrite.
    SERVER: Object.freeze({ SUBFOLDER: 'master-repeatability', FILE_NAME: 'master-repeatability_latest.xlsx' }),
    TEXT: Object.freeze({
      serverSaved: '. Kopya sa Server: ',
      serverFailed: '. Hindi nakopya sa Server path: ',
      serverState: Object.freeze({
        noFolder: 'wala pang Server path sa Settings.',
        noPermission: 'kailangan ng pahintulot sa Server folder.',
        unsupported: 'hindi suportado ng browser ang folder access (gamitin ang Chrome o Edge).',
        error: 'hindi ma-save sa Server folder. Subukan ulit.'
      })
    })
  });
})();
