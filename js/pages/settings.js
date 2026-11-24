/*
 * FILE    : js/pages/settings.js
 * PURPOSE : Settings: machine name (puwedeng palitan) at mga path na may full path (server, saving, data source)
 * DEPENDS : config.js, security.js, storage.js, watcher-install.js (optional), settings-restore.js at settings-restore-config.js (optional), shift-settings.js at shift-times.js (optional)
 * VERSION : v21 | 2026-11-24 | Batch A: settingsType (Select 1 type only: lock ng uri, hindi binubura ang file ng kabilang uri kapag OFF, itago ang Data source sa LEAD PC, full path mula sa clipboard); userInputName; applyTypeLock, handleTypeChange
 * VERSION : v15 | 2026-11-22 | Yugto 0: hook sa shiftSettings (card na Shift): init (sa init at applyRestoredSettings), tsek at save ng shiftTimes sa onSave
 * VERSION : v10.1 | 2026-11-22 | settings ay sa settings\machines\sender o monitoring: removeMachineSettings na may keep ({mode, fileName}) at laging tinatawag kapag may dating file (migration); getFileLocation ay may machines\<role>
 * VERSION : v10 | 2026-11-22 | ibalik ang settings mula sa BMWW\settings: applyRestoredSettings, restoreAfterPick (pagkapili ng BMWW), banner na Ibalik ang settings (initRestoreBanner, onRestoreClick)
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
  let typedUserName = '';
  const RESTORE = root.settingsRestoreConfig;
  const TYPE = root.settingsTypeConfig;

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
    if (input.value && input.value !== CONFIG.LEAD_PC_NAME) typedUserName = input.value;
    if (mode === CONFIG.MACHINE_MODE.LEAD_PC) input.value = CONFIG.LEAD_PC_NAME;
    else if (input.value === CONFIG.LEAD_PC_NAME) input.value = getUserInputName();
    input.disabled = mode !== CONFIG.MACHINE_MODE.USER_INPUT;
    query('note').textContent = TEXT.machineNote;
    applyTypeLock();
  }

  // Ang huling pangalan ng Sender (User input) na naka-save, para maibalik kapag bumalik mula sa LEAD PC.
  function getUserInputName() {
    if (typedUserName) return typedUserName;
    const field = TYPE ? TYPE.FIELD.userInputName : '';
    if (field && settings[field]) return settings[field];
    return settings.machineMode === CONFIG.MACHINE_MODE.USER_INPUT ? settings.machineName || '' : '';
  }

  // Nilo-lock ang pagpili ng uri kapag naka-ON ang Select 1 type only at naka-save na ito (naka-ON pa lang ngunit hindi pa na-save = hindi pa lock).
  function applyTypeLock() {
    const field = TYPE ? TYPE.FIELD.selectOneTypeOnly : '';
    const isLocked = Boolean(root.settingsType && root.settingsType.isOn() && settings[field] === true && settings.machineMode);
    document.querySelectorAll(SEL.modeRadio).forEach((radio) => { radio.disabled = isLocked; });
  }

  // Kapag ginalaw ang switch na Select 1 type only: ina-update ang lock at path, at minamarkahang may pagbabago.
  function handleTypeChange() {
    renderMachine();
    renderPaths();
    setDirty(true);
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
    if (root.settingsType) root.settingsType.applyPathVisibility(rowMap, getSelectedMode());
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
    const mode = getSelectedMode();
    for (const pathItem of CONFIG.PATH_LIST) {
      if (root.settingsType && root.settingsType.isHiddenKey(pathItem.key, mode)) continue;
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

  // Hinahanap ang elemento ng banner na Ibalik ang settings (selector ay nasa settings-restore-config.js).
  function queryRestore(key) {
    return RESTORE ? document.querySelector(RESTORE.SELECTOR[key]) : null;
  }

  // Kinukuha ang laman ng form (mode, pangalan, full path ng bawat folder) para sa pagsusuri kung blangko.
  function getFormValues() {
    const fullPathMap = {};
    CONFIG.PATH_LIST.forEach((pathItem) => { fullPathMap[pathItem.key] = getInputFullPath(pathItem.key); });
    return { mode: getSelectedMode(), name: sanitizeInput(query('nameInput').value, CONFIG.MACHINE_NAME_MAX), fullPathMap };
  }

  // Pinupunan ang form ng naibalik na settings mula sa file at isinusulat din sa localStorage (hindi sine-save sa file).
  function applyRestoredSettings(restored) {
    settings = restored;
    storage.writeLocalSettings(settings);
    CONFIG.PATH_LIST.forEach((pathItem) => {
      rowMap[pathItem.key].inputElement.value = getSavedFullPath(pathItem.key);
      rowMap[pathItem.key].inputElement.classList.remove(INPUT.error);
    });
    document.querySelectorAll(SEL.modeRadio).forEach((radio) => { radio.checked = radio.value === settings.machineMode; });
    query('nameInput').value = settings.machineMode === CONFIG.MACHINE_MODE.USER_INPUT ? settings.machineName || '' : '';
    if (root.trendSettings) root.trendSettings.init(settings, () => setDirty(true));
    if (root.shiftSettings) root.shiftSettings.init(settings, () => setDirty(true));
    if (root.settingsType) root.settingsType.init(settings, handleTypeChange);
    renderMachine();
    renderPaths();
  }

  // Mensahe pagkatapos ng pagbabalik: kung may folder pang kailangang piliin ulit sa browser na ito, sasabihin.
  function getRestoredMessage() {
    const needsPick = CONFIG.PATH_LIST.some((pathItem) => getInputFullPath(pathItem.key) && !handleMap[pathItem.key]);
    const template = needsPick ? RESTORE.TEXT.restoredNoPicks : RESTORE.TEXT.restoredAllSet;
    return template.replace('{machine}', settings.machineName || RESTORE.TEXT.fallbackMachine);
  }

  // Pagkapili ng BMWW: kung blangko ang form at may naka-save na settings sa folder, ibinabalik ito. Ibinibigay ang true kapag naibalik.
  async function restoreAfterPick(rootHandle) {
    if (!RESTORE || !root.settingsRestore || !root.settingsRestore.isFormBlank(getFormValues())) return false;
    try {
      const outcome = await root.settingsRestore.restoreFromFolder(rootHandle, '');
      if (outcome.result !== RESTORE.RESULT.restored) return false;
      applyRestoredSettings(outcome.settings);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Itinatago ang banner na Ibalik ang settings.
  function hideRestoreBanner() {
    const banner = queryRestore('banner');
    if (banner) banner.hidden = true;
  }

  // Pindot sa Ibalik ang settings: hihingi ng permission (kailangan ng click), babasahin ang file at pupunan ang form.
  async function onRestoreClick() {
    const rootHandle = handleMap[CONFIG.ROOT_KEY];
    if (!rootHandle) return;
    try {
      if (!(await storage.hasPermission(rootHandle, true))) { setStatus(RESTORE.TEXT.noPermission, true); return; }
      hideRestoreBanner();
      renderPaths();
      const outcome = await root.settingsRestore.restoreFromFolder(rootHandle, settings[CONFIG.MACHINE_FILE_FIELD] || '');
      if (outcome.result === RESTORE.RESULT.restored) {
        if (isDirty) { setStatus(RESTORE.TEXT.keptChanges, false); return; }
        applyRestoredSettings(outcome.settings);
        setDirty(false);
        setStatus(getRestoredMessage(), false);
      } else if (outcome.result === RESTORE.RESULT.unreadable) {
        setStatus(RESTORE.TEXT.unreadable, true);
      } else {
        setStatus(outcome.result === RESTORE.RESULT.missing ? RESTORE.TEXT.missingFolder : RESTORE.TEXT.emptyFolder, false);
      }
    } catch (error) {
      setStatus(RESTORE.TEXT.error, true);
    }
  }

  // Kung may naka-save na BMWW handle pero nawala ang permission (nagsara ang browser), ipinapakita ang banner na Ibalik ang settings.
  async function initRestoreBanner() {
    const banner = queryRestore('banner');
    const rootHandle = handleMap[CONFIG.ROOT_KEY];
    if (!RESTORE || !root.settingsRestore || !banner || !rootHandle) return;
    try {
      if (await storage.hasPermission(rootHandle, false)) return;
    } catch (error) {
      return;
    }
    queryRestore('bannerText').textContent = RESTORE.TEXT.bannerNeedAccess;
    queryRestore('bannerButton').addEventListener('click', onRestoreClick);
    banner.hidden = false;
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
      // Bagong browser o blangkong form: ibalik ang naka-save na settings mula sa BMWW\settings (walang sinusulat).
      const isRestored = key === CONFIG.ROOT_KEY ? await restoreAfterPick(handle) : false;
      if (isRestored) hideRestoreBanner();
      // Awtomatikong full path (hula): ilalagay agad sa field at lalabas sa ilalim ng pangalan ng path (renderPaths).
      const hasRestoredPath = isRestored && Boolean(getInputFullPath(key));
      let clipboardPath = !hasRestoredPath && root.settingsType ? await root.settingsType.readClipboardPath(handle.name) : '';
      if (clipboardPath === getInputFullPath(key)) clipboardPath = '';
      const guessedPath = clipboardPath || (hasRestoredPath ? '' : guessFullPath(key, handle.name));
      if (guessedPath) {
        rowMap[key].inputElement.value = guessedPath;
        rowMap[key].inputElement.classList.remove(INPUT.error);
      }
      renderPaths();
      if (isRestored) {
        setDirty(false);
        setStatus(getRestoredMessage(), false);
        return;
      }
      setDirty(true);
      if (clipboardPath) {
        setStatus(TYPE.TEXT.fullPathFromClipboard + clipboardPath + TYPE.TEXT.fullPathFromClipboardHint, false);
      } else if (guessedPath) {
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

  // Ibinibigay ang lokasyon ng settings file ng machine para sa mensahe: <path>\settings\machines\<sender|monitoring>\<file>.
  function getFileLocation(fullPath, fileName, machineMode) {
    const separator = CONFIG.PATH_SEPARATOR;
    return getSettingsLocation(fullPath) + separator + CONFIG.MACHINES_SUBFOLDER + separator + storage.getRoleFolderName(machineMode) + separator + fileName;
  }

  // Parehong pangalan ba ang dalawang file? (Hindi sensitibo sa laki ng letra, tulad ng Windows.)
  function isSameFileName(first, second) {
    return String(first).toLowerCase() === String(second).toLowerCase();
  }

  // Binubura ang lumang settings file ayon sa Select 1 type only (OFF = hindi ginagalaw ang file ng kabilang uri). Kung walang settingsType, lumang gawi.
  async function removeOldSettingsFile(parentHandle, options) {
    if (!options.previousFile) return false;
    if (root.settingsType) return root.settingsType.removeOldFile(parentHandle, options);
    return storage.removeMachineSettings(parentHandle, options.previousFile, { mode: options.mode, fileName: options.fileName });
  }

  // Isinusulat ang settings sa Server path. Ibinibigay ang 'saved', 'skipped' (walang Server path) o 'failed'.
  async function writeToServer(serverHandle, isAllowed, fileName, data, removeOptions) {
    if (!serverHandle) return 'skipped';
    try {
      if (!isAllowed) return 'failed';
      await storage.writeMachineSettings(serverHandle, fileName, data);
      await removeOldSettingsFile(serverHandle, removeOptions);
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
      const shiftResult = root.shiftSettings ? root.shiftSettings.read() : null;
      if (shiftResult && shiftResult.error) { setStatus(shiftResult.error, true); return; }
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
      const removeOptions = { isSingleType: root.settingsType ? root.settingsType.isOn() : true, previousFile, previousMode: settings.machineMode || '', mode, fileName };
      next[TYPE.FIELD.selectOneTypeOnly] = removeOptions.isSingleType;
      next[TYPE.FIELD.userInputName] = mode === CONFIG.MACHINE_MODE.USER_INPUT ? name : getUserInputName();
      const folderNames = {};
      CONFIG.PATH_LIST.forEach((pathItem) => {
        const folderName = handleMap[pathItem.key] ? handleMap[pathItem.key].name : getSavedName(pathItem.key);
        folderNames[pathItem.key] = folderName;
        const legacyField = CONFIG.LEGACY_NAME_FIELD[pathItem.key];
        if (legacyField) next[legacyField] = folderName;
      });
      next.folderNames = folderNames;
      if (trendResult) next[root.trendConfig.STORAGE.LIMITS_FIELD] = trendResult.limits;
      if (shiftResult && shiftResult.times) next[root.shiftTimes.CONFIG.FIELD] = shiftResult.times;
      next[CONFIG.FOLDER_PATHS_FIELD] = fullPathMap;
      next.savedAt = new Date().toISOString();
      await storage.writeMachineSettings(rootHandle, fileName, next);
      await removeOldSettingsFile(rootHandle, removeOptions);
      settings = next;
      storage.writeLocalSettings(settings);
      setDirty(false);
      const serverResult = await writeToServer(serverHandle, isServerAllowed, fileName, next, removeOptions);
      renderMachine();
      renderPaths();
      const rootLocation = getFileLocation(fullPathMap[CONFIG.ROOT_KEY], fileName, mode);
      if (serverResult === 'saved') {
        setStatus(TEXT.savedBoth + rootLocation + ' | ' + getFileLocation(fullPathMap[CONFIG.SERVER_KEY], fileName, mode), false);
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
    if (root.shiftSettings) root.shiftSettings.init(settings, () => setDirty(true));
    if (root.settingsType) root.settingsType.init(settings, handleTypeChange);
    CONFIG.PATH_LIST.forEach((pathItem) => { rowMap[pathItem.key].inputElement.value = getSavedFullPath(pathItem.key); });
    document.querySelectorAll(SEL.modeRadio).forEach((radio) => {
      radio.checked = radio.value === settings.machineMode;
      radio.addEventListener('change', () => { renderMachine(); renderPaths(); setDirty(true); });
    });
    query('saveButton').addEventListener('click', onSave);
    query('nameInput').addEventListener('input', () => setDirty(true));
    if (root.watcherInstall) root.watcherInstall.init();
    if (settings.machineMode === CONFIG.MACHINE_MODE.USER_INPUT) query('nameInput').value = settings.machineName || '';
    renderMachine();
    renderPaths();
    setDirty(false);
    await initRestoreBanner();
    if (!storage.isFolderAccessSupported()) setStatus(TEXT.unsupported, true);
  }

  root.registry.registerPage('settings', Object.freeze({ init }));
})();
