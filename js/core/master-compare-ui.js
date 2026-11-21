/*
 * FILE    : js/core/master-compare-ui.js
 * PURPOSE : Screen ng Compare vs previous sa Master page: button, table, chart at Export to Excel (window.BMWW.compareUi)
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, chart-draw.js, master-compare.js, master-compare-export.js, master-compare-config.js
 * VERSION : v3.5 | 2026-11-21 | bagong file; tinatawag ng js/pages/master.js (init at refresh)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const COMPARE = root.compareConfig;
  const EXPORT = root.exportConfig;
  const TEXT = CONFIG.TEXT.master;
  const { storage, csv, chart, masterCompare, compareExport } = root;

  // hooks galing sa master.js: getLatestRun, isBusy, setBusy, getReadyHandle, getReadErrorMessage, getMachineName
  let hooks = null;
  // Huling compare { run, comparison }; nananatili habang bukas ang website (para sa pagbalik sa Master page).
  let lastCompare = null;

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(COMPARE.SELECTOR[key]);
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
    if (error && error.code === 'noPreviousRecord') return COMPARE.TEXT.error.noPreviousRecord.replace('{n}', String(COMPARE.LOOKBACK_DAYS));
    if (error && COMPARE.TEXT.error[error.code]) return COMPARE.TEXT.error[error.code];
    return hooks.getReadErrorMessage(error);
  }

  // Friendly na mensahe ng error sa pag-export (walang teknikal na detalye).
  function getExportMessage(error) {
    const exportMap = EXPORT.TEXT.error;
    if (error && COMPARE.TEXT.error[error.code]) return COMPARE.TEXT.error[error.code];
    if (error && exportMap[error.code]) return exportMap[error.code];
    if (error && EXPORT.ERROR_BY_NAME[error.name]) return exportMap[EXPORT.ERROR_BY_NAME[error.name]];
    return COMPARE.TEXT.error.exportFail;
  }

  // Numero sa tatlong decimal; '-' kung wala.
  function formatNumber(value) {
    return value === null || value === undefined ? '-' : value.toFixed(COMPARE.DISPLAY_DIGITS);
  }

  // Numero na may sign (+0.250 / -0.100); '-' kung wala.
  function formatSigned(value) {
    if (value === null || value === undefined) return '-';
    return (value > 0 ? '+' : '') + value.toFixed(COMPARE.DISPLAY_DIGITS);
  }

  // Text ng slider: <barcode> (<diff>) o '-'.
  function formatSlider(slider) {
    return slider ? slider.barcode + ' (' + formatNumber(slider.difference) + ')' : '-';
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

  // Table na may horizontal scroll sa maliit na screen. Cell ay text o { text, className }.
  function makeTable(headerList, rowList) {
    const wrap = makeElement('div', 'table-wrap');
    const table = makeElement('table', 'result-table');
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    headerList.forEach((header) => headRow.append(makeElement('th', '', header)));
    head.append(headRow);
    const body = document.createElement('tbody');
    rowList.forEach((cellList) => {
      const row = document.createElement('tr');
      cellList.forEach((cell) => {
        const isObject = typeof cell === 'object';
        row.append(makeElement('td', isObject ? cell.className : '', isObject ? cell.text : cell));
      });
      body.append(row);
    });
    table.append(head, body);
    wrap.append(table);
    return wrap;
  }

  // Ilang araw ang pagitan ng dalawang petsa (ayon sa kalendaryo).
  function getDayGap(laterDate, earlierDate) {
    const later = new Date(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate()).getTime();
    const earlier = new Date(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate()).getTime();
    return Math.round((later - earlier) / 86400000);
  }

  // Nagre-render ng resulta ng compare.
  function renderComparison(comparison) {
    const area = query('result');
    const { current, previous, sliderList, summary } = comparison;
    const text = COMPARE.TEXT;
    const label = COMPARE.LABEL;
    const hasWorse = summary.worseCount > 0;
    const head = makeElement('div', 'result-head');
    head.append(makeElement('span', 'status-badge ' + (hasWorse ? 'is-fail' : 'is-pass'), hasWorse ? text.verdictWorse.replace('{n}', String(summary.worseCount)) : text.verdictOk));
    const biggest = summary.biggestIncrease;
    area.replaceChildren(makeElement('h3', 'compare-title', text.resultTitle), head, makeStatList([
      [label.todayDate, csv.formatDateTime(current.recordDate, true)],
      [label.previousDate, csv.formatDateTime(previous.recordDate, true)],
      [TEXT.rSquared, previous.regression.rSquared.toFixed(4) + COMPARE.TEXT.arrow + current.regression.rSquared.toFixed(4)],
      [label.rSquaredChange, (summary.rSquaredChange > 0 ? '+' : '') + summary.rSquaredChange.toFixed(4)],
      [label.status, previous.status + text.arrow + current.status],
      [label.worstToday, formatSlider(summary.currentWorst)],
      [label.worstPrevious, formatSlider(summary.previousWorst)],
      [label.biggestIncrease, biggest ? biggest.barcode + ' (' + formatSigned(biggest.change) + ')' : text.noBiggest],
      [label.worseCount + ' / ' + label.betterCount + ' / ' + label.sameCount, summary.worseCount + ' / ' + summary.betterCount + ' / ' + summary.sameCount],
      [label.previousFile, previous.fileName]
    ]));
    if (getDayGap(current.recordDate, previous.recordDate) > 1) {
      area.append(makeElement('p', 'result-note', text.gapNote.replace('{date}', csv.formatDateInput(previous.recordDate))));
    }
    const table = makeTable([label.columnBarcode, label.columnPrevious, label.columnToday, label.columnChange, label.columnTrend], sliderList.map((slider) => [
      slider.barcode,
      { text: formatNumber(slider.previousDifference), className: slider.previousLevel },
      { text: formatNumber(slider.currentDifference), className: slider.currentLevel },
      { text: formatSigned(slider.change), className: COMPARE.TREND_CLASS[slider.trend] },
      { text: COMPARE.TREND_SYMBOL[slider.trend] + ' ' + COMPARE.TREND_TEXT[slider.trend], className: COMPARE.TREND_CLASS[slider.trend] }
    ]));
    area.append(table);
    const chartBox = makeElement('div', 'chart-box chart-box-wide');
    area.append(chartBox);
    const machineName = hooks.getMachineName();
    chart.drawLines(chartBox, {
      title: (machineName ? machineName + ' ' : '') + text.chartTitle,
      categoryList: sliderList.map((slider) => slider.barcode),
      seriesList: [
        { name: text.seriesPrevious + ' (' + csv.formatDateInput(previous.recordDate) + ')', values: sliderList.map((slider) => slider.previousDifference), isMaster: false, colorIndex: COMPARE.CHART.PREVIOUS_COLOR_INDEX },
        { name: text.seriesToday + ' (' + csv.formatDateInput(current.recordDate) + ')', values: sliderList.map((slider) => slider.currentDifference), isMaster: false, colorIndex: COMPARE.CHART.TODAY_COLOR_INDEX }
      ],
      hideLegend: false
    });
    area.append(makeElement('p', 'result-note', text.ruleNote.replace('{min}', String(COMPARE.WORSEN_MIN))));
  }

  // Ina-update ang button: bukas ang Compare kapag may Master Correl na resulta; bukas ang Export kapag may compare. Nililinis ang lumang compare kapag nagbago ang Master Correl.
  function refresh() {
    if (!hooks) return;
    const runButton = query('runButton');
    const exportButton = query('exportButton');
    if (!runButton || !exportButton) return;
    const run = hooks.getLatestRun();
    if (lastCompare && lastCompare.run !== run) {
      lastCompare = null;
      query('result').replaceChildren();
      setStatus('', '');
    }
    runButton.disabled = hooks.isBusy() || !run;
    exportButton.disabled = hooks.isBusy() || !lastCompare;
  }

  // Click ng Compare vs previous.
  async function onCompare() {
    if (hooks.isBusy()) return;
    const run = hooks.getLatestRun();
    if (!run) { setStatus(COMPARE.TEXT.error.noCurrent, 'error'); return; }
    hooks.setBusy(true);
    try {
      setStatus(COMPARE.TEXT.working, 'info');
      const handle = await hooks.getReadyHandle();
      const previous = await masterCompare.findPrevious(handle, run.range.startDate, (index, total, name) => setStatus(COMPARE.TEXT.progress + index + '/' + total + ' ' + name, 'info'));
      const comparison = masterCompare.compareRecords(run.result, previous);
      lastCompare = { run, comparison };
      renderComparison(comparison);
      setStatus('', '');
      const resultArea = query('result');
      if (resultArea && resultArea.scrollIntoView) resultArea.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      lastCompare = null;
      const resultArea = query('result');
      if (resultArea) resultArea.replaceChildren();
      setStatus(getReadMessage(error), 'error');
    } finally {
      hooks.setBusy(false);
    }
  }

  // Click ng Export compare to Excel: sine-save sa <Saving path>/master-compare/<petsa>/.
  async function onExport() {
    if (hooks.isBusy()) return;
    if (!lastCompare) { setStatus(COMPARE.TEXT.error.noResult, 'error'); return; }
    hooks.setBusy(true);
    try {
      setStatus(COMPARE.TEXT.exporting, 'info');
      if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
      const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle) throw csv.createError('noRoot');
      if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
      const settings = storage.readLocalSettings();
      const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
      const sourceText = paths[MASTER.SOURCE_KEY] || (settings.folderNames || {})[MASTER.SOURCE_KEY] || TEXT.sourceNotSet;
      const saved = await compareExport.exportCompare(lastCompare.comparison, rootHandle, sourceText, hooks.getMachineName());
      const basePath = paths[CONFIG.ROOT_KEY] || rootHandle.name;
      const separator = EXPORT.PATH_SEPARATOR;
      setStatus(COMPARE.TEXT.saved + basePath + separator + saved.folderName + separator + saved.fileName, 'success');
    } catch (error) {
      setStatus(getExportMessage(error), 'error');
    } finally {
      hooks.setBusy(false);
    }
  }

  // Init, tinatawag ng master.js sa bawat bukas ng Master page (bagong DOM kada bukas).
  function init(nextHooks) {
    hooks = nextHooks;
    if (lastCompare && lastCompare.run === hooks.getLatestRun()) renderComparison(lastCompare.comparison);
    else lastCompare = null;
    query('runButton').addEventListener('click', onCompare);
    query('exportButton').addEventListener('click', onExport);
    refresh();
  }

  root.compareUi = Object.freeze({ init, refresh });
})();
