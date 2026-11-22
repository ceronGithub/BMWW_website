/*
 * FILE    : js/core/storage.js
 * PURPOSE : Folder access, IndexedDB handles, settings file
 * DEPENDS : js/core/config.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | naka-IIFE na (walang module)
 * VERSION : v5 | 2026-11-20 | settings kada machine: toMachineFileName, writeMachineSettings, removeMachineSettings, readMachineSettings
 * VERSION : v10.1 | 2026-11-22 | settings ng machine ay nasa settings\machines\sender o monitoring (getRoleFolderName, getRoleFolder); basa ay may fallback sa lumang settings; removeMachineSettings ay may keep at tumatanggal din sa lumang lugar
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

  // Pangalan ng subfolder ayon sa mode: LEAD PC = monitoring, ang iba = sender.
  function getRoleFolderName(machineMode) {
    return machineMode === CONFIG.MACHINE_MODE.LEAD_PC ? CONFIG.MONITORING_SUBFOLDER : CONFIG.SENDER_SUBFOLDER;
  }

  // Kinukuha ang <parent>\settings\machines\<roleName>. Ginagawa ang mga folder kung shouldCreate; kung hindi, nagtatapon ng NotFoundError kapag wala.
  async function getRoleFolder(parentHandle, roleName, shouldCreate) {
    const options = { create: shouldCreate === true };
    const settingsFolder = await parentHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER, options);
    const machinesFolder = await settingsFolder.getDirectoryHandle(CONFIG.MACHINES_SUBFOLDER, options);
    return machinesFolder.getDirectoryHandle(roleName, options);
  }

  // Sinusulat ang settings ng machine sa <folder>\settings\machines\<sender|monitoring>\<fileName> (ayon sa settings.machineMode; ginagawa ang mga folder kung wala pa).
  async function writeMachineSettings(parentHandle, fileName, settings) {
    const roleName = getRoleFolderName(settings && settings.machineMode);
    const folder = await getRoleFolder(parentHandle, roleName, true);
    const file = await folder.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  }

  // Mga folder na pagbabasahan ng settings ng machine: sender at monitoring (bago), at ang lumang <settings> (walang machines). Ang wala ay hindi isinasama.
  async function listReadFolders(parentHandle) {
    const roleList = [];
    for (const roleName of [CONFIG.SENDER_SUBFOLDER, CONFIG.MONITORING_SUBFOLDER]) {
      try {
        roleList.push({ roleName, handle: await getRoleFolder(parentHandle, roleName, false) });
      } catch (error) {
        // Wala pa ang subfolder; laktaw.
      }
    }
    let flatFolder = null;
    try {
      flatFolder = await parentHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
    } catch (error) {
      // Wala pang settings folder.
    }
    return { roleList, flatFolder };
  }

  // Binubura ang lumang settings file ng machine sa sender, monitoring at lumang <settings> (hal. nang mapalitan ang pangalan o mode, o paglipat sa bagong layout).
  // Ang keep ({ mode, fileName }) ay ang bagong sulat na file; hindi ito binubura. Hindi binubura ang settings.json at events.json.
  async function removeMachineSettings(parentHandle, fileName, keep) {
    if (!fileName || CONFIG.MACHINE_FILE.RESERVED_FILES.includes(fileName.toLowerCase())) return false;
    const keepRole = keep && keep.mode ? getRoleFolderName(keep.mode) : '';
    const keepName = keep && keep.fileName ? String(keep.fileName).toLowerCase() : '';
    let hasRemoved = false;
    try {
      const { roleList, flatFolder } = await listReadFolders(parentHandle);
      const targetList = roleList.filter((role) => !(role.roleName === keepRole && fileName.toLowerCase() === keepName)).map((role) => role.handle);
      if (flatFolder) targetList.push(flatFolder);
      for (const folder of targetList) {
        try {
          await folder.removeEntry(fileName);
          hasRemoved = true;
        } catch (error) {
          // Wala ang file sa folder na ito; laktaw.
        }
      }
    } catch (error) {
      return hasRemoved;
    }
    return hasRemoved;
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

  // Pinakabagong settings ng machine (may machineName) sa isang folder; null kung wala. Laktaw ang settings.json at events.json.
  async function readNewestMachine(folder) {
    const rule = CONFIG.MACHINE_FILE;
    let newest = null;
    for await (const entry of folder.values()) {
      const lowerName = entry.name.toLowerCase();
      if (entry.kind !== 'file' || !lowerName.endsWith(rule.EXTENSION) || rule.RESERVED_FILES.includes(lowerName)) continue;
      const modifiedMs = (await entry.getFile()).lastModified;
      if (!newest || modifiedMs > newest.modifiedMs) newest = { name: entry.name, modifiedMs };
    }
    if (!newest) return null;
    const found = await readJsonFile(folder, newest.name);
    return found && typeof found.machineName === 'string' ? found : null;
  }

  // Binabasa ang settings ng machine: ang preferredFileName muna (sender, monitoring, lumang settings), tapos ang pinakabagong <machine>.json sa bawat folder, huli ang lumang settings.json.
  async function readMachineSettings(rootHandle, preferredFileName) {
    try {
      const { roleList, flatFolder } = await listReadFolders(rootHandle);
      const folderList = roleList.map((role) => role.handle);
      if (flatFolder) folderList.push(flatFolder);
      if (preferredFileName) {
        for (const folder of folderList) {
          const preferred = await readJsonFile(folder, preferredFileName);
          if (preferred) return preferred;
        }
      }
      for (const folder of folderList) {
        const found = await readNewestMachine(folder);
        if (found) return found;
      }
      return flatFolder ? await readJsonFile(flatFolder, CONFIG.MACHINE_FILE.LEGACY_NAME) : null;
    } catch (error) {
      return null;
    }
  }

  root.storage = Object.freeze({ isFolderAccessSupported, saveHandle, loadHandle, pickFolder, hasPermission, readLocalSettings, writeLocalSettings, writeSettingsFile, readSettingsFile, toMachineFileName, writeMachineSettings, removeMachineSettings, readMachineSettings, getRoleFolderName, getRoleFolder });
})();
