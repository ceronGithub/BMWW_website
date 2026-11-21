/*
 * FILE    : js/pages/trend.js
 * PURPOSE : Trend page: binabasa ang master CSV ng Data source 1, 6 na chart (Mean Offset, Stdev, CV, Slope, Intercept, R2) na may UCL, CL, LCL, marker ng pagpalit ng cantilever, at listahan ng record ng napiling araw na may Set / Reset
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, trend-config.js, trend-limits.js, trend-overrides.js, trend-reader.js, trend-chart.js, trend-export-config.js, trend-export.js
 * VERSION : v9.4 | 2026-11-22 | Export to Excel (onExport): Excel sa Saving path, picture sa Saving path at Server path; ito lang ang nagpapadala ng Trend sa Dashboard
 * VERSION : v9.3 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const TREND = root.trendConfig;
  const SEL = TREND.SELECTOR;
  const TEXT = TREND.TEXT;
  const EXPORT = root.trendExportConfig;
  const { storage, csv, trendLimits, trendOverrides, trendReader, trendChart } = root;

  let sourceHandle = null;
  let isBusy = false;
  // Alaala ng huling resulta; nananatili habang bukas ang website (hindi nabubura kapag lumipat ng page).
  const saved = { run: null, dayKey: '' };

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
  function setStatusOf(element, message, kind) {
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
    element.classList.toggle('is-info', kind === 'info');
  }

  // Friendly na mensahe ng error ng pagbabasa (walang teknikal na detalye).
  function getErrorMessage(error) {
    if (error && TEXT.error[error.code]) return TEXT.error[error.code];
    if (error && MASTER.ERROR_BY_NAME[error.name]) return TEXT.error[MASTER.ERROR_BY_NAME[error.name]];
    return TEXT.error.readFail;
  }

  // Hawak ng Data source 1 at permission (galing sa click ng user).
  async function getReadyHandle() {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    if (!sourceHandle) sourceHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[TREND.SOURCE_KEY]);
    if (!sourceHandle) throw csv.createError('noSource');
    if (!(await storage.hasPermission(sourceHandle, true))) throw csv.createError('noPermission');
    return sourceHandle;
  }

  // Path ng Data source 1 mula sa Settings (full path kung meron, kung hindi pangalan ng folder).
  function renderSource() {
    const settings = storage.readLocalSettings();
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    const names = settings.folderNames || {};
    query('source').textContent = paths[TREND.SOURCE_KEY] || names[TREND.SOURCE_KEY] || TEXT.sourceNotSet;
  }

  // Petsa ngayon (00:00).
  function getTodayDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Default na saklaw: huling DEFAULT_DAYS araw hanggang ngayon (o ang huling ginamit).
  function setDefaultDates() {
    const range = saved.run ? { start: saved.run.startDate, end: saved.run.endDate } : { start: trendReader.addDays(getTodayDate(), 1 - TREND.RANGE.DEFAULT_DAYS), end: getTodayDate() };
    query('start').value = csv.formatDateInput(range.start);
    query('end').value = csv.formatDateInput(range.end);
  }

  // Binabasa at sinusuri ang Start date at End date. Ibinibigay { startDate, endDate } o { error }.
  function readDateInputs() {
    const startDate = csv.parseDateInput(query('start').value);
    const endDate = csv.parseDateInput(query('end').value);
    if (!startDate || !endDate) return { error: TEXT.badDate };
    if (startDate > endDate) return { error: TEXT.badRange };
    const dayCount = Math.round((endDate - startDate) / 86400000) + 1;
    if (dayCount > TREND.RANGE.MAX_DAYS) return { error: TEXT.tooLong.replace('{days}', String(TREND.RANGE.MAX_DAYS)) };
    return { startDate, endDate };
  }

  // Ang mga point ng chart ayon sa huling resulta at sa mga Set ng user.
  function getPointList() {
    return trendReader.pickPoints(saved.run.recordList, trendOverrides.readAll(), saved.run.startDate, saved.run.endDate);
  }

  // Isang item ng buod: label at value.
  function makeStat(label, value) {
    const item = makeElement('div', 'stat-item');
    item.append(makeElement('span', 'stat-label', label), makeElement('span', 'stat-value', String(value)));
    return item;
  }

  // Buod: bilang ng point, record, file, labas sa limit at Set ng user. May paalala kapag walang limit.
  function renderSummary(pointList, limitMap) {
    const host = query('summary');
    const outCount = TREND.METRIC_LIST.reduce((total, metric) => total + trendChart.countOut(pointList, metric, limitMap[metric.key]), 0);
    const list = makeElement('div', 'stat-list');
    list.append(
      makeStat(TEXT.summaryPoints, pointList.length),
      makeStat(TEXT.summaryRecords, saved.run.recordList.length),
      makeStat(TEXT.summaryFiles, saved.run.masterFileCount),
      makeStat(TEXT.summaryOut, outCount),
      makeStat(TEXT.summaryOverride, pointList.filter((point) => point.isOverride).length)
    );
    host.replaceChildren(list);
    if (saved.run.unreadableCount) host.append(makeElement('p', 'result-note', saved.run.unreadableCount + TEXT.unreadable));
    if (!trendLimits.hasAnyInAll(limitMap)) {
      const note = makeElement('p', 'result-note is-warning', TEXT.noLimits + ' ');
      const link = makeElement('a', '', TEXT.limitsLink);
      link.href = '#settings';
      note.append(link);
      host.append(note);
    }
  }

  // Listahan ng pagpalit ng cantilever (kung kailan nagbago).
  function renderChanges(pointList, changeList) {
    const host = query('changes');
    host.replaceChildren();
    if (!pointList.length) return;
    const first = pointList[0].record.cantilever || '-';
    const block = makeElement('div', 'trend-changes');
    block.append(makeElement('h3', 'trend-changes-title', TEXT.changesTitle));
    if (!changeList.length) {
      block.append(makeElement('p', 'result-note', TEXT.changesNone + first));
    } else {
      const list = makeElement('ul', 'trend-changes-list');
      changeList.forEach((change) => {
        list.append(makeElement('li', '', (change.from || '-') + ' → ' + (change.to || '-') + TEXT.changeItem + change.label + ')'));
      });
      block.append(list);
    }
    host.append(block);
  }

  // Legend ng chart (point, labas sa limit, Set ng user, pagpalit ng cantilever).
  function makeLegend() {
    const list = makeElement('ul', 'trend-legend');
    [['is-normal', TEXT.legendPoint], ['is-out', TEXT.legendOut], ['is-set', TEXT.legendSet], ['is-change', TEXT.legendChange]].forEach((entry) => {
      list.append(makeElement('li', 'trend-legend-item ' + entry[0], entry[1]));
    });
    return list;
  }

  // Iginuguhit ang 6 na chart.
  function renderCharts(pointList, limitMap, changeList) {
    const host = query('charts');
    host.replaceChildren(makeLegend());
    TREND.METRIC_LIST.forEach((metric) => {
      const block = makeElement('div', 'trend-chart-block');
      const scroll = makeElement('div', 'trend-chart-scroll');
      scroll.tabIndex = 0;
      scroll.setAttribute('aria-label', metric.label);
      trendChart.draw(scroll, { metric, pointList, limit: limitMap[metric.key], changeList });
      block.append(scroll);
      if (trendLimits.hasAny(limitMap[metric.key])) block.append(makeElement('p', 'trend-out-note', TEXT.outCount + trendChart.countOut(pointList, metric, limitMap[metric.key])));
      host.append(block);
    });
  }

  // Text ng isang value ng record (4 o 5 decimal ayon sa config).
  function formatValue(value, metric) {
    return value === null ? '-' : value.toFixed(metric.digits);
  }

  // Button ng Set o Reset sa isang row ng listahan ng araw.
  function makeActionButton(action, record, slotKey) {
    const isSet = action === 'set';
    const button = makeElement('button', 'btn btn-secondary trend-action', isSet ? TEXT.setButton : TEXT.resetButton);
    button.type = 'button';
    button.dataset.action = action;
    button.dataset.slot = slotKey;
    button.dataset.id = record.id;
    button.setAttribute('aria-label', (isSet ? TEXT.setAria : TEXT.resetAria) + trendReader.formatPointLabel({ shiftDay: record.shiftDay, shift: record.shift }) + ' ' + new Date(record.time).toLocaleTimeString());
    return button;
  }

  // Listahan ng mga record ng napiling araw: file, shift, cantilever at ang 6 na value, may Set / Reset.
  function renderDay() {
    const statusElement = query('dayStatus');
    const resultHost = query('dayResult');
    const dateInput = query('dayDate');
    resultHost.replaceChildren();
    if (!saved.run) { dateInput.disabled = true; setStatusOf(statusElement, TEXT.dayRun, 'info'); return; }
    dateInput.disabled = false;
    const dayKey = dateInput.value;
    if (!csv.parseDateInput(dayKey)) { setStatusOf(statusElement, TEXT.dayPick, 'info'); return; }
    saved.dayKey = dayKey;
    const recordList = trendReader.listRecordsOfDay(saved.run.recordList, dayKey);
    if (!recordList.length) { setStatusOf(statusElement, TEXT.dayEmpty, 'info'); return; }
    setStatusOf(statusElement, '', '');
    const pointList = getPointList();
    const chosenMap = new Map(pointList.map((point) => [point.slotKey, point]));
    const limitMap = trendLimits.getLimits(storage.readLocalSettings());
    resultHost.append(makeElement('p', 'result-note', TEXT.dayNote));
    const startKey = csv.formatDateInput(saved.run.startDate);
    const endKey = csv.formatDateInput(saved.run.endDate);
    const table = makeElement('table', 'result-table');
    const headRow = makeElement('tr');
    [TEXT.dayColumn.time, TEXT.dayColumn.shift, TEXT.dayColumn.cantilever, TEXT.dayColumn.file].concat(TREND.METRIC_LIST.map((metric) => metric.label), [TEXT.dayColumn.point, TEXT.dayColumn.action]).forEach((label) => headRow.append(makeElement('th', '', label)));
    const tableHead = makeElement('thead');
    tableHead.append(headRow);
    const body = makeElement('tbody');
    recordList.forEach((record) => {
      const row = makeElement('tr');
      const date = new Date(record.time);
      const slotKey = record.shift ? trendReader.getSlotKey(record) : '';
      const point = slotKey ? chosenMap.get(slotKey) : null;
      const isChosen = Boolean(point) && point.record.id === record.id;
      row.classList.toggle('is-chosen', isChosen);
      row.append(
        makeElement('td', '', csv.formatDateTime(date, false).slice(11)),
        makeElement('td', '', record.shift ? trendReader.getShiftDisplay(record.shift) : TEXT.outsideShift),
        makeElement('td', '', record.cantilever || '-'),
        makeElement('td', 'trend-file-cell', record.fileName)
      );
      TREND.METRIC_LIST.forEach((metric) => {
        const value = record.valueMap[metric.key];
        const state = trendLimits.classify(value, limitMap[metric.key]);
        const isOut = state === TREND.POINT_STATE.above || state === TREND.POINT_STATE.below;
        row.append(makeElement('td', isOut ? 'is-out' : '', formatValue(value, metric)));
      });
      const actionCell = makeElement('td');
      let pointText = TEXT.pointNo;
      if (!record.shift) {
        pointText = TEXT.outsideShift;
      } else if (record.shiftDay < startKey || record.shiftDay > endKey) {
        pointText = TEXT.outsideRange;
      } else if (isChosen) {
        pointText = point.isOverride ? TEXT.pointSet : TEXT.pointDefault;
        if (point.isOverride) actionCell.append(makeActionButton('reset', record, slotKey));
      } else {
        actionCell.append(makeActionButton('set', record, slotKey));
      }
      row.append(makeElement('td', '', pointText), actionCell);
      body.append(row);
    });
    table.append(tableHead, body);
    const wrap = makeElement('div', 'table-wrap');
    wrap.append(table);
    resultHost.append(wrap);
  }

  // Iginuguhit ang buod, pagpalit ng cantilever, chart at listahan ng araw.
  function renderAll() {
    query('resetButton').disabled = !saved.run;
    setExportDisabled(!saved.run);
    if (!saved.run) return;
    const limitMap = trendLimits.getLimits(storage.readLocalSettings());
    const pointList = getPointList();
    const changeList = trendReader.findCantileverChanges(pointList);
    renderSummary(pointList, limitMap);
    renderChanges(pointList, changeList);
    renderCharts(pointList, limitMap, changeList);
    renderDay();
  }

  // Pinipili ang petsa ng listahan ng araw: ang huling napili kung nasa saklaw, kung hindi ang huling petsa ng chart.
  function pickDayDate() {
    const dateInput = query('dayDate');
    const startKey = csv.formatDateInput(saved.run.startDate);
    const endKey = csv.formatDateInput(saved.run.endDate);
    dateInput.min = startKey;
    dateInput.max = endKey;
    if (saved.dayKey && saved.dayKey >= startKey && saved.dayKey <= endKey) {
      dateInput.value = saved.dayKey;
      return;
    }
    const pointList = getPointList();
    dateInput.value = pointList.length ? pointList[pointList.length - 1].shiftDay : endKey;
  }

  // Busy state ng Run Trend.
  function setBusy(nextBusy) {
    isBusy = nextBusy;
    query('runButton').disabled = nextBusy;
    query('resetButton').disabled = nextBusy || !saved.run;
    setExportDisabled(nextBusy || !saved.run);
  }

  // Button ng Export to Excel: nakasara habang walang resulta o abala.
  function setExportDisabled(isDisabled) {
    const exportButton = document.querySelector(EXPORT.SELECTOR.exportButton);
    if (exportButton) exportButton.disabled = isDisabled;
  }

  // Run Trend: binabasa ang mga file at iginuguhit ang resulta.
  async function onRun() {
    if (isBusy) return;
    const statusElement = query('status');
    const range = readDateInputs();
    if (range.error) { setStatusOf(statusElement, range.error, 'error'); return; }
    setBusy(true);
    setStatusOf(statusElement, TEXT.working, 'info');
    try {
      const handle = await getReadyHandle();
      const result = await trendReader.readRecords(handle, range.startDate, range.endDate, (current, total, name) => setStatusOf(statusElement, TEXT.progress + current + '/' + total + ' ' + name, 'info'));
      saved.run = result;
      pickDayDate();
      setStatusOf(statusElement, '', '');
      renderAll();
    } catch (error) {
      setStatusOf(statusElement, getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Export to Excel: Excel sa Saving path lang; picture ng 6 chart sa Saving path at Server path (para sa Dashboard ng LEAD PC at ng sarili).
  async function onExport() {
    if (isBusy) return;
    const statusElement = document.querySelector(EXPORT.SELECTOR.exportStatus);
    if (!saved.run) { setStatusOf(statusElement, EXPORT.TEXT.noRun, 'error'); return; }
    setBusy(true);
    setStatusOf(statusElement, EXPORT.TEXT.exporting, 'info');
    try {
      const settings = storage.readLocalSettings();
      const pointList = getPointList();
      const result = await root.trendExport.exportAll({
        run: saved.run, pointList, limitMap: trendLimits.getLimits(settings), changeList: trendReader.findCantileverChanges(pointList), machineName: settings.machineName, settings
      });
      setStatusOf(statusElement, result.message, result.kind);
    } catch (error) {
      setStatusOf(statusElement, root.trendExport.getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  // Set / Reset sa listahan ng araw (event delegation).
  function onDayClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || !saved.run) return;
    if (button.dataset.action === 'set') {
      trendOverrides.setChoice(button.dataset.slot, button.dataset.id);
    } else {
      trendOverrides.clearChoice(button.dataset.slot);
    }
    renderAll();
    setStatusOf(query('dayStatus'), button.dataset.action === 'set' ? TEXT.setDone : TEXT.resetDone, 'success');
  }

  // Ibinabalik lahat ng shift sa pinakahuling record.
  function onResetAll() {
    if (!saved.run) return;
    trendOverrides.clearAll();
    renderAll();
    setStatusOf(query('dayStatus'), TEXT.resetAllDone, 'success');
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    renderSource();
    setDefaultDates();
    query('runButton').addEventListener('click', onRun);
    query('resetButton').addEventListener('click', onResetAll);
    const exportButton = document.querySelector(EXPORT.SELECTOR.exportButton);
    if (exportButton) exportButton.addEventListener('click', onExport);
    setExportDisabled(!saved.run);
    query('dayDate').addEventListener('change', renderDay);
    query('dayResult').addEventListener('click', onDayClick);
    if (saved.run) {
      pickDayDate();
      renderAll();
    } else {
      renderDay();
    }
  }

  root.registry.registerPage('trend', Object.freeze({ init }));
})();
