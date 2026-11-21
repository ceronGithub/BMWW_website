/*
 * FILE    : js/pages/settings.js
 * PURPOSE : Settings: machine name (puwedeng palitan) at mga path na may full path (server, saving, data source)
 * DEPENDS : config.js, security.js, storage.js, watcher-install.js (optional)
 * VERSION : v9.3 | 2026-11-22 | hook sa trendSettings (card na Trend limits): init, at tsek at save ng limits sa onSave
 * VERSION : v2.20 | 2026-11-21 | awtomatikong lagay ng full path kapag pumili ng folder (getParentPath, guessFullPath); lumalabas agad sa ilalim ng pangalan ng path
 * VERSION : v2.18 | 2026-11-21 | kailangan na ang full path ng bawat napiling folder; paalala na may hindi pa na-save (isDirty) kapag may binago
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | naka-IIFE na; nagre-register sa registry (walang module)
 * VERSION : v2.2 | 2026-11-20 | maraming path (CONFIG.PATH_LIST), status badge, lock badge
 * VERSION : v2.4 | 2026-11-20 | walang lock ang machine name; full path ng bawat folder (type/paste, may validation)
 * VERSION : v2.3 | 2026-11-20 | ibang path ay sarado hanggang may Saving path; Required marker; highlight kapag kulang
 * VERSION : v5 | 2026-11-20 | Save: settings kada machine (<machine>.json) sa Saving path at Server path; basa ng settings ayon sa machine file
 * VERSION : v3.2 | 2026-11-21 | tawag sa watcher-install (init at setUnlocked) para sa card ng Install File Watcher
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
  const INPUT = CONFIG.ROW_INPUT_CLASS;
  let isDirty = false;

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  // Minamarkahan kung may pagbabago na hindi pa na-save; ipinapakita o itinatago ang paalala.
  function setDirty(nextDirty) {
    isDirty = nextDirty;
    query('unsavedNote').hidden = !nextDirty;
    if (nextDirty && !query('status').classList.contains('is-error')) setStatus('', false);
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

  // Ina-update ang machine name field ayon sa napiling uri (walang lock; puwedeng palitan anumang oras).
  function renderMachine() {
    const mode = getSelectedMode();
    const input = query('nameInput');
    if (mode === CONFIG.MACHINE_MODE.LEAD_PC) input.value = CONFIG.LEAD_PC_NAME;
    else if (input.value === CONFIG.LEAD_PC_NAME) input.value = '';
    input.disabled = mode !== CONFIG.MACHINE_MODE.USER_INPUT;
    query('note').textContent = TEXT.machineNote;
  }

  // Sarado ba ang path? Ang mga gated na path ay bukas lang kapag may Saving path na.
  function isPathLocked(pathItem) {
    return Boolean(pathItem.gated) && !handleMap[CONFIG.ROOT_KEY];
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

  // Kinukuha ang naka-save na full path ng folder.
  function getSavedFullPath(key) {
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    return paths[key] || '';
  }

  // Kinukuha ang full path na nasa input (nililinis).
  function getInputFullPath(key) {
    return sanitizeInput(rowMap[key].inputElement.value, CONFIG.FULL_PATH_MAX);
  }

  // Huling bahagi ng path (pangalan ng folder), walang sobrang separator sa dulo.
  function getLastSegment(fullPath) {
    const parts = fullPath.split(CONFIG.PATH_SEPARATOR).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  // Parent ng isang full path (walang huling folder). Drive root ay may \\ sa dulo (hal. C:\\). Blangko kung wala.
  function getParentPath(fullPath) {
    const trimmed = fullPath.replace(/[\\/]+$/, '');
    if (/^[A-Za-z]:$/.test(trimmed)) return trimmed + CONFIG.PATH_SEPARATOR;
    const cut = trimmed.lastIndexOf(CONFIG.PATH_SEPARATOR);
    if (cut < 0) return '';
    const parent = trimmed.slice(0, cut);
    return /^[A-Za-z]:$/.test(parent) ? parent + CONFIG.PATH_SEPARATOR : parent;
  }

  // Idinurugtong ang pangalan ng folder sa parent.
  function joinPath(parent, folderName) {
    return parent.replace(/[\\/]+$/, '') + CONFIG.PATH_SEPARATOR + folderName;
  }

  // Hinuhulaan ang full path ng napiling folder: <parent> + <pangalan>. Ibinibigay '' kung tama na ang nasa field o walang mahulaan.
  // Parent (ayon sa pagkakasunod): parent ng nasa field na; parent ng ibang path sa parehong group; PARENT_BY_KEY sa config.
  function guessFullPath(key, folderName) {
    const auto = CONFIG.AUTO_PATH;
    const current = getInputFullPath(key);
    if (current && getLastSegment(current).toLowerCase() === folderName.toLowerCase()) return '';
    let parent = current ? getParentPath(current) : '';
    if (!parent) {
      const group = auto.GROUP_LIST.find((keyList) => keyList.includes(key)) || [];
      const siblingKey = group.find((otherKey) => otherKey !== key && getInputFullPath(otherKey));
      if (siblingKey) parent = getParentPath(getInputFullPath(siblingKey));
    }
    if (!parent) parent = auto.PARENT_BY_KEY[key] || '';
    return parent ? sanitizeInput(joinPath(parent, folderName), CONFIG.FULL_PATH_MAX) : '';
  }

  // Sinusuri ang full path. Ibinibigay ang error message o '' kung ayos (o walang laman).
  function validateFullPath(key, fullPath) {
    const folderName = handleMap[key] ? handleMap[key].name : getSavedName(key);
    if (!fullPath) return folderName ? TEXT.fullPathRequired : '';
    if (!CONFIG.FULL_PATH_PATTERN.test(fullPath)) return TEXT.fullPathInvalid;
    const lastSegment = getLastSegment(fullPath);
    const isDriveRoot = /^[A-Za-z]:$/.test(lastSegment);
    if (folderName && !isDriveRoot && lastSegment.toLowerCase() !== folderName.toLowerCase()) return TEXT.fullPathMismatch + folderName;
    return '';
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
      head.append(label);
      if (pathItem.required) {
        const requiredTag = document.createElement('span');
        requiredTag.className = 'path-required';
        requiredTag.textContent = TEXT.badgeRequired;
        head.append(requiredTag);
      }
      const badge = document.createElement('span');
      head.append(badge);
      const note = document.createElement('p');
      note.className = 'card-note';
      const name = document.createElement('p');
      name.className = 'path-name';
      const fullWrap = document.createElement('div');
      fullWrap.className = INPUT.wrap;
      const fullLabel = document.createElement('label');
      fullLabel.className = 'form-label';
      fullLabel.textContent = TEXT.fullPathLabel;
      const fullInput = document.createElement('input');
      fullInput.type = 'text';
      fullInput.className = INPUT.input;
      fullInput.maxLength = CONFIG.FULL_PATH_MAX;
      fullInput.autocomplete = 'off';
      fullInput.spellcheck = false;
      fullInput.placeholder = TEXT.fullPathPlaceholder;
      fullInput.setAttribute('aria-label', TEXT.fullPathAria + pathItem.label);
      fullInput.addEventListener('input', () => onFullPathInput(pathItem.key));
      const fullHint = document.createElement('p');
      fullHint.className = 'card-note';
      fullHint.textContent = TEXT.fullPathHint;
      fullWrap.append(fullLabel, fullInput, fullHint);
      info.append(head, note, name, fullWrap);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.setAttribute('aria-label', TEXT.pickButton + ': ' + pathItem.label);
      button.addEventListener('click', () => onPickFolder(pathItem.key));
      item.append(info, button);
      fragment.append(item);
      rowMap[pathItem.key] = { rowElement: item, noteElement: note, nameElement: name, badgeElement: badge, buttonElement: button, inputElement: fullInput, hintElement: fullHint };
    });
    query('pathList').replaceChildren(fragment);
  }

  // Ina-update ang pangalan, badge, note, button at lock state ng bawat path.
  function renderPaths() {
    const isSupported = storage.isFolderAccessSupported();
    CONFIG.PATH_LIST.forEach((pathItem) => {
      const locked = isPathLocked(pathItem);
      const state = getPathState(pathItem.key);
      const row = rowMap[pathItem.key];
      const fullPath = getInputFullPath(pathItem.key);
      row.nameElement.textContent = fullPath || state.name;
      row.inputElement.disabled = locked;
      row.badgeElement.textContent = locked && state.variant === CONFIG.BADGE.empty ? TEXT.badgeClosed : state.text;
      row.badgeElement.className = 'badge ' + state.variant;
      row.noteElement.textContent = locked ? TEXT.lockedPathNote : pathItem.note;
      row.buttonElement.textContent = state.variant === CONFIG.BADGE.empty ? TEXT.pickButton : TEXT.changeButton;
      row.buttonElement.disabled = locked || !isSupported;
      row.rowElement.classList.toggle(CONFIG.ROW_CLASS.locked, locked);
    });
    if (root.watcherInstall) root.watcherInstall.setUnlocked(Boolean(handleMap[CONFIG.ROOT_KEY]));
  }

  // Tinatanggal ang highlight ng row.
  function clearAttention() {
    Object.values(rowMap).forEach((row) => {
      row.rowElement.classList.remove(CONFIG.ROW_CLASS.attention);
      row.inputElement.classList.remove(INPUT.error);
    });
  }

  // Hina-highlight at ini-scroll ang Saving path row kapag ito ang kulang.
  function focusRootRow() {
    const row = rowMap[CONFIG.ROOT_KEY];
    const wantsReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia(CONFIG.REDUCED_MOTION_QUERY).matches;
    row.rowElement.classList.add(CONFIG.ROW_CLASS.attention);
    row.rowElement.scrollIntoView({ behavior: wantsReducedMotion ? CONFIG.SCROLL_BEHAVIOR.reduced : CONFIG.SCROLL_BEHAVIOR.normal, block: 'center' });
    row.buttonElement.focus({ preventScroll: true });
  }

  // Kapag may tina-type sa full path: i-update ang ipinapakitang path at tanggalin ang error.
  function onFullPathInput(key) {
    const row = rowMap[key];
    row.inputElement.classList.remove(INPUT.error);
    row.rowElement.classList.remove(CONFIG.ROW_CLASS.attention);
    setDirty(true);
    renderPaths();
  }

  // Sinusuri lahat ng full path bago mag-save. Ibinibigay ang unang error (at hina-highlight ang row) o ''.
  function checkAllFullPaths(fullPathMap) {
    for (const pathItem of CONFIG.PATH_LIST) {
      const message = validateFullPath(pathItem.key, fullPathMap[pathItem.key]);
      if (message) {
        const row = rowMap[pathItem.key];
        row.inputElement.classList.add(INPUT.error);
        row.rowElement.classList.add(CONFIG.ROW_CLASS.attention);
        if (typeof row.rowElement.scrollIntoView === 'function') row.rowElement.scrollIntoView({ block: 'center' });
        row.inputElement.focus({ preventScroll: true });
        return pathItem.label + ': ' + message;
      }
    }
    return '';
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
        const fromFile = await storage.readMachineSettings(rootHandle, settings[CONFIG.MACHINE_FILE_FIELD] || '');
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
    const pathItem = CONFIG.PATH_LIST.find((item) => item.key === key);
    if (!pathItem || isPathLocked(pathItem)) { setStatus(TEXT.lockedPathNote, true); return; }
    try {
      const handle = await storage.pickFolder();
      if (key === CONFIG.ROOT_KEY && handle.name.toLowerCase() !== CONFIG.ROOT_FOLDER_NAME.toLowerCase()) {
        setStatus(TEXT.wrongRoot, true);
        return;
      }
      const wasRootReady = Boolean(handleMap[CONFIG.ROOT_KEY]);
      handleMap[key] = handle;
      await storage.saveHandle(CONFIG.HANDLE_KEY[key], handle);
      if (key === CONFIG.ROOT_KEY) clearAttention();
      // Awtomatikong full path (hula): ilalagay agad sa field at lalabas sa ilalim ng pangalan ng path (renderPaths).
      const guessedPath = guessFullPath(key, handle.name);
      if (guessedPath) {
        rowMap[key].inputElement.value = guessedPath;
        rowMap[key].inputElement.classList.remove(INPUT.error);
      }
      renderPaths();
      setDirty(true);
      if (guessedPath) {
        setStatus(TEXT.fullPathAutoFilled + guessedPath + TEXT.fullPathAutoHint, false);
      } else {
        setStatus(key === CONFIG.ROOT_KEY && !wasRootReady ? TEXT.pathsUnlocked : TEXT.folderPicked, false);
      }
      if (!getInputFullPath(key)) rowMap[key].inputElement.focus();
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      setStatus(TEXT.folderError, true);
    }
  }

  // Ibinibigay ang lokasyon ng settings.json para sa mensahe (full path kung alam, kung hindi ang default label).
  function getSettingsLocation(rootFullPath) {
    if (!rootFullPath) return CONFIG.SETTINGS_PATH_LABEL;
    const base = rootFullPath.replace(/[\\]+$/, '');
    return base + CONFIG.PATH_SEPARATOR + CONFIG.SETTINGS_SUBFOLDER;
  }

  // Ibinibigay ang lokasyon ng settings file ng machine para sa mensahe.
  function getFileLocation(fullPath, fileName) {
    return getSettingsLocation(fullPath) + CONFIG.PATH_SEPARATOR + fileName;
  }

  // Parehong pangalan ba ang dalawang file? (Hindi sensitibo sa laki ng letra, tulad ng Windows.)
  function isSameFileName(first, second) {
    return String(first).toLowerCase() === String(second).toLowerCase();
  }

  // Isinusulat ang settings sa Server path. Ibinibigay ang 'saved', 'skipped' (walang Server path) o 'failed'.
  async function writeToServer(serverHandle, isAllowed, fileName, data, previousFile) {
    if (!serverHandle) return 'skipped';
    try {
      if (!isAllowed) return 'failed';
      await storage.writeMachineSettings(serverHandle, fileName, data);
      if (previousFile && !isSameFileName(previousFile, fileName)) await storage.removeMachineSettings(serverHandle, previousFile);
      return 'saved';
    } catch (error) {
      return 'failed';
    }
  }

  // Sine-save ang settings sa Saving path at Server path: <path>\settings\<machine name>.json.
  async function onSave() {
    const rootHandle = handleMap[CONFIG.ROOT_KEY];
    if (!rootHandle) { setStatus(TEXT.rootMissing, true); focusRootRow(); return; }
    try {
      clearAttention();
      const mode = getSelectedMode();
      const name = mode === CONFIG.MACHINE_MODE.LEAD_PC ? CONFIG.LEAD_PC_NAME : sanitizeInput(query('nameInput').value, CONFIG.MACHINE_NAME_MAX);
      if (!mode || !name) { setStatus(TEXT.machineMissing, true); return; }
      const fullPathMap = {};
      CONFIG.PATH_LIST.forEach((pathItem) => { fullPathMap[pathItem.key] = getInputFullPath(pathItem.key); });
      const pathError = checkAllFullPaths(fullPathMap);
      if (pathError) { setStatus(pathError, true); return; }
      const trendResult = root.trendSettings ? root.trendSettings.read() : null;
      if (trendResult && trendResult.error) { setStatus(trendResult.error, true); return; }
      if (!(await storage.hasPermission(rootHandle, true))) { setStatus(TEXT.noPermission, true); return; }
      const serverHandle = handleMap[CONFIG.SERVER_KEY];
      let isServerAllowed = false;
      if (serverHandle) {
        try {
          isServerAllowed = await storage.hasPermission(serverHandle, true);
        } catch (error) {
          isServerAllowed = false;
        }
      }
      const next = { ...settings };
      delete next.machineNameLocked;
      next.machineMode = mode;
      next.machineName = name;
      const fileName = storage.toMachineFileName(name);
      const previousFile = settings[CONFIG.MACHINE_FILE_FIELD] || '';
      next[CONFIG.MACHINE_FILE_FIELD] = fileName;
      const folderNames = {};
      CONFIG.PATH_LIST.forEach((pathItem) => {
        const folderName = handleMap[pathItem.key] ? handleMap[pathItem.key].name : getSavedName(pathItem.key);
        folderNames[pathItem.key] = folderName;
        const legacyField = CONFIG.LEGACY_NAME_FIELD[pathItem.key];
        if (legacyField) next[legacyField] = folderName;
      });
      next.folderNames = folderNames;
      if (trendResult) next[root.trendConfig.STORAGE.LIMITS_FIELD] = trendResult.limits;
      next[CONFIG.FOLDER_PATHS_FIELD] = fullPathMap;
      next.savedAt = new Date().toISOString();
      await storage.writeMachineSettings(rootHandle, fileName, next);
      if (previousFile && !isSameFileName(previousFile, fileName)) await storage.removeMachineSettings(rootHandle, previousFile);
      settings = next;
      storage.writeLocalSettings(settings);
      setDirty(false);
      const serverResult = await writeToServer(serverHandle, isServerAllowed, fileName, next, previousFile);
      renderMachine();
      renderPaths();
      const rootLocation = getFileLocation(fullPathMap[CONFIG.ROOT_KEY], fileName);
      if (serverResult === 'saved') {
        setStatus(TEXT.savedBoth + rootLocation + ' | ' + getFileLocation(fullPathMap[CONFIG.SERVER_KEY], fileName), false);
      } else if (serverResult === 'skipped') {
        setStatus(TEXT.savedRootOnly + rootLocation + TEXT.serverNotSet, false);
      } else {
        setStatus(TEXT.savedRootOnly + rootLocation + TEXT.serverFailed, true);
      }
    } catch (error) {
      setStatus(TEXT.saveError, true);
    }
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    await loadState();
    buildPathRows();
    if (root.trendSettings) root.trendSettings.init(settings, () => setDirty(true));
    CONFIG.PATH_LIST.forEach((pathItem) => { rowMap[pathItem.key].inputElement.value = getSavedFullPath(pathItem.key); });
    document.querySelectorAll(SEL.modeRadio).forEach((radio) => {
      radio.checked = radio.value === settings.machineMode;
      radio.addEventListener('change', () => { renderMachine(); setDirty(true); });
    });
    query('saveButton').addEventListener('click', onSave);
    query('nameInput').addEventListener('input', () => setDirty(true));
    if (root.watcherInstall) root.watcherInstall.init();
    if (settings.machineMode === CONFIG.MACHINE_MODE.USER_INPUT) query('nameInput').value = settings.machineName || '';
    renderMachine();
    renderPaths();
    setDirty(false);
    if (!storage.isFolderAccessSupported()) setStatus(TEXT.unsupported, true);
  }

  root.registry.registerPage('settings', Object.freeze({ init }));
})();
