/*
 * FILE    : js/pages/dashboard.js
 * PURPOSE : Ipinapakita ang naka-save na settings
 * DEPENDS : config.js, storage.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | naka-IIFE na; nagre-register sa registry (walang module)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const { readLocalSettings } = root.storage;

  // Nilalagay ang text sa elementong may key sa selector.
  function setText(key, value) {
    const element = document.querySelector(CONFIG.SELECTOR.dashboard[key]);
    if (element) element.textContent = value;
  }

  // Init ng page, tinatawag ng router.
  function init() {
    const settings = readLocalSettings();
    const text = CONFIG.TEXT;
    setText('machine', settings.machineName || text.notSet);
    setText('mode', settings.machineMode === CONFIG.MACHINE_MODE.LEAD_PC ? text.modeLead : settings.machineMode ? text.modeUser : '');
    setText('root', settings.rootFolderName || text.notSet);
    setText('source', settings.sourceFolderName || text.notSet);
    setText('saved', settings.savedAt ? new Date(settings.savedAt).toLocaleString() : text.notSet);
  }

  root.registry.registerPage('dashboard', Object.freeze({ init }));
})();
