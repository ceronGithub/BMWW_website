/*
 * FILE    : js/core/queue.js
 * PURPOSE : Queue ng mga machine sa Server path: sulat ng status ng sariling machine, basa ng lahat ng machine, listahan ng machine mula sa server settings
 * DEPENDS : js/core/config.js, js/core/security.js, js/core/storage.js
 * VERSION : v5.1 | 2026-11-21 | bagong file (Task 1B); wala pang tumatawag, gagamitin ng monitor (1C) at Dashboard (1D)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const QUEUE = CONFIG.QUEUE;
  const CONNECTION = QUEUE.CONNECTION;
  const storage = root.storage;
  const { sanitizeInput } = root.security;

  // Nasa listahan ba ang value? (para sa mode, state, source na galing sa file)
  function pickFrom(group, value, fallback) {
    return Object.values(group).includes(value) ? value : fallback;
  }

  // Ginagawang ISO na petsa ang value; walang laman kung hindi valid.
  function toIsoOrEmpty(value) {
    if (typeof value !== 'string' || !value) return '';
    const time = Date.parse(value);
    return Number.isNaN(time) ? '' : new Date(time).toISOString();
  }

  // Nililinis ang status galing sa file o monitor. Ibinibigay ang malinis na object o null kung walang machine name.
  function normalizeStatus(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const machineName = sanitizeInput(typeof raw.machineName === 'string' ? raw.machineName : '', CONFIG.MACHINE_NAME_MAX);
    if (!machineName) return null;
    const mode = pickFrom(QUEUE.MODE, raw.mode, QUEUE.MODE.idle);
    const state = mode === QUEUE.MODE.idle ? QUEUE.STATE.idle : pickFrom(QUEUE.STATE, raw.state, QUEUE.STATE.idle);
    const text = (value, limit) => sanitizeInput(typeof value === 'string' ? value : '', limit);
    return {
      version: QUEUE.FILE_VERSION,
      machineName,
      machineMode: pickFrom(CONFIG.MACHINE_MODE, raw.machineMode, CONFIG.MACHINE_MODE.USER_INPUT),
      mode,
      state,
      source: pickFrom(QUEUE.SOURCE, raw.source, QUEUE.SOURCE.none),
      fileName: text(raw.fileName, QUEUE.FILE_NAME_MAX),
      wafer: text(raw.wafer, QUEUE.TEXT_MAX),
      blk: text(raw.blk, QUEUE.TEXT_MAX),
      layer: text(raw.layer, QUEUE.TEXT_MAX),
      barcode: text(raw.barcode, QUEUE.TEXT_MAX),
      startedAt: toIsoOrEmpty(raw.startedAt),
      finishedAt: toIsoOrEmpty(raw.finishedAt),
      updatedAt: toIsoOrEmpty(raw.updatedAt)
    };
  }

  // Gumagawa ng status ng sariling machine; updatedAt ay ang oras ngayon (heartbeat).
  function buildStatus(identity, fields, nowMs) {
    return normalizeStatus({ ...fields, machineName: identity.machineName, machineMode: identity.machineMode, updatedAt: new Date(nowMs).toISOString() });
  }

  // Wala lang ba ang folder? (Iba ito sa pumalyang server; ang pumalya ay hindi itinuturing na walang laman.)
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  // Binabasa ang isang JSON file sa folder (null kung wala, sira, o masyadong malaki).
  async function readEntryJson(entry) {
    try {
      const file = await entry.getFile();
      if (typeof file.size === 'number' && file.size > QUEUE.FILE_MAX_BYTES) return null;
      return { data: JSON.parse(await file.text()), modifiedMs: file.lastModified };
    } catch (error) {
      return null;
    }
  }

  // Mga JSON file sa folder, hindi lalampas sa MAX_FILES (laktaw ang reserved na file).
  async function listJsonEntries(folder) {
    const entryList = [];
    for await (const entry of folder.values()) {
      const lowerName = entry.name.toLowerCase();
      if (entry.kind !== 'file' || !lowerName.endsWith(CONFIG.MACHINE_FILE.EXTENSION)) continue;
      if (CONFIG.MACHINE_FILE.RESERVED_FILES.includes(lowerName)) continue;
      entryList.push(entry);
      if (entryList.length >= QUEUE.MAX_FILES) break;
    }
    return entryList;
  }

  // Sinusulat ang status ng sariling machine sa <Server path>\queue\<machine name>.json (ginagawa ang subfolder kung wala).
  async function writeQueueStatus(serverHandle, status) {
    const clean = normalizeStatus(status);
    if (!clean) throw new Error('invalid-status');
    const folder = await serverHandle.getDirectoryHandle(QUEUE.SUBFOLDER, { create: true });
    const file = await folder.getFileHandle(storage.toMachineFileName(clean.machineName), { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(clean, null, 2));
    await writable.close();
    return clean;
  }

  // Binubura ang status ng isang machine sa queue. Ibinibigay ang false kung wala o pumalya.
  async function removeQueueStatus(serverHandle, machineName) {
    try {
      const folder = await serverHandle.getDirectoryHandle(QUEUE.SUBFOLDER);
      await folder.removeEntry(storage.toMachineFileName(machineName));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Binabasa ang lahat ng status sa queue: [{status, fileName, modifiedMs}]. Walang queue folder = walang laman; ang pumalyang server ay nagtatapon ng error (hinuhuli ng loadSnapshot).
  async function readQueueList(serverHandle) {
    let folder;
    try {
      folder = await serverHandle.getDirectoryHandle(QUEUE.SUBFOLDER);
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
    const result = [];
    for (const entry of await listJsonEntries(folder)) {
      const read = await readEntryJson(entry);
      const status = read ? normalizeStatus(read.data) : null;
      if (status) result.push({ status, fileName: entry.name, modifiedMs: read.modifiedMs });
    }
    return result;
  }

  // Binabasa ang mga naka-register na machine sa <Server path>\settings (hindi isinasama ang LEAD PC): [{machineName, machineMode, fileName}]
  async function readMachineList(serverHandle) {
    let folder;
    try {
      folder = await serverHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
    const result = [];
    for (const entry of await listJsonEntries(folder)) {
      const read = await readEntryJson(entry);
      const machineName = read && read.data && typeof read.data.machineName === 'string' ? sanitizeInput(read.data.machineName, CONFIG.MACHINE_NAME_MAX) : '';
      if (!machineName || read.data.machineMode === CONFIG.MACHINE_MODE.LEAD_PC) continue;
      result.push({ machineName, machineMode: CONFIG.MACHINE_MODE.USER_INPUT, fileName: entry.name });
    }
    return result;
  }

  // Active, stale (matagal nang walang update), o noStatus (walang queue file). Ang oras ng file sa server ang inuuna.
  function getPresence(queueItem, nowMs) {
    if (!queueItem) return QUEUE.PRESENCE.noStatus;
    const updatedMs = queueItem.modifiedMs || Date.parse(queueItem.status.updatedAt);
    if (!updatedMs || Number.isNaN(updatedMs) || nowMs - updatedMs > QUEUE.STALE_MS) return QUEUE.PRESENCE.stale;
    return QUEUE.PRESENCE.active;
  }

  // Pinagsasama ang naka-register na machine at ang queue. Ang machine na nasa queue lang ay kasama pa rin (registered: false).
  function combineMachines(machineList, queueList, nowMs) {
    const queueMap = new Map(queueList.map((item) => [item.status.machineName.toLowerCase(), item]));
    const itemMap = new Map();
    machineList.forEach((machine) => {
      const key = machine.machineName.toLowerCase();
      itemMap.set(key, { machineName: machine.machineName, registered: true, queueItem: queueMap.get(key) || null });
    });
    queueList.forEach((item) => {
      const key = item.status.machineName.toLowerCase();
      if (!itemMap.has(key)) itemMap.set(key, { machineName: item.status.machineName, registered: false, queueItem: item });
    });
    return [...itemMap.values()]
      .map((item) => ({
        machineName: item.machineName,
        registered: item.registered,
        status: item.queueItem ? item.queueItem.status : null,
        modifiedMs: item.queueItem ? item.queueItem.modifiedMs : 0,
        presence: getPresence(item.queueItem, nowMs)
      }))
      .sort((first, second) => first.machineName.localeCompare(second.machineName, undefined, { numeric: true, sensitivity: 'base' }));
  }

  // Bilang ng machine: total, active, stale, noStatus, ongoing, done (ongoing/done ay mula sa active lang).
  function summarize(machineItemList) {
    const summary = { total: machineItemList.length, active: 0, stale: 0, noStatus: 0, ongoing: 0, done: 0 };
    machineItemList.forEach((item) => {
      summary[item.presence] += 1;
      if (item.presence === QUEUE.PRESENCE.active && item.status) {
        if (item.status.state === QUEUE.STATE.ongoing) summary.ongoing += 1;
        if (item.status.state === QUEUE.STATE.done) summary.done += 1;
      }
    });
    return summary;
  }

  // Kinukuha ang hawak ng Server path at permission nito. Ang shouldRequest ay true lang kapag galing sa click.
  async function findServerHandle(shouldRequest) {
    if (!storage.isFolderAccessSupported()) return { handle: null, state: CONNECTION.unsupported };
    const handle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.SERVER_KEY]);
    if (!handle) return { handle: null, state: CONNECTION.noFolder };
    const isAllowed = await storage.hasPermission(handle, shouldRequest === true);
    return { handle, state: isAllowed ? CONNECTION.ok : CONNECTION.noPermission };
  }

  // Kinukuha ang buong larawan ng mga machine para sa Dashboard. Hindi nagtatapon ng error.
  async function loadSnapshot(shouldRequest, nowMs) {
    let found = { handle: null, state: CONNECTION.error };
    try {
      found = await findServerHandle(shouldRequest);
      if (found.state !== CONNECTION.ok) return { state: found.state, handle: found.handle, machineItemList: [], summary: summarize([]) };
      const [machineList, queueList] = await Promise.all([readMachineList(found.handle), readQueueList(found.handle)]);
      const machineItemList = combineMachines(machineList, queueList, nowMs);
      return { state: CONNECTION.ok, handle: found.handle, machineItemList, summary: summarize(machineItemList) };
    } catch (error) {
      return { state: CONNECTION.error, handle: found.handle, machineItemList: [], summary: summarize([]) };
    }
  }

  root.queue = Object.freeze({ normalizeStatus, buildStatus, writeQueueStatus, removeQueueStatus, readQueueList, readMachineList, getPresence, combineMachines, summarize, findServerHandle, loadSnapshot });
})();
