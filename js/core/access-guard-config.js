/*
 * FILE     : js/core/access-guard-config.js
 * PURPOSE  : Constants ng access guard: estado ng bawat folder, oras ng pagsusuri, selector at text ng banner
 * DEPENDS  : js/core/config.js
 * USED BY  : js/core/access-guard.js
 * VERSION  : v22 | 2026-11-24 | bagong file (Batch B: Task 5 at 9)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.accessGuardConfig = Object.freeze({
    CHECK_INTERVAL_MS: 30000,
    // ok = may permission at nahanap; needPermission = naka-save ang folder pero kailangan ng permission; needPick = may naka-save na pangalan pero wala ang folder sa browser na ito;
    // missing = hindi mahanap/mabasa ang folder (drive o server); notSet = hindi pa naka-set.
    STATUS: { ok: 'ok', needPermission: 'needPermission', needPick: 'needPick', missing: 'missing', notSet: 'notSet' },
    SELECTOR: { content: '#content' },
    ID: { bar: 'access-guard' },
    SETTINGS_HREF: '#settings',
    SETTINGS_PAGE: 'settings',
    TEXT: {
      title: 'Kailangan ng ayos ang mga folder',
      allowAll: 'Payagan lahat',
      allowOne: 'Payagan',
      recheck: 'Suriin ulit',
      openSettings: 'Buksan ang Settings',
      working: 'Hinihingi ang permission...',
      statusLabel: {
        needPermission: 'Kailangan ng permission',
        needPick: 'Piliin ulit sa Settings (hindi pa napipili sa browser na ito)',
        missing: 'Hindi mahanap ang folder. Tingnan kung nakakabit ang drive o server.',
        notSet: 'Hindi pa naka-set'
      },
      helpPermission: 'Pindutin ang Payagan lahat at piliin ang Allow sa tanong ng browser. Kung may pagpipiliang "Allow on every visit", piliin ito para hindi na magtanong ulit sa susunod.',
      helpSettings: 'Para sa folder na hindi pa naka-set o kailangang piliin ulit: buksan ang Settings, pindutin ang Piliin sa folder na iyon, ilagay ang full path, at Save settings.',
      helpMissing: 'Kung hindi mahanap ang folder: tingnan kung bukas ang server o drive, tapos pindutin ang Suriin ulit.',
      requestFailed: 'Hindi napayagan ang ilan. Pindutin ang Payagan sa bawat folder, isa-isa.',
      restored: 'Naibalik ang settings mula sa BMWW folder.'
    }
  });
})();
