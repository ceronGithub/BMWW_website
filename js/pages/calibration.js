/*
 * FILE    : js/pages/calibration.js
 * PURPOSE : Calibration page: Calibration correl (pinakabagong calibration record ngayong araw: After = Actual vs Master), gamit ang Data source 1 ng Settings
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, master-analysis.js, chart-draw.js, calibration-config.js, calibration-analysis.js, calibration-export.js
 * VERSION : v9.2 | 2026-11-22 | hook sa calibrationRepeatabilityUi (Calibration Repeatability): init at refresh kasabay ng Compare
 * VERSION : v9.1 | 2026-11-22 | hook sa calibrationCompareUi (Compare sliders): refresh pagkatapos ng run, init ng compare, getReadyHandle hook
 * VERSION : v9.0 | 2026-11-22 | Calibration correl (kopya ng Master Correl): resulta, chart, table, kusang export sa Saving path at Server path
 * VERSION : v2.3 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const CALIBRATION = root.calibrationConfig;
  const EXPORT = root.exportConfig;
  const SETTING = CALIBRATION.EXPORT;
  const SEL = CALIBRATION.SELECTOR;
  const TEXT = CALIBRATION.TEXT;
  const { storage, csv, masterAnalysis, chart, calibrationAnalysis, calibrationExport } = root;

  let sourceHandle = null;
  let isBusy = false;
  let lastRun = null;

  // Alaala ng huling resulta; nananatili habang bukas ang website (hindi nabubura kapag lumipat ng page).
  const saved = { latest: null };

  // Machine name mula sa Settings; walang laman kung hindi pa naka-set.
  function getMachineName() {
    const settings = storage.readLocalSettings();
    return typeof settings.machineName === 'string' ? settings.machineName.trim() : '';
  }

  // Petsa ngayon (00:00). Kinukuha tuwing kailangan para tama pa rin kahit lampas hatinggabi ang bukas na page.
  function getTodayDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Pamagat ng chart: <machine name> Calibration Correl.
  function buildChartTitle() {
    const machineName = getMachineName();
    return machineName ? machineName + ' ' + TEXT.scatterTitle : TEXT.scatterTitle;
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
  function setStatus(message, kind) {
    const element = query('status');
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
    element.classList.toggle('is-info', kind === 'info');
  }

  // Ginagawang friendly na mensahe ang error ng pagbabasa (walang teknikal na detalye).
  function getErrorMessage(error) {
    if (error && TEXT.error[error.code]) return TEXT.error[error.code];
    if (error && MASTER.ERROR_BY_NAME[error.name]) return TEXT.error[MASTER.ERROR_BY_NAME[error.name]];
    return TEXT.error.readFail;
  }

  // Friendly na mensahe ng error ng export (text ng export ng Saving path), walang teknikal na detalye.
  function getExportErrorMessage(error) {
    if (error && EXPORT.TEXT.error[error.code]) return EXPORT.TEXT.error[error.code];
    if (error && EXPORT.ERROR_BY_NAME[error.name]) return EXPORT.TEXT.error[EXPORT.ERROR_BY_NAME[error.name]];
    return TEXT.error.exportFail;
  }

  // Disable ng button habang tumatakbo.
  function setBusy(nextBusy) {
    isBusy = nextBusy;
    query('runButton').disabled = nextBusy;
    refreshCompare();
  }

  // Ina-update ang button ng Compare sliders (bukas lang kapag may Calibration Correl run at hindi busy).
  function refreshCompare() {
    if (root.calibrationCompareUi) root.calibrationCompareUi.refresh();
    if (root.calibrationRepeatabilityUi) root.calibrationRepeatabilityUi.refresh();
  }

  // Inihahanda ang folder handle ng Data source 1 at hinihingi ang permission (dapat galing sa click).
  async function getReadyHandle() {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    if (!sourceHandle) sourceHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CALIBRATION.SOURCE_KEY]);
    if (!sourceHandle) throw csv.createError('noSource');
    if (!(await storage.hasPermission(sourceHandle, true))) throw csv.createError('noPermission');
    return sourceHandle;
  }

  // Path ng Data source 1 mula sa Settings (full path kung meron, kung hindi pangalan ng folder).
  function getSourceText() {
    const settings = storage.readLocalSettings();
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    const names = settings.folderNames || {};
    return paths[CALIBRATION.SOURCE_KEY] || names[CALIBRATION.SOURCE_KEY] || TEXT.sourceNotSet;
  }

  // Ipinapakita ang path ng Data source 1.
  function renderSource() {
    query('source').textContent = getSourceText();
  }

  // Nililinis ang resulta at mensahe.
  function clearResult() {
    setStatus('', '');
    query('result').replaceChildren();
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

  // Numero sa ilang decimal; '-' kung wala.
  function formatNumber(value, digits) {
    return value === null || value === undefined ? '-' : value.toFixed(digits === undefined ? 3 : digits);
  }

  // Nagre-render ng resulta ng Calibration correl.
  function renderResult(result) {
    const area = query('result');
    const head = makeElement('div', 'result-head');
    head.append(makeStatusBadge(result.status));
    area.replaceChildren(head, makeStatList([
      [TEXT.rSquared, result.regression.rSquared.toFixed(4)],
      [TEXT.recordDate, csv.formatDateTime(result.recordDate, true)],
      [TEXT.actualAverage, formatNumber(result.actualAverage, 6)],
      [TEXT.masterAverage, formatNumber(result.masterAverage, 6)],
      [TEXT.fileName, result.fileName]
    ]));
    const resultTable = makeTable([TEXT.barcode, TEXT.actual, TEXT.master], result.barcodeList.map((barcode, index) => [barcode, { text: formatNumber(result.actualList[index], 3), level: levelOf(result.actualList[index], result.masterList[index]) }, formatNumber(result.masterList[index], 3)]));
    area.append(resultTable);
    const chartGrid = makeElement('div', 'chart-grid');
    const scatterBox = makeElement('div', 'chart-box');
    const barBox = makeElement('div', 'chart-box');
    chartGrid.append(scatterBox, barBox);
    area.append(makeLevelLegend(), chartGrid);
    const pointList = [];
    result.masterList.forEach((masterValue, index) => {
      if (masterValue !== null && result.actualList[index] !== null) pointList.push({ x: masterValue, y: result.actualList[index], level: levelOf(result.actualList[index], masterValue), barcode: result.barcodeList[index] });
    });
    bindBarcodeSelect(resultTable, [scatterBox]);
    chart.drawScatter(scatterBox, { title: buildChartTitle(), xTitle: TEXT.scatterX, yTitle: TEXT.scatterY, pointList, trend: result.regression });
    chart.drawBars(barBox, { title: TEXT.barTitle, itemList: [{ label: TEXT.actualAverage, value: result.actualAverage || 0 }, { label: TEXT.masterAverage, value: result.masterAverage || 0 }] });
    if (result.unreadableCount) area.append(makeElement('p', 'result-note', result.unreadableCount + TEXT.unreadable));
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
  async function copyToServer(serverFound, exported, paths) {
    if (serverFound.state !== CONFIG.QUEUE.CONNECTION.ok) return { ok: false, message: TEXT.serverState[serverFound.state] || TEXT.serverState.error };
    try {
      const copied = await calibrationExport.copyToServer(serverFound.handle, exported, getMachineName());
      const separator = EXPORT.PATH_SEPARATOR;
      const basePath = paths[CONFIG.SERVER_KEY] || serverFound.handle.name;
      return { ok: true, path: basePath + separator + copied.folderName + separator + copied.fileName };
    } catch (error) {
      return { ok: false, message: TEXT.serverState.error };
    }
  }

  // Ang buong export: Saving path (may timestamp) at kopya sa Server path (ino-overwrite). Ibinibigay { message, kind }. Nagtatapon ng error kapag pumalya ang Saving path.
  async function exportFiles() {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    if (!rootHandle) throw csv.createError('noRoot');
    if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
    const serverFound = await findServerForCopy();
    const paths = storage.readLocalSettings()[CONFIG.FOLDER_PATHS_FIELD] || {};
    const exported = await calibrationExport.exportCalibration(lastRun.result, lastRun.range, rootHandle, getSourceText(), getMachineName());
    const separator = EXPORT.PATH_SEPARATOR;
    const savedText = TEXT.saved + (paths[CONFIG.ROOT_KEY] || rootHandle.name) + separator + exported.folderName + separator + exported.fileName;
    const serverCopy = await copyToServer(serverFound, exported, paths);
    if (serverCopy.ok) return { message: savedText + TEXT.serverSaved + serverCopy.path, kind: 'success' };
    return { message: savedText + TEXT.serverFailed + serverCopy.message, kind: 'error' };
  }

  // Kusang export pagkatapos ng Calibration correl. Tinatawag habang busy pa ang page; hindi nawawala ang resulta sa screen kapag pumalya.
  async function autoExport() {
    if (!SETTING.AUTO.ENABLED || !lastRun) return;
    try {
      setStatus(TEXT.exporting, 'info');
      const outcome = await exportFiles();
      setStatus(outcome.message, outcome.kind);
    } catch (error) {
      setStatus(getExportErrorMessage(error), 'error');
    }
  }

  // Click ng Calibration Correl.
  async function onRun() {
    if (isBusy) return;
    clearResult();
    lastRun = null;
    saved.latest = null;
    refreshCompare();
    if (CALIBRATION.LATEST.DATE_READONLY) query('date').value = csv.formatDateInput(getTodayDate());
    const startDate = csv.parseDateInput(query('date').value);
    if (!startDate) { setStatus(TEXT.error.badDate, 'error'); return; }
    setBusy(true);
    try {
      setStatus(TEXT.working, 'info');
      const handle = await getReadyHandle();
      const result = await calibrationAnalysis.analyzeLatest(handle, startDate, (current, total, name) => setStatus(TEXT.progress + current + '/' + total + ' ' + name, 'info'));
      renderResult(result);
      lastRun = { result, range: { startDate, endDate: startDate } };
      saved.latest = lastRun;
      setStatus('', '');
      await autoExport();
    } catch (error) {
      query('result').replaceChildren();
      setStatus(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Ibinabalik ang huling resulta kapag bumalik sa Calibration page (ngayong araw lang; kung luma na, binubura).
  function restoreSaved() {
    if (saved.latest && csv.formatDateInput(saved.latest.range.startDate) === csv.formatDateInput(getTodayDate())) {
      renderResult(saved.latest.result);
      lastRun = saved.latest;
    } else {
      saved.latest = null;
    }
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    isBusy = false;
    sourceHandle = null;
    lastRun = null;
    const dateInput = query('date');
    dateInput.value = csv.formatDateInput(getTodayDate());
    dateInput.readOnly = CALIBRATION.LATEST.DATE_READONLY;
    renderSource();
    restoreSaved();
    query('runButton').addEventListener('click', onRun);
    root.calibrationCompareUi.init({
      getLatestRun: () => lastRun,
      isBusy: () => isBusy,
      setBusy,
      getReadyHandle,
      getReadErrorMessage: getErrorMessage,
      getMachineName,
      getSourceText
    });
    root.calibrationRepeatabilityUi.init({
      isBusy: () => isBusy,
      setBusy,
      getReadyHandle,
      getReadErrorMessage: getErrorMessage,
      getMachineName,
      getSourceText,
      getTodayDate
    });
    if (!storage.isFolderAccessSupported()) {
      setBusy(true);
      setStatus(TEXT.error.unsupported, 'error');
      return;
    }
    try {
      sourceHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CALIBRATION.SOURCE_KEY]);
    } catch (error) {
      sourceHandle = null;
    }
    if (!sourceHandle) setStatus(TEXT.error.noSource, 'error');
  }

  root.registry.registerPage('calibration', Object.freeze({ init }));
})();
