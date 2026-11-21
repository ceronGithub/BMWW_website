/*
 * FILE    : js/core/repeatability-sync.js
 * PURPOSE : Export ng Master Repeatability sa <Saving path> (may timestamp) at kopya (overwrite) sa <Server path>\master-repeatability\<machine name>\<petsa ngayon>\master-repeatability_latest.xlsx
 * DEPENDS : js/core/config.js, storage.js, queue.js, csv-reader.js, master-export-config.js, master-export.js, correl-export.js, repeatability-sync-config.js
 * VERSION : v8.11 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.exportConfig;
  const SYNC = root.repeatabilitySyncConfig;
  const { storage, csv, masterExport, correlExport } = root;

  // Isinusulat ang Blob bilang file sa loob ng folder; kapag pumalya, inaabort ang sulat at ipinapasa ang error.
  async function writeBlob(folderHandle, fileName, blob) {
    const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(blob);
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { /* walang magagawa kung pumalya rin ang abort */ }
      throw error;
    }
    await writable.close();
  }

  // Kinukuha ang Server path at humihingi ng permission (galing sa click). Hindi nagtatapon ng error.
  async function findServer() {
    try {
      return await root.queue.findServerHandle(true);
    } catch (error) {
      return { handle: null, state: CONFIG.QUEUE.CONNECTION.error };
    }
  }

  // Kopya ng Excel sa <Server path>/<SUBFOLDER>/<machine name>/<yyyy-mm-dd ngayon>/ (ginagawa ang mga folder kung wala pa). Ibinibigay { ok, path } o { ok: false, message }; hindi nagtatapon ng error.
  async function copyToServer(serverFound, paths, result, sourceText, machineName) {
    const stateText = SYNC.TEXT.serverState;
    if (serverFound.state !== CONFIG.QUEUE.CONNECTION.ok) return { ok: false, message: stateText[serverFound.state] || stateText.error };
    try {
      const exportedAt = new Date();
      const blob = masterExport.buildBlob(result, exportedAt, sourceText);
      const subfolderHandle = await serverFound.handle.getDirectoryHandle(SYNC.SERVER.SUBFOLDER, { create: true });
      const machineFolderName = correlExport.getMachineFolderName(machineName);
      const machineHandle = await subfolderHandle.getDirectoryHandle(machineFolderName, { create: true });
      const dateFolderName = csv.formatDateInput(exportedAt);
      const dateHandle = await machineHandle.getDirectoryHandle(dateFolderName, { create: true });
      await writeBlob(dateHandle, SYNC.SERVER.FILE_NAME, blob);
      const separator = EXPORT.PATH_SEPARATOR;
      const basePath = paths[CONFIG.SERVER_KEY] || serverFound.handle.name;
      return { ok: true, path: [basePath, SYNC.SERVER.SUBFOLDER, machineFolderName, dateFolderName, SYNC.SERVER.FILE_NAME].join(separator) };
    } catch (error) {
      return { ok: false, message: stateText.error };
    }
  }

  // Ang buong export: Saving path (may timestamp) at kopya sa Server path. Ibinibigay { message, kind }. Nagtatapon ng error (may code) kapag pumalya ang Saving path.
  async function exportBoth(result, machineName) {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    if (!rootHandle) throw csv.createError('noRoot');
    if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
    const serverFound = await findServer();
    const settings = storage.readLocalSettings();
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    const sourceText = paths[CONFIG.MASTER.SOURCE_KEY] || (settings.folderNames || {})[CONFIG.MASTER.SOURCE_KEY] || CONFIG.TEXT.master.sourceNotSet;
    const saved = await masterExport.exportRepeatability(result, rootHandle, sourceText);
    const separator = EXPORT.PATH_SEPARATOR;
    const basePath = paths[CONFIG.ROOT_KEY] || rootHandle.name;
    const savedText = EXPORT.TEXT.saved + basePath + separator + saved.folderName + separator + saved.fileName;
    const serverCopy = await copyToServer(serverFound, paths, result, sourceText, machineName);
    if (serverCopy.ok) return { message: savedText + SYNC.TEXT.serverSaved + serverCopy.path, kind: 'success' };
    return { message: savedText + SYNC.TEXT.serverFailed + serverCopy.message, kind: 'error' };
  }

  root.repeatabilitySync = Object.freeze({ exportBoth, copyToServer });
})();
