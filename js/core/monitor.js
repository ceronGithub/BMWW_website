/*
 * FILE    : js/core/monitor.js
 * PURPOSE : Monitor ng Data source 1, 2, 3 ng sariling machine (not-LEAD PC): nakikita ang ongoing/done at nagsusulat ng status sa <Server path>\queue
 * DEPENDS : js/core/config.js, js/core/security.js, js/core/storage.js, js/core/queue.js, js/core/csv-reader.js
 * VERSION : v5.2 | 2026-11-21 | bagong file (Task 1C)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MONITOR = CONFIG.MONITOR;
  const QUEUE = CONFIG.QUEUE;
  const STATE = MONITOR.STATE;
  const storage = root.storage;
  const queue = root.queue;
  const csv = root.csv;
  const { sanitizeInput } = root.security;

  let context = null;
  let timerId = null;
  let isPolling = false;
  let monitorState = STATE.stopped;
  let lastWriteMs = 0;
  let lastWrittenKey = '';
  let lastWrittenName = '';
  let lastError = '';
  let settingsKey = '';
  const sourceMap = {};

  // Walang laman na state ng isang source.
  function createSourceState() {
    return { snapshot: null, recentNew: new Map(), state: QUEUE.STATE.idle, mode: QUEUE.MODE.idle, startedMs: 0, finishedMs: 0, lastActivityMs: 0, fileName: '', wafer: '', blk: '', layer: '', truncated: false, error: '' };
  }

  // Dapat bang laktawan ang pangalan (pansamantalang file).
  function isIgnoredName(name) {
    const lowerName = name.toLowerCase();
    return MONITOR.IGNORED_PREFIXES.some((prefix) => lowerName.startsWith(prefix.toLowerCase()))
      || MONITOR.IGNORED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  }

  // Hinahati ang pangalan (hal. 4A05520A) sa Wafer, Blk at Layer. Walang laman kung hindi tumama.
  function parseName(itemName) {
    const matched = CONFIG.LOT.NAME_PATTERN.exec(itemName);
    if (!matched) return { wafer: '', blk: '', layer: '' };
    return { wafer: matched[1].toUpperCase(), layer: matched[2], blk: matched[3].toUpperCase() };
  }

  // Binabasa ang folder at subfolder (basa lang): {entryMap(path -> {kind, modifiedMs, size}), truncated}.
  async function scanSource(directoryHandle) {
    const entryMap = new Map();
    let truncated = false;
    async function walk(handle, relativePath, depth) {
      for await (const entry of handle.values()) {
        if (entryMap.size >= MONITOR.MAX_ENTRIES) { truncated = true; return; }
        if (isIgnoredName(entry.name)) continue;
        const entryPath = relativePath + '/' + entry.name;
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          entryMap.set(entryPath, { kind: 'file', modifiedMs: file.lastModified, size: file.size });
        } else {
          entryMap.set(entryPath, { kind: 'folder', modifiedMs: 0, size: 0 });
          if (depth < CONFIG.LOT.MAX_DEPTH) await walk(entry, entryPath, depth + 1);
        }
      }
    }
    await walk(directoryHandle, '', 1);
    return { entryMap, truncated };
  }

  // Ikinukumpara ang dalawang scan: bagong file, bagong folder, nabago (oras o laki), at nawala.
  function diffSnapshots(previous, current) {
    const diff = { newFiles: [], newFolders: [], changed: [], removed: [] };
    current.forEach((entry, entryPath) => {
      const before = previous.get(entryPath);
      if (!before) { (entry.kind === 'file' ? diff.newFiles : diff.newFolders).push(entryPath); return; }
      if (entry.kind === 'file' && (entry.modifiedMs !== before.modifiedMs || entry.size !== before.size)) diff.changed.push(entryPath);
    });
    previous.forEach((entry, entryPath) => { if (!current.has(entryPath)) diff.removed.push(entryPath); });
    return diff;
  }

  // Ang path na may pinakabagong oras sa listahan.
  function latestPath(pathList, entryMap) {
    let best = '';
    pathList.forEach((entryPath) => {
      if (!best || entryMap.get(entryPath).modifiedMs >= entryMap.get(best).modifiedMs) best = entryPath;
    });
    return best;
  }

  // Pangalan ng file mula sa path.
  function baseName(entryPath) {
    return entryPath.slice(entryPath.lastIndexOf('/') + 1);
  }

  // Ang bagong file na kasusulat pa lang ay patuloy na nagbabago (laki/oras); huwag itong ituring na bagong ongoing sa loob ng SETTLE_MS.
  function settleDiff(recentNew, diff, nowMs) {
    diff.changed = diff.changed.filter((entryPath) => !(recentNew.has(entryPath) && nowMs - recentNew.get(entryPath) < MONITOR.SETTLE_MS));
    diff.newFiles.forEach((entryPath) => recentNew.set(entryPath, nowMs));
    recentNew.forEach((addedMs, entryPath) => { if (nowMs - addedMs >= MONITOR.SETTLE_MS) recentNew.delete(entryPath); });
  }

  // Ina-update ang state ng isang source ayon sa pagbabago. Ang mode ng source1 ay galing sa context.detectedMode (Calibration o Master).
  // source2/source3: bagong file = DONE; ibang pagbabago = ONGOING. source1: anumang pagbabago = ONGOING; walang DONE.
  function evaluateSource(sourceKey, previousState, diff, currentMap, nowMs, detectedMode) {
    const next = { ...previousState };
    const hasNewFile = diff.newFiles.length > 0;
    const hasActivity = hasNewFile || diff.newFolders.length > 0 || diff.changed.length > 0 || diff.removed.length > 0;
    const fixedMode = MONITOR.SOURCE_MODE[sourceKey];
    const mode = fixedMode === 'auto' ? detectedMode || QUEUE.MODE.calibration : fixedMode;
    if (sourceKey !== 'source1' && hasNewFile) {
      const newest = baseName(latestPath(diff.newFiles, currentMap));
      return { ...next, state: QUEUE.STATE.done, mode, startedMs: previousState.state === QUEUE.STATE.ongoing ? previousState.startedMs : nowMs, finishedMs: nowMs, lastActivityMs: nowMs, fileName: newest, ...parseName(newest) };
    }
    if (hasActivity) {
      const touched = diff.changed.length ? diff.changed : diff.newFiles;
      const name = touched.length ? baseName(latestPath(touched, currentMap)) : previousState.fileName;
      return { ...next, state: QUEUE.STATE.ongoing, mode, startedMs: previousState.state === QUEUE.STATE.ongoing ? previousState.startedMs : nowMs, finishedMs: 0, lastActivityMs: nowMs, fileName: name, ...parseName(name) };
    }
    if (previousState.state === QUEUE.STATE.ongoing && nowMs - previousState.lastActivityMs > MONITOR.ONGOING_TIMEOUT_MS[sourceKey]) {
      return { ...next, state: QUEUE.STATE.idle, mode: QUEUE.MODE.idle, startedMs: 0, finishedMs: 0 };
    }
    return next;
  }

  // Pinipili kung aling source ang ipapakita ng machine: ang pinakabagong ongoing; kung wala, ang pinakabagong done; kung wala, idle.
  function chooseOverall(stateMap) {
    const list = MONITOR.SOURCE_KEYS.map((key) => ({ key, item: stateMap[key] })).filter((entry) => entry.item && entry.item.state !== QUEUE.STATE.idle);
    const latest = (state) => list.filter((entry) => entry.item.state === state).sort((first, second) => second.item.lastActivityMs - first.item.lastActivityMs)[0];
    const chosen = latest(QUEUE.STATE.ongoing) || latest(QUEUE.STATE.done);
    if (!chosen) return { mode: QUEUE.MODE.idle, state: QUEUE.STATE.idle, source: QUEUE.SOURCE.none, fileName: '', wafer: '', blk: '', layer: '', barcode: '', startedAt: '', finishedAt: '' };
    const item = chosen.item;
    return {
      mode: item.mode, state: item.state, source: chosen.key, fileName: item.fileName, wafer: item.wafer, blk: item.blk, layer: item.layer, barcode: '',
      startedAt: item.startedMs ? new Date(item.startedMs).toISOString() : '', finishedAt: item.finishedMs ? new Date(item.finishedMs).toISOString() : ''
    };
  }

  // Binabasa (basa lang) ang pinakabagong CSV ng Calib folder; 15 headers = Master, kung hindi Calibration.
  async function detectCalibMode(directoryHandle) {
    try {
      const { fileList } = await csv.listCsvFiles(directoryHandle);
      if (!fileList.length) return QUEUE.MODE.calibration;
      fileList.sort((first, second) => second.modifiedAt - first.modifiedAt);
      const rowList = await csv.readCsvRows(fileList[0].file);
      return csv.countHeaders(rowList) === CONFIG.MASTER.HEADER_COUNT ? QUEUE.MODE.master : QUEUE.MODE.calibration;
    } catch (error) {
      return QUEUE.MODE.calibration;
    }
  }

  // Binabasa ang pagkakakilanlan ng machine at ang mga handle (hindi humihingi ng permission maliban kung galing sa click).
  async function loadContext(shouldRequest) {
    const settings = storage.readLocalSettings();
    const machineName = sanitizeInput(settings.machineName || '', CONFIG.MACHINE_NAME_MAX);
    const machineMode = settings.machineMode;
    if (!storage.isFolderAccessSupported()) return { state: STATE.unsupported };
    if (!machineName || machineMode !== CONFIG.MACHINE_MODE.USER_INPUT) return { state: STATE.notApplicable };
    const found = await queue.findServerHandle(shouldRequest);
    const sourceHandles = {};
    for (const key of MONITOR.SOURCE_KEYS) {
      try {
        const handle = await storage.loadHandle(CONFIG.HANDLE_KEY[key]);
        if (handle && (await storage.hasPermission(handle, shouldRequest === true))) sourceHandles[key] = handle;
      } catch (error) {
        // Hindi mabasa ang handle na ito: laktawan.
      }
    }
    if (!Object.keys(sourceHandles).length) return { state: STATE.noSource, machineName, machineMode };
    if (found.state === CONFIG.QUEUE.CONNECTION.noFolder) return { state: STATE.noServer, machineName, machineMode, sourceHandles };
    if (found.state !== CONFIG.QUEUE.CONNECTION.ok) return { state: STATE.noPermission, machineName, machineMode, sourceHandles };
    return { state: STATE.running, machineName, machineMode, sourceHandles, serverHandle: found.handle };
  }

  // Isang ikot: basa ng bawat source, update ng state, sulat ng status sa queue kapag may pagbabago o oras na ng heartbeat.
  async function pollOnce(nowMs) {
    if (!context || context.state !== STATE.running) return;
    for (const key of MONITOR.SOURCE_KEYS) {
      const handle = context.sourceHandles[key];
      const previous = sourceMap[key] || createSourceState();
      sourceMap[key] = previous;
      if (!handle) continue;
      try {
        const scan = await scanSource(handle);
        previous.truncated = scan.truncated;
        previous.error = '';
        if (!previous.snapshot) { previous.snapshot = scan.entryMap; continue; }
        const diff = diffSnapshots(previous.snapshot, scan.entryMap);
        settleDiff(previous.recentNew, diff, nowMs);
        const hasActivity = diff.newFiles.length || diff.newFolders.length || diff.changed.length || diff.removed.length;
        const detectedMode = key === 'source1' && hasActivity ? await detectCalibMode(handle) : '';
        const next = evaluateSource(key, previous, diff, scan.entryMap, nowMs, detectedMode);
        next.snapshot = scan.entryMap;
        sourceMap[key] = next;
      } catch (error) {
        previous.error = 'read';
      }
    }
    await writeStatus(nowMs);
  }

  // Sinusulat ang status sa queue kung nagbago o oras na ng heartbeat. Kapag pumalya, subukan ulit sa susunod na ikot.
  async function writeStatus(nowMs) {
    const overall = chooseOverall(sourceMap);
    const key = JSON.stringify(overall);
    const isChanged = key !== lastWrittenKey;
    if (!isChanged && nowMs - lastWriteMs < QUEUE.HEARTBEAT_MS) return;
    try {
      const status = queue.buildStatus({ machineName: context.machineName, machineMode: context.machineMode }, overall, nowMs);
      await queue.writeQueueStatus(context.serverHandle, status);
      if (lastWrittenName && lastWrittenName.toLowerCase() !== context.machineName.toLowerCase()) await queue.removeQueueStatus(context.serverHandle, lastWrittenName);
      lastWrittenName = context.machineName;
      lastWrittenKey = key;
      lastWriteMs = nowMs;
      lastError = '';
    } catch (error) {
      lastError = 'write';
    }
  }

  // Ikot ng timer. Hindi nag-o-overlap at hindi nagtatapon ng error.
  async function tick() {
    if (isPolling) return;
    isPolling = true;
    try {
      const currentKey = JSON.stringify(storage.readLocalSettings());
      if (currentKey !== settingsKey) await start(false);
      await pollOnce(Date.now());
    } catch (error) {
      monitorState = STATE.error;
    } finally {
      isPolling = false;
    }
  }

  // Sinisimulan ang monitor. Hindi nagtatapon ng error; ibinibigay ang state. shouldRequest = true lang kapag galing sa click.
  async function start(shouldRequest) {
    stop();
    settingsKey = JSON.stringify(storage.readLocalSettings());
    try {
      context = await loadContext(shouldRequest === true);
      monitorState = context.state;
    } catch (error) {
      context = null;
      monitorState = STATE.error;
    }
    MONITOR.SOURCE_KEYS.forEach((key) => { sourceMap[key] = createSourceState(); });
    lastWrittenKey = '';
    lastWriteMs = 0;
    timerId = window.setInterval(tick, MONITOR.POLL_MS);
    if (context && context.state === STATE.running) await pollOnce(Date.now());
    return monitorState;
  }

  // Itinitigil ang timer.
  function stop() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }

  // Ang kasalukuyang kalagayan ng monitor (para sa Dashboard at pag-debug): walang snapshot, buod lang.
  function getState() {
    const sources = {};
    MONITOR.SOURCE_KEYS.forEach((key) => {
      const item = sourceMap[key];
      sources[key] = item ? { state: item.state, mode: item.mode, fileName: item.fileName, wafer: item.wafer, blk: item.blk, layer: item.layer, entryCount: item.snapshot ? item.snapshot.size : 0, truncated: item.truncated, error: item.error } : null;
    });
    return { state: monitorState, machineName: context ? context.machineName || '' : '', lastWriteMs, lastError, sources };
  }

  root.monitor = Object.freeze({ isIgnoredName, parseName, diffSnapshots, evaluateSource, settleDiff, chooseOverall, scanSource, detectCalibMode, start, stop, getState });
})();
