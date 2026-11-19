/*
 * FILE    : js/pages/settings.js
 * PURPOSE : Settings: machine name (isang beses) at mga path (server, saving, data source)
 * DEPENDS : config.js, security.js, storage.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | naka-IIFE na; nagre-register sa registry (walang module)
 * VERSION : v2.2 | 2026-11-20 | maraming path (CONFIG.PATH_LIST), status badge, lock badge
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const storage = root.storage;
  const { sanitizeInput } = root.security;

  const SEL = CONFIG.SELECTOR.settings;
  const TEXT = CONFIG.TEXT;
  let settings = {};
  const handleMap = {};
  const rowMap = {};

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  // Nagpapakita ng status (error o success).
  function setStatus(message, isError) {
    const element = query('status');
    element.textContent = message;
    element.classList.toggle('is-error', isError);
    element.classList.toggle('is-success', !isError);
  }

  // Kinukuha ang napiling uri ng machine name.
  function getSelectedMode() {
    const checked = document.querySelector(SEL.modeRadio + ':checked');
    return checked ? checked.value : '';
  }

  // Ina-update ang machine name fields, lock state at lock badge.
  function renderMachine() {
    const locked = Boolean(settings.machineNameLocked);
    const mode = getSelectedMode();
    const input = query('nameInput');
    const lockBadge = query('lockBadge');
    document.querySelectorAll(SEL.modeRadio).forEach((radio) => { radio.disabled = locked; });
    if (mode === CONFIG.MACHINE_MODE.LEAD_PC) input.value = CONFIG.LEAD_PC_NAME;
    else if (locked) input.value = settings.machineName || '';
    input.disabled = locked || mode !== CONFIG.MACHINE_MODE.USER_INPUT;
    query('note').textContent = locked ? TEXT.machineLocked : TEXT.machineWarn;
    lockBadge.textContent = locked ? TEXT.badgeLocked : TEXT.badgeOpen;
    lockBadge.className = 'badge ' + (locked ? CONFIG.BADGE.ok : CONFIG.BADGE.empty);
  }

  // Kinukuha ang naka-save na pangalan ng folder (kasama ang lumang field).
  function getSavedName(key) {
    const names = settings.folderNames || {};
    if (names[key]) return names[key];
    const legacyField = CONFIG.LEGACY_NAME_FIELD[key];
    return legacyField ? settings[legacyField] || '' : '';
  }

  // Ibinibigay ang pangalan, text at kulay ng badge ng isang path.
  function getPathState(key) {
    if (handleMap[key]) return { name: handleMap[key].name, text: TEXT.badgeSet, variant: CONFIG.BADGE.ok };
    const savedName = getSavedName(key);
    if (savedName) return { name: savedName, text: TEXT.badgeReselect, variant: CONFIG.BADGE.info };
    return { name: TEXT.notSet, text: TEXT.badgeEmpty, variant: CONFIG.BADGE.empty };
  }

  // Ginagawa ang row ng bawat path mula sa CONFIG.PATH_LIST (textContent lang, walang innerHTML).
  function buildPathRows() {
    const fragment = document.createDocumentFragment();
    CONFIG.PATH_LIST.forEach((pathItem) => {
      const item = document.createElement('li');
      item.className = 'path-row';
      const info = document.createElement('div');
      info.className = 'path-info';
      const head = document.createElement('div');
      head.className = 'path-head';
      const label = document.createElement('p');
      label.className = 'path-label';
      label.textContent = pathItem.label;
      const badge = document.createElement('span');
      head.append(label, badge);
      const note = document.createElement('p');
      note.className = 'card-note';
      note.textContent = pathItem.note;
      const name = document.createElement('p');
      name.className = 'path-name';
      info.append(head, note, name);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.setAttribute('aria-label', TEXT.pickButton + ': ' + pathItem.label);
      button.addEventListener('click', () => onPickFolder(pathItem.key));
      item.append(info, button);
      fragment.append(item);
      rowMap[pathItem.key] = { nameElement: name, badgeElement: badge, buttonElement: button };
    });
    query('pathList').replaceChildren(fragment);
  }

  // Ina-update ang pangalan, badge at button ng bawat path.
  function renderPaths() {
    CONFIG.PATH_LIST.forEach((pathItem) => {
      const state = getPathState(pathItem.key);
      const row = rowMap[pathItem.key];
      row.nameElement.textContent = state.name;
      row.badgeElement.textContent = state.text;
      row.badgeElement.className = 'badge ' + state.variant;
      row.buttonElement.textContent = state.variant === CONFIG.BADGE.empty ? TEXT.pickButton : TEXT.changeButton;
    });
  }

  // Binabasa ang naunang settings (file ang pangunahin, localStorage ang backup).
  async function loadState() {
    settings = storage.readLocalSettings();
    if (!storage.isFolderAccessSupported()) return;
    try {
      for (const pathItem of CONFIG.PATH_LIST) {
        handleMap[pathItem.key] = await storage.loadHandle(CONFIG.HANDLE_KEY[pathItem.key]);
      }
      const rootHandle = handleMap[CONFIG.ROOT_KEY];
      if (rootHandle && (await storage.hasPermission(rootHandle, false))) {
        const fromFile = await storage.readSettingsFile(rootHandle);
        if (fromFile) {
          settings = fromFile;
          storage.writeLocalSettings(settings);
        }
      }
    } catch (error) {
      setStatus(TEXT.loadError, true);
    }
  }

  // Pumipili ng folder para sa path na may ganitong key; ang saving path ay dapat BMWW.
  async function onPickFolder(key) {
    try {
      const handle = await storage.pickFolder();
      if (key === CONFIG.ROOT_KEY && handle.name.toLowerCase() !== CONFIG.ROOT_FOLDER_NAME.toLowerCase()) {
        setStatus(TEXT.wrongRoot, true);
        return;
      }
      handleMap[key] = handle;
      await storage.saveHandle(CONFIG.HANDLE_KEY[key], handle);
      renderPaths();
      setStatus(TEXT.folderPicked, false);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      setStatus(TEXT.folderError, true);
    }
  }

  // Sine-save ang settings sa BMWW\settings\settings.json.
  async function onSave() {
    const rootHandle = handleMap[CONFIG.ROOT_KEY];
    if (!rootHandle) { setStatus(TEXT.rootMissing, true); return; }
    try {
      if (!(await storage.hasPermission(rootHandle, true))) { setStatus(TEXT.noPermission, true); return; }
      const next = { ...settings };
      if (!settings.machineNameLocked) {
        const mode = getSelectedMode();
        const name = mode === CONFIG.MACHINE_MODE.LEAD_PC ? CONFIG.LEAD_PC_NAME : sanitizeInput(query('nameInput').value, CONFIG.MACHINE_NAME_MAX);
        if (!mode || !name) { setStatus(TEXT.machineMissing, true); return; }
        if (!window.confirm(TEXT.confirmLock)) return;
        next.machineMode = mode;
        next.machineName = name;
        next.machineNameLocked = true;
      }
      const folderNames = {};
      CONFIG.PATH_LIST.forEach((pathItem) => {
        const name = handleMap[pathItem.key] ? handleMap[pathItem.key].name : getSavedName(pathItem.key);
        folderNames[pathItem.key] = name;
        const legacyField = CONFIG.LEGACY_NAME_FIELD[pathItem.key];
        if (legacyField) next[legacyField] = name;
      });
      next.folderNames = folderNames;
      next.savedAt = new Date().toISOString();
      await storage.writeSettingsFile(rootHandle, next);
      settings = next;
      storage.writeLocalSettings(settings);
      renderMachine();
      renderPaths();
      setStatus(TEXT.saved + CONFIG.SETTINGS_PATH_LABEL, false);
    } catch (error) {
      setStatus(TEXT.saveError, true);
    }
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    await loadState();
    buildPathRows();
    document.querySelectorAll(SEL.modeRadio).forEach((radio) => {
      radio.checked = radio.value === settings.machineMode;
      radio.addEventListener('change', renderMachine);
    });
    query('saveButton').addEventListener('click', onSave);
    renderMachine();
    renderPaths();
    if (!storage.isFolderAccessSupported()) {
      Object.values(rowMap).forEach((row) => { row.buttonElement.disabled = true; });
      setStatus(TEXT.unsupported, true);
    }
  }

  root.registry.registerPage('settings', Object.freeze({ init }));
})();
