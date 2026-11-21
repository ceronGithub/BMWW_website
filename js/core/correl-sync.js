/*
 * FILE    : js/core/correl-sync.js
 * PURPOSE : Sulat at basa ng status ng Master Correl (PASS / WARNING / FAIL) sa Server path para makita ng LEAD PC: <Server path>\correl\<machine name>.json
 * DEPENDS : js/core/config.js, security.js, storage.js, queue.js, correl-sync-config.js
 * INPUT   : resulta ng Master Correl (analyzeLatest): status, regression.rSquared, recordDate, fileName
 * OUTPUT  : isang JSON file kada machine (sinusulat ng machine, binabasa ng LEAD PC)
 * VERSION : v7.3 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const SYNC = root.correlSyncConfig;
  const CONNECTION = CONFIG.QUEUE.CONNECTION;
  const STATUS_LIST = Object.values(CONFIG.MASTER.STATUS);
  const { sanitizeInput } = root.security;
  const { storage, queue } = root;

  // Numero kung may saysay; null kung wala.
  function toNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  // Text na nilinis at nilimitahan ang haba.
  function toText(value, limit) {
    return sanitizeInput(typeof value === 'string' ? value : '', limit || SYNC.TEXT_MAX);
  }

  // Date o text -> ISO na petsa; walang laman kung hindi valid.
  function toIso(value) {
    const isDate = Boolean(value) && typeof value === 'object' && typeof value.getTime === 'function';
    const time = isDate ? value.getTime() : typeof value === 'string' ? Date.parse(value) : NaN;
    return Number.isNaN(time) ? '' : new Date(time).toISOString();
  }

  // Nililinis ang status. Ibinibigay ang malinis na object o null kung walang machine name o hindi kilala ang status.
  function normalizeStatus(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const machineName = toText(raw.machineName, CONFIG.MACHINE_NAME_MAX);
    if (!machineName || !STATUS_LIST.includes(raw.status)) return null;
    const modeList = Object.values(CONFIG.MACHINE_MODE);
    return {
      version: SYNC.FILE_VERSION,
      machineName,
      machineMode: modeList.includes(raw.machineMode) ? raw.machineMode : CONFIG.MACHINE_MODE.USER_INPUT,
      updatedAt: toIso(raw.updatedAt),
      recordDate: toIso(raw.recordDate),
      status: raw.status,
      rSquared: toNumber(raw.rSquared),
      fileName: toText(raw.fileName, CONFIG.QUEUE.FILE_NAME_MAX)
    };
  }

  // Gumagawa ng status mula sa resulta ng Master Correl.
  function buildPayload(identity, result, nowMs) {
    return normalizeStatus({
      machineName: identity.machineName,
      machineMode: identity.machineMode,
      updatedAt: new Date(nowMs).toISOString(),
      recordDate: result.recordDate,
      status: result.status,
      rSquared: result.regression ? result.regression.rSquared : null,
      fileName: result.fileName
    });
  }

  // Wala lang ba ang folder? (iba ito sa pumalyang server)
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  // Sulat sa <Server path>\correl\<machine name>.json (gawa ng subfolder).
  async function writeCorrelStatus(serverHandle, status) {
    const clean = normalizeStatus(status);
    if (!clean) throw new Error('invalid-status');
    const folder = await serverHandle.getDirectoryHandle(SYNC.SUBFOLDER, { create: true });
    const file = await folder.getFileHandle(storage.toMachineFileName(clean.machineName), { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(clean, null, 2));
    await writable.close();
    return clean;
  }

  // Basa ng lahat ng status ng Master Correl sa Server path; walang folder = []; sira o masyadong malaki ay nilalaktawan.
  async function readCorrelList(serverHandle) {
    let folder;
    try {
      folder = await serverHandle.getDirectoryHandle(SYNC.SUBFOLDER);
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
    const result = [];
    let count = 0;
    for await (const entry of folder.values()) {
      if (entry.kind !== 'file' || !entry.name.toLowerCase().endsWith(CONFIG.MACHINE_FILE.EXTENSION)) continue;
      count += 1;
      if (count > SYNC.MAX_FILES) break;
      try {
        const file = await entry.getFile();
        if (typeof file.size === 'number' && file.size > SYNC.FILE_MAX_BYTES) continue;
        const status = normalizeStatus(JSON.parse(await file.text()));
        if (status) result.push({ status, fileName: entry.name, modifiedMs: file.lastModified });
      } catch (error) {
        // sirang file: laktawan
      }
    }
    return result;
  }

  // Ipinapadala ang resulta ng Master Correl sa Server path. Ibinibigay: 'ok' | 'skippedLead' | 'noName' | 'noFolder' | 'noPermission' | 'unsupported' | 'error'.
  // shouldRequest true lang kapag galing sa click (para makahingi ng permission). Hindi nagtatapon ng error.
  async function publishStatus(result, settings, shouldRequest) {
    try {
      if (settings.machineMode === CONFIG.MACHINE_MODE.LEAD_PC) return 'skippedLead';
      const machineName = typeof settings.machineName === 'string' ? settings.machineName.trim() : '';
      if (!machineName) return 'noName';
      const payload = buildPayload({ machineName, machineMode: settings.machineMode }, result, Date.now());
      if (!payload) return 'error';
      const found = await queue.findServerHandle(shouldRequest === true);
      if (found.state !== CONNECTION.ok) return found.state;
      await writeCorrelStatus(found.handle, payload);
      return CONNECTION.ok;
    } catch (error) {
      return CONNECTION.error;
    }
  }

  root.correlSync = Object.freeze({ normalizeStatus, buildPayload, writeCorrelStatus, readCorrelList, publishStatus });
})();
