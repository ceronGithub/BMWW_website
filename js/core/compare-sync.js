/*
 * FILE    : js/core/compare-sync.js
 * PURPOSE : Sulat at basa ng status ng worst slider sa Server path para ma-update ang LEAD PC: <Server path>\compare\<machine name>.json
 * DEPENDS : js/core/config.js, security.js, storage.js, queue.js, master-compare-config.js
 * INPUT   : run ng Master Correl, worst slider (detectWorst) at resulta ng compareRecords (o null)
 * OUTPUT  : isang JSON file kada machine (sinusulat ng machine, binabasa ng LEAD PC); detected: false = walang worst slider (clear)
 * VERSION : v7 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const COMPARE = root.compareConfig;
  const SYNC = COMPARE.SYNC;
  const CONNECTION = CONFIG.QUEUE.CONNECTION;
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

  // Nasa listahan ba ang value? (level, trend)
  function pickFrom(list, value, fallback) {
    return list.includes(value) ? value : fallback;
  }

  // Nililinis ang isang slider galing sa file o sa compare.
  function normalizeSlider(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const barcode = toText(raw.barcode);
    if (!barcode) return null;
    return {
      barcode,
      level: pickFrom(Object.keys(COMPARE.LEVEL_RANK), raw.level, ''),
      trend: pickFrom(Object.values(COMPARE.TREND), raw.trend, COMPARE.TREND.unknown),
      currentActual: toNumber(raw.currentActual), currentMaster: toNumber(raw.currentMaster), currentDifference: toNumber(raw.currentDifference),
      previousActual: toNumber(raw.previousActual), previousMaster: toNumber(raw.previousMaster), previousDifference: toNumber(raw.previousDifference),
      change: toNumber(raw.change)
    };
  }

  // Nililinis ang buong status. Ibinibigay ang malinis na object o null kung walang machine name.
  function normalizeStatus(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const machineName = toText(raw.machineName, CONFIG.MACHINE_NAME_MAX);
    if (!machineName) return null;
    const summary = raw.summary && typeof raw.summary === 'object' ? raw.summary : null;
    const detected = raw.detected === true;
    const sliderList = Array.isArray(raw.sliderList) ? raw.sliderList.slice(0, SYNC.SLIDER_MAX).map(normalizeSlider).filter(Boolean) : [];
    return {
      version: SYNC.FILE_VERSION,
      machineName,
      machineMode: pickFrom(Object.values(CONFIG.MACHINE_MODE), raw.machineMode, CONFIG.MACHINE_MODE.USER_INPUT),
      updatedAt: toIso(raw.updatedAt),
      detected,
      recordDate: toIso(raw.recordDate),
      previousDate: toIso(raw.previousDate),
      todayFile: toText(raw.todayFile, CONFIG.QUEUE.FILE_NAME_MAX),
      previousFile: toText(raw.previousFile, CONFIG.QUEUE.FILE_NAME_MAX),
      hasPrevious: raw.hasPrevious === true,
      worst: detected ? normalizeSlider(raw.worst) : null,
      summary: detected && summary ? {
        worseCount: toNumber(summary.worseCount), betterCount: toNumber(summary.betterCount), sameCount: toNumber(summary.sameCount), unknownCount: toNumber(summary.unknownCount),
        rSquaredToday: toNumber(summary.rSquaredToday), rSquaredPrevious: toNumber(summary.rSquaredPrevious)
      } : null,
      sliderList: detected ? sliderList : []
    };
  }

  // Gumagawa ng status mula sa run, worst slider at compare (comparison ay null kung walang previous o walang worst slider).
  function buildPayload(identity, run, detection, comparison, nowMs) {
    const base = { machineName: identity.machineName, machineMode: identity.machineMode, updatedAt: new Date(nowMs).toISOString(), recordDate: run.result.recordDate };
    if (!detection) return normalizeStatus({ ...base, detected: false });
    const matched = comparison ? comparison.sliderList[detection.index] : null;
    const summary = comparison ? comparison.summary : null;
    return normalizeStatus({
      ...base,
      detected: true,
      previousDate: comparison ? comparison.previous.recordDate : '',
      todayFile: run.result.fileName,
      previousFile: comparison ? comparison.previous.fileName : '',
      hasPrevious: Boolean(comparison),
      worst: {
        barcode: detection.barcode, level: detection.level,
        currentActual: detection.actual, currentMaster: detection.master, currentDifference: detection.difference,
        previousActual: matched ? matched.previousActual : null, previousMaster: matched ? matched.previousMaster : null, previousDifference: matched ? matched.previousDifference : null,
        change: matched ? matched.change : null, trend: matched ? matched.trend : COMPARE.TREND.unknown
      },
      summary: summary ? {
        worseCount: summary.worseCount, betterCount: summary.betterCount, sameCount: summary.sameCount, unknownCount: summary.unknownCount,
        rSquaredToday: comparison.current.regression.rSquared, rSquaredPrevious: comparison.previous.regression.rSquared
      } : null,
      sliderList: comparison ? comparison.sliderList.filter((slider) => slider.isAttention) : []
    });
  }

  // Wala lang ba ang folder? (iba ito sa pumalyang server)
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  // Sulat sa <Server path>\compare\<machine name>.json (gawa ng subfolder).
  async function writeCompareStatus(serverHandle, status) {
    const clean = normalizeStatus(status);
    if (!clean) throw new Error('invalid-status');
    const folder = await serverHandle.getDirectoryHandle(SYNC.SUBFOLDER, { create: true });
    const file = await folder.getFileHandle(storage.toMachineFileName(clean.machineName), { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(clean, null, 2));
    await writable.close();
    return clean;
  }

  // Basa ng lahat ng compare status sa Server path; walang folder = []; sira o masyadong malaki ay nilalaktawan.
  async function readCompareList(serverHandle) {
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

  // Pinapadala ang status sa Server path. Ibinibigay: 'ok' | 'noFolder' | 'noPermission' | 'unsupported' | 'error'.
  // shouldRequest true lang kapag galing sa click (para makahingi ng permission).
  async function sendStatus(status, shouldRequest) {
    try {
      const found = await queue.findServerHandle(shouldRequest === true);
      if (found.state !== CONNECTION.ok) return found.state;
      await writeCompareStatus(found.handle, status);
      return CONNECTION.ok;
    } catch (error) {
      return CONNECTION.error;
    }
  }

  root.compareSync = Object.freeze({ normalizeStatus, buildPayload, writeCompareStatus, readCompareList, sendStatus });
})();
