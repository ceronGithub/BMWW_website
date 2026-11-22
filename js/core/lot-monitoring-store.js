/*
 * FILE    : js/core/lot-monitoring-store.js
 * PURPOSE : Monitoring ng LOT Tracking: isang row kada LOT Unit; JSON (source of truth) at Excel sa Saving path at Server path
 * DEPENDS : js/core/config.js, js/core/storage.js, js/core/lot-config.js, js/core/lot-shift.js, js/core/lot-monitoring-export.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 2)
 * VERSION : v2 | 2026-11-23 | Yugto 3: dagdag na getUnitList, setRemarks, hasFinalMeas (para sa Remarks at On hold)
 * VERSION : v3 | 2026-11-23 | Yugto 4: dagdag na markSent at getSentStatus (Sent Status at Sent Time)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MON = root.lotConfig.MONITORING;
  const lotShift = root.lotShift;
  const exporter = root.lotMonitoringExport;
  const storage = root.storage;

  const docMap = new Map();
  const writeStateMap = new Map();
  let handleMap = {};
  let isHandleLoaded = false;
  let machineName = '';

  // Susi ng doc sa memorya: machine at monitoring day.
  function buildDocKey(machine, startMs) {
    return machine + '|' + lotShift.getMonitoringDay(startMs).iso;
  }

  // Walang laman na doc ng isang araw.
  function createEmptyDoc(machine, startMs) {
    return { version: MON.VERSION, machine, monitoringDay: lotShift.getMonitoringDay(startMs).iso, updatedMs: 0, rows: [] };
  }

  // Row na may lahat ng 16 na field (text, time at number ay nililinis; galing ito sa file kaya hindi pinagkakatiwalaan).
  function normalizeRow(rawRow) {
    const source = rawRow && typeof rawRow === 'object' ? rawRow : {};
    const row = {};
    MON.COLUMN_LIST.forEach((column) => {
      const value = source[column.field];
      if (column.type === 'text') row[column.field] = typeof value === 'string' ? value.slice(0, MON.TEXT_MAX) : '';
      else row[column.field] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    });
    return row;
  }

  // Doc mula sa nabasang JSON; null kung hindi tama ang version o anyo.
  function normalizeDoc(rawDoc) {
    if (!rawDoc || typeof rawDoc !== 'object' || rawDoc.version !== MON.VERSION || !Array.isArray(rawDoc.rows)) return null;
    return {
      version: MON.VERSION,
      machine: typeof rawDoc.machine === 'string' ? rawDoc.machine : '',
      monitoringDay: typeof rawDoc.monitoringDay === 'string' ? rawDoc.monitoringDay : '',
      updatedMs: typeof rawDoc.updatedMs === 'number' ? rawDoc.updatedMs : 0,
      rows: rawDoc.rows.slice(0, MON.ROWS_MAX).map(normalizeRow)
    };
  }

  // Kinukuha ang folder handle ng Saving path at Server path (isang beses lang).
  async function loadHandles() {
    if (isHandleLoaded) return;
    handleMap = {};
    if (storage.isFolderAccessSupported()) {
      for (const targetKey of Object.keys(MON.TARGET)) {
        try {
          handleMap[targetKey] = (await storage.loadHandle(CONFIG.HANDLE_KEY[MON.TARGET[targetKey].handleKey])) || null;
        } catch (error) {
          handleMap[targetKey] = null;
        }
      }
    }
    isHandleLoaded = true;
  }

  // Humihingi ng permission sa Saving path at Server path. Tinatawag lang kapag may kilos ng user (Enter).
  async function requestAccess() {
    await loadHandles();
    for (const targetKey of Object.keys(handleMap)) {
      if (!handleMap[targetKey]) continue;
      try {
        await storage.hasPermission(handleMap[targetKey], true);
      } catch (error) {
        // Hindi napayagan: lalabas bilang babala kapag magsusulat.
      }
    }
  }

  // Pangalan ng folder ng machine sa Server path (ligtas na pangalan, walang .json).
  function getMachineFolderName(machine) {
    return storage.toMachineFileName(machine).slice(0, -CONFIG.MACHINE_FILE.EXTENSION.length);
  }

  // Folder ng monitoring: <Saving path>\monitoring o <Server path>\monitoring\<machine>.
  async function getTargetFolder(handle, targetKey, machine, shouldCreate) {
    const options = { create: shouldCreate === true };
    const monitoringFolder = await handle.getDirectoryHandle(MON.FOLDER, options);
    return targetKey === 'server' ? monitoringFolder.getDirectoryHandle(getMachineFolderName(machine), options) : monitoringFolder;
  }

  // Binabasa ang JSON ng araw sa isang target. Ibinabalik { isChecked, doc }: isChecked = may permission at nasuri ang folder.
  async function readFromTarget(targetKey, machine, startMs) {
    const handle = handleMap[targetKey];
    if (!handle) return { isChecked: false, doc: null };
    let isAllowed = false;
    try {
      isAllowed = await storage.hasPermission(handle, false);
    } catch (error) {
      isAllowed = false;
    }
    if (!isAllowed) return { isChecked: false, doc: null };
    try {
      const folder = await getTargetFolder(handle, targetKey, machine, false);
      const fileHandle = await folder.getFileHandle(lotShift.getMonitoringDay(startMs).key + MON.JSON_SUFFIX);
      const text = await (await fileHandle.getFile()).text();
      return { isChecked: true, doc: normalizeDoc(JSON.parse(text)) };
    } catch (error) {
      return { isChecked: true, doc: null };
    }
  }

  // Inihahanda ang doc ng araw ng lote: binabasa ang JSON (Saving path muna, tapos Server path). Ibinabalik true kung handa na.
  // Kung may folder na naka-set pero walang permission, hindi ito itinatago (para hindi mapatungan ang file); susubukan ulit sa susunod.
  async function prepare(machine, startMs) {
    machineName = machine;
    await loadHandles();
    const docKey = buildDocKey(machine, startMs);
    if (docMap.has(docKey)) return true;
    let isVerified = Object.keys(handleMap).every((targetKey) => !handleMap[targetKey]);
    let foundDoc = null;
    for (const targetKey of Object.keys(MON.TARGET)) {
      const result = await readFromTarget(targetKey, machine, startMs);
      if (result.isChecked) isVerified = true;
      if (result.doc && !foundDoc) foundDoc = result.doc;
    }
    if (!isVerified) return false;
    docMap.set(docKey, foundDoc || createEmptyDoc(machine, startMs));
    return true;
  }

  // Doc ng lote (undefined kung hindi pa handa).
  function getDoc(lote) {
    return docMap.get(buildDocKey(machineName, lote.startMs));
  }

  // Mga index ng row ng block ng lote (parehong Barcode at Start).
  function getBlockIndexList(doc, lote) {
    const indexList = [];
    doc.rows.forEach((row, index) => {
      if (row.barcode === lote.barcode && row.startMs === lote.startMs) indexList.push(index);
    });
    return indexList;
  }

  // Bagong row ng block (walang LOT Unit pa): ONGOING, NOT SENT.
  function createRow(lote) {
    const row = normalizeRow({});
    row.barcode = lote.barcode;
    row.startMs = lote.startMs;
    row.operator = lote.operator;
    row.machine = machineName;
    row.status = MON.STATUS.ongoing;
    row.sentStatus = MON.SENT.notSent;
    row.shift = lotShift.getShift(lote.startMs);
    return row;
  }

  // Sinisiguradong may block ang lote; kapag wala, gumagawa ng row na walang LOT Unit. Ibinabalik ang mga index ng block.
  function ensureBlock(doc, lote) {
    let indexList = getBlockIndexList(doc, lote);
    if (indexList.length === 0) {
      doc.rows.push(createRow(lote));
      indexList = [doc.rows.length - 1];
    }
    return indexList;
  }

  // Pag-scan ng lote: gumagawa agad ng row. Ibinabalik true kung may nagbago.
  function startBlock(lote) {
    const doc = getDoc(lote);
    if (!doc) return false;
    const before = doc.rows.length;
    ensureBlock(doc, lote);
    return doc.rows.length !== before;
  }

  // Itinatala ang LOT Unit nang isang beses: pinupuno ang unang row na walang LOT Unit, o bagong row sa dulo ng block. Ibinabalik true kung may nagbago.
  function recordUnit(lote, unitRow) {
    const doc = getDoc(lote);
    if (!doc || !unitRow.unitName) return false;
    const indexList = ensureBlock(doc, lote);
    if (indexList.some((index) => doc.rows[index].lotUnit === unitRow.unitName)) return false;
    let target = indexList.map((index) => doc.rows[index]).find((row) => row.lotUnit === '');
    if (!target) {
      target = createRow(lote);
      doc.rows.splice(indexList[indexList.length - 1] + 1, 0, target);
    }
    target.wafer = unitRow.wafer;
    target.blk = unitRow.blk;
    target.layerNo = unitRow.layer;
    target.lotUnit = unitRow.unitName;
    target.filePath = unitRow.path;
    return true;
  }

  // I-DONE ang block: ang mga ONGOING ay nagiging DONE, End-Time = endMs, Lot Duration (minuto). Ibinabalik true kung may nagbago.
  function finishBlock(lote, endMs) {
    const doc = getDoc(lote);
    if (!doc) return false;
    const factor = Math.pow(10, MON.DURATION_DECIMALS);
    const durationMin = Math.round(((endMs - lote.startMs) / MON.MS_PER_MINUTE) * factor) / factor;
    let isChanged = false;
    ensureBlock(doc, lote).forEach((index) => {
      const row = doc.rows[index];
      if (row.status !== MON.STATUS.ongoing) return;
      row.endMs = endMs;
      row.status = MON.STATUS.done;
      row.lotDurationMin = durationMin;
      isChanged = true;
    });
    return isChanged;
  }

  /**
   * PARA SAAN    : ibigay ang mga LOT Unit ng block ng lote at ang Remarks nila (para sa Remarks dialog)
   * GINAGAWA     : kinokopya ang unit, wafer at remarks ng bawat row ng block na may LOT Unit
   * INPUT/OUTPUT : lote { barcode, startMs } -> [{ lotUnit, wafer, remarks }]
   * TINATAWAG NG : lot-tracking.js askPendingRemarks
   * TUMATAWAG SA : lot-monitoring-store.js getDoc, getBlockIndexList
   */
  function getUnitList(lote) {
    const doc = getDoc(lote);
    if (!doc) return [];
    return getBlockIndexList(doc, lote)
      .map((index) => doc.rows[index])
      .filter((row) => row.lotUnit !== '')
      .map((row) => ({ lotUnit: row.lotUnit, wafer: row.wafer, remarks: row.remarks }));
  }

  /**
   * PARA SAAN    : isulat ang Remarks ng isang LOT Unit sa monitoring
   * GINAGAWA     : hinahanap ang row ng unit sa block ng lote at nilalagay ang text (hanggang TEXT_MAX); hindi ito nagse-save sa file
   * INPUT/OUTPUT : (lote, unitName, text) -> bool (true kung may nagbago)
   * TINATAWAG NG : lot-tracking.js applyRemark
   * TUMATAWAG SA : lot-monitoring-store.js getDoc, getBlockIndexList
   */
  function setRemarks(lote, unitName, text) {
    const doc = getDoc(lote);
    if (!doc) return false;
    const index = getBlockIndexList(doc, lote).find((rowIndex) => doc.rows[rowIndex].lotUnit === unitName);
    if (index === undefined) return false;
    const value = String(text).slice(0, MON.TEXT_MAX);
    if (doc.rows[index].remarks === value) return false;
    doc.rows[index].remarks = value;
    return true;
  }

  /**
   * PARA SAAN    : may Final Meas. na ba ang wafer sa ibang row ng monitoring ng araw na ito
   * GINAGAWA     : hinahanap sa doc ng araw ng lote ang row na iba ang LOT Unit, pareho ang wafer at Remarks = Final Meas.
   * INPUT/OUTPUT : (lote, wafer, unitName) -> bool
   * TINATAWAG NG : lot-tracking.js applyRemark
   * TUMATAWAG SA : lot-monitoring-store.js getDoc
   */
  function hasFinalMeas(lote, wafer, unitName) {
    const doc = getDoc(lote);
    if (!doc || !wafer) return false;
    const finalLabel = root.lotConfig.REMARKS.OPTION_LIST.find((option) => option.key === root.lotConfig.REMARKS.FINAL_KEY).label;
    return doc.rows.some((row) => row.wafer === wafer && row.lotUnit !== unitName && row.remarks === finalLabel);
  }

  /**
   * PARA SAAN    : itala na naipadala sa Server path ang isang LOT Unit
   * GINAGAWA     : Sent Status = SENT at Sent Time = sentMs sa row ng unit; hindi ito nagse-save sa file
   * INPUT/OUTPUT : (lote, unitName, sentMs) -> bool (true kung may nagbago)
   * TINATAWAG NG : lot-tracking.js onSendClick
   * TUMATAWAG SA : lot-monitoring-store.js getDoc, getBlockIndexList
   */
  function markSent(lote, unitName, sentMs) {
    const doc = getDoc(lote);
    if (!doc) return false;
    const index = getBlockIndexList(doc, lote).find((rowIndex) => doc.rows[rowIndex].lotUnit === unitName);
    if (index === undefined) return false;
    doc.rows[index].sentStatus = MON.SENT.sent;
    doc.rows[index].sentMs = sentMs;
    return true;
  }

  /**
   * PARA SAAN    : alamin ang Sent Status ng isang LOT Unit (para sa button sa RESULT)
   * GINAGAWA     : binabasa ang row ng unit sa block ng lote
   * INPUT/OUTPUT : (lote, unitName) -> 'SENT' | 'NOT SENT' | '' (walang doc o walang row)
   * TINATAWAG NG : lot-tracking.js renderResults
   * TUMATAWAG SA : lot-monitoring-store.js getDoc, getBlockIndexList
   */
  function getSentStatus(lote, unitName) {
    const doc = getDoc(lote);
    if (!doc) return '';
    const index = getBlockIndexList(doc, lote).find((rowIndex) => doc.rows[rowIndex].lotUnit === unitName);
    return index === undefined ? '' : doc.rows[index].sentStatus;
  }

  // Isinusulat ang isang file (text o Blob) sa folder; kapag pumalya, inaabort ang sulat at ipinapasa ang error.
  async function writeFile(folder, fileName, content) {
    const fileHandle = await folder.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(content);
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { /* walang magagawa kung pumalya rin ang abort */ }
      throw error;
    }
    await writable.close();
  }

  // Isinusulat ang JSON at Excel sa isang target. Ibinabalik ang listahan ng babala (walang laman kung maayos).
  async function writeTarget(targetKey, doc, jsonText, blob) {
    const label = MON.TARGET[targetKey].label;
    const handle = handleMap[targetKey];
    if (!handle) return [label + MON.TEXT.noFolder];
    let isAllowed = false;
    try {
      isAllowed = await storage.hasPermission(handle, false);
    } catch (error) {
      isAllowed = false;
    }
    if (!isAllowed) return [label + MON.TEXT.noPermission];
    const warningList = [];
    const dayKey = lotShift.toFileKey(doc.monitoringDay);
    let folder = null;
    try {
      folder = await getTargetFolder(handle, targetKey, doc.machine, true);
    } catch (error) {
      return [label + MON.TEXT.jsonError];
    }
    try {
      await writeFile(folder, dayKey + MON.JSON_SUFFIX, jsonText);
    } catch (error) {
      warningList.push(label + MON.TEXT.jsonError);
    }
    if (blob) {
      try {
        await writeFile(folder, dayKey + MON.XLSX_SUFFIX, blob);
      } catch (error) {
        warningList.push(label + MON.TEXT.excelError);
      }
    }
    return warningList;
  }

  // Isinusulat ang doc sa lahat ng target. Ang Server path na pumalya ay hindi hadlang sa Saving path (at kabaliktaran).
  async function writeAll(doc) {
    doc.updatedMs = Date.now();
    const jsonText = JSON.stringify(doc, null, MON.JSON_INDENT);
    const warningList = [];
    let blob = null;
    try {
      blob = exporter.buildBlob(doc);
    } catch (error) {
      warningList.push(MON.TEXT.buildError);
    }
    for (const targetKey of Object.keys(MON.TARGET)) {
      (await writeTarget(targetKey, doc, jsonText, blob)).forEach((warning) => warningList.push(warning));
    }
    return warningList;
  }

  // Sunud-sunod na sulat: kapag may sulat na tumatakbo, isang karagdagang sulat lang ang ipapila (laman ang pinakabago).
  async function runWriteLoop(docKey, state) {
    let warningList = [];
    try {
      while (state.isDirty) {
        state.isDirty = false;
        warningList = await writeAll(docMap.get(docKey));
      }
    } catch (error) {
      warningList = [MON.TEXT.buildError];
    } finally {
      state.isRunning = false;
    }
    return warningList;
  }

  // Sine-save ang monitoring ng araw ng lote. Hindi nagtatapon ng error; ibinabalik ang listahan ng babala.
  function save(lote) {
    const docKey = buildDocKey(machineName, lote.startMs);
    if (!docMap.has(docKey)) return Promise.resolve([MON.TEXT.notLoaded]);
    let state = writeStateMap.get(docKey);
    if (!state) {
      state = { isRunning: false, isDirty: false, promise: null };
      writeStateMap.set(docKey, state);
    }
    state.isDirty = true;
    if (state.isRunning) return state.promise;
    state.isRunning = true;
    state.promise = runWriteLoop(docKey, state);
    return state.promise;
  }

  root.lotMonitoringStore = Object.freeze({ prepare, requestAccess, startBlock, recordUnit, finishBlock, getUnitList, setRemarks, hasFinalMeas, markSent, getSentStatus, save });
})();
