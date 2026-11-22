/*
 * FILE    : js/pages/lot-tracking.js
 * PURPOSE : LOT Tracking: Barcode -> Operator -> simula ng lote; binabantayan ang bagong file/folder sa mga Data source ng Settings
 * DEPENDS : js/core/config.js, js/core/registry.js, js/core/security.js, js/core/storage.js, js/core/lot-config.js, js/core/lot-unit-collector.js, js/core/lot-active-store.js
 * VERSION : v2.5 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-22 | Yugto 1: isang row kada LOT Unit (X at X_Time), Unang nakita, at pag-save/pagbalik ng aktibong lote
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

  let lote = createEmptyLote();
  let pendingBarcode = '';
  let sourceList = [];
  let timerId = null;
  let isScanning = false;
  let firstSeenMap = {};
  let currentMachine = '';

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
    for (const key of LOT.SOURCE_KEYS) {
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
    warningList.forEach((warning) => { note += ' | ' + warning; });
    setResultNote(note);
  }

  // Nililinis ang RESULT.
  function clearResults() {
    const body = query('resultBody');
    if (body) body.replaceChildren();
    setResultNote('');
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
      renderResults(collected.rowList, warningList);
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

  // Tinatapos ang aktibong lote: End Date/Time = ngayon, huling hanap, tigil ang timer.
  async function endLote() {
    stopTimer();
    lote.endMs = Date.now();
    activeStore.clear();
    renderLote();
    setStatus(TEXT.ended + lote.barcode + '.', false);
    await refreshResults();
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
    await requestAccess();
    startTimer();
    await refreshResults();
  }

  // Enter sa Barcode: parehong barcode ng aktibong lote = tapusin; iba o bago = hingin ang Operator.
  async function handleBarcode() {
    const barcodeValue = sanitizeInput(query('barcode').value, LOT.BARCODE_MAX);
    if (!barcodeValue) return;
    if (isActive()) {
      const isSameBarcode = barcodeValue.toUpperCase() === lote.barcode.toUpperCase();
      await endLote();
      if (isSameBarcode) return;
    }
    pendingBarcode = barcodeValue;
    query('barcode').value = barcodeValue;
    query('operator').value = '';
    setStatus(TEXT.enterOperator, false);
    query('operator').focus();
  }

  // Enter sa Operator: i-validate, tapos simulan ang lote.
  function handleOperator() {
    const operatorValue = sanitizeInput(query('operator').value, LOT.OPERATOR_MAX);
    if (!pendingBarcode) { setStatus(TEXT.barcodeFirst, true); query('barcode').focus(); return; }
    if (operatorValue.length < LOT.OPERATOR_MIN) { setStatus(TEXT.operatorInvalid, true); return; }
    startLote(operatorValue).catch(() => setStatus(TEXT.scanError, true));
  }

  // NEW LOTE: tanungin muna, lagyan ng End kung aktibo, linisin ang form (naiiwan ang End hanggang sa susunod na lote).
  function onNewLote() {
    if ((lote.barcode || pendingBarcode) && !window.confirm(TEXT.confirmNew)) return;
    stopTimer();
    const keptEndMs = isActive() ? Date.now() : lote.endMs;
    lote = { barcode: '', operator: '', startMs: 0, endMs: keptEndMs };
    firstSeenMap = {};
    activeStore.clear();
    pendingBarcode = '';
    query('barcode').value = '';
    query('operator').value = '';
    renderLote();
    clearResults();
    setStatus(TEXT.newReady, false);
    query('barcode').focus();
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
    if (isActive()) startTimer();
    if (lote.startMs) refreshResults();
    barcodeInput.focus();
  }

  root.registry.registerPage(LOT.PAGE, Object.freeze({ init }));
})();
