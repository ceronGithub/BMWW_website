/*
 * FILE    : js/core/calibration-repeatability-ui.js
 * PURPOSE : Screen ng Calibration Repeatability sa Calibration page (kopya ng Master Repeatability): Start/End date, mode (All / Latest per shift), table, line chart na may file panel, at kusang Excel export (window.BMWW.calibrationRepeatabilityUi)
 * DEPENDS : js/core/config.js, storage.js, queue.js, csv-reader.js, chart-draw.js, master-shift.js, calibration-repeatability.js, calibration-repeatability-export.js, calibration-repeatability-config.js, calibration-config.js
 * VERSION : v23 | 2026-11-24 | Barcode checker (Task 11): tala sa ilalim ng resulta kung may file na nilaktawan dahil mali ang barcode (result.barcodeRejectedList)
 * VERSION : v9.2 | 2026-11-22 | bagong file; tinatawag ng js/pages/calibration.js (init at refresh); walang sync sa Dashboard ng LEAD PC
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const CHART = CONFIG.CHART;
  const MTEXT = CONFIG.TEXT.master;
  const EXPORT = root.exportConfig;
  const SHIFT = root.shiftConfig;
  const SETTING = root.calibrationRepeatabilityConfig;
  const SEL = SETTING.SELECTOR;
  const CTEXT = root.calibrationConfig.TEXT;
  const { storage, csv, chart, masterAnalysis, calibrationRepeatability, calibrationRepeatabilityExport } = root;

  // hooks galing sa calibration.js: isBusy, setBusy, getReadyHandle, getReadErrorMessage, getMachineName, getSourceText, getTodayDate
  let hooks = null;
  // Huling resulta at napiling file; nananatili habang bukas ang website (para sa pagbalik sa Calibration page).
  const saved = { result: null, dates: null, selectedNameSet: null };
  let lastResult = null;

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
  function setStatus(message, kind) {
    const element = query('status');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
    element.classList.toggle('is-info', kind === 'info');
  }

  // Friendly na mensahe ng error sa pagbasa (walang teknikal na detalye).
  function getReadMessage(error) {
    const code = error && error.code;
    if (code && SETTING.TEXT.error[code]) return SETTING.TEXT.error[code];
    if (code && MTEXT.error[code]) return MTEXT.error[code];
    if (code && SHIFT.TEXT.error[code]) return SHIFT.TEXT.error[code];
    return hooks.getReadErrorMessage(error);
  }

  // Friendly na mensahe ng error sa pag-export (walang teknikal na detalye).
  function getExportMessage(error) {
    if (error && EXPORT.TEXT.error[error.code]) return EXPORT.TEXT.error[error.code];
    if (error && EXPORT.ERROR_BY_NAME[error.name]) return EXPORT.TEXT.error[EXPORT.ERROR_BY_NAME[error.name]];
    return CTEXT.error.exportFail;
  }

  // Numero sa 3 decimal; '-' kung wala.
  function formatNumber(value, digits) {
    return value === null || value === undefined ? '-' : value.toFixed(digits === undefined ? 3 : digits);
  }

  // Kulay ng reading ayon sa actual vs master.
  function levelOf(actualValue, masterValue) {
    return masterAnalysis.classifyDeviation(actualValue, masterValue);
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

  // Pindutin ang barcode sa table (o ang point / label sa chart) para laki-an ang point nito; pindutin ulit para i-unselect.
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
      cell.setAttribute('aria-label', CTEXT.barcodeSelectAria + cell.textContent);
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

  // Legend ng kulay (green / yellow / red) mula sa CONFIG.MASTER.DEVIATION.
  function makeLevelLegend() {
    const rule = MASTER.DEVIATION;
    const textMap = {
      green: CTEXT.levelGreen.replace('{low}', String(rule.GREEN_MAX)),
      yellow: CTEXT.levelYellow.replace('{low}', String(rule.GREEN_MAX)).replace('{high}', String(rule.YELLOW_MAX)),
      red: CTEXT.levelRed.replace('{high}', String(rule.YELLOW_MAX))
    };
    const list = makeElement('ul', 'level-legend');
    list.append(makeElement('li', 'level-legend-title', CTEXT.levelLegendTitle));
    Object.keys(textMap).forEach((key) => list.append(makeElement('li', 'level-legend-item ' + rule.LEVEL[key], textMap[key])));
    return list;
  }

  // Legend ng petsa (kulay ng bawat linya).
  function makeDateLegend(seriesList) {
    const list = makeElement('ul', 'date-legend');
    list.tabIndex = 0;
    list.setAttribute('aria-label', EXPORT.TEXT.dateLegendAria);
    list.append(makeElement('li', 'date-legend-title', EXPORT.TEXT.dateLegendTitle + (seriesList.length - 1)));
    seriesList.forEach((series, index) => {
      const colorIndex = (series.colorIndex !== undefined ? series.colorIndex : index) % CHART.PALETTE_SIZE;
      list.append(makeElement('li', 'date-legend-item ' + (series.isMaster ? 'chart-master' : 'chart-series-' + colorIndex), series.name));
    });
    return list;
  }

  // Pamagat ng chart: <machine name> Calibration Repeatability.
  function buildChartTitle() {
    const machineName = hooks.getMachineName();
    return machineName ? machineName + ' ' + SETTING.TEXT.lineTitle : SETTING.TEXT.lineTitle;
  }

  // Pinagsasama ang mga linya ayon sa file: pangalan, kulay (colorIndex) at bilang ng record.
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

  // Iginuguhit ang line chart; ang mga linya lang ng napiling file (at ang MASTER) ang kasama.
  function drawRangeLines(lineBox, legendHost, result, shownList, groupMap, selectedNameSet) {
    const seriesList = shownList
      .filter((column) => selectedNameSet.has(column.fileName))
      .map((column) => ({
        name: column.key, values: column.values, isMaster: false, colorIndex: groupMap.get(column.fileName).colorIndex,
        levelList: column.values.map((value, index) => levelOf(value, result.masterList[index]))
      }));
    seriesList.push({ name: MTEXT.masterSeries, values: result.masterList, isMaster: true });
    chart.drawLines(lineBox, { title: buildChartTitle(), categoryList: result.barcodeList, seriesList, hideLegend: true });
    legendHost.replaceChildren(makeDateLegend(seriesList));
  }

  // Panel sa gilid ng chart: checkbox ng bawat file (lahat naka-check). Tinatawag ang onChange kapag may binago.
  function makeFilePanel(groupList, selectedNameSet, onChange) {
    const panel = makeElement('aside', 'file-panel');
    panel.setAttribute('aria-label', MTEXT.filePanelTitle);
    const summary = makeElement('p', 'file-panel-summary');
    summary.setAttribute('aria-live', 'polite');
    const updateSummary = () => {
      summary.textContent = selectedNameSet.size
        ? MTEXT.fileSelected.replace('{n}', String(selectedNameSet.size)).replace('{total}', String(groupList.length))
        : MTEXT.fileNoneSelected;
    };
    const list = makeElement('ul', 'file-list');
    const masterItem = makeElement('li', 'file-item file-item-master chart-master');
    masterItem.append(makeElement('span', 'file-swatch'), makeElement('span', 'file-name', MTEXT.masterSeries));
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
      label.append(checkbox, makeElement('span', 'file-swatch chart-series-' + group.colorIndex), name, makeElement('span', 'file-count', group.recordCount + MTEXT.fileRecords));
      item.append(label);
      list.append(item);
    });
    updateSummary();
    panel.append(makeElement('h3', 'file-panel-title', MTEXT.filePanelTitle), makeElement('p', 'file-panel-note', MTEXT.filePanelNote), summary, list);
    return panel;
  }

  // Nagre-render ng resulta ng Calibration Repeatability.
  function renderResult(result, initialNameSet) {
    const area = query('result');
    const stats = result.stats;
    const head = makeElement('div', 'result-head');
    head.append(makeStatusBadge(stats.status));
    area.replaceChildren(head, makeStatList([
      [MTEXT.repeatability, formatNumber(stats.score, 2) + '%'],
      [MTEXT.averageDifference, formatNumber(stats.averageDifference)],
      [MTEXT.worstBarcode, stats.worstBarcode || '-'],
      [MTEXT.maxDifference, formatNumber(stats.maxDifference)],
      [CTEXT.actualAverage, formatNumber(stats.actualAverage)],
      [CTEXT.masterAverage, formatNumber(stats.masterAverage)],
      [MTEXT.difference, formatNumber(stats.difference)],
      [MTEXT.records, String(result.recordCount)],
      [MTEXT.csvFiles, result.fileCount + ' (' + SETTING.TEXT.calibrationFiles.toLowerCase() + ': ' + result.calibrationFileCount + ')'],
      [MTEXT.range, csv.formatDateInput(result.startDate) + ' - ' + csv.formatDateInput(result.endDate)],
      [SHIFT.TEXT.modeLabel, SHIFT.TEXT.modeName[result.mode]]
    ]));
    const rangeTable = makeTable([MTEXT.barcode, MTEXT.master, MTEXT.actualAverageShort, MTEXT.averageDifference, MTEXT.maxDifference],
      stats.perBarcodeList.map((entry) => [entry.barcode, formatNumber(entry.master), { text: formatNumber(entry.actualAverage), level: levelOf(entry.actualAverage, entry.master) }, formatNumber(entry.averageDifference), { text: formatNumber(entry.maxDifference), level: entry.maxDifference === null ? '' : levelOf(entry.maxDifference, 0) }]));
    area.append(rangeTable);
    const chartBlock = makeElement('div', 'chart-block');
    const scrollBox = makeElement('div', 'chart-scroll');
    scrollBox.tabIndex = 0;
    scrollBox.setAttribute('role', 'region');
    scrollBox.setAttribute('aria-label', SETTING.TEXT.chartAria);
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
    if (shownList.length < result.columnList.length) area.append(makeElement('p', 'result-note', MTEXT.linesLimited.replace('{n}', String(shownList.length))));
    if (result.unreadableCount) area.append(makeElement('p', 'result-note', result.unreadableCount + MTEXT.unreadable));
    // Barcode checker: ang file na nilaktawan dahil mali ang barcode (pangalan at dahilan).
    if (result.barcodeRejectedList && result.barcodeRejectedList.length) {
      const rejectedText = result.barcodeRejectedList.map((entry) => entry.name + ' (' + entry.reason + ')').join(' | ');
      area.append(makeElement('p', 'result-note', result.barcodeRejectedList.length + root.barcodeCheckerConfig.TEXT.rejectedNote + rejectedText));
    }
  }

  // Kinukuha ang Server path at humihingi ng permission (galing sa click). Hindi nagtatapon ng error.
  async function findServerForCopy() {
    try {
      return await root.queue.findServerHandle(true);
    } catch (error) {
      return { handle: null, state: CONFIG.QUEUE.CONNECTION.error };
    }
  }

  // Ang buong export: Saving path (may timestamp) at kopya sa Server path (ino-overwrite). Ibinibigay { message, kind }. Nagtatapon ng error kapag pumalya ang Saving path.
  async function exportBoth(result) {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    if (!rootHandle) throw csv.createError('noRoot');
    if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
    const serverFound = await findServerForCopy();
    const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
    const machineName = hooks.getMachineName();
    const exported = await calibrationRepeatabilityExport.exportRepeatability(result, rootHandle, hooks.getSourceText(), machineName);
    const separator = EXPORT.PATH_SEPARATOR;
    const savedText = CTEXT.saved + (paths[CONFIG.ROOT_KEY] || rootHandle.name) + separator + exported.folderName + separator + exported.fileName;
    if (serverFound.state !== CONFIG.QUEUE.CONNECTION.ok) return { message: savedText + CTEXT.serverFailed + (CTEXT.serverState[serverFound.state] || CTEXT.serverState.error), kind: 'error' };
    try {
      const copied = await calibrationRepeatabilityExport.copyToServer(serverFound.handle, result, hooks.getSourceText(), machineName);
      return { message: savedText + CTEXT.serverSaved + (paths[CONFIG.SERVER_KEY] || serverFound.handle.name) + separator + copied.folderName + separator + copied.fileName, kind: 'success' };
    } catch (error) {
      return { message: savedText + CTEXT.serverFailed + CTEXT.serverState.error, kind: 'error' };
    }
  }

  // Kusang export pagkatapos ng run. Tinatawag habang busy pa ang page; hindi nawawala ang resulta sa screen kapag pumalya.
  async function autoExport() {
    if (!SETTING.AUTO.ENABLED || !lastResult) return;
    try {
      setStatus(SETTING.TEXT.exporting, 'info');
      const outcome = await exportBoth(lastResult);
      setStatus(outcome.message, outcome.kind);
    } catch (error) {
      setStatus(getExportMessage(error), 'error');
    }
  }

  // Ang napiling mode (all / shift).
  function getSelectedMode() {
    const checked = document.querySelector(SEL.checkedMode);
    return checked ? checked.value : SHIFT.DEFAULT_MODE;
  }

  // Click ng Calibration Repeatability (may validation ng petsa bago magbasa).
  async function onRun() {
    if (hooks.isBusy()) return;
    setStatus('', '');
    query('result').replaceChildren();
    lastResult = null;
    saved.result = null;
    saved.dates = null;
    saved.selectedNameSet = null;
    const startDate = csv.parseDateInput(query('start').value);
    const endDate = csv.parseDateInput(query('end').value);
    if (!startDate || !endDate) { setStatus(MTEXT.error.badDates, 'error'); return; }
    if (startDate > endDate) { setStatus(MTEXT.error.startAfterEnd, 'error'); return; }
    hooks.setBusy(true);
    try {
      setStatus(MTEXT.working, 'info');
      const handle = await hooks.getReadyHandle();
      const analyzed = await calibrationRepeatability.analyzeRange(handle, startDate, endDate, (current, total, name) => setStatus(MTEXT.progress + current + '/' + total + ' ' + name, 'info'));
      const result = root.masterShift.applyMode(analyzed, getSelectedMode());
      renderResult(result);
      lastResult = result;
      saved.result = result;
      saved.dates = { startDate, endDate };
      setStatus('', '');
      await autoExport();
    } catch (error) {
      query('result').replaceChildren();
      setStatus(getReadMessage(error), 'error');
    } finally {
      hooks.setBusy(false);
    }
  }

  // Ina-update ang button (disabled habang busy).
  function refresh() {
    if (!hooks) return;
    const runButton = query('runButton');
    if (runButton) runButton.disabled = hooks.isBusy();
  }

  // Init, tinatawag ng calibration.js sa bawat bukas ng Calibration page (bagong DOM kada bukas).
  function init(nextHooks) {
    hooks = nextHooks;
    lastResult = null;
    const today = hooks.getTodayDate();
    const rangeStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - MASTER.RANGE.DEFAULT_DAYS);
    query('start').value = csv.formatDateInput(rangeStart);
    query('end').value = csv.formatDateInput(today);
    if (saved.result && saved.dates) {
      query('start').value = csv.formatDateInput(saved.dates.startDate);
      query('end').value = csv.formatDateInput(saved.dates.endDate);
      const modeRadio = document.querySelector(SEL.modeRadio + '[value="' + saved.result.mode + '"]');
      if (modeRadio) modeRadio.checked = true;
      renderResult(saved.result, saved.selectedNameSet);
      lastResult = saved.result;
    }
    query('runButton').addEventListener('click', onRun);
    refresh();
  }

  root.calibrationRepeatabilityUi = Object.freeze({ init, refresh });
})();
