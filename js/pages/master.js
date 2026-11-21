/*
 * FILE    : js/pages/master.js
 * PURPOSE : Master page: Latest Master (today, readonly) at Range Master analysis, gamit ang Data source 1 ng Settings
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, master-analysis.js, chart-draw.js
 * VERSION : v7.3 | 2026-11-21 | Master Correl: pagkatapos ng run, ipinapadala ang status (PASS / WARNING / FAIL) sa Server path para sa LEAD PC (sendCorrelToLead)
 * VERSION : v7.2 | 2026-11-21 | Export ng Master Correl: may kopya na rin sa Server path (findServerForCopy, copyCorrelToServer); hindi pumapalya ang Saving path kapag pumalya ang Server
 * VERSION : v7.1 | 2026-11-21 | Master Correl: tinanggal ang Worst slider sa stat list (formatWorstSlider); nasa hiwalay na card na Compare sliders na ito
 * VERSION : v3.5 | 2026-11-21 | Compare vs previous: init ng root.compareUi (pagkatapos ng restoreSaved) at refresh sa updateExportButton
 * VERSION : v2.19 | 2026-11-21 | Export ng Master Correl: ipinapasa ang machine name para sa pamagat ng chart sa Excel
 * VERSION : v2.17c | 2026-11-21 | Latest Master: iisang Date na lang (query latestDate); ang Date ang ginagamit bilang start at end sa analyzeLatest
 * VERSION : v2.17 | 2026-11-21 | Pamagat ng chart = <machine name> Master Correl / Master Repeatability; ang huling resulta (Master Correl at Master Repeatability, kasama ang petsa, mode at napiling file) ay naaalala kapag umalis at bumalik sa Master page
 * VERSION : v2.3 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-20 | Latest Master at Range Master; error trapping
 * VERSION : v2.7 | 2026-11-20 | kulay green / yellow / red kada reading (point, dot, cell); legend; mas maliit na chart
 * VERSION : v2.9 | 2026-11-20 | Range Master: legend sa ilalim ng chart para sa napiling file lang (kasama ang MASTER)
 * VERSION : v2.8 | 2026-11-20 | Range Master: listahan ng file sa gilid ng chart (lahat naka-check); kapag na-uncheck, nawawala ang linya ng file sa chart
 * VERSION : v2.12 | 2026-11-21 | Mode ng Master Repeatability: All data points (flat) o Latest per shift (Morning / Night kada petsa)
 * VERSION : v2.10 | 2026-11-20 | Master Repeatability: chart sa scroll box (x/y), legend = petsa ng napiling file; Export to Excel sa Saving path
 * VERSION : v2.16 | 2026-11-21 | Master Correl: Export to Excel (master-correl) at Open latest correl file
 * VERSION : v2.22 | 2026-11-21 | Latest (Correl): Worst slider sa stat list (formatWorstSlider)
 * VERSION : v2.21 | 2026-11-21 | pindutin ang barcode sa table (o sa chart) para laki-an ang point ng barcode na iyon sa Correl at Repeatability (bindBarcodeSelect)
 * VERSION : v2.20 | 2026-11-21 | Open latest correl file: folder ang binubuksan (opened.openedPath)
 * VERSION : v2.15 | 2026-11-21 | Open latest: walang download; full path ng Saving path ang ipinapasa sa masterOpenLatest
 * VERSION : v2.15 | 2026-11-21 | Master Correl: editable ang Start date at End date (may validation), hindi na ino-overwrite ng ngayong araw
 * VERSION : v2.14 | 2026-11-21 | Open latest repeatability file (kaliwa ng Export to Excel): binubuksan ang pinakabagong na-export na Excel
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const CHART = CONFIG.CHART;
  const SEL = CONFIG.SELECTOR.master;
  const TEXT = CONFIG.TEXT.master;
  const { storage, csv, masterAnalysis, chart, masterExport, masterOpenLatest, correlExport } = root;
  const EXPORT = root.exportConfig;
  const CORREL = root.correlConfig;
  const SHIFT = root.shiftConfig;

  let sourceHandle = null;
  let isBusy = false;
  let lastRangeResult = null;
  let lastLatestRun = null;

  // Alaala ng huling resulta; nananatili habang bukas ang website (hindi nabubura kapag lumipat ng page).
  const saved = { latest: null, range: null, rangeDates: null, selectedNameSet: null };

  // Machine name mula sa Settings; walang laman kung hindi pa naka-set.
  function getMachineName() {
    const settings = storage.readLocalSettings();
    return typeof settings.machineName === 'string' ? settings.machineName.trim() : '';
  }

  // Pamagat ng chart: <machine name> + pangalan ng chart (hal. "MWW 1 Master Correl").
  function buildChartTitle(baseTitle) {
    const machineName = getMachineName();
    return machineName ? machineName + ' ' + baseTitle : baseTitle;
  }

  // Napiling mode ng Master Repeatability ('all' o 'shift').
  function getSelectedMode() {
    const checked = document.querySelector(SHIFT.SELECTOR.checkedMode);
    return checked ? checked.value : SHIFT.DEFAULT_MODE;
  }

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  // Gumagawa ng element na may class at text (textContent lang).
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Mensahe sa ilalim ng button: 'error', 'success' o 'info'.
  function setStatus(statusKey, message, kind) {
    const element = query(statusKey);
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
    element.classList.toggle('is-info', kind === 'info');
  }

  // Ginagawang friendly na mensahe ang error (walang teknikal na detalye).
  function getErrorMessage(error) {
    const messageMap = TEXT.error;
    if (error && SHIFT.TEXT.error[error.code]) return SHIFT.TEXT.error[error.code];
    if (error && messageMap[error.code]) return messageMap[error.code];
    if (error && MASTER.ERROR_BY_NAME[error.name]) return messageMap[MASTER.ERROR_BY_NAME[error.name]];
    return messageMap.readFail;
  }

  // Button ng Export to Excel (hindi ito nasa CONFIG.SELECTOR.master).
  function getExportButton() {
    return document.querySelector(EXPORT.SELECTOR.exportButton);
  }

  // Button ng Open latest repeatability file (hindi ito nasa CONFIG.SELECTOR.master).
  function getOpenLatestButton() {
    return document.querySelector(EXPORT.SELECTOR.openLatestButton);
  }

  // Mga button ng Master Correl (Open latest correl file at Export to Excel).
  function getCorrelOpenButton() {
    return document.querySelector(CORREL.SELECTOR.openLatestButton);
  }
  function getCorrelExportButton() {
    return document.querySelector(CORREL.SELECTOR.exportButton);
  }

  // Bukas lang ang Export kapag may resulta (Master Repeatability o Master Correl) at walang tumatakbo.
  function updateExportButton() {
    getExportButton().disabled = isBusy || !lastRangeResult;
    getCorrelExportButton().disabled = isBusy || !lastLatestRun;
    if (root.compareUi) root.compareUi.refresh();
  }

  // Disable ng mga button habang tumatakbo.
  function setBusy(nextBusy) {
    isBusy = nextBusy;
    query('latestButton').disabled = nextBusy;
    query('rangeButton').disabled = nextBusy;
    getOpenLatestButton().disabled = nextBusy;
    getCorrelOpenButton().disabled = nextBusy;
    updateExportButton();
  }

  // Friendly na mensahe ng error sa pag-export (walang teknikal na detalye).
  function getExportErrorMessage(error) {
    const messageMap = EXPORT.TEXT.error;
    if (error && messageMap[error.code]) return messageMap[error.code];
    if (error && EXPORT.ERROR_BY_NAME[error.name]) return messageMap[EXPORT.ERROR_BY_NAME[error.name]];
    return messageMap.exportFail;
  }

  // Inihahanda ang folder handle ng Data source 1 at hinihingi ang permission (dapat galing sa click).
  async function getReadyHandle() {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    if (!sourceHandle) sourceHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[MASTER.SOURCE_KEY]);
    if (!sourceHandle) throw csv.createError('noSource');
    if (!(await storage.hasPermission(sourceHandle, true))) throw csv.createError('noPermission');
    return sourceHandle;
  }

  // Ipinapakita ang path ng Data source 1 mula sa Settings (full path kung meron, kung hindi pangalan ng folder).
  function renderSource() {
    const settings = storage.readLocalSettings();
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    const names = settings.folderNames || {};
    const text = paths[MASTER.SOURCE_KEY] || names[MASTER.SOURCE_KEY] || TEXT.sourceNotSet;
    query('source').textContent = text;
  }

  // Nililinis ang resulta at mensahe ng isang seksyon.
  function clearSection(statusKey, resultKey) {
    setStatus(statusKey, '', '');
    query(resultKey).replaceChildren();
  }

  // Status badge (PASS / WARNING / FAIL).
  function makeStatusBadge(status) {
    return makeElement('span', 'status-badge ' + MASTER.STATUS_CLASS[status], status);
  }

  // Listahan ng label at value.
  function makeStatList(entryList) {
    const list = makeElement('div', 'stat-list');
    entryList.forEach((entry) => {
      const item = makeElement('div', 'stat-item');
      item.append(makeElement('span', 'stat-label', entry[0]), makeElement('span', 'stat-value', entry[1]));
      list.append(item);
    });
    return list;
  }

  // Table na may horizontal scroll sa maliit na screen.
  function makeTable(headerList, rowList) {
    const wrap = makeElement('div', 'table-wrap');
    const table = makeElement('table', 'result-table');
    const headRow = document.createElement('tr');
    headerList.forEach((header) => headRow.append(makeElement('th', '', header)));
    const head = document.createElement('thead');
    head.append(headRow);
    const body = document.createElement('tbody');
    rowList.forEach((cellList) => {
      const row = document.createElement('tr');
      cellList.forEach((cell) => {
        const isLevelCell = typeof cell === 'object';
        row.append(makeElement('td', isLevelCell ? cell.level : '', isLevelCell ? cell.text : cell));
      });
      body.append(row);
    });
    table.append(head, body);
    wrap.append(table);
    return wrap;
  }

  // Pinipili ang barcode: nilalakihan ang point nito sa chart at hina-highlight ang row sa table.
  // Pindutin ang barcode sa table (o ang point / label sa chart); pindutin ulit para i-unselect.
  // Ibinibigay ang apply() na tatawagin pagkatapos i-redraw ang chart (para hindi mawala ang napili).
  function bindBarcodeSelect(tableWrap, chartBoxList) {
    let selectedBarcode = '';
    const rowList = Array.from(tableWrap.querySelectorAll('tbody tr'));
    const apply = () => {
      rowList.forEach((row) => row.classList.toggle('is-selected', selectedBarcode !== '' && row.firstElementChild.textContent === selectedBarcode));
      chartBoxList.forEach((box) => chart.highlight(box, selectedBarcode));
    };
    const toggle = (barcode) => {
      selectedBarcode = selectedBarcode === barcode ? '' : barcode;
      apply();
    };
    rowList.forEach((row) => {
      const cell = row.firstElementChild;
      cell.classList.add('barcode-link');
      cell.tabIndex = 0;
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', TEXT.barcodeSelectAria + cell.textContent);
      cell.addEventListener('click', () => toggle(cell.textContent));
      cell.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle(cell.textContent);
      });
    });
    chartBoxList.forEach((box) => box.addEventListener('click', (event) => {
      const target = event.target.closest('[data-barcode]');
      if (target) toggle(target.getAttribute('data-barcode'));
    }));
    return apply;
  }

  // Kulay ng reading ayon sa actual vs master.
  function levelOf(actualValue, masterValue) {
    return masterAnalysis.classifyDeviation(actualValue, masterValue);
  }

  // Legend ng kulay (green / yellow / red) mula sa CONFIG.MASTER.DEVIATION.
  function makeLevelLegend() {
    const rule = MASTER.DEVIATION;
    const textMap = {
      green: TEXT.levelGreen.replace('{low}', String(rule.GREEN_MAX)),
      yellow: TEXT.levelYellow.replace('{low}', String(rule.GREEN_MAX)).replace('{high}', String(rule.YELLOW_MAX)),
      red: TEXT.levelRed.replace('{high}', String(rule.YELLOW_MAX))
    };
    const list = makeElement('ul', 'level-legend');
    list.append(makeElement('li', 'level-legend-title', TEXT.levelLegendTitle));
    Object.keys(textMap).forEach((key) => list.append(makeElement('li', 'level-legend-item ' + rule.LEVEL[key], textMap[key])));
    return list;
  }

  // Legend ng chart: petsa ng bawat napiling record (kulay ay kapareho ng linya, kada file); may scroll pataas/pababa.
  function makeDateLegend(seriesList) {
    const list = makeElement('ul', 'date-legend');
    list.tabIndex = 0;
    list.setAttribute('aria-label', EXPORT.TEXT.dateLegendAria);
    list.append(makeElement('li', 'date-legend-title', EXPORT.TEXT.dateLegendTitle + (seriesList.length - 1)));
    seriesList.forEach((series, index) => {
      const colorIndex = (series.colorIndex !== undefined ? series.colorIndex : index) % CONFIG.CHART.PALETTE_SIZE;
      const colorClass = series.isMaster ? 'chart-master' : 'chart-series-' + colorIndex;
      list.append(makeElement('li', 'date-legend-item ' + colorClass, series.name));
    });
    return list;
  }

  // Numero sa 3 decimal; '-' kung wala.
  function formatNumber(value, digits) {
    return value === null || value === undefined ? '-' : value.toFixed(digits === undefined ? 3 : digits);
  }

  // Nagre-render ng resulta ng Latest Master.
  function renderLatest(result) {
    const area = query('latestResult');
    const head = makeElement('div', 'result-head');
    head.append(makeStatusBadge(result.status));
    area.replaceChildren(head, makeStatList([
      [TEXT.rSquared, result.regression.rSquared.toFixed(4)],
      [TEXT.recordDate, csv.formatDateTime(result.recordDate, true)],
      [TEXT.actualAverage, formatNumber(result.actualAverage, 6)],
      [TEXT.masterAverage, formatNumber(result.masterAverage, 6)],
      [TEXT.fileName, result.fileName]
    ]));
    const latestTable = makeTable([TEXT.barcode, TEXT.actual, TEXT.master], result.barcodeList.map((barcode, index) => [barcode, { text: formatNumber(result.actualList[index], 3), level: levelOf(result.actualList[index], result.masterList[index]) }, formatNumber(result.masterList[index], 3)]));
    area.append(latestTable);
    const chartGrid = makeElement('div', 'chart-grid');
    const scatterBox = makeElement('div', 'chart-box');
    const barBox = makeElement('div', 'chart-box');
    chartGrid.append(scatterBox, barBox);
    area.append(makeLevelLegend(), chartGrid);
    const pointList = [];
    result.masterList.forEach((masterValue, index) => { if (masterValue !== null && result.actualList[index] !== null) pointList.push({ x: masterValue, y: result.actualList[index], level: levelOf(result.actualList[index], masterValue), barcode: result.barcodeList[index] }); });
    bindBarcodeSelect(latestTable, [scatterBox]);
    chart.drawScatter(scatterBox, { title: buildChartTitle(TEXT.scatterTitle), xTitle: TEXT.scatterX, yTitle: TEXT.scatterY, pointList, trend: result.regression });
    chart.drawBars(barBox, { title: TEXT.barTitle, itemList: [{ label: TEXT.actualAverage, value: result.actualAverage || 0 }, { label: TEXT.masterAverage, value: result.masterAverage || 0 }] });
    if (result.unreadableCount) area.append(makeElement('p', 'result-note', result.unreadableCount + TEXT.unreadable));
  }

  // Pinagsasama ang mga linya ayon sa file: pangalan, kulay (colorIndex) at bilang ng record. Ayon sa unang labas ng file.
  function groupByFile(columnList) {
    const groupList = [];
    const groupMap = new Map();
    columnList.forEach((column) => {
      if (!groupMap.has(column.fileName)) {
        const group = { name: column.fileName, colorIndex: groupList.length % CHART.PALETTE_SIZE, recordCount: 0 };
        groupMap.set(column.fileName, group);
        groupList.push(group);
      }
      groupMap.get(column.fileName).recordCount += 1;
    });
    return { groupList, groupMap };
  }

  // Iginuguhit ang line chart ng Range Master; ang mga linya lang ng napiling file (at ang MASTER) ang kasama.
  function drawRangeLines(lineBox, legendHost, result, shownList, groupMap, selectedNameSet) {
    const seriesList = shownList
      .filter((column) => selectedNameSet.has(column.fileName))
      .map((column) => ({
        name: column.key, values: column.values, isMaster: false, colorIndex: groupMap.get(column.fileName).colorIndex,
        levelList: column.values.map((value, index) => levelOf(value, result.masterList[index]))
      }));
    seriesList.push({ name: TEXT.masterSeries, values: result.masterList, isMaster: true });
    chart.drawLines(lineBox, { title: buildChartTitle(TEXT.lineTitle), categoryList: result.barcodeList, seriesList, hideLegend: true });
    legendHost.replaceChildren(makeDateLegend(seriesList));
  }

  // Panel sa gilid ng chart: checkbox ng bawat file (lahat naka-check). Tinatawag ang onChange kapag may binago.
  function makeFilePanel(groupList, selectedNameSet, onChange) {
    const panel = makeElement('aside', 'file-panel');
    panel.setAttribute('aria-label', TEXT.filePanelTitle);
    const summary = makeElement('p', 'file-panel-summary');
    summary.setAttribute('aria-live', 'polite');
    const updateSummary = () => {
      summary.textContent = selectedNameSet.size
        ? TEXT.fileSelected.replace('{n}', String(selectedNameSet.size)).replace('{total}', String(groupList.length))
        : TEXT.fileNoneSelected;
    };
    const list = makeElement('ul', 'file-list');
    const masterItem = makeElement('li', 'file-item file-item-master chart-master');
    masterItem.append(makeElement('span', 'file-swatch'), makeElement('span', 'file-name', TEXT.masterSeries));
    list.append(masterItem);
    groupList.forEach((group) => {
      const item = makeElement('li', 'file-item');
      const label = makeElement('label', 'file-label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'file-checkbox';
      checkbox.checked = selectedNameSet.has(group.name);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selectedNameSet.add(group.name);
        else selectedNameSet.delete(group.name);
        updateSummary();
        onChange();
      });
      const name = makeElement('span', 'file-name', group.name);
      name.title = group.name;
      label.append(checkbox, makeElement('span', 'file-swatch chart-series-' + group.colorIndex), name,
        makeElement('span', 'file-count', group.recordCount + TEXT.fileRecords));
      item.append(label);
      list.append(item);
    });
    updateSummary();
    panel.append(makeElement('h3', 'file-panel-title', TEXT.filePanelTitle), makeElement('p', 'file-panel-note', TEXT.filePanelNote), summary, list);
    return panel;
  }

  // Nagre-render ng resulta ng Range Master.
  function renderRange(result, initialNameSet) {
    const area = query('rangeResult');
    const stats = result.stats;
    const head = makeElement('div', 'result-head');
    head.append(makeStatusBadge(stats.status));
    area.replaceChildren(head, makeStatList([
      [TEXT.repeatability, formatNumber(stats.score, 2) + '%'],
      [TEXT.averageDifference, formatNumber(stats.averageDifference)],
      [TEXT.worstBarcode, stats.worstBarcode || '-'],
      [TEXT.maxDifference, formatNumber(stats.maxDifference)],
      [TEXT.actualAverage, formatNumber(stats.actualAverage)],
      [TEXT.masterAverage, formatNumber(stats.masterAverage)],
      [TEXT.difference, formatNumber(stats.difference)],
      [TEXT.records, String(result.recordCount)],
      [TEXT.csvFiles, result.fileCount + ' (' + TEXT.masterFiles.toLowerCase() + ': ' + result.masterFileCount + ')'],
      [TEXT.range, csv.formatDateTime(result.startDate, false).slice(0, 10) + ' - ' + csv.formatDateTime(result.endDate, false).slice(0, 10)],
      [SHIFT.TEXT.modeLabel, SHIFT.TEXT.modeName[result.mode]]
    ]));
    const rangeTable = makeTable([TEXT.barcode, TEXT.master, TEXT.actualAverageShort, TEXT.averageDifference, TEXT.maxDifference],
      stats.perBarcodeList.map((entry) => [entry.barcode, formatNumber(entry.master), { text: formatNumber(entry.actualAverage), level: levelOf(entry.actualAverage, entry.master) }, formatNumber(entry.averageDifference), { text: formatNumber(entry.maxDifference), level: entry.maxDifference === null ? '' : levelOf(entry.maxDifference, 0) }]));
    area.append(rangeTable);
    const chartBlock = makeElement('div', 'chart-block');
    const scrollBox = makeElement('div', 'chart-scroll');
    scrollBox.tabIndex = 0;
    scrollBox.setAttribute('role', 'region');
    scrollBox.setAttribute('aria-label', EXPORT.TEXT.chartAria);
    const lineBox = makeElement('div', 'chart-box');
    const legendHost = makeElement('div', 'date-legend-host');
    scrollBox.append(lineBox);
    chartBlock.append(scrollBox, legendHost);
    const shownList = result.columnList.slice(-MASTER.RANGE.MAX_LINES);
    const { groupList, groupMap } = groupByFile(shownList);
    const selectedNameSet = new Set(groupList.map((group) => group.name).filter((name) => !initialNameSet || initialNameSet.has(name)));
    saved.selectedNameSet = selectedNameSet;
    const applyBarcodeSelect = bindBarcodeSelect(rangeTable, [lineBox]);
    // Pagkatapos i-redraw ang chart (hal. may na-uncheck na file), ibinabalik ang laki ng napiling barcode.
    const redraw = () => { drawRangeLines(lineBox, legendHost, result, shownList, groupMap, selectedNameSet); applyBarcodeSelect(); };
    const layout = makeElement('div', 'range-chart-layout');
    layout.append(chartBlock, makeFilePanel(groupList, selectedNameSet, redraw));
    area.append(makeLevelLegend(), layout);
    redraw();
    if (shownList.length < result.columnList.length) area.append(makeElement('p', 'result-note', TEXT.linesLimited.replace('{n}', String(shownList.length))));
    if (result.unreadableCount) area.append(makeElement('p', 'result-note', result.unreadableCount + TEXT.unreadable));
  }

  // Ipinapadala ang status ng Master Correl (PASS / WARNING / FAIL) sa Server path para makita ng LEAD PC; ang resulta ay ipinapakita sa status line.
  async function sendCorrelToLead(result) {
    const sync = root.correlSyncConfig;
    const key = await root.correlSync.publishStatus(result, storage.readLocalSettings(), true);
    const rSquared = result.regression && typeof result.regression.rSquared === 'number' ? result.regression.rSquared.toFixed(sync.R_SQUARED_DIGITS) : '-';
    const message = (sync.TEXT[key] || sync.TEXT.error).replace('{status}', result.status).replace('{rSquared}', rSquared);
    setStatus('latestStatus', message, sync.MESSAGE_KIND[key] || 'error');
  }

  // Click ng Run Latest Master.
  async function onRunLatest() {
    if (isBusy) return;
    clearSection('latestStatus', 'latestResult');
    lastLatestRun = null;
    saved.latest = null;
    updateExportButton();
    const startDate = csv.parseDateInput(query('latestDate').value);
    if (!startDate) { setStatus('latestStatus', TEXT.error.badDate, 'error'); return; }
    const endDate = startDate;
    setBusy(true);
    try {
      setStatus('latestStatus', TEXT.working, 'info');
      const handle = await getReadyHandle();
      const result = await masterAnalysis.analyzeLatest(handle, startDate, (current, total, name) => setStatus('latestStatus', TEXT.progress + current + '/' + total + ' ' + name, 'info'), endDate);
      renderLatest(result);
      lastLatestRun = { result, range: { startDate, endDate } };
      saved.latest = lastLatestRun;
      setStatus('latestStatus', '', '');
      await sendCorrelToLead(result);
    } catch (error) {
      query('latestResult').replaceChildren();
      setStatus('latestStatus', getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Click ng Run Range Master (may validation ng petsa bago magbasa).
  async function onRunRange() {
    if (isBusy) return;
    clearSection('rangeStatus', 'rangeResult');
    lastRangeResult = null;
    saved.range = null;
    saved.rangeDates = null;
    saved.selectedNameSet = null;
    updateExportButton();
    const startDate = csv.parseDateInput(query('rangeStart').value);
    const endDate = csv.parseDateInput(query('rangeEnd').value);
    if (!startDate || !endDate) { setStatus('rangeStatus', TEXT.error.badDates, 'error'); return; }
    if (startDate > endDate) { setStatus('rangeStatus', TEXT.error.startAfterEnd, 'error'); return; }
    setBusy(true);
    try {
      setStatus('rangeStatus', TEXT.working, 'info');
      const handle = await getReadyHandle();
      const analyzed = await masterAnalysis.analyzeRange(handle, startDate, endDate, (current, total, name) => setStatus('rangeStatus', TEXT.progress + current + '/' + total + ' ' + name, 'info'));
      const result = root.masterShift.applyMode(analyzed, getSelectedMode());
      renderRange(result);
      lastRangeResult = result;
      saved.range = result;
      saved.rangeDates = { startDate, endDate };
      setStatus('rangeStatus', '', '');
    } catch (error) {
      query('rangeResult').replaceChildren();
      setStatus('rangeStatus', getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Click ng Export to Excel: sine-save sa <Saving path>/<subfolder>/ (ginagawa ang subfolder kung wala pa).
  async function onExport() {
    if (isBusy) return;
    if (!lastRangeResult) { setStatus('rangeStatus', EXPORT.TEXT.error.noResult, 'error'); return; }
    setBusy(true);
    try {
      setStatus('rangeStatus', EXPORT.TEXT.exporting, 'info');
      if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
      const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle) throw csv.createError('noRoot');
      if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
      const settings = storage.readLocalSettings();
      const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
      const sourceText = paths[MASTER.SOURCE_KEY] || (settings.folderNames || {})[MASTER.SOURCE_KEY] || TEXT.sourceNotSet;
      const saved = await masterExport.exportRepeatability(lastRangeResult, rootHandle, sourceText);
      const basePath = paths[CONFIG.ROOT_KEY] || rootHandle.name;
      const separator = EXPORT.PATH_SEPARATOR;
      setStatus('rangeStatus', EXPORT.TEXT.saved + basePath + separator + saved.folderName + separator + saved.fileName, 'success');
    } catch (error) {
      setStatus('rangeStatus', getExportErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Click ng Open latest repeatability file: hinahanap sa <Saving path>/<subfolder>/ ang pinakabagong .xlsx at binubuksan.
  async function onOpenLatestFile() {
    if (isBusy) return;
    setBusy(true);
    try {
      setStatus('rangeStatus', EXPORT.TEXT.openingLatest, 'info');
      if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
      const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle) throw csv.createError('noRoot');
      if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
      const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
      const opened = await masterOpenLatest.openLatest(rootHandle, paths[CONFIG.ROOT_KEY]);
      setStatus('rangeStatus', EXPORT.TEXT.openedLatest + opened.fullPath + EXPORT.TEXT.openedHint, 'success');
    } catch (error) {
      const messageMap = EXPORT.TEXT.error;
      const known = error && messageMap[error.code];
      setStatus('rangeStatus', known ? messageMap[error.code] : (error && EXPORT.ERROR_BY_NAME[error.name] ? messageMap[EXPORT.ERROR_BY_NAME[error.name]] : messageMap.openFail), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Friendly na mensahe ng error ng Correl export / open: Correl text muna, tapos ang pangkalahatan ng export (walang teknikal na detalye).
  function getCorrelErrorMessage(error, fallbackKey) {
    const correlMap = CORREL.TEXT.error;
    const exportMap = EXPORT.TEXT.error;
    if (error && correlMap[error.code]) return correlMap[error.code];
    if (error && exportMap[error.code]) return exportMap[error.code];
    if (error && EXPORT.ERROR_BY_NAME[error.name]) return exportMap[EXPORT.ERROR_BY_NAME[error.name]];
    return correlMap[fallbackKey];
  }

  // Kinukuha ang Server path at humihingi ng permission (galing sa click). Hindi nagtatapon ng error.
  async function findServerForCopy() {
    try {
      return await root.queue.findServerHandle(true);
    } catch (error) {
      return { handle: null, state: CONFIG.QUEUE.CONNECTION.error };
    }
  }

  // Kopya ng na-export na Excel sa Server path. Ibinibigay { ok: true, path } o { ok: false, message }; hindi nagtatapon ng error.
  async function copyCorrelToServer(serverFound, saved, paths) {
    const serverText = CORREL.TEXT.serverState;
    if (serverFound.state !== CONFIG.QUEUE.CONNECTION.ok) return { ok: false, message: serverText[serverFound.state] || serverText.error };
    try {
      const copied = await correlExport.copyToServer(serverFound.handle, saved, getMachineName());
      const separator = EXPORT.PATH_SEPARATOR;
      const basePath = paths[CONFIG.SERVER_KEY] || serverFound.handle.name;
      return { ok: true, path: basePath + separator + copied.folderName + separator + copied.fileName };
    } catch (error) {
      return { ok: false, message: serverText.error };
    }
  }

  // Click ng Export to Excel ng Master Correl: sine-save sa <Saving path>/master-correl/<petsa>/ at kinokopya sa <Server path>/master-correl/<machine name>/<petsa>/.
  async function onExportCorrel() {
    if (isBusy) return;
    if (!lastLatestRun) { setStatus('latestStatus', CORREL.TEXT.error.noResult, 'error'); return; }
    setBusy(true);
    try {
      setStatus('latestStatus', CORREL.TEXT.exporting, 'info');
      if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
      const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle) throw csv.createError('noRoot');
      if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
      const serverFound = await findServerForCopy();
      const settings = storage.readLocalSettings();
      const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
      const sourceText = paths[MASTER.SOURCE_KEY] || (settings.folderNames || {})[MASTER.SOURCE_KEY] || TEXT.sourceNotSet;
      const saved = await correlExport.exportCorrel(lastLatestRun.result, lastLatestRun.range, rootHandle, sourceText, getMachineName());
      const basePath = paths[CONFIG.ROOT_KEY] || rootHandle.name;
      const separator = EXPORT.PATH_SEPARATOR;
      const savedText = CORREL.TEXT.saved + basePath + separator + saved.folderName + separator + saved.fileName;
      const serverCopy = await copyCorrelToServer(serverFound, saved, paths);
      if (serverCopy.ok) setStatus('latestStatus', savedText + CORREL.TEXT.serverSaved + serverCopy.path, 'success');
      else setStatus('latestStatus', savedText + CORREL.TEXT.serverFailed + serverCopy.message, 'error');
    } catch (error) {
      setStatus('latestStatus', getCorrelErrorMessage(error, 'exportFail'), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Click ng Open latest correl file: binubuksan sa Excel (handler na bmww-open:) ang pinakabagong file sa master-correl.
  async function onOpenLatestCorrel() {
    if (isBusy) return;
    setBusy(true);
    try {
      setStatus('latestStatus', CORREL.TEXT.openingLatest, 'info');
      if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
      const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle) throw csv.createError('noRoot');
      if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
      const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
      const opened = await masterOpenLatest.openLatest(rootHandle, paths[CONFIG.ROOT_KEY], CORREL);
      setStatus('latestStatus', CORREL.TEXT.openedLatest + opened.openedPath + EXPORT.TEXT.openedHint, 'success');
    } catch (error) {
      setStatus('latestStatus', getCorrelErrorMessage(error, 'openFail'), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Ibinabalik ang huling resulta (at ang petsa / mode na ginamit) kapag bumalik sa Master page.
  function restoreSaved() {
    if (saved.latest) {
      query('latestDate').value = csv.formatDateInput(saved.latest.range.startDate);
      renderLatest(saved.latest.result);
      lastLatestRun = saved.latest;
    }
    if (saved.range && saved.rangeDates) {
      query('rangeStart').value = csv.formatDateInput(saved.rangeDates.startDate);
      query('rangeEnd').value = csv.formatDateInput(saved.rangeDates.endDate);
      const modeRadio = document.querySelector(SHIFT.SELECTOR.checkedMode.replace(':checked', '[value="' + saved.range.mode + '"]'));
      if (modeRadio) modeRadio.checked = true;
      renderRange(saved.range, saved.selectedNameSet);
      lastRangeResult = saved.range;
    }
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    isBusy = false;
    sourceHandle = null;
    lastRangeResult = null;
    lastLatestRun = null;
    const today = new Date();
    const rangeStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - MASTER.RANGE.DEFAULT_DAYS);
    query('latestDate').value = csv.formatDateInput(today);
    query('rangeStart').value = csv.formatDateInput(rangeStart);
    query('rangeEnd').value = csv.formatDateInput(today);
    renderSource();
    restoreSaved();
    root.compareUi.init({ getLatestRun: () => lastLatestRun, isBusy: () => isBusy, setBusy, getReadyHandle, getReadErrorMessage: getErrorMessage, getMachineName });
    query('latestButton').addEventListener('click', onRunLatest);
    query('rangeButton').addEventListener('click', onRunRange);
    getExportButton().addEventListener('click', onExport);
    getOpenLatestButton().addEventListener('click', onOpenLatestFile);
    getCorrelExportButton().addEventListener('click', onExportCorrel);
    getCorrelOpenButton().addEventListener('click', onOpenLatestCorrel);
    updateExportButton();
    if (!storage.isFolderAccessSupported()) {
      setBusy(true);
      setStatus('latestStatus', TEXT.error.unsupported, 'error');
      return;
    }
    try {
      sourceHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[MASTER.SOURCE_KEY]);
    } catch (error) {
      sourceHandle = null;
    }
    if (!sourceHandle) setStatus('latestStatus', TEXT.error.noSource, 'error');
  }

  root.registry.registerPage('master', Object.freeze({ init }));
})();
