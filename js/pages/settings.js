/*
 * FILE    : js/pages/settings.js
 * PURPOSE : Settings: machine name (isang beses) at folders
 * DEPENDS : config.js, security.js, storage.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 */
'use strict';
import { CONFIG } from '../core/config.js';
import { sanitizeInput } from '../core/security.js';
import * as storage from '../core/storage.js';

const SEL = CONFIG.SELECTOR.settings;
const TEXT = CONFIG.TEXT;
let settings = {};
let rootHandle = null;
let sourceHandle = null;

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

// Ina-update ang machine name fields at lock state.
function renderMachine() {
  const locked = Boolean(settings.machineNameLocked);
  const mode = getSelectedMode();
  const input = query('nameInput');
  document.querySelectorAll(SEL.modeRadio).forEach((radio) => { radio.disabled = locked; });
  if (mode === CONFIG.MACHINE_MODE.LEAD_PC) input.value = CONFIG.LEAD_PC_NAME;
  else if (locked) input.value = settings.machineName || '';
  input.disabled = locked || mode !== CONFIG.MACHINE_MODE.USER_INPUT;
  query('note').textContent = locked ? TEXT.machineLocked : TEXT.machineWarn;
}

// Pangalan ng folder o paalala kung kailangan piliin ulit.
function folderLabel(handle, savedName) {
  if (handle) return handle.name;
  return savedName ? savedName + TEXT.needReselect : TEXT.notSet;
}

// Ina-update ang pangalan ng mga napiling folder.
function renderFolders() {
  query('rootLabel').textContent = folderLabel(rootHandle, settings.rootFolderName);
  query('sourceLabel').textContent = folderLabel(sourceHandle, settings.sourceFolderName);
}

// Binabasa ang naunang settings (file ang pangunahin, localStorage ang backup).
async function loadState() {
  settings = storage.readLocalSettings();
  if (!storage.isFolderAccessSupported()) return;
  try {
    rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY.root);
    sourceHandle = await storage.loadHandle(CONFIG.HANDLE_KEY.source);
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

// Pumipili ng folder (root o source).
async function onPickFolder(kind) {
  try {
    const handle = await storage.pickFolder();
    if (kind === 'root') {
      if (handle.name.toLowerCase() !== CONFIG.ROOT_FOLDER_NAME.toLowerCase()) { setStatus(TEXT.wrongRoot, true); return; }
      rootHandle = handle;
    } else {
      sourceHandle = handle;
    }
    await storage.saveHandle(CONFIG.HANDLE_KEY[kind], handle);
    renderFolders();
    setStatus(TEXT.folderPicked, false);
  } catch (error) {
    if (error && error.name === 'AbortError') return;
    setStatus(TEXT.folderError, true);
  }
}

// Sine-save ang settings sa BMWW\settings\settings.json.
async function onSave() {
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
    next.rootFolderName = rootHandle.name;
    next.sourceFolderName = sourceHandle ? sourceHandle.name : settings.sourceFolderName || '';
    next.savedAt = new Date().toISOString();
    await storage.writeSettingsFile(rootHandle, next);
    settings = next;
    storage.writeLocalSettings(settings);
    renderMachine();
    renderFolders();
    setStatus(TEXT.saved + CONFIG.SETTINGS_PATH_LABEL, false);
  } catch (error) {
    setStatus(TEXT.saveError, true);
  }
}

// Init ng page, tinatawag ng router.
export async function init() {
  await loadState();
  document.querySelectorAll(SEL.modeRadio).forEach((radio) => {
    radio.checked = radio.value === settings.machineMode;
    radio.addEventListener('change', renderMachine);
  });
  query('pickRoot').addEventListener('click', () => onPickFolder('root'));
  query('pickSource').addEventListener('click', () => onPickFolder('source'));
  query('saveButton').addEventListener('click', onSave);
  renderMachine();
  renderFolders();
  if (!storage.isFolderAccessSupported()) {
    query('pickRoot').disabled = true;
    query('pickSource').disabled = true;
    setStatus(TEXT.unsupported, true);
  }
}
