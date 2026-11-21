/*
 * FILE    : js/core/storage.js
 * PURPOSE : Folder access, IndexedDB handles, settings file
 * DEPENDS : js/core/config.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | naka-IIFE na (walang module)
 * VERSION : v5 | 2026-11-20 | settings kada machine: toMachineFileName, writeMachineSettings, removeMachineSettings, readMachineSettings
 * VERSION : v5.3 | 2026-11-21 | writeLocalSettings ay nagbabato ng SETTINGS_CHANGED_EVENT pagkatapos mag-save
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;

  // Sinusuportahan ba ng browser ang folder picker (Chrome/Edge).
  function isFolderAccessSupported() {
    return typeof window.showDirectoryPicker === 'function';
  }

  // Binubuksan ang IndexedDB kung saan nakasave ang folder handles.
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(CONFIG.DB_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sine-save ang folder handle para hindi na pumili ulit.
  async function saveHandle(key, handle) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(CONFIG.DB_STORE, 'readwrite');
      transaction.objectStore(CONFIG.DB_STORE).put(handle, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Kinukuha ang naka-save na handle (null kung wala).
  async function loadHandle(key) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(CONFIG.DB_STORE).objectStore(CONFIG.DB_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Bubuksan ang folder picker (read at write).
  function pickFolder() {
    return window.showDirectoryPicker({ mode: 'readwrite', startIn: 'desktop' });
  }

  // Tinitingnan o hinihingi ang permission sa folder.
  async function hasPermission(handle, shouldRequest) {
    const options = { mode: 'readwrite' };
    if ((await handle.queryPermission(options)) === 'granted') return true;
    if (!shouldRequest) return false;
    return (await handle.requestPermission(options)) === 'granted';
  }

  // Binabasa ang settings cache sa localStorage.
  function readLocalSettings() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  // Sine-save ang settings cache sa localStorage.
  function writeLocalSettings(settings) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      // Hindi kritikal: ang file sa BMWW ang pangunahing tala.
    }
    // Sinasabihan ang sidebar at router na nagbago ang settings (hal. naging LEAD PC), para ma-update agad ang access.
    window.dispatchEvent(new CustomEvent(CONFIG.SETTINGS_CHANGED_EVENT));
  }

  // Gumagawa ng settings folder (kung wala pa) at sinusulat ang settings.json.
  async function writeSettingsFile(rootHandle, settings) {
    const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER, { create: true });
    const file = await folder.getFileHandle(CONFIG.SETTINGS_FILE, { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  }

  // Binabasa ang settings.json (null kung wala o sira).
  async function readSettingsFile(rootHandle) {
    try {
      const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
      const file = await folder.getFileHandle(CONFIG.SETTINGS_FILE);
      return JSON.parse(await (await file.getFile()).text());
    } catch (error) {
      return null;
    }
  }

  // Ginagawang ligtas na pangalan ng file ang machine name (hal. "MWW 1" -> "MWW 1.json").
  function toMachineFileName(machineName) {
    const rule = CONFIG.MACHINE_FILE;
    let baseName = String(machineName).replace(rule.INVALID_CHARS, '_').replace(rule.TRAILING_CHARS, '').trim();
    if (!baseName) baseName = rule.FALLBACK_NAME;
    let fileName = baseName + rule.EXTENSION;
    if (rule.RESERVED_PATTERN.test(baseName) || rule.RESERVED_FILES.includes(fileName.toLowerCase())) fileName = rule.PREFIX + fileName;
    return fileName;
  }

  // Sinusulat ang settings ng machine sa <folder>\settings\<fileName> (ginagawa ang subfolder kung wala pa).
  async function writeMachineSettings(parentHandle, fileName, settings) {
    const folder = await parentHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER, { create: true });
    const file = await folder.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  }

  // Binubura ang lumang settings file ng machine (hal. nang mapalitan ang pangalan). Hindi binubura ang settings.json at events.json.
  async function removeMachineSettings(parentHandle, fileName) {
    if (!fileName || CONFIG.MACHINE_FILE.RESERVED_FILES.includes(fileName.toLowerCase())) return false;
    try {
      const folder = await parentHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
      await folder.removeEntry(fileName);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Binabasa at ginagawang object ang isang settings file (null kung wala o sira).
  async function readJsonFile(folder, fileName) {
    try {
      const file = await folder.getFileHandle(fileName);
      return JSON.parse(await (await file.getFile()).text());
    } catch (error) {
      return null;
    }
  }

  // Binabasa ang settings ng machine: ang preferredFileName muna, tapos ang pinakabagong <machine>.json, tapos ang lumang settings.json (laktaw ang events.json).
  async function readMachineSettings(rootHandle, preferredFileName) {
    try {
      const rule = CONFIG.MACHINE_FILE;
      const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
      if (preferredFileName) {
        const preferred = await readJsonFile(folder, preferredFileName);
        if (preferred) return preferred;
      }
      let newest = null;
      for await (const entry of folder.values()) {
        const lowerName = entry.name.toLowerCase();
        if (entry.kind !== 'file' || !lowerName.endsWith(rule.EXTENSION) || rule.RESERVED_FILES.includes(lowerName)) continue;
        const modifiedMs = (await entry.getFile()).lastModified;
        if (!newest || modifiedMs > newest.modifiedMs) newest = { name: entry.name, modifiedMs };
      }
      if (newest) {
        const found = await readJsonFile(folder, newest.name);
        if (found && typeof found.machineName === 'string') return found;
      }
      return await readJsonFile(folder, rule.LEGACY_NAME);
    } catch (error) {
      return null;
    }
  }

  root.storage = Object.freeze({ isFolderAccessSupported, saveHandle, loadHandle, pickFolder, hasPermission, readLocalSettings, writeLocalSettings, writeSettingsFile, readSettingsFile, toMachineFileName, writeMachineSettings, removeMachineSettings, readMachineSettings });
})();
