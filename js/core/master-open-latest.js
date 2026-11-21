/*
 * FILE    : js/core/master-open-latest.js
 * PURPOSE : Hinahanap ang pinakabagong na-export na Repeatability Excel file sa <Saving path>/master-repeatability/<petsa>/ at binubuksan ito sa Excel
 * DEPENDS : js/core/master-export-config.js, csv-reader.js
 * VERSION : v2.14 | 2026-11-21 | bagong file (Open latest repeatability file)
 * VERSION : v2.15 | 2026-11-21 | walang download na; ang Windows handler na bmww-open: (tools/open-handler) ang nagbubukas ng file sa Excel
 * VERSION : v2.16 | 2026-11-21 | may optional na target (SUBFOLDER, FILE_PREFIX, FILE_EXTENSION, NO_FILE_CODE) para magamit din ng Master Correl; default ay Repeatability
 * NOTE    : Hindi kayang patakbuhin ng browser ang Excel nang direkta, kaya nagpapadala ito ng link na bmww-open:<full path> sa Windows handler.
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const EXPORT = root.exportConfig;
  const { csv } = root;
  const FULL_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

  // Tama ba ang pangalan: nagsisimula sa FILE_PREFIX, nagtatapos sa FILE_EXTENSION (kaya hindi kasama ang temporary na ~$ ng Excel).
  function isTargetFile(name, target) {
    return name.startsWith(target.FILE_PREFIX) && name.toLowerCase().endsWith(target.FILE_EXTENSION);
  }

  // Hinahanap ang file na may pinakabagong last modified sa lahat ng folder ng petsa. Kapag wala: error na NO_FILE_CODE ('noLatestFile' kung default).
  async function findLatestFile(rootHandle, target) {
    const noFileCode = target.NO_FILE_CODE || 'noLatestFile';
    let subfolderHandle;
    try {
      subfolderHandle = await rootHandle.getDirectoryHandle(target.SUBFOLDER);
    } catch (error) {
      if (error && error.name === 'NotFoundError') throw csv.createError(noFileCode);
      throw error;
    }
    let latest = null;
    for await (const [folderName, folderHandle] of subfolderHandle.entries()) {
      if (folderHandle.kind !== 'directory') continue;
      for await (const [fileName, fileHandle] of folderHandle.entries()) {
        if (fileHandle.kind !== 'file' || !isTargetFile(fileName, target)) continue;
        const file = await fileHandle.getFile();
        if (!latest || file.lastModified > latest.lastModified) latest = { lastModified: file.lastModified, folderName: target.SUBFOLDER + EXPORT.PATH_SEPARATOR + folderName, fileName };
      }
    }
    if (!latest) throw csv.createError(noFileCode);
    return latest;
  }

  // Ipinapadala sa Windows handler (bmww-open:<full path na naka-encode>) sa pamamagitan ng link na kinlick ng code.
  function launchHandler(fullPath) {
    const link = document.createElement('a');
    link.href = EXPORT.PROTOCOL + encodeURIComponent(fullPath);
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
  }

  // Hanapin at buksan ang pinakabagong file. rootPath = full path ng Saving path (galing sa Settings), hal. C:\\BMWW.
  // Ibinabalik ang { folderName, fileName, fullPath }.
  // target = { SUBFOLDER, FILE_PREFIX, FILE_EXTENSION, NO_FILE_CODE }; kung wala, Repeatability (exportConfig).
  async function openLatest(rootHandle, rootPath, target) {
    if (!rootPath || !FULL_PATH_PATTERN.test(rootPath)) throw csv.createError('noRootPath');
    const latest = await findLatestFile(rootHandle, target || EXPORT);
    const separator = EXPORT.PATH_SEPARATOR;
    const fullPath = rootPath.replace(/[\\/]+$/, '') + separator + latest.folderName + separator + latest.fileName;
    launchHandler(fullPath);
    return { folderName: latest.folderName, fileName: latest.fileName, fullPath };
  }

  root.masterOpenLatest = Object.freeze({ findLatestFile, openLatest });
})();
