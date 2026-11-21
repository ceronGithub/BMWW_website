/*
 * FILE    : js/core/correl-preview.js
 * PURPOSE : Preview button ng machine tile sa Dashboard (LEAD PC): hinahanap ang pinakabagong na-export na Master Correl file ng machine
 *           sa <Server path>\master-correl\<machine name>\<petsa>\ at binubuksan ang File Explorer (naka-highlight ang file) sa pamamagitan ng handler na bmww-open:reveal:
 * DEPENDS : js/core/config.js, storage.js, queue.js, csv-reader.js, master-export-config.js, correl-export-config.js, master-open-latest.js
 * INPUT   : machineName (galing sa tile), Server path (full path sa Settings at folder handle)
 * OUTPUT  : { ok: true, openedPath } o { ok: false, code } (code ay susi ng TEXT.error sa dashboard-machines-config.js); hindi nagtatapon ng error
 * NOTE    : Basa lang ang ginagawa sa Server. Ang Server path ay dapat drive letter (hal. Z:\BMWW); hindi pinapayagan ng handler ang \\server na UNC path.
 * VERSION : v7.4 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const CORREL = root.correlConfig;
  const EXPORT = root.exportConfig;
  const CONNECTION = CONFIG.QUEUE.CONNECTION;

  // Pangalan ng folder ng machine sa Server path (kapareho ng ginagamit ng Export to Excel sa Master page).
  function getMachineFolderName(machineName) {
    const cleaned = String(machineName || '').replace(CORREL.SERVER.UNSAFE_NAME, '_').replace(CORREL.SERVER.TRIM_NAME, '');
    return cleaned || CORREL.SERVER.NO_MACHINE_FOLDER;
  }

  // Binubuksan ang File Explorer sa pinakabagong Correl file ng machine. shouldRequest = true lang kapag galing sa click (para makahingi ng permission).
  async function previewLatest(machineName, shouldRequest) {
    try {
      // Full path ng Server path na tinype sa Settings (kailangan ito ng Windows handler para mabuksan ang tamang folder).
      const serverPath = (root.storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {})[CONFIG.SERVER_KEY] || '';
      const found = await root.queue.findServerHandle(shouldRequest === true);
      if (found.state !== CONNECTION.ok) return { ok: false, code: found.state };
      let correlHandle;
      try {
        correlHandle = await found.handle.getDirectoryHandle(CORREL.SERVER.SUBFOLDER);
      } catch (error) {
        if (error && error.name === 'NotFoundError') return { ok: false, code: 'noFile' };
        throw error;
      }
      // Ang master-correl folder ang "root" dito, kaya ang SUBFOLDER ng target ay ang folder ng machine: master-correl\<machine>\<petsa>\<file>.
      const target = {
        SUBFOLDER: getMachineFolderName(machineName),
        FILE_PREFIX: CORREL.FILE_PREFIX,
        FILE_EXTENSION: CORREL.FILE_EXTENSION,
        NO_FILE_CODE: 'noFile',
        OPEN_MODE: EXPORT.OPEN_MODE_FOLDER
      };
      const correlPath = serverPath.replace(/[\\/]+$/, '') + EXPORT.PATH_SEPARATOR + CORREL.SERVER.SUBFOLDER;
      const opened = await root.masterOpenLatest.openLatest(correlHandle, correlPath, target);
      return { ok: true, openedPath: opened.openedPath };
    } catch (error) {
      return { ok: false, code: error && error.code ? error.code : 'error' };
    }
  }

  root.correlPreview = Object.freeze({ getMachineFolderName, previewLatest });
})();
