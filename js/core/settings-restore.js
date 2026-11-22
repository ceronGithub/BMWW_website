/*
 * FILE    : js/core/settings-restore.js
 * PURPOSE : Checker ng <BMWW>\settings (missing, empty, hasFiles) at pagbasa ng naka-save na settings ng machine para maibalik ito sa ibang browser o pagkasara ng tab. Walang sinusulat.
 * DEPENDS : js/core/config.js, js/core/storage.js, js/core/settings-restore-config.js
 * VERSION : v10.1 | 2026-11-22 | checkSettingsFolder ay naghahanap din sa machines\sender at machines\monitoring
 * VERSION : v10 | 2026-11-22 | bagong file: checkSettingsFolder, restoreFromFolder, isFormBlank
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const storage = root.storage;
  const RESTORE = root.settingsRestoreConfig;

  // Hindi nahanap ba ang folder o file? (NotFoundError ng browser)
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  // Mga .json file sa isang folder na settings ng machine (laktaw ang events.json).
  async function listMachineFileNames(folder) {
    const nameList = [];
    for await (const entry of folder.values()) {
      const lowerName = entry.name.toLowerCase();
      if (entry.kind !== 'file' || !lowerName.endsWith(RESTORE.FILE_EXTENSION) || RESTORE.IGNORED_FILES.includes(lowerName)) continue;
      nameList.push(entry.name);
    }
    return nameList;
  }

  // Tinitingnan ang <BMWW>\settings: wala (missing), walang settings file (empty) o may file (hasFiles). Hinahanap sa machines\sender, machines\monitoring at sa lumang settings. Walang ginagawa o sinusulat.
  async function checkSettingsFolder(rootHandle) {
    let settingsFolder;
    try {
      settingsFolder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
    } catch (error) {
      if (isNotFound(error)) return { state: RESTORE.STATE.missing, fileList: [] };
      throw error;
    }
    const fileList = await listMachineFileNames(settingsFolder);
    for (const roleName of [CONFIG.SENDER_SUBFOLDER, CONFIG.MONITORING_SUBFOLDER]) {
      try {
        fileList.push(...(await listMachineFileNames(await storage.getRoleFolder(rootHandle, roleName, false))));
      } catch (error) {
        if (!isNotFound(error)) throw error;
      }
    }
    return { state: fileList.length ? RESTORE.STATE.hasFiles : RESTORE.STATE.empty, fileList };
  }

  // Binabasa ang naka-save na settings ng machine (preferredFileName muna, tapos ang pinakabago). Ibinibigay ang { result, settings }.
  async function restoreFromFolder(rootHandle, preferredFileName) {
    const check = await checkSettingsFolder(rootHandle);
    if (check.state === RESTORE.STATE.missing) return { result: RESTORE.RESULT.missing, settings: null };
    if (check.state === RESTORE.STATE.empty) return { result: RESTORE.RESULT.empty, settings: null };
    const settings = await storage.readMachineSettings(rootHandle, preferredFileName || '');
    if (!settings || typeof settings !== 'object') return { result: RESTORE.RESULT.unreadable, settings: null };
    return { result: RESTORE.RESULT.restored, settings };
  }

  // Blangko ba ang form (walang napiling mode, walang pangalan, walang full path)? Kapag oo, ligtas na punan ng naibalik na settings.
  function isFormBlank(formValues) {
    const values = formValues || {};
    const hasPath = Object.values(values.fullPathMap || {}).some((fullPath) => Boolean(fullPath));
    return !values.mode && !values.name && !hasPath;
  }

  root.settingsRestore = Object.freeze({ checkSettingsFolder, restoreFromFolder, isFormBlank });
})();
