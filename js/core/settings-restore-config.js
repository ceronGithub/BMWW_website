/*
 * FILE    : js/core/settings-restore-config.js
 * PURPOSE : Lahat ng constants, selector at text ng pagbabalik ng settings mula sa BMWW\settings (hiwalay sa config.js)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v10 | 2026-11-22 | bagong file: selector at text ng restore banner at checker ng settings folder
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.settingsRestoreConfig = Object.freeze({
    // Estado ng settings folder sa <BMWW>\settings.
    STATE: { missing: 'missing', empty: 'empty', hasFiles: 'hasFiles' },
    // Resulta ng restoreFromFolder.
    RESULT: { restored: 'restored', missing: 'missing', empty: 'empty', unreadable: 'unreadable' },
    // Mga file sa settings folder na hindi settings ng machine.
    IGNORED_FILES: ['events.json'],
    FILE_EXTENSION: '.json',
    SELECTOR: {
      banner: '#settings-restore',
      bannerText: '#settings-restore-text',
      bannerButton: '#settings-restore-button'
    },
    TEXT: {
      bannerNeedAccess: 'Kailangan ulit payagan ang access sa BMWW folder (nagsara ang browser o ibang browser ito). Pindutin ang Ibalik ang settings para mabasa ang naka-save na settings.',
      restoredNoPicks: 'Naibalik ang settings ng {machine}. Piliin ulit ang Server path at Data source (kailangan ng bawat browser), tapos Save settings.',
      restoredAllSet: 'Naibalik ang settings ng {machine}.',
      missingFolder: 'Walang settings folder sa BMWW na ito. Mag-setup at pindutin ang Save settings.',
      emptyFolder: 'May settings folder pero wala pang settings ng machine. Mag-setup at pindutin ang Save settings.',
      unreadable: 'Hindi mabasa ang settings file sa BMWW\\settings. Mag-setup at pindutin ang Save settings.',
      keptChanges: 'Naibalik ang access sa BMWW folder. Hindi pinalitan ang mga binago mo; pindutin ang Save settings.',
      noPermission: 'Hindi pinayagan ang access sa BMWW folder. Subukan ulit at pindutin ang Allow.',
      error: 'Hindi naibalik ang settings. Subukan ulit.',
      fallbackMachine: 'machine'
    }
  });
})();
