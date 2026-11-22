/*
 * FILE    : js/pages/lot-tracking.js
 * PURPOSE : LOT Tracking: Barcode -> Operator -> simula ng lote; binabantayan ang bagong file/folder sa mga Data source ng Settings
 * DEPENDS : js/core/config.js, js/core/registry.js, js/core/security.js, js/core/storage.js, js/core/lot-config.js, js/core/lot-unit-collector.js, js/core/lot-active-store.js, js/core/lot-validation.js, js/core/lot-beep.js, js/core/lot-monitoring-store.js, js/core/lot-remarks.js, js/core/lot-onhold.js
 * USED BY : pages/lot-tracking.html (script tag), js/templates/lot-tracking.template.js
 * VERSION : v2.5 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-22 | Yugto 1: isang row kada LOT Unit (X at X_Time), Unang nakita, at pag-save/pagbalik ng aktibong lote
 * VERSION : v2.7 | 2026-11-22 | Yugto 1: Barcode uppercase, check ng Operator, Esc sa Operator = Cancel, beep sa END, Data source 2 at 3 lang (lotConfig.SOURCE.KEYS)
 * VERSION : v2.8 | 2026-11-23 | Yugto 2: monitoring (row sa pag-scan, LOT Unit, auto-DONE kapag END, iba ang barcode o NEW LOTE), JSON at Excel sa Saving path at Server path
 * VERSION : v2.9 | 2026-11-23 | Yugto 3: Remarks dialog kada LOT Unit, babala sa Final Meas., On hold (hold file sa Server path at Saving path), tanggal ng hold kapag nagsimula ulit ang barcode
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const LOT = CONFIG.LOT;
  const SEL = LOT.SELECTOR;
  const TEXT = LOT.TEXT;
  const storage = root.storage;
  const { sanitizeInput } = root.security;
  const LOT_CONFIG = root.lotConfig;
  const unitCollector = root.lotUnitCollector;
  const activeStore = root.lotActiveStore;
  const validation = root.lotValidation;
  const beep = root.lotBeep;
  const monitor = root.lotMonitoringStore;
  const MONITORING = LOT_CONFIG.MONITORING;
  const REMARKS = LOT_CONFIG.REMARKS;
  const remarks = root.lotRemarks;
  const onhold = root.lotOnhold;

  let lote = createEmptyLote();
  let pendingBarcode = '';
  let sourceList = [];
  let timerId = null;
  let isScanning = false;
  let firstSeenMap = {};
  let currentMachine = '';
  let monitorWarningList = [];
  let lastScan = { rowList: [], warningList: [] };
  let isAskingRemarks = false;

  // Walang laman na lote (barcode, operator, simula, wakas sa milliseconds).
  function createEmptyLote() {
    return { barcode: '', operator: '', startMs: 0, endMs: 0 };
  }

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  // Aktibo ba ang lote: may simula at wala pang wakas.
  function isActive() {
    return lote.startMs > 0 && lote.endMs === 0;
  }

  // Sine-save ang aktibong lote at ang talaan ng unang nakita (para sa pag-refresh ng page).
  function saveActive() {
    activeStore.save({ machine: currentMachine, lote, firstSeen: firstSeenMap });
  }

  // Ibinabalik ang aktibong lote ng machine na ito pagkatapos mag-refresh ng page. Hindi ginagalaw kung may lote na sa memory.
  function restoreActiveLote() {
    if (lote.startMs > 0) return;
    const saved = activeStore.load(currentMachine);
    if (!saved) return;
    lote = saved.lote;
    firstSeenMap = saved.firstSeen;
  }

  // Dalawang digit na numero (hal. 5 -> 05).
  function pad(number) {
    return String(number).padStart(2, '0');
  }

  // Petsa bilang yyyy-mm-dd (walang laman kung 0).
  function formatDate(ms) {
    if (!ms) return '';
    const date = new Date(ms);
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  // Oras bilang hh:mm:ss (walang laman kung 0).
  function formatTime(ms) {
    if (!ms) return '';
    const date = new Date(ms);
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  // Petsa at oras bilang yyyy-mm-dd hh:mm:ss.
  function formatDateTime(ms) {
    return formatDate(ms) + ' ' + formatTime(ms);
  }

  // Nagpapakita ng status (error o success).
  function setStatus(message, isError) {
    const element = query('status');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', isError);
    element.classList.toggle('is-success', !isError);
  }

  // Nagpapakita ng tala sa ibabaw ng RESULT.
  function setResultNote(message) {
    const element = query('resultNote');
    if (element) element.textContent = message;
  }

  // Inilalagay ang laman ng lote sa form at ang badge (ONGOING, DONE o walang lote).
  function renderLote() {
    if (lote.barcode) {
      query('barcode').value = lote.barcode;
      query('operator').value = lote.operator;
    }
    query('startDate').value = formatDate(lote.startMs);
    query('startTime').value = formatTime(lote.startMs);
    query('endDate').value = formatDate(lote.endMs);
    query('endTime').value = formatTime(lote.endMs);
    const badge = query('badge');
    const isDone = Boolean(lote.barcode) && lote.endMs > 0;
    badge.textContent = isActive() ? TEXT.stateOngoing : isDone ? TEXT.stateDone : TEXT.stateIdle;
    badge.className = 'badge ' + (isActive() ? CONFIG.BADGE.info : isDone ? CONFIG.BADGE.ok : CONFIG.BADGE.empty);
  }

  // Hinahati ang pangalan (hal. 4A05520A) sa Wafer, Blk at Layer. Walang laman kung hindi tumama.
  function parseName(itemName) {
    const matched = LOT.NAME_PATTERN.exec(itemName);
    if (!matched) return { wafer: '', blk: '', layer: '' };
    return { wafer: matched[1].toUpperCase(), layer: matched[2], blk: matched[3].toUpperCase() };
  }

  // Gumagawa ng isang item ng RESULT.
  function buildItem(sourceLabel, modifiedMs, path, name, type) {
    const parts = parseName(name);
    return { sourceLabel, modifiedMs, path, type, fileName: name, wafer: parts.wafer, blk: parts.blk, layer: parts.layer };
  }

  // Binabasa ang folder at mga subfolder (hanggang MAX_DEPTH) at kinukuha ang bagong file/folder.
  // Ibinabalik ang pinakabagong oras ng pagbabago sa loob ng folder. Basa lang, walang isinusulat.
  async function scanDirectory(directoryHandle, sourceLabel, relativePath, depth, earliestMs, itemList) {
    let newestMs = 0;
    try {
      for await (const entry of directoryHandle.values()) {
        const entryPath = relativePath + '/' + entry.name;
        if (entry.kind === 'file') {
          if (entry.name.startsWith(LOT.IGNORED_PREFIX)) continue;
          const modifiedMs = (await entry.getFile()).lastModified;
          if (modifiedMs > newestMs) newestMs = modifiedMs;
          if (modifiedMs >= earliestMs) itemList.push(buildItem(sourceLabel, modifiedMs, entryPath, entry.name, LOT.TYPE.file));
        } else if (depth < LOT.MAX_DEPTH) {
          const folderNewestMs = await scanDirectory(entry, sourceLabel, entryPath, depth + 1, earliestMs, itemList);
          if (folderNewestMs > newestMs) newestMs = folderNewestMs;
          if (folderNewestMs >= earliestMs) itemList.push(buildItem(sourceLabel, folderNewestMs, entryPath, entry.name, LOT.TYPE.folder));
        }
      }
    } catch (error) {
      // Hindi mabasa ang folder na ito (hal. walang permission): laktawan, tuloy ang iba.
    }
    return newestMs;
  }

  // Kinukuha ang mga folder handle ng Data source mula sa Settings (IndexedDB).
  async function loadSources() {
    sourceList = [];
    if (!storage.isFolderAccessSupported()) return;
    for (const key of LOT_CONFIG.SOURCE.KEYS) {
      try {
        const handle = await storage.loadHandle(CONFIG.HANDLE_KEY[key]);
        if (handle) sourceList.push({ key, label: LOT.SOURCE_LABEL[key], handle });
      } catch (error) {
        // Hindi mabasa ang handle na ito: laktawan.
      }
    }
  }

  // Humihingi ng permission sa bawat Data source. Tinatawag lang kapag may kilos ng user (Enter).
  async function requestAccess() {
    await monitor.requestAccess();
    for (const source of sourceList) {
      try {
        await storage.hasPermission(source.handle, true);
      } catch (error) {
        // Hindi napayagan: lalabas bilang babala sa RESULT.
      }
    }
  }

  // Inilalagay ang mga row (isa kada LOT Unit) sa talaan (textContent lang, walang innerHTML).
  function renderResults(rowList, warningList) {
    const shownList = rowList.slice(0, LOT.MAX_ROWS);
    const fragment = document.createDocumentFragment();
    shownList.forEach((item) => {
      const tableRow = document.createElement('tr');
      const cellList = [item.sourceLabel, item.unitName, formatDateTime(item.modifiedMs), formatDateTime(item.firstSeenMs), item.type, item.path, item.wafer, item.blk, item.layer, item.fileName];
      cellList.forEach((text, index) => {
        const cell = document.createElement('td');
        cell.textContent = text || LOT.EMPTY_CELL;
        if (index === LOT_CONFIG.RESULT.PATH_COLUMN) cell.className = 'lot-path';
        tableRow.append(cell);
      });
      fragment.append(tableRow);
    });
    query('resultBody').replaceChildren(fragment);
    let note = rowList.length === 0
      ? TEXT.waiting + formatDateTime(lote.startMs)
      : rowList.length + TEXT.found + formatDateTime(lote.startMs);
    if (rowList.length > LOT.MAX_ROWS) note += ' | ' + TEXT.showing + LOT.MAX_ROWS + '.';
    warningList.concat(monitorWarningList).forEach((warning) => { note += ' | ' + warning; });
    setResultNote(note);
  }

  // Nililinis ang RESULT.
  function clearResults() {
    const body = query('resultBody');
    if (body) body.replaceChildren();
    setResultNote('');
  }

  // Hinihintay ang tumatakbong hanap (hanggang FINISH_WAIT_MAX_MS) para kasama ang huling unit bago tapusin ang lote.
  async function waitForScan() {
    let waitedMs = 0;
    while (isScanning && waitedMs < MONITORING.FINISH_WAIT_MAX_MS) {
      await new Promise((resolve) => { window.setTimeout(resolve, MONITORING.FINISH_WAIT_MS); });
      waitedMs += MONITORING.FINISH_WAIT_MS;
    }
  }

  // Sine-save ang monitoring ng lote na nagsimula sa startMs; ang mga babala ay ipinapakita sa tala ng RESULT.
  function persistMonitoring(startMs) {
    return monitor.save({ startMs }).then((warningList) => {
      monitorWarningList = warningList;
      if (lote.startMs === startMs && query('resultBody')) renderResults(lastScan.rowList, lastScan.warningList);
    });
  }

  // Itinatala sa monitoring ang mga bagong LOT Unit ng aktibong lote (pinakaunang nakita muna). Ibinabalik true kung may nagbago.
  function recordNewUnits(rowList) {
    const unitList = rowList.filter((row) => row.unitName).sort((first, second) => first.firstSeenMs - second.firstSeenMs);
    let isChanged = false;
    unitList.forEach((unitRow) => {
      if (monitor.recordUnit(lote, unitRow)) isChanged = true;
    });
    return isChanged;
  }

  /**
   * PARA SAAN    : susi ng lote para sa talaan ng mga unit na natanong na
   * GINAGAWA     : Barcode at Start ng lote
   * INPUT/OUTPUT : lote -> text
   * TINATAWAG NG : lot-tracking.js askPendingRemarks
   * TUMATAWAG SA : wala
   */
  function getLoteKey(currentLote) {
    return currentLote.barcode + '|' + currentLote.startMs;
  }

  /**
   * PARA SAAN    : ilapat ang sagot sa Remarks dialog
   * GINAGAWA     : babala kung may Final Meas. na ang wafer; isinusulat ang Remarks sa monitoring; kung On hold, isinusulat ang hold file sa Server path at Saving path; tapos sine-save ang monitoring at ipinapakita ang status
   * INPUT/OUTPUT : (loteSnapshot, unit { lotUnit, wafer }, answer { key, type, text }) -> Promise<void>
   * TINATAWAG NG : lot-tracking.js askPendingRemarks
   * TUMATAWAG SA : lotMonitoringStore (hasFinalMeas, setRemarks), lotOnhold.write, persistMonitoring, setStatus
   */
  async function applyRemark(loteSnapshot, unit, answer) {
    const warningList = [];
    if (answer.key === REMARKS.FINAL_KEY && monitor.hasFinalMeas(loteSnapshot, unit.wafer, unit.lotUnit)) warningList.push(unit.lotUnit + REMARKS.TEXT.finalWarning);
    monitor.setRemarks(loteSnapshot, unit.lotUnit, answer.text);
    let message = REMARKS.TEXT.saved + unit.lotUnit + ': ' + answer.text;
    if (answer.type === 'hold') {
      const holdWarningList = await onhold.write({
        barcode: loteSnapshot.barcode, lotUnit: unit.lotUnit, wafer: unit.wafer, operator: loteSnapshot.operator,
        machine: currentMachine, pcName: currentMachine, timeMs: Date.now()
      });
      holdWarningList.forEach((warning) => warningList.push(REMARKS.TEXT.unitLabel.trim() + ' ' + unit.lotUnit + ' ' + LOT_CONFIG.ONHOLD.TEXT.prefix + warning));
      if (holdWarningList.length === 0) message = LOT_CONFIG.ONHOLD.TEXT.written;
    }
    persistMonitoring(loteSnapshot.startMs);
    if (warningList.length > 0) setStatus(warningList.join(' | '), true);
    else setStatus(message, false);
  }

  /**
   * PARA SAAN    : itanong ang Remarks ng bawat bagong LOT Unit, isang beses kada unit
   * GINAGAWA     : habang may unit na walang Remarks at hindi pa natatanong, binubuksan ang dialog; Cancel = walang Remarks at hindi na uulitin; isa lang ang tumatakbo nang sabay
   * INPUT/OUTPUT : wala -> Promise<void> (hindi nagtatapon ng error sa tumatawag)
   * TINATAWAG NG : lot-tracking.js refreshResults
   * TUMATAWAG SA : lotMonitoringStore.getUnitList, lotRemarks (isAsked, markAsked, ask), lot-tracking.js applyRemark
   */
  async function askPendingRemarks() {
    if (isAskingRemarks || !isActive()) return;
    isAskingRemarks = true;
    const loteSnapshot = lote;
    const loteKey = getLoteKey(loteSnapshot);
    try {
      while (lote === loteSnapshot && isActive()) {
        const pendingUnit = monitor.getUnitList(loteSnapshot).find((unit) => unit.remarks === '' && !remarks.isAsked(loteKey, unit.lotUnit));
        if (!pendingUnit) break;
        remarks.markAsked(loteKey, pendingUnit.lotUnit);
        const answer = await remarks.ask(pendingUnit.lotUnit);
        if (!answer.isCancelled) await applyRemark(loteSnapshot, pendingUnit, answer);
      }
    } finally {
      isAskingRemarks = false;
    }
  }

  // Isang beses na hanap ng bagong file/folder sa lahat ng Data source.
  async function refreshResults() {
    if (isScanning || !lote.startMs) return;
    if (!query('resultBody')) { stopTimer(); return; }
    isScanning = true;
    try {
      const earliestMs = lote.startMs - LOT.START_TOLERANCE_MS;
      const itemList = [];
      const warningList = [];
      if (sourceList.length === 0) warningList.push(TEXT.noSource);
      for (const source of sourceList) {
        let isAllowed = false;
        try {
          isAllowed = await storage.hasPermission(source.handle, false);
        } catch (error) {
          isAllowed = false;
        }
        if (!isAllowed) { warningList.push(source.label + TEXT.noPermission); continue; }
        await scanDirectory(source.handle, source.label, source.handle.name, 0, earliestMs, itemList);
      }
      if (!query('resultBody')) { stopTimer(); return; }
      const collected = unitCollector.collectUnits(itemList, firstSeenMap, Date.now());
      if (collected.isFirstSeenChanged && isActive()) saveActive();
      lastScan = { rowList: collected.rowList, warningList };
      if (isActive() && await monitor.prepare(currentMachine, lote.startMs) && recordNewUnits(collected.rowList)) persistMonitoring(lote.startMs);
      renderResults(collected.rowList, warningList);
      askPendingRemarks().catch(() => setStatus(TEXT.scanError, true));
    } catch (error) {
      setResultNote(TEXT.scanError);
    } finally {
      isScanning = false;
    }
  }

  // Sinisimulan ang auto refresh (isa lang na timer).
  function startTimer() {
    if (timerId !== null) return;
    timerId = window.setInterval(refreshResults, LOT.REFRESH_MS);
  }

  // Itinitigil ang auto refresh.
  function stopTimer() {
    if (timerId === null) return;
    window.clearInterval(timerId);
    timerId = null;
  }

  // Tinatapos ang aktibong lote: tigil ang timer, huling hanap (habang aktibo pa), End Date/Time = ngayon, I-DONE ang mga unit sa monitoring.
  async function endLote() {
    stopTimer();
    await waitForScan();
    await refreshResults();
    const startMs = lote.startMs;
    await monitor.prepare(currentMachine, startMs);
    lote.endMs = Date.now();
    monitor.finishBlock(lote, lote.endMs);
    activeStore.clear();
    renderLote();
    setStatus(TEXT.ended + lote.barcode + '.', false);
    await persistMonitoring(startMs);
  }

  // Sinisimulan ang bagong lote: Start Date/Time = ngayon, clear ang End, simula ng bantay.
  async function startLote(operatorValue) {
    lote = { barcode: pendingBarcode, operator: operatorValue, startMs: Date.now(), endMs: 0 };
    firstSeenMap = {};
    saveActive();
    pendingBarcode = '';
    renderLote();
    clearResults();
    setStatus(TEXT.started + lote.barcode + '.', false);
    query('barcode').focus();
    monitorWarningList = [];
    await requestAccess();
    onhold.removeByBarcode(lote.barcode).then((holdWarningList) => { if (holdWarningList.length > 0) setStatus(holdWarningList.join(' | '), true); });
    if (await monitor.prepare(currentMachine, lote.startMs)) monitor.startBlock(lote);
    startTimer();
    persistMonitoring(lote.startMs);
    await refreshResults();
  }

  // Enter sa Barcode: parehong barcode ng aktibong lote = tapusin; iba o bago = hingin ang Operator.
  async function handleBarcode() {
    const barcodeValue = validation.normalizeBarcode(query('barcode').value);
    if (!barcodeValue) return;
    await requestAccess();
    if (isActive()) {
      const isSameBarcode = barcodeValue === lote.barcode.toUpperCase();
      await endLote();
      if (isSameBarcode) {
        beep.playBeep();
        return;
      }
    }
    pendingBarcode = barcodeValue;
    query('barcode').value = barcodeValue;
    query('operator').value = '';
    setStatus(TEXT.enterOperator, false);
    query('operator').focus();
  }

  // Esc sa Operator = Cancel: nililinis ang Barcode at RESULT. Ang End ng naunang lote (kung meron) ay iniiwan.
  function cancelOperator() {
    if (!pendingBarcode) return;
    stopTimer();
    lote = { barcode: '', operator: '', startMs: 0, endMs: lote.endMs };
    firstSeenMap = {};
    activeStore.clear();
    pendingBarcode = '';
    query('barcode').value = '';
    query('operator').value = '';
    renderLote();
    clearResults();
    setStatus(TEXT.operatorCancelled, false);
    query('barcode').focus();
  }

  // Enter sa Operator: i-validate (haba at tanggap na character), tapos simulan ang lote.
  function handleOperator() {
    const operatorValue = validation.normalizeOperator(query('operator').value);
    if (!pendingBarcode) { setStatus(TEXT.barcodeFirst, true); query('barcode').focus(); return; }
    if (!validation.isValidOperator(operatorValue)) { setStatus(TEXT.operatorInvalid, true); return; }
    startLote(operatorValue).catch(() => setStatus(TEXT.scanError, true));
  }

  // NEW LOTE: tanungin muna, lagyan ng End kung aktibo, linisin ang form (naiiwan ang End hanggang sa susunod na lote).
  function onNewLote() {
    if ((lote.barcode || pendingBarcode) && !window.confirm(TEXT.confirmNew)) return;
    stopTimer();
    const wasActive = isActive();
    const finishedLote = lote;
    const keptEndMs = wasActive ? Date.now() : lote.endMs;
    if (wasActive) monitor.finishBlock(finishedLote, keptEndMs);
    lote = { barcode: '', operator: '', startMs: 0, endMs: keptEndMs };
    firstSeenMap = {};
    monitorWarningList = [];
    activeStore.clear();
    pendingBarcode = '';
    query('barcode').value = '';
    query('operator').value = '';
    renderLote();
    clearResults();
    setStatus(TEXT.newReady, false);
    query('barcode').focus();
    if (wasActive) monitor.save(finishedLote).then((warningList) => { if (warningList.length) setStatus(warningList.join(' | '), true); });
  }

  // Enter key lang ang tinatanggap (hindi habang nagko-compose ng IME).
  function isEnterKey(event) {
    return event.key === 'Enter' && !event.isComposing;
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    const machineName = sanitizeInput(storage.readLocalSettings().machineName || '', CONFIG.MACHINE_NAME_MAX);
    const isReady = machineName.length > 0;
    currentMachine = machineName;
    const barcodeInput = query('barcode');
    const operatorInput = query('operator');
    query('machine').value = machineName || CONFIG.TEXT.notSet;
    barcodeInput.maxLength = LOT.BARCODE_MAX;
    operatorInput.maxLength = LOT.OPERATOR_MAX;
    [barcodeInput, operatorInput, query('newButton')].forEach((element) => { element.disabled = !isReady; });
    barcodeInput.addEventListener('focus', () => barcodeInput.select());
    barcodeInput.addEventListener('keydown', (event) => {
      if (!isEnterKey(event)) return;
      event.preventDefault();
      handleBarcode().catch(() => setStatus(TEXT.scanError, true));
    });
    operatorInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault();
        cancelOperator();
        return;
      }
      if (!isEnterKey(event)) return;
      event.preventDefault();
      handleOperator();
    });
    query('newButton').addEventListener('click', onNewLote);
    if (isReady) restoreActiveLote();
    renderLote();
    if (!isReady) { setStatus(TEXT.machineMissing, true); return; }
    if (!storage.isFolderAccessSupported()) setStatus(CONFIG.TEXT.unsupported, true);
    else setStatus(TEXT.scanBarcode, false);
    await loadSources();
    if (isActive()) await monitor.prepare(currentMachine, lote.startMs);
    if (isActive()) startTimer();
    if (lote.startMs) refreshResults();
    barcodeInput.focus();
  }

  root.registry.registerPage(LOT.PAGE, Object.freeze({ init }));
})();
