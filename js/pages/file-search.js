/*
 * FILE    : js/pages/file-search.js
 * PURPOSE : Search Files page: hanap sa CLO1A/CLO1A1 (by name, by range date, latest), resulta na may scroll, Send to (Path o manual)
 * DEPENDS : js/core/config.js, registry.js, security.js, storage.js, csv-reader.js, file-scanner.js, file-sender.js, send-log.js
 * VERSION : v2.8 | 2026-11-20 | bagong file
 * VERSION : v23 | 2026-11-24 | Task 13: ang search na tumatakbo ay nananatili kahit lumabas at bumalik sa page (activeSearch, pendingOutcome, isPageOpen); kulay (is-searching) ang button na ginamit; hindi clickable ang lahat ng button habang may search; By name: kasama ang folder; Search Date: kasama ang folder
 * VERSION : v3.0 | 2026-11-21 | Preview kada file sa Result (text, CSV, larawan, PDF)
 * VERSION : v2.9 | 2026-11-21 | tanong kung papalitan ang kapangalan (overwrite); send log sa Saving path; alaala ng huling manual destination
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const SEARCH = CONFIG.FILE_SEARCH;
  const SEL = SEARCH.SELECTOR;
  const TEXT = SEARCH.TEXT;
  const { storage, csv, fileScanner, fileSender, sendLog } = root;
  const { sanitizeInput } = root.security;

  let sourceStateList = [];
  let resultList = [];
  let rowMap = {};
  let control = null;
  let isBusy = false;
  let manualHandle = null;
  let previewToken = 0;
  let previewUrl = '';
  // Nananatili kahit lumabas sa page (hindi nire-reset ng init): ang search na tumatakbo at ang resulta na natapos habang wala sa page.
  let activeSearch = null;
  let pendingOutcome = null;
  let pageRoot = null;

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  // Gumagawa ng element na may class at text (textContent lang, walang innerHTML).
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Mensahe: 'error', 'success' o 'info'. statusKey = 'status' (search) o 'sendStatus' (send).
  function setStatus(statusKey, message, kind) {
    const element = query(statusKey);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
    element.classList.toggle('is-info', kind === 'info');
  }

  // Dalawang digit na numero.
  function pad(number) {
    return String(number).padStart(2, '0');
  }

  // yyyy-mm-dd hh:mm:ss
  function formatDateTime(ms) {
    const date = new Date(ms);
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  // Laki ng file (hal. 1.5 MB); '-' kung folder.
  function formatSize(bytes) {
    if (bytes === null || bytes === undefined) return SEARCH.EMPTY_CELL;
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < SEARCH.SIZE_UNIT_LIST.length - 1) { value /= 1024; unitIndex += 1; }
    return (unitIndex === 0 ? String(value) : value.toFixed(1)) + ' ' + SEARCH.SIZE_UNIT_LIST[unitIndex];
  }

  // Full path ng source mula sa Settings kung meron (kung hindi, pangalan ng folder).
  function getSourcePath(key, handle) {
    const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
    return paths[key] || (handle ? handle.name : '');
  }

  // Ginagawang friendly na mensahe ang error ng folder (walang teknikal na detalye).
  function getAccessMessage(label, error) {
    const isPermission = error && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
    return label + (isPermission ? TEXT.sourceNoPermission : TEXT.sourceUnreadable);
  }

  // Ginagawa ang listahan ng CLO1A / CLO1A1 (checkbox, path, badge).
  async function buildSourceRows() {
    const list = query('sourceList');
    list.replaceChildren();
    sourceStateList = [];
    for (const item of SEARCH.SOURCE_LIST) {
      let handle = null;
      try {
        if (storage.isFolderAccessSupported()) handle = await storage.loadHandle(CONFIG.HANDLE_KEY[item.key]);
      } catch (error) {
        handle = null;
      }
      const row = makeElement('li', 'fs-source-row');
      const label = makeElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(handle);
      checkbox.disabled = !handle;
      label.append(checkbox, makeElement('span', '', item.label));
      const pathText = handle ? getSourcePath(item.key, handle) : TEXT.sourceNotSet;
      row.append(label, makeElement('span', 'fs-source-path', pathText), makeElement('span', 'badge ' + (handle ? CONFIG.BADGE.ok : CONFIG.BADGE.empty), handle ? TEXT.sourceBadgeSet : TEXT.sourceBadgeEmpty));
      list.append(row);
      sourceStateList.push({ key: item.key, label: item.label, handle, checkbox });
    }
  }

  // Hinahanda ang mga napiling source: permission (galing sa click) at path. Ibinibigay ang {readyList, warningList}.
  async function prepareSources() {
    const readyList = [];
    const warningList = [];
    const checkedList = sourceStateList.filter((state) => state.checkbox.checked && state.handle);
    for (const state of checkedList) {
      try {
        if (await storage.hasPermission(state.handle, true)) readyList.push({ key: state.key, label: state.label, handle: state.handle, rootPath: getSourcePath(state.key, state.handle) });
        else warningList.push(state.label + TEXT.sourceNoPermission);
      } catch (error) {
        warningList.push(getAccessMessage(state.label, error));
      }
    }
    return { checkedCount: checkedList.length, readyList, warningList };
  }

  // Nakabukas ba ang page na ito ngayon? (Ang tumatakbong search ay hindi dapat sumulat sa DOM na wala na.)
  function isPageOpen() {
    return Boolean(pageRoot && pageRoot.isConnected);
  }

  // Kulay (is-searching) ang button ng search na tumatakbo; walang buttonKey = tanggalin ang kulay.
  function markSearching(buttonKey) {
    ['nameButton', 'rangeButton', 'latestButton'].forEach((key) => {
      const button = query(key);
      if (!button) return;
      const isActive = key === buttonKey;
      button.classList.toggle('is-searching', isActive);
      if (isActive) button.setAttribute('aria-busy', 'true'); else button.removeAttribute('aria-busy');
    });
  }

  // Busy state: disable ng lahat ng button maliban sa Stop; enable ng Stop.
  function setBusy(nextBusy) {
    isBusy = nextBusy;
    if (!isPageOpen()) return;
    ['nameButton', 'rangeButton', 'latestButton', 'clearButton', 'sendButton', 'manualPick'].forEach((key) => {
      const button = query(key);
      if (button) button.disabled = nextBusy;
    });
    const stopButton = query('stopButton');
    if (stopButton) stopButton.disabled = !nextBusy;
    if (!nextBusy) markSearching('');
  }

  // Bilang ng napiling (may check) na file sa resulta.
  function getSelectedList() {
    return resultList.filter((item) => item.type === SEARCH.TYPE.file && rowMap[item.id] && rowMap[item.id].checkbox.checked);
  }

  // Ina-update ang "Napili: n" at ang select-all.
  function updateSelectedCount() {
    const sendable = resultList.filter((item) => item.type === SEARCH.TYPE.file);
    const selected = getSelectedList().length;
    query('selectedCount').textContent = TEXT.selected + selected;
    const all = query('selectAll');
    all.checked = sendable.length > 0 && selected === sendable.length;
    all.indeterminate = selected > 0 && selected < sendable.length;
    all.disabled = sendable.length === 0;
  }

  // Ina-update ang status cell ng isang item.
  function renderStatus(item) {
    const entry = rowMap[item.id];
    if (!entry) return;
    entry.statusCell.textContent = item.status;
    entry.statusCell.className = 'fs-status-cell ' + SEARCH.STATUS_CLASS[item.status];
  }

  // Inilalagay ang resulta sa table (textContent lang). Ang table ay may sariling scroll (CSS).
  function renderResults(itemList) {
    resultList = itemList;
    rowMap = {};
    const fragment = document.createDocumentFragment();
    itemList.forEach((item) => {
      const row = document.createElement('tr');
      const checkCell = makeElement('td', 'fs-col-check');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.type === SEARCH.TYPE.file;
      checkbox.disabled = item.type !== SEARCH.TYPE.file;
      checkbox.setAttribute('aria-label', 'Piliin ' + item.name);
      checkCell.append(checkbox);
      const statusCell = makeElement('td', 'fs-status-cell');
      const previewCell = makeElement('td', 'fs-nowrap');
      if (item.type === SEARCH.TYPE.file) {
        const previewButton = makeElement('button', 'btn btn-secondary fs-preview-button', TEXT.previewButton);
        previewButton.type = 'button';
        previewButton.dataset.id = String(item.id);
        previewButton.setAttribute('aria-label', TEXT.previewAria + item.name);
        previewCell.append(previewButton);
      } else {
        previewCell.textContent = SEARCH.EMPTY_CELL;
      }
      row.append(
        checkCell,
        makeElement('td', 'fs-name', item.name),
        makeElement('td', 'fs-nowrap', item.type),
        makeElement('td', 'fs-nowrap', formatDateTime(item.modifiedMs)),
        makeElement('td', 'fs-nowrap', formatSize(item.size)),
        makeElement('td', 'fs-nowrap', item.sourceLabel),
        makeElement('td', 'fs-folder', item.folderPath),
        statusCell,
        previewCell
      );
      fragment.append(row);
      rowMap[item.id] = { checkbox, statusCell };
    });
    query('resultBody').replaceChildren(fragment);
    itemList.forEach(renderStatus);
    query('found').textContent = TEXT.found + itemList.length;
    updateSelectedCount();
  }

  // Nililinis ang resulta.
  function clearResults() {
    renderResults([]);
    query('resultNote').textContent = '';
  }

  // Tala sa ilalim ng RESULT: ano ang hinanap at mga babala.
  function describeResult(modeText, result, warningList) {
    const noteList = [modeText];
    if (result.itemList.length === 0) noteList.push(TEXT.none);
    if (result.isStopped) noteList.push(TEXT.stopped);
    if (result.isResultLimited) noteList.push(TEXT.resultLimited.replace('{n}', String(SEARCH.MAX_RESULTS)));
    if (result.isScanLimited) noteList.push(TEXT.scanLimited.replace('{n}', String(SEARCH.MAX_SCANNED)));
    if (result.skippedCount > 0) noteList.push(result.skippedCount + TEXT.skipped);
    return noteList.concat(warningList).join(' | ');
  }

  // Karaniwang takbo ng isang search. buildOptions(sourceList) -> options ng scanSources; modeText para sa tala; buttonKey = button na pinindot.
  // Nananatiling tumatakbo kahit lumabas sa page: ang estado ay nasa activeSearch at ang natapos na resulta ay nasa pendingOutcome.
  async function runSearch(buildOptions, modeText, buttonKey) {
    if (isBusy || activeSearch) return;
    if (!storage.isFolderAccessSupported()) { setStatus('status', TEXT.unsupported, 'error'); return; }
    activeSearch = { control: null, buttonKey, progressText: TEXT.working };
    pendingOutcome = null;
    setBusy(true);
    markSearching(buttonKey);
    setStatus('sendStatus', '', '');
    let outcome = null;
    try {
      const prepared = await prepareSources();
      if (prepared.checkedCount === 0) { outcome = { statusText: TEXT.noSourceChecked }; return; }
      if (prepared.readyList.length === 0) { outcome = { statusText: prepared.warningList.join(' | ') || TEXT.noSourceReady }; return; }
      control = fileScanner.createControl();
      activeSearch.control = control;
      setStatus('status', TEXT.working, 'info');
      const options = buildOptions();
      options.control = control;
      options.onProgress = (count) => {
        activeSearch.progressText = TEXT.progress + count;
        if (isPageOpen()) setStatus('status', activeSearch.progressText, 'info');
      };
      const result = await fileScanner.scanSources(prepared.readyList, options);
      outcome = { itemList: result.itemList, noteText: describeResult(modeText, result, prepared.warningList) };
    } catch (error) {
      outcome = { statusText: TEXT.searchError };
    } finally {
      control = null;
      activeSearch = null;
      if (isPageOpen()) { setBusy(false); showOutcome(outcome); } else { isBusy = false; pendingOutcome = outcome; }
    }
  }

  // Ipinapakita ang resulta o mensahe ng natapos na search.
  function showOutcome(outcome) {
    if (!outcome) return;
    if (outcome.itemList) {
      renderResults(outcome.itemList);
      query('resultNote').textContent = outcome.noteText;
      setStatus('status', '', '');
    } else {
      setStatus('status', outcome.statusText, 'error');
    }
  }

  // SEARCH FILE NAME
  function onSearchName() {
    const nameText = sanitizeInput(query('nameInput').value, SEARCH.NAME_MAX);
    if (!nameText) { setStatus('status', TEXT.nameEmpty, 'error'); query('nameInput').focus(); return; }
    const matcher = fileScanner.buildNameMatcher(nameText);
    return runSearch(() => ({ nameMatcher: matcher, fromMs: 0, toMs: Number.MAX_SAFE_INTEGER, includeFolders: false, matchFolderNames: true }), TEXT.modeNote.name + nameText, 'nameButton');
  }

  // SEARCH DATE
  function onSearchDate() {
    const startDate = csv.parseDateInput(query('rangeStart').value);
    const endDate = csv.parseDateInput(query('rangeEnd').value);
    if (!startDate || !endDate) { setStatus('status', TEXT.badDates, 'error'); return; }
    if (startDate.getTime() > endDate.getTime()) { setStatus('status', TEXT.startAfterEnd, 'error'); return; }
    const range = fileScanner.getRangeMs(startDate, endDate);
    return runSearch(() => ({ nameMatcher: null, fromMs: range.fromMs, toMs: range.toMs, includeFolders: true }), TEXT.modeNote.range + query('rangeStart').value + ' hanggang ' + query('rangeEnd').value, 'rangeButton');
  }

  // GET LATEST FILES: bago ngayong araw at kahapon (mga file at folder).
  function onGetLatest() {
    const fromMs = fileScanner.getLatestStartMs(new Date());
    return runSearch(() => ({ nameMatcher: null, fromMs, toMs: Number.MAX_SAFE_INTEGER, includeFolders: true }), TEXT.modeNote.latest + formatDateTime(fromMs) + ' pataas', 'latestButton');
  }

  // Extension ng file (maliit na letra, walang tuldok).
  function getExtension(fileName) {
    const index = fileName.lastIndexOf('.');
    return index < 0 ? '' : fileName.slice(index + 1).toLowerCase();
  }

  // Anong uri ng preview ang bagay sa file: 'csv', 'text', 'image', 'pdf' o '' (wala).
  function getPreviewKind(fileName) {
    const extension = getExtension(fileName);
    const rule = SEARCH.PREVIEW;
    if (rule.CSV_EXT.includes(extension)) return 'csv';
    if (rule.TEXT_EXT.includes(extension)) return 'text';
    if (rule.IMAGE_EXT.includes(extension)) return 'image';
    if (rule.PDF_EXT.includes(extension)) return 'pdf';
    return '';
  }

  // Nililinis ang preview (at ang object URL ng larawan/PDF).
  function resetPreviewBody() {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ''; }
    query('previewBody').replaceChildren();
  }

  // Mensahe sa loob ng preview.
  function showPreviewMessage(message) {
    query('previewBody').replaceChildren(makeElement('p', 'fs-preview-message', message));
  }

  // Tala sa ilalim ng pamagat ng preview: petsa, laki, source at kung hanggang saan ang ipinapakita.
  function setPreviewMeta(item, extraText) {
    const parts = [formatDateTime(item.modifiedMs), formatSize(item.size), item.sourceLabel, item.folderPath];
    if (extraText) parts.push(extraText);
    query('previewMeta').textContent = parts.join(' | ');
  }

  // Preview ng text: unang MAX_BYTES lang. Ibinibigay ang {text, isPartial} o null kung mukhang binary.
  async function readPreviewText(file) {
    const rule = SEARCH.PREVIEW;
    const text = await file.slice(0, rule.MAX_BYTES).text();
    if (text.indexOf('\u0000') !== -1) return null;
    return { text, isPartial: file.size > rule.MAX_BYTES };
  }

  // Table ng CSV (unang MAX_ROWS at MAX_COLUMNS); may row number. textContent lang.
  function buildCsvTable(rowList) {
    const rule = SEARCH.PREVIEW;
    const table = makeElement('table', 'fs-csv');
    const body = document.createElement('tbody');
    let isColumnsLimited = false;
    rowList.slice(0, rule.MAX_ROWS).forEach((cellList, rowIndex) => {
      const row = document.createElement('tr');
      row.append(makeElement('th', '', String(rowIndex + 1)));
      if (cellList.length > rule.MAX_COLUMNS) isColumnsLimited = true;
      cellList.slice(0, rule.MAX_COLUMNS).forEach((cell) => row.append(makeElement('td', '', cell)));
      body.append(row);
    });
    table.append(body);
    return { table, isColumnsLimited };
  }

  // Binubuksan ang preview ng isang file (basa lang). Ang token ay para hindi magpatong kung mabilis mag-click.
  async function openPreview(item) {
    const dialog = query('previewDialog');
    const token = previewToken + 1;
    previewToken = token;
    resetPreviewBody();
    query('previewTitle').textContent = item.name;
    setPreviewMeta(item, '');
    showPreviewMessage(TEXT.previewLoading);
    if (!dialog.open) dialog.showModal();
    query('previewClose').focus();
    try {
      const kind = getPreviewKind(item.name);
      if (!kind) { showPreviewMessage(TEXT.previewNone); return; }
      const file = await item.handle.getFile();
      if (token !== previewToken) return;
      if (file.size === 0) { showPreviewMessage(TEXT.previewEmpty); return; }
      const rule = SEARCH.PREVIEW;
      if (kind === 'image' || kind === 'pdf') {
        if (file.size > (kind === 'image' ? rule.IMAGE_MAX_BYTES : rule.PDF_MAX_BYTES)) { showPreviewMessage(TEXT.previewTooBig); return; }
        previewUrl = URL.createObjectURL(file);
        if (kind === 'image') {
          const image = makeElement('img', 'fs-preview-image');
          image.alt = TEXT.previewImageAlt;
          image.src = previewUrl;
          query('previewBody').replaceChildren(image);
        } else {
          const frame = makeElement('iframe', 'fs-preview-frame');
          frame.title = item.name;
          frame.src = previewUrl;
          query('previewBody').replaceChildren(frame);
        }
        return;
      }
      const result = await readPreviewText(file);
      if (token !== previewToken) return;
      if (!result) { showPreviewMessage(TEXT.previewBinary); return; }
      const partialText = result.isPartial ? TEXT.previewPartial.replace('{shown}', formatSize(rule.MAX_BYTES)).replace('{total}', formatSize(file.size)) : '';
      if (kind === 'csv') {
        const rowList = csv.parseCsv(result.text);
        // Kapag pinutol ang file, ang huling row ay maaaring putol din: huwag ipakita.
        if (result.isPartial && rowList.length > 1) rowList.pop();
        const built = buildCsvTable(rowList);
        let note = rowList.length > rule.MAX_ROWS ? TEXT.previewRows.replace('{n}', String(rule.MAX_ROWS)) : partialText;
        if (built.isColumnsLimited) note += TEXT.previewColumns.replace('{n}', String(rule.MAX_COLUMNS));
        setPreviewMeta(item, note);
        query('previewBody').replaceChildren(built.table);
        return;
      }
      setPreviewMeta(item, partialText);
      query('previewBody').replaceChildren(makeElement('pre', 'fs-preview-text', result.text));
    } catch (error) {
      if (token === previewToken) showPreviewMessage(TEXT.previewError);
    }
  }

  // Isinasara ang preview.
  function closePreview() {
    previewToken += 1;
    const dialog = query('previewDialog');
    if (dialog && dialog.open) dialog.close();
    resetPreviewBody();
  }

  // STOP: ihinto ang search o ang pagpapadala.
  function onStop() {
    if (control) control.stop();
  }

  // CLEAR RESULT
  function onClear() {
    if (isBusy) return;
    clearResults();
    setStatus('status', '', '');
    setStatus('sendStatus', '', '');
  }

  // Napiling paraan ng pagpapadala.
  function getSendMode() {
    const checked = document.querySelector(SEL.sendModeRadio + ':checked');
    return checked ? checked.value : SEARCH.SEND_MODE.path;
  }

  // Ipinapakita ang Server path (mula sa Settings) at ang manual input ayon sa napili.
  function renderSendMode() {
    const isManual = getSendMode() === SEARCH.SEND_MODE.manual;
    query('manualWrap').hidden = !isManual;
  }

  // Ipinapakita ang Server path na naka-set sa Settings.
  function renderServerPath() {
    const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
    const names = storage.readLocalSettings().folderNames || {};
    const text = paths[SEARCH.SERVER_KEY] || names[SEARCH.SERVER_KEY] || '';
    query('sendPathText').textContent = text ? TEXT.sendPathLabel + text : TEXT.sendPathNone;
  }

  // Huling bahagi ng path (pangalan ng folder).
  function getLastSegment(fullPath) {
    const parts = fullPath.split(CONFIG.PATH_SEPARATOR).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  // Sinusuri ang manual path at ang napiling folder. Ibinibigay ang error message o ''.
  function validateManual() {
    const typed = sanitizeInput(query('manualPath').value, CONFIG.FULL_PATH_MAX);
    if (!manualHandle) return TEXT.manualNeedFolder;
    if (!typed) return '';
    if (!CONFIG.FULL_PATH_PATTERN.test(typed)) return TEXT.manualInvalid;
    const lastSegment = getLastSegment(typed);
    const isDriveRoot = /^[A-Za-z]:$/.test(lastSegment);
    if (!isDriveRoot && lastSegment.toLowerCase() !== manualHandle.name.toLowerCase()) return TEXT.manualMismatch + manualHandle.name;
    return '';
  }

  // Sine-save ang huling manual destination (path text sa localStorage, folder handle sa IndexedDB).
  async function rememberManual(shouldSaveHandle) {
    try {
      localStorage.setItem(SEARCH.MANUAL_STORAGE_KEY, JSON.stringify({ [SEARCH.MANUAL_PATH_FIELD]: sanitizeInput(query('manualPath').value, CONFIG.FULL_PATH_MAX) }));
    } catch (error) {
      // Hindi kritikal.
    }
    if (shouldSaveHandle && manualHandle) {
      try { await storage.saveHandle(SEARCH.MANUAL_HANDLE_KEY, manualHandle); } catch (error) { /* hindi kritikal */ }
    }
  }

  // Binabalik ang huling manual destination (path text at folder handle).
  async function restoreManual() {
    try {
      const saved = JSON.parse(localStorage.getItem(SEARCH.MANUAL_STORAGE_KEY) || '{}');
      query('manualPath').value = sanitizeInput(saved[SEARCH.MANUAL_PATH_FIELD] || '', CONFIG.FULL_PATH_MAX);
    } catch (error) {
      query('manualPath').value = '';
    }
    try {
      manualHandle = storage.isFolderAccessSupported() ? await storage.loadHandle(SEARCH.MANUAL_HANDLE_KEY) : null;
    } catch (error) {
      manualHandle = null;
    }
    if (manualHandle) query('manualFolder').textContent = TEXT.manualFolderLabel + manualHandle.name + TEXT.manualReselect;
  }

  // Choose folder: pumipili ng destination folder para sa manual input.
  async function onPickManual() {
    try {
      manualHandle = await storage.pickFolder();
      query('manualFolder').textContent = TEXT.manualFolderLabel + manualHandle.name;
      setStatus('sendStatus', '', '');
      await rememberManual(true);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      setStatus('sendStatus', TEXT.pickError, 'error');
    }
  }

  // Kinukuha ang destination folder handle ayon sa napiling paraan. Ibinibigay ang {handle} o {message}.
  async function resolveDestination() {
    if (getSendMode() === SEARCH.SEND_MODE.manual) {
      const manualError = validateManual();
      query('manualPath').classList.toggle('is-error', Boolean(manualError));
      if (manualError) return { message: manualError };
      return { handle: manualHandle };
    }
    let serverHandle = null;
    try {
      serverHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[SEARCH.SERVER_KEY]);
    } catch (error) {
      serverHandle = null;
    }
    return serverHandle ? { handle: serverHandle } : { message: TEXT.sendPathNone };
  }

  // Label ng destination para sa log (full path kung alam, kung hindi pangalan ng folder).
  function getDestinationLabel(destinationHandle) {
    if (getSendMode() === SEARCH.SEND_MODE.manual) {
      const typed = sanitizeInput(query('manualPath').value, CONFIG.FULL_PATH_MAX);
      return typed || destinationHandle.name;
    }
    const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
    return paths[SEARCH.SERVER_KEY] || destinationHandle.name;
  }

  // Inihahanda ang Saving path para sa log. Ibinibigay ang {handle} o {message} (hindi ito humaharang sa pagpapadala).
  async function prepareLogHandle() {
    let rootHandle = null;
    try {
      rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    } catch (error) {
      rootHandle = null;
    }
    if (!rootHandle) return { message: TEXT.logNoRoot };
    try {
      if (!(await storage.hasPermission(rootHandle, true))) return { message: TEXT.logNoPermission };
    } catch (error) {
      return { message: TEXT.logNoPermission };
    }
    return { handle: rootHandle };
  }

  // Isinusulat ang log ng mga naipadala. Ibinibigay ang mensaheng idadagdag sa status.
  async function writeSendLog(logTarget, processedList, destinationLabel) {
    if (!logTarget.handle) return logTarget.message;
    if (processedList.length === 0) return '';
    try {
      const machineName = sanitizeInput(storage.readLocalSettings().machineName || '', CONFIG.MACHINE_NAME_MAX);
      await sendLog.appendLog(logTarget.handle, machineName, processedList, destinationLabel);
      const rootPath = (storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {})[CONFIG.ROOT_KEY] || logTarget.handle.name;
      return TEXT.logSaved + sendLog.getLogLocation(rootPath);
    } catch (error) {
      return TEXT.logFailed;
    }
  }

  // SEND: kopyahin ang mga napiling file sa destination. Tinatanong kung papalitan ang kapangalan.
  async function onSend() {
    if (isBusy) return;
    const selectedList = getSelectedList();
    if (selectedList.length === 0) { setStatus('sendStatus', TEXT.noneSelected, 'error'); return; }
    if (!storage.isFolderAccessSupported()) { setStatus('sendStatus', TEXT.unsupported, 'error'); return; }
    setBusy(true);
    try {
      const destination = await resolveDestination();
      if (!destination.handle) { setStatus('sendStatus', destination.message, 'error'); return; }
      if (!(await fileSender.ensureWriteAccess(destination.handle))) { setStatus('sendStatus', TEXT.destinationNoPermission, 'error'); return; }
      const sourceHandleList = sourceStateList.filter((state) => state.handle).map((state) => state.handle);
      if (await fileSender.isInsideSource(destination.handle, sourceHandleList)) { setStatus('sendStatus', TEXT.destinationIsSource, 'error'); return; }
      // Hingin ang permission sa Saving path habang may click, bago ang tanong at ang pagpapadala.
      const logTarget = await prepareLogHandle();
      const existingCount = await fileSender.countExisting(selectedList, destination.handle);
      const overwrite = existingCount > 0 && window.confirm(TEXT.confirmOverwrite.replace('{n}', String(existingCount)));
      selectedList.forEach((item) => { item.status = SEARCH.STATUS.pending; renderStatus(item); });
      if (getSendMode() === SEARCH.SEND_MODE.manual) await rememberManual(true);
      control = fileScanner.createControl();
      let doneCount = 0;
      const summary = await fileSender.sendItems(selectedList, destination.handle, control, overwrite, (item) => {
        renderStatus(item);
        doneCount += 1;
        setStatus('sendStatus', TEXT.sending + doneCount + '/' + selectedList.length, 'info');
      });
      const processedList = selectedList.filter((item) => item.status !== SEARCH.STATUS.pending);
      const logMessage = await writeSendLog(logTarget, processedList, getDestinationLabel(destination.handle));
      const summaryText = TEXT.sendSummary
        .replace('{sent}', String(summary.sent)).replace('{replaced}', String(summary.replaced))
        .replace('{exists}', String(summary.exists)).replace('{failed}', String(summary.failed));
      setStatus('sendStatus', (summary.isStopped ? TEXT.sendStopped : '') + summaryText + logMessage, summary.failed > 0 ? 'error' : 'success');
    } catch (error) {
      setStatus('sendStatus', TEXT.sendError, 'error');
    } finally {
      control = null;
      setBusy(false);
    }
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    pageRoot = document.querySelector('.page-file-search');
    // Kapag may search pa na tumatakbo mula sa naunang bukas ng page, nananatili itong busy (hindi nare-reset).
    isBusy = Boolean(activeSearch);
    control = activeSearch ? activeSearch.control : null;
    previewToken = 0;
    previewUrl = '';
    resultList = [];
    rowMap = {};
    manualHandle = null;
    const today = new Date();
    query('rangeStart').value = csv.formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - SEARCH.RANGE_DEFAULT_DAYS));
    query('rangeEnd').value = csv.formatDateInput(today);
    query('nameInput').maxLength = SEARCH.NAME_MAX;
    query('manualPath').maxLength = CONFIG.FULL_PATH_MAX;
    query('manualPath').placeholder = TEXT.manualPlaceholder;
    query('manualFolder').textContent = TEXT.manualFolderNone;
    await restoreManual();
    query('latestNote').textContent = TEXT.latestNote.replace('{days}', String(SEARCH.LATEST_DAYS));
    renderServerPath();
    renderSendMode();
    renderResults([]);
    query('nameButton').addEventListener('click', onSearchName);
    query('rangeButton').addEventListener('click', onSearchDate);
    query('latestButton').addEventListener('click', onGetLatest);
    query('stopButton').addEventListener('click', onStop);
    query('clearButton').addEventListener('click', onClear);
    query('sendButton').addEventListener('click', onSend);
    query('manualPick').addEventListener('click', onPickManual);
    query('manualPath').addEventListener('input', () => query('manualPath').classList.remove('is-error'));
    query('nameInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); onSearchName(); }
    });
    document.querySelectorAll(SEL.sendModeRadio).forEach((radio) => radio.addEventListener('change', renderSendMode));
    query('selectAll').addEventListener('change', () => {
      const isChecked = query('selectAll').checked;
      resultList.forEach((item) => { if (item.type === SEARCH.TYPE.file) rowMap[item.id].checkbox.checked = isChecked; });
      updateSelectedCount();
    });
    query('resultBody').addEventListener('change', updateSelectedCount);
    query('resultBody').addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('.fs-preview-button') : null;
      if (!button) return;
      const item = resultList.find((entry) => String(entry.id) === button.dataset.id);
      if (item) openPreview(item);
    });
    query('previewClose').addEventListener('click', closePreview);
    query('previewDialog').addEventListener('close', resetPreviewBody);
    query('stopButton').disabled = true;
    await buildSourceRows();
    if (!storage.isFolderAccessSupported()) setStatus('status', TEXT.unsupported, 'error');
    if (activeSearch) {
      // May search pa: hindi clickable ang mga button, may kulay ang ginamit na button, at ang Stop ay gumagana.
      setBusy(true);
      markSearching(activeSearch.buttonKey);
      setStatus('status', activeSearch.progressText, 'info');
    } else if (pendingOutcome) {
      // Natapos ang search habang wala ka sa page: ipakita ang resulta.
      const outcome = pendingOutcome;
      pendingOutcome = null;
      showOutcome(outcome);
    }
  }

  root.registry.registerPage(SEARCH.PAGE, Object.freeze({ init }));
})();
