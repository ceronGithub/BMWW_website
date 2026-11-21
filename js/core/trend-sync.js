/*
 * FILE    : js/core/trend-sync.js
 * PURPOSE : Sulat at basa ng Trend export: Excel (Saving path lang), picture at meta file (Saving path at Server path). Ang meta ay huling isinusulat para ito ang tanda ng bagong update
 * DEPENDS : js/core/config.js, csv-reader.js, trend-export-config.js
 * INPUT   : saveToSavingPath, sendToServer (sulat, galing sa click ng Export); readLatest, findInSavingPath, findOnServer (basa, para sa Dashboard)
 * OUTPUT  : { ok, path } o { ok: false, message } sa sendToServer; { meta, modifiedMs, imageHandle } o null sa basa. Ang basa ay hindi nagtatapon ng error
 * VERSION : v9.4 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.trendExportConfig;
  const META = EXPORT.META;

  // Pangalan ng folder ng machine sa Server (kapareho ng Master Correl).
  function getMachineFolderName(machineName) {
    const cleaned = String(machineName || '').replace(EXPORT.UNSAFE_NAME, '_').replace(EXPORT.TRIM_NAME, '');
    return cleaned || EXPORT.NO_MACHINE_FOLDER;
  }

  // Isinusulat ang Blob o text bilang file; kapag pumalya, inaabort ang sulat at ipinapasa ang error.
  async function writeFile(folderHandle, fileName, content) {
    const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(content);
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { /* walang magagawa kung pumalya rin ang abort */ }
      throw error;
    }
    await writable.close();
  }

  // Binubuksan (at ginagawa kung wala pa) ang sunud-sunod na folder.
  async function openFolders(startHandle, nameList) {
    let handle = startHandle;
    for (const name of nameList) handle = await handle.getDirectoryHandle(name, { create: true });
    return handle;
  }

  // Saving path: Excel sa <Saving path>\trend\<petsa>\, at picture + meta sa <Saving path>\trend\ (para sa sariling Dashboard). Nagtatapon ng error kapag pumalya. Ibinibigay ang path ng Excel.
  async function saveToSavingPath(rootHandle, parts) {
    const trendHandle = await openFolders(rootHandle, [EXPORT.SUBFOLDER]);
    const dateHandle = await openFolders(trendHandle, [parts.dateFolderName]);
    await writeFile(dateHandle, parts.excelFileName, parts.excelBlob);
    await writeFile(trendHandle, EXPORT.IMAGE_NAME, parts.imageBlob);
    await writeFile(trendHandle, EXPORT.META_NAME, parts.metaText);
    return [EXPORT.SUBFOLDER, parts.dateFolderName, parts.excelFileName].join(EXPORT.PATH_SEPARATOR);
  }

  // Server path: picture + meta lang (walang Excel) sa <Server path>\trend\<machine name>\. Hindi nagtatapon ng error.
  async function sendToServer(serverFound, machineName, parts, basePath) {
    const stateText = EXPORT.TEXT.serverState;
    if (serverFound.state !== CONFIG.QUEUE.CONNECTION.ok) return { ok: false, message: stateText[serverFound.state] || stateText.error };
    try {
      const machineFolderName = getMachineFolderName(machineName);
      const machineHandle = await openFolders(serverFound.handle, [EXPORT.SUBFOLDER, machineFolderName]);
      await writeFile(machineHandle, EXPORT.IMAGE_NAME, parts.imageBlob);
      await writeFile(machineHandle, EXPORT.META_NAME, parts.metaText);
      return { ok: true, path: [basePath || serverFound.handle.name, EXPORT.SUBFOLDER, machineFolderName, EXPORT.IMAGE_NAME].join(EXPORT.PATH_SEPARATOR) };
    } catch (error) {
      return { ok: false, message: stateText.error };
    }
  }

  // Text na may limit ng haba; walang laman kung hindi text.
  function cleanText(value) {
    return typeof value === 'string' ? value.trim().slice(0, META.TEXT_MAX) : '';
  }

  // Numero na hindi negatibo; 0 kung hindi tama.
  function cleanCount(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  }

  // Nililinis ang nabasang meta. Null kung walang tamang updatedAt.
  function normalizeMeta(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const updatedAt = cleanText(raw.updatedAt);
    if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) return null;
    return {
      version: META.VERSION, machineName: cleanText(raw.machineName), updatedAt,
      startDate: cleanText(raw.startDate), endDate: cleanText(raw.endDate),
      pointCount: cleanCount(raw.pointCount), recordCount: cleanCount(raw.recordCount), outCount: cleanCount(raw.outCount),
      excelFileName: cleanText(raw.excelFileName)
    };
  }

  // Binabasa ang trend_latest.json at hawak ng trend_latest.png sa folder. Null kung wala o hindi mabasa.
  async function readLatest(folderHandle) {
    try {
      const metaHandle = await folderHandle.getFileHandle(EXPORT.META_NAME);
      const metaFile = await metaHandle.getFile();
      if (metaFile.size > META.FILE_MAX_BYTES) return null;
      const meta = normalizeMeta(JSON.parse(await metaFile.text()));
      if (!meta) return null;
      let imageHandle = null;
      try { imageHandle = await folderHandle.getFileHandle(EXPORT.IMAGE_NAME); } catch (error) { imageHandle = null; }
      return { meta, modifiedMs: metaFile.lastModified, imageHandle };
    } catch (error) {
      return null;
    }
  }

  // Sariling Dashboard (Sender): <Saving path>\trend\. Null kung wala pa.
  async function findInSavingPath(rootHandle) {
    try {
      return await readLatest(await rootHandle.getDirectoryHandle(EXPORT.SUBFOLDER));
    } catch (error) {
      return null;
    }
  }

  // LEAD PC: <Server path>\trend\<machine name>\. Null kung wala pa.
  async function findOnServer(serverHandle, machineName) {
    try {
      const trendHandle = await serverHandle.getDirectoryHandle(EXPORT.SUBFOLDER);
      return await readLatest(await trendHandle.getDirectoryHandle(getMachineFolderName(machineName)));
    } catch (error) {
      return null;
    }
  }

  root.trendSync = Object.freeze({ getMachineFolderName, saveToSavingPath, sendToServer, readLatest, findInSavingPath, findOnServer });
})();
