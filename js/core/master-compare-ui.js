/*
 * FILE    : js/core/master-compare-ui.js
 * PURPOSE : Screen ng Compare vs previous sa Master page: kusang gumagawa kapag may worst slider (yellow o red), table na may actual at master, chart, Export to Excel, at sulat ng status sa Server path para sa LEAD PC (window.BMWW.compareUi)
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, chart-draw.js, master-compare.js, master-compare-export.js, master-compare-config.js, compare-sync.js
 * VERSION : v8.5 | 2026-11-21 | autoExportCompare: kusang Excel ng Compare sa Saving path at Server path pagkatapos ng Compare vs previous
 * VERSION : v7.1 | 2026-11-21 | refresh: kusang takbo lang kapag COMPARE.AUTO_RUN; bukas ang Compare vs previous kapag may Master Correl run (kahit green lahat, para may sagot)
 * VERSION : v3.5 | 2026-11-21 | bagong file; tinatawag ng js/pages/master.js (init at refresh)
 * VERSION : v7.9 | 2026-11-21 | inalis ang Export compare to Excel (button, onExport)
 * VERSION : v7 | 2026-11-21 | kusang compare kapag may worst slider lang; banner, Previous vs Today table ng actual/master/diff, filter (kailangang tingnan lang), sync sa Server path
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const COMPARE = root.compareConfig;
  const CLASS = COMPARE.CLASS;
  const EXPORT = root.exportConfig;
  const TEXT = CONFIG.TEXT.master;
  const { storage, csv, chart, masterCompare, compareExport, compareSync } = root;

  // hooks galing sa master.js: getLatestRun, isBusy, setBusy, getReadyHandle, getReadErrorMessage, getMachineName
  let hooks = null;
  // Huling view { run, detection, comparison, noPrevious, showAll, sync }; nananatili habang bukas ang website (para sa pagbalik sa Master page).
  let view = null;
  // Ang run na sinimulan nang iproseso nang kusa (para hindi maulit).
  let autoRun = null;

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
    table.append(head, makeTableBody(rowList));
    wrap.append(table);
    return wrap;
  }

  // Body ng table mula sa listahan ng row. Ang row ay listahan ng cell, o { cells, className }.
  function makeTableBody(rowList) {
    const body = document.createElement('tbody');
    rowList.forEach((rowItem) => {
      const cellList = Array.isArray(rowItem) ? rowItem : rowItem.cells;
      const row = document.createElement('tr');
      if (!Array.isArray(rowItem) && rowItem.className) row.className = rowItem.className;
      cellList.forEach((cell) => {
        const isObject = typeof cell === 'object';
        row.append(makeElement('td', isObject ? cell.className : '', isObject ? cell.text : cell));
      });
      body.append(row);
    });
    return body;
  }

  // Ilang araw ang pagitan ng dalawang petsa (ayon sa kalendaryo).
  function getDayGap(laterDate, earlierDate) {
    const later = new Date(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate()).getTime();
    const earlier = new Date(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate()).getTime();
    return Math.round((later - earlier) / 86400000);
  }

  // Text ng sync sa LEAD PC ayon sa lagay.
  function getSyncText(current) {
    const sync = current.sync;
    const text = COMPARE.TEXT.sync;
    if (!sync || sync.key === 'pending') return text.pending;
    if (sync.key === 'ok') return (current.detection ? text.ok : text.cleared).replace('{time}', sync.time);
    return text[sync.key] || text.error;
  }

  // Linya ng sync sa LEAD PC (ina-update pagkatapos ng sulat sa server).
  function buildSyncLine(current) {
    return makeElement('p', 'result-note ' + CLASS.sync, getSyncText(current));
  }

  function updateSyncLine() {
    const area = query('result');
    const line = area ? area.querySelector('.' + CLASS.sync) : null;
    if (line && view) line.textContent = getSyncText(view);
  }

  // Banner ng worst slider: malaki at may kulay ng level.
  function buildBanner(current) {
    const detection = current.detection;
    const text = COMPARE.TEXT;
    const banner = makeElement('div', CLASS.banner + ' ' + detection.level);
    banner.append(makeElement('h3', 'compare-banner-title', text.banner.replace('{barcode}', detection.barcode)));
    const slider = current.comparison ? current.comparison.sliderList[detection.index] : null;
    const levelText = COMPARE.LEVEL_TEXT[detection.level] || '';
    if (slider && slider.previousDifference !== null) {
      const change = slider.change === null ? '' : ' (' + formatSigned(slider.change) + ')';
      const trend = slider.trend === COMPARE.TREND.unknown ? '' : COMPARE.TREND_SYMBOL[slider.trend] + ' ' + COMPARE.TREND_TEXT[slider.trend];
      banner.append(makeElement('p', 'compare-banner-line', text.bannerLine.replace('{today}', formatNumber(detection.difference)).replace('{level}', levelText).replace('{previous}', formatNumber(slider.previousDifference) + change).replace('{trend}', trend)));
    } else {
      banner.append(makeElement('p', 'compare-banner-line', text.bannerNoPrevious.replace('{today}', formatNumber(detection.difference)).replace('{level}', levelText)));
    }
    return banner;
  }

  // Card na walang worst slider (lahat green).
  function buildNoWorst(current) {
    const box = makeElement('div', CLASS.ok);
    box.append(makeElement('h3', 'compare-banner-title', COMPARE.TEXT.noWorstTitle));
    box.append(makeElement('p', 'compare-banner-line', COMPARE.TEXT.noWorstNote.replace('{max}', String(MASTER.DEVIATION.GREEN_MAX))));
    box.append(buildSyncLine(current));
    return box;
  }

  // Maliit na table ng worst slider: Actual, Master at Diff ng Previous at Today.
  function buildWorstTable(current) {
    const { comparison, detection } = current;
    const label = COMPARE.LABEL;
    const slider = comparison.sliderList[detection.index];
    const masterMark = slider.masterChanged ? ' *' : '';
    return makeTable(
      [label.worstSlider + ': ' + detection.barcode, label.groupPrevious + ' (' + csv.formatDateInput(comparison.previous.recordDate) + ')', label.groupToday + ' (' + csv.formatDateInput(comparison.current.recordDate) + ')'],
      [
        [label.rowActual, formatNumber(slider.previousActual), formatNumber(slider.currentActual)],
        [label.rowMaster, formatNumber(slider.previousMaster), formatNumber(slider.currentMaster) + masterMark],
        [label.rowDiff, { text: formatNumber(slider.previousDifference), className: slider.previousLevel }, { text: formatNumber(slider.currentDifference), className: slider.currentLevel }]
      ]
    );
  }

  // Maikling buod: R Square, Status, bilang ng trend at previous record.
  function buildStats(comparison) {
    const { current, previous, summary } = comparison;
    const text = COMPARE.TEXT;
    const rSquaredChange = (summary.rSquaredChange > 0 ? '+' : '') + summary.rSquaredChange.toFixed(4);
    return makeStatList([
      [text.statRSquared, previous.regression.rSquared.toFixed(4) + text.arrow + current.regression.rSquared.toFixed(4) + ' (' + rSquaredChange + ')'],
      [text.statStatus, previous.status + text.arrow + current.status],
      [text.statCounts, summary.worseCount + ' / ' + summary.betterCount + ' / ' + summary.sameCount],
      [text.statPrevious, csv.formatDateTime(previous.recordDate, true) + ' | ' + previous.fileName]
    ]);
  }

  // Table ng mga slider: Previous (Actual, Master, Diff) at Today (Actual, Master, Diff), Change, Trend.
  function makeCompareTable(sliderList, worstSlider) {
    const label = COMPARE.LABEL;
    const wrap = makeElement('div', 'table-wrap');
    const table = makeElement('table', 'result-table compare-table');
    const head = document.createElement('thead');
    const topRow = document.createElement('tr');
    const subRow = document.createElement('tr');
    const spanHeader = (text, rows, columns, className) => {
      const cell = makeElement('th', className || '', text);
      if (rows) cell.setAttribute('rowspan', String(rows));
      if (columns) cell.setAttribute('colspan', String(columns));
      return cell;
    };
    topRow.append(spanHeader(label.columnBarcode, 2, 0), spanHeader(label.groupPrevious, 0, 3, CLASS.groupStart), spanHeader(label.groupToday, 0, 3, CLASS.groupStart), spanHeader(label.columnChange, 2, 0, CLASS.groupStart), spanHeader(label.columnTrend, 2, 0));
    [label.columnActual, label.columnMaster, label.columnDiff, label.columnActual, label.columnMaster, label.columnDiff].forEach((text, index) => {
      subRow.append(makeElement('th', index % 3 === 0 ? CLASS.groupStart : '', text));
    });
    head.append(topRow, subRow);
    const rowList = sliderList.map((slider) => {
      const trendClass = COMPARE.TREND_CLASS[slider.trend];
      const masterClass = slider.masterChanged ? CLASS.masterChanged : '';
      return {
        className: slider === worstSlider ? CLASS.worstRow : '',
        cells: [
          slider.barcode,
          { text: formatNumber(slider.previousActual), className: CLASS.groupStart },
          formatNumber(slider.previousMaster),
          { text: formatNumber(slider.previousDifference), className: slider.previousLevel },
          { text: formatNumber(slider.currentActual), className: CLASS.groupStart },
          { text: formatNumber(slider.currentMaster) + (slider.masterChanged ? ' *' : ''), className: masterClass },
          { text: formatNumber(slider.currentDifference), className: slider.currentLevel },
          { text: formatSigned(slider.change), className: trendClass + ' ' + CLASS.groupStart },
          { text: COMPARE.TREND_SYMBOL[slider.trend] + ' ' + COMPARE.TREND_TEXT[slider.trend], className: trendClass }
        ]
      };
    });
    table.append(head, makeTableBody(rowList));
    wrap.append(table);
    return wrap;
  }

  // Filter at table: default ay ang kailangang tingnan lang (hindi green o lumalala), pinakamalaki ang diff sa taas.
  function buildTableSection(current) {
    const { comparison, detection } = current;
    const text = COMPARE.TEXT;
    const sliderList = comparison.sliderList;
    const worstSlider = sliderList[detection.index];
    const box = makeElement('div', CLASS.tableBox);
    const filter = makeElement('label', CLASS.filter);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(current.showAll);
    filter.append(checkbox, makeElement('span', '', text.showAll.replace('{total}', String(sliderList.length))));
    const tableArea = makeElement('div', '');
    const draw = () => {
      const showAll = checkbox.checked;
      current.showAll = showAll;
      const shown = showAll ? sliderList : sliderList.filter((slider) => slider.isAttention).sort((first, second) => (second.currentDifference || 0) - (first.currentDifference || 0));
      const note = showAll ? text.allNote.replace('{total}', String(sliderList.length)) : text.attentionNote.replace('{shown}', String(shown.length)).replace('{total}', String(sliderList.length));
      tableArea.replaceChildren(makeCompareTable(shown, worstSlider), makeElement('p', 'result-note', note));
    };
    checkbox.addEventListener('change', draw);
    draw();
    box.append(filter, tableArea);
    return box;
  }

  // Chart ng Previous at Today (diff ng lahat ng slider).
  function buildChart(comparison) {
    const { current, previous, sliderList } = comparison;
    const text = COMPARE.TEXT;
    const chartBox = makeElement('div', 'chart-box chart-box-wide');
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
    return chartBox;
  }

  // Ina-draw ang kasalukuyang view sa result area.
  function renderView() {
    const area = query('result');
    if (!area) return;
    if (!view) { area.replaceChildren(); return; }
    if (!view.detection) { area.replaceChildren(buildNoWorst(view)); return; }
    const nodeList = [buildBanner(view), buildSyncLine(view)];
    if (view.comparison) {
      const { comparison } = view;
      nodeList.push(buildWorstTable(view), buildStats(comparison));
      if (getDayGap(comparison.current.recordDate, comparison.previous.recordDate) > 1) {
        nodeList.push(makeElement('p', 'result-note', COMPARE.TEXT.gapNote.replace('{date}', csv.formatDateInput(comparison.previous.recordDate))));
      }
      nodeList.push(buildTableSection(view), buildChart(comparison));
      if (comparison.sliderList.some((slider) => slider.masterChanged)) nodeList.push(makeElement('p', 'result-note', COMPARE.TEXT.masterChangedNote));
      nodeList.push(makeElement('p', 'result-note', COMPARE.TEXT.ruleNote.replace('{min}', String(COMPARE.WORSEN_MIN))));
    } else if (view.noPrevious) {
      nodeList.push(makeElement('p', 'result-note', COMPARE.TEXT.noPreviousNote));
    }
    area.replaceChildren(...nodeList);
  }

  // Sumusulat sa Server path para ma-update ang LEAD PC. Ibinibigay { key, time }.
  async function syncToServer(current, shouldRequest) {
    const settings = storage.readLocalSettings();
    const machineName = hooks.getMachineName();
    if (settings.machineMode === CONFIG.MACHINE_MODE.LEAD_PC) return { key: 'skippedLead', time: '' };
    if (!machineName) return { key: 'noName', time: '' };
    const identity = { machineName, machineMode: settings.machineMode };
    const payload = compareSync.buildPayload(identity, current.run, current.detection, current.comparison, Date.now());
    const key = await compareSync.sendStatus(payload, shouldRequest);
    return { key, time: new Date().toLocaleTimeString() };
  }

  // Sync pagkatapos ng compare; ina-update ang linya kung ito pa rin ang view.
  async function finishSync(current, shouldRequest) {
    current.sync = await syncToServer(current, shouldRequest);
    if (view === current) updateSyncLine();
  }

  // Kusang export ng Excel ng Compare: bagong file sa <Saving path>\\master-compare\\<petsa> at kopya (overwrite) sa <Server path>\\master-compare\\<machine>\\<petsa>. Hindi nagtatapon ng error; ipinapakita ang resulta sa status line.
  async function autoExportCompare(current, shouldRequest) {
    if (!COMPARE.AUTO_EXPORT || !current.comparison) return;
    try {
      setStatus(COMPARE.TEXT.exporting, 'info');
      if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
      const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle) throw csv.createError('noRoot');
      if (!(await storage.hasPermission(rootHandle, shouldRequest))) throw csv.createError('noPermission');
      const settings = storage.readLocalSettings();
      const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
      const sourceText = paths[MASTER.SOURCE_KEY] || (settings.folderNames || {})[MASTER.SOURCE_KEY] || TEXT.sourceNotSet;
      const separator = EXPORT.PATH_SEPARATOR;
      const saved = await compareExport.exportCompare(current.comparison, rootHandle, sourceText, hooks.getMachineName());
      const savedText = COMPARE.TEXT.saved + (paths[CONFIG.ROOT_KEY] || rootHandle.name) + separator + saved.folderName + separator + saved.fileName;
      const serverText = root.correlConfig.TEXT.serverState;
      let serverFound;
      try {
        serverFound = await root.queue.findServerHandle(shouldRequest);
      } catch (error) {
        serverFound = { handle: null, state: CONFIG.QUEUE.CONNECTION.error };
      }
      if (serverFound.state !== CONFIG.QUEUE.CONNECTION.ok) {
        setStatus(savedText + COMPARE.TEXT.serverFailed + (serverText[serverFound.state] || serverText.error), 'error');
        return;
      }
      try {
        const copied = await compareExport.copyToServer(serverFound.handle, saved, hooks.getMachineName());
        setStatus(savedText + COMPARE.TEXT.serverSaved + (paths[CONFIG.SERVER_KEY] || serverFound.handle.name) + separator + copied.folderName + separator + copied.fileName, 'success');
      } catch (error) {
        setStatus(savedText + COMPARE.TEXT.serverFailed + serverText.error, 'error');
      }
    } catch (error) {
      setStatus(getExportMessage(error), 'error');
    }
  }

  // Pinoproseso ang run: tinitingnan ang worst slider; kung meron, gumagawa ng compare; sinusulat ang status sa Server path.
  // shouldRequest true lang kapag galing sa click (para makahingi ng permission sa Server folder).
  async function processRun(run, shouldRequest) {
    const detection = masterCompare.detectWorst(run.result);
    const current = { run, detection, comparison: null, noPrevious: false, showAll: false, sync: { key: 'pending', time: '' } };
    view = current;
    if (!detection) {
      setStatus('', '');
      renderView();
      await finishSync(current, shouldRequest);
      return;
    }
    hooks.setBusy(true);
    try {
      setStatus(COMPARE.TEXT.working, 'info');
      try {
        const handle = await hooks.getReadyHandle();
        const previous = await masterCompare.findPrevious(handle, run.range.startDate, (index, total, name) => setStatus(COMPARE.TEXT.progress + index + '/' + total + ' ' + name, 'info'));
        current.comparison = masterCompare.compareRecords(run.result, previous);
        setStatus('', '');
      } catch (error) {
        current.comparison = null;
        current.noPrevious = Boolean(error) && error.code === 'noPreviousRecord';
        setStatus(getReadMessage(error), 'error');
      }
      if (view === current) renderView();
      await finishSync(current, shouldRequest);
      await autoExportCompare(current, shouldRequest);
      const resultArea = query('result');
      if (resultArea && resultArea.scrollIntoView) resultArea.scrollIntoView({ block: 'nearest' });
    } finally {
      hooks.setBusy(false);
    }
  }

  // Ina-update ang button: bukas ang Compare kapag may Master Correl run; bukas ang Export kapag may compare. Kusang pinoproseso ang bagong run lang kapag COMPARE.AUTO_RUN (false ngayon).
  function refresh() {
    if (!hooks) return;
    const runButton = query('runButton');
    if (!runButton) return;
    const run = hooks.getLatestRun();
    if (view && view.run !== run) {
      view = null;
      renderView();
      setStatus('', '');
    }
    runButton.disabled = hooks.isBusy() || !run;
    if (COMPARE.AUTO_RUN && run && autoRun !== run && !hooks.isBusy()) {
      autoRun = run;
      processRun(run, false).catch(() => setStatus(COMPARE.TEXT.error.exportFail, 'error'));
    }
  }

  // Click ng Compare vs previous (ulitin; may click kaya puwedeng humingi ng permission).
  async function onCompare() {
    if (hooks.isBusy()) return;
    const run = hooks.getLatestRun();
    if (!run) { setStatus(COMPARE.TEXT.error.noCurrent, 'error'); return; }
    autoRun = run;
    try {
      await processRun(run, true);
    } catch (error) {
      setStatus(getReadMessage(error), 'error');
    }
  }

  // Init, tinatawag ng master.js sa bawat bukas ng Master page (bagong DOM kada bukas).
  function init(nextHooks) {
    hooks = nextHooks;
    if (view && view.run !== hooks.getLatestRun()) view = null;
    query('runButton').addEventListener('click', onCompare);
    renderView();
    refresh();
  }

  root.compareUi = Object.freeze({ init, refresh });
})();
