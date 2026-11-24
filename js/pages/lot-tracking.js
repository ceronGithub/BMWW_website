/*
 * FILE    : js/pages/lot-tracking.js
 * PURPOSE : LOT Tracking: Barcode -> Operator -> simula ng lote; binabantayan ang bagong file/folder sa mga Data source ng Settings
 * DEPENDS : js/core/config.js, js/core/registry.js, js/core/security.js, js/core/storage.js, js/core/lot-config.js, js/core/lot-unit-collector.js, js/core/lot-active-store.js, js/core/lot-validation.js, js/core/lot-beep.js, js/core/lot-monitoring-store.js, js/core/lot-remarks.js, js/core/lot-onhold.js, js/core/lot-send.js, js/core/file-sender.js, js/core/lot-watch.js, js/core/lot-hold-config.js, js/core/lot-csv-check.js, js/core/lot-hold-store.js, js/core/lot-autohold.js
 * USED BY : pages/lot-tracking.html (script tag), js/templates/lot-tracking.template.js
 * VERSION : v2.5 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-22 | Yugto 1: isang row kada LOT Unit (X at X_Time), Unang nakita, at pag-save/pagbalik ng aktibong lote
 * VERSION : v2.7 | 2026-11-22 | Yugto 1: Barcode uppercase, check ng Operator, Esc sa Operator = Cancel, beep sa END, Data source 2 at 3 lang (lotConfig.SOURCE.KEYS)
 * VERSION : v2.8 | 2026-11-23 | Yugto 2: monitoring (row sa pag-scan, LOT Unit, auto-DONE kapag END, iba ang barcode o NEW LOTE), JSON at Excel sa Saving path at Server path
 * VERSION : v3.1 | 2026-11-24 | Yugto 6: bantay kapag walang aktibong lote (watchTick): bagong LOT Unit = itanong ang Barcode sa dialog, tapos Operator, tapos simula ng lote (Start = oras ng pinakamaagang unit)
 * VERSION : v3.0 | 2026-11-23 | Yugto 4: SERVER button sa bawat unit ng RESULT (Send sa Server path), Sent Status at Sent Time sa monitoring; handle sa bawat item ng RESULT
 * VERSION : v3.2 | 2026-11-24 | Task 1A: auto-hold (nabura ang file, walang Average); hindi na tinatanggal ang hold ng barcode sa startLote (kada unit na ang tanggal, pagkatapos ng re-measure)
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
  const send = root.lotSend;
  const SEND = LOT_CONFIG.SEND;
  const lotWatch = root.lotWatch;
  const WATCH = LOT_CONFIG.WATCH;
  const autoHold = root.lotAutoHold.create();

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
  let isSending = false;
  let watcher = null;
  let watchTimerId = null;
  let isWatching = false;
  let watchPending = null;

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
  function buildItem(sourceLabel, modifiedMs, path, name, type, handle) {
    const parts = parseName(name);
    return { sourceLabel, modifiedMs, path, type, handle, fileName: name, wafer: parts.wafer, blk: parts.blk, layer: parts.layer };
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
          if (modifiedMs >= earliestMs) itemList.push(buildItem(sourceLabel, modifiedMs, entryPath, entry.name, LOT.TYPE.file, entry));
        } else if (depth < LOT.MAX_DEPTH) {
          const folderNewestMs = await scanDirectory(entry, sourceLabel, entryPath, depth + 1, earliestMs, itemList);
          if (folderNewestMs > newestMs) newestMs = folderNewestMs;
          if (folderNewestMs >= earliestMs) itemList.push(buildItem(sourceLabel, folderNewestMs, entryPath, entry.name, LOT.TYPE.folder, entry));
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

  /**
   * PARA SAAN    : ipadala ang isang LOT Unit sa Server path (SERVER button)
   * GINAGAWA     : kinukuha ang Server path, humihingi ng write permission (galing sa click), sinusuri na hindi ito Data source, tinatanong kung papalitan ang kapangalan, kinokopya ang file/folder ng unit; kapag naipadala lahat: Sent Status = SENT at Sent Time sa monitoring
   * INPUT/OUTPUT : (unitRow { unitName, itemList }) -> Promise<void> (hindi nagtatapon ng error)
   * TINATAWAG NG : event click sa .lot-send-button (renderResults)
   * TUMATAWAG SA : storage.loadHandle, fileSender (ensureWriteAccess, isInsideSource), lotSend (buildSendList, countExisting, sendUnit), monitor.markSent, persistMonitoring, renderResults, setStatus
   */
  async function onSendClick(unitRow) {
    if (isSending) { setStatus(SEND.TEXT.busy, true); return; }
    if (!storage.isFolderAccessSupported()) { setStatus(SEND.TEXT.unsupported, true); return; }
    isSending = true;
    try {
      const destination = await storage.loadHandle(CONFIG.HANDLE_KEY.server);
      if (!destination) { setStatus(SEND.TEXT.noServer, true); return; }
      if (!(await root.fileSender.ensureWriteAccess(destination))) { setStatus(SEND.TEXT.noPermission, true); return; }
      if (await root.fileSender.isInsideSource(destination, sourceList.map((source) => source.handle))) { setStatus(SEND.TEXT.isSource, true); return; }
      const sendList = send.buildSendList(unitRow);
      if (sendList.length === 0) { setStatus(SEND.TEXT.noItem, true); return; }
      const existingCount = await send.countExisting(sendList, destination);
      if (existingCount > 0 && !window.confirm(SEND.TEXT.confirmOverwrite.replace('{n}', String(existingCount)))) { setStatus(SEND.TEXT.notReplaced, true); return; }
      setStatus(SEND.TEXT.sending + unitRow.unitName + '...', false);
      const summary = await send.sendUnit(sendList, destination, existingCount > 0);
      if (!summary.isSent) { setStatus(SEND.TEXT.failed + unitRow.unitName + '.', true); return; }
      monitor.markSent(lote, unitRow.unitName, Date.now());
      setStatus(SEND.TEXT.sent + unitRow.unitName + '.', false);
      await persistMonitoring(lote.startMs);
      if (query('resultBody')) renderResults(lastScan.rowList, lastScan.warningList);
    } catch (error) {
      setStatus(SEND.TEXT.error, true);
    } finally {
      isSending = false;
    }
  }

  /**
   * PARA SAAN    : gumawa ng cell ng Send para sa isang row ng RESULT
   * GINAGAWA     : button na SERVER (at salitang SENT kapag naipadala na); textContent lang; walang inline onclick
   * INPUT/OUTPUT : unitRow -> Element (td)
   * TINATAWAG NG : lot-tracking.js renderResults
   * TUMATAWAG SA : monitor.getSentStatus, lot-tracking.js onSendClick (sa click)
   */
  function buildSendCell(unitRow) {
    const cell = document.createElement('td');
    if (!unitRow.unitName) { cell.textContent = LOT.EMPTY_CELL; return cell; }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn lot-send-button';
    button.textContent = SEND.BUTTON_LABEL;
    button.setAttribute('aria-label', SEND.BUTTON_LABEL + ' ' + unitRow.unitName);
    button.addEventListener('click', () => { onSendClick(unitRow); });
    cell.append(button);
    if (monitor.getSentStatus(lote, unitRow.unitName) === MONITORING.SENT.sent) {
      const mark = document.createElement('span');
      mark.className = 'lot-sent-mark';
      mark.textContent = SEND.SENT_LABEL;
      cell.append(mark);
    }
    return cell;
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
      tableRow.append(buildSendCell(item));
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

  /**
   * PARA SAAN    : auto-hold pagkatapos ng bawat scan (nabura ang file, walang Average, tanggal ng hold pagkatapos ng re-measure)
   * GINAGAWA     : tinatawag ang autoHold.process para sa aktibong lote; hindi hinihintay at hindi nagtatapon ng error
   * INPUT/OUTPUT : (rowList, isAllChecked) -> wala
   * TINATAWAG NG : lot-tracking.js refreshResults
   * TUMATAWAG SA : autoHold.process, monitor, persistMonitoring, setStatus
   */
  function runAutoHold(rowList, isAllChecked) {
    if (!isActive()) return;
    const startMs = lote.startMs;
    autoHold.process({
      lote, machine: currentMachine, rowList, isAllChecked, monitor,
      persist: () => persistMonitoring(startMs),
      notify: (message, isError) => setStatus(message, isError)
    }).catch(() => setStatus(TEXT.scanError, true));
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
      let isAllChecked = sourceList.length > 0;
      if (sourceList.length === 0) warningList.push(TEXT.noSource);
      for (const source of sourceList) {
        let isAllowed = false;
        try {
          isAllowed = await storage.hasPermission(source.handle, false);
        } catch (error) {
          isAllowed = false;
        }
        if (!isAllowed) { isAllChecked = false; warningList.push(source.label + TEXT.noPermission); continue; }
        await scanDirectory(source.handle, source.label, source.handle.name, 0, earliestMs, itemList);
      }
      if (!query('resultBody')) { stopTimer(); return; }
      const collected = unitCollector.collectUnits(itemList, firstSeenMap, Date.now());
      if (collected.isFirstSeenChanged && isActive()) saveActive();
      if (watcher) watcher.addKnown(collected.rowList.map((row) => row.unitName));
      lastScan = { rowList: collected.rowList, warningList };
      if (isActive() && await monitor.prepare(currentMachine, lote.startMs) && recordNewUnits(collected.rowList)) persistMonitoring(lote.startMs);
      renderResults(collected.rowList, warningList);
      runAutoHold(collected.rowList, isAllChecked);
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
    if (watcher) watcher.reset(lote.endMs);
    activeStore.clear();
    renderLote();
    setStatus(TEXT.ended + lote.barcode + '.', false);
    await persistMonitoring(startMs);
  }

  // Sinisimulan ang bagong lote: Start Date/Time = ngayon, clear ang End, simula ng bantay.
  async function startLote(operatorValue, startMsOverride) {
    lote = { barcode: pendingBarcode, operator: operatorValue, startMs: startMsOverride || Date.now(), endMs: 0 };
    firstSeenMap = {};
    saveActive();
    pendingBarcode = '';
    renderLote();
    clearResults();
    setStatus(TEXT.started + lote.barcode + '.', false);
    query('barcode').focus();
    monitorWarningList = [];
    await requestAccess();
    // [BINURA v3.2] onhold.removeByBarcode: ang hold ay tinatanggal na kada LOT Unit ng lot-autohold.js pagkatapos ng re-measure.
    if (await monitor.prepare(currentMachine, lote.startMs)) monitor.startBlock(lote);
    startTimer();
    persistMonitoring(lote.startMs);
    await refreshResults();
  }

  /**
   * PARA SAAN    : simulan ang bantay kapag walang aktibong lote
   * GINAGAWA     : isang timer lang (WATCH.INTERVAL_MS) na tumatawag ng watchTick
   * INPUT/OUTPUT : wala -> wala
   * TINATAWAG NG : lot-tracking.js init
   * TUMATAWAG SA : lot-tracking.js watchTick (kada interval)
   */
  function startWatchTimer() {
    if (watchTimerId !== null) return;
    watchTimerId = window.setInterval(() => { watchTick().catch(() => { isWatching = false; }); }, WATCH.INTERVAL_MS);
  }

  /**
   * PARA SAAN    : itigil ang bantay (kapag umalis na sa page)
   * GINAGAWA     : nililinis ang timer
   * INPUT/OUTPUT : wala -> wala
   * TINATAWAG NG : lot-tracking.js watchTick
   * TUMATAWAG SA : wala
   */
  function stopWatchTimer() {
    if (watchTimerId === null) return;
    window.clearInterval(watchTimerId);
    watchTimerId = null;
  }

  /**
   * PARA SAAN    : kalimutan ang bantay na naghihintay ng Operator (Esc, NEW LOTE)
   * GINAGAWA     : ang mga unit na iyon ay itinatala bilang tinanggihan para hindi na itanong
   * INPUT/OUTPUT : wala -> wala
   * TINATAWAG NG : lot-tracking.js cancelOperator, onNewLote
   * TUMATAWAG SA : watcher.decline
   */
  function dropWatchPending() {
    if (!watchPending) return;
    if (watcher) watcher.decline(watchPending.unitNameList);
    watchPending = null;
  }

  /**
   * PARA SAAN    : isang tingin ng bantay (spec 4.8): may bagong LOT Unit ba habang walang aktibong lote
   * GINAGAWA     : hindi tumatakbo kapag may aktibong lote, naghihintay ng Operator, may ipinapadala o may dialog; hinahanap ang bagong file sa Data source mula sa huling tingin; kapag may bagong unit, tinatanong ang Barcode sa dialog; Cancel = tinatanggihan ang mga unit; OK = ilalagay ang Barcode at hihintayin ang Operator (Start ng lote = oras ng pinakamaagang unit)
   * INPUT/OUTPUT : wala -> Promise<void> (hindi nagtatapon ng error sa tumatawag)
   * TINATAWAG NG : timer ng startWatchTimer (kada WATCH.INTERVAL_MS)
   * TUMATAWAG SA : scanDirectory, storage.hasPermission, unitCollector.collectUnits, watcher (getEarliestMs, markLooked, findNewUnits, addKnown, decline), lotWatch.askBarcode, setStatus
   */
  async function watchTick() {
    if (isWatching || isScanning || isSending || isAskingRemarks || isActive() || pendingBarcode || watchPending) return;
    if (!query('barcode')) { stopWatchTimer(); return; }
    if (!watcher || sourceList.length === 0) return;
    isWatching = true;
    try {
      const lookedMs = Date.now();
      const itemList = [];
      for (const source of sourceList) {
        let isAllowed = false;
        try {
          isAllowed = await storage.hasPermission(source.handle, false);
        } catch (error) {
          isAllowed = false;
        }
        if (isAllowed) await scanDirectory(source.handle, source.label, source.handle.name, 0, watcher.getEarliestMs(), itemList);
      }
      if (isActive() || pendingBarcode || !query('barcode')) return;
      watcher.markLooked(lookedMs);
      const newRowList = watcher.findNewUnits(unitCollector.collectUnits(itemList, {}, lookedMs).rowList);
      if (newRowList.length === 0) return;
      const unitNameList = newRowList.map((row) => row.unitName);
      const answer = await lotWatch.askBarcode(unitNameList);
      if (answer.isCancelled) {
        watcher.decline(unitNameList);
        setStatus(WATCH.TEXT.declined, false);
        return;
      }
      watcher.addKnown(unitNameList);
      watchPending = { startMs: Math.min(...newRowList.map((row) => row.modifiedMs)), unitNameList };
      pendingBarcode = answer.barcode;
      query('barcode').value = answer.barcode;
      query('operator').value = '';
      setStatus(TEXT.enterOperator, false);
      query('operator').focus();
    } finally {
      isWatching = false;
    }
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
    dropWatchPending();
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
    const startMsOverride = watchPending ? watchPending.startMs : 0;
    watchPending = null;
    startLote(operatorValue, startMsOverride).catch(() => setStatus(TEXT.scanError, true));
  }

  // NEW LOTE: tanungin muna, lagyan ng End kung aktibo, linisin ang form (naiiwan ang End hanggang sa susunod na lote).
  function onNewLote() {
    if ((lote.barcode || pendingBarcode) && !window.confirm(TEXT.confirmNew)) return;
    stopTimer();
    dropWatchPending();
    if (watcher) watcher.reset(Date.now());
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
    if (storage.isFolderAccessSupported()) {
      watcher = lotWatch.createWatcher(Date.now());
      startWatchTimer();
    }
    if (isActive()) await monitor.prepare(currentMachine, lote.startMs);
    if (isActive()) startTimer();
    if (lote.startMs) refreshResults();
    barcodeInput.focus();
  }

  root.registry.registerPage(LOT.PAGE, Object.freeze({ init }));
})();
