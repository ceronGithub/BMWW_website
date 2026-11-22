/*
 * FILE    : js/core/calibration-tile.js
 * PURPOSE : Tile ng Calibration Correl at Calibration Repeatability sa Dashboard (status, R Square / Repeatability %, Worst slider, dahilan kung walang nabasa) at Preview sa bagong tab. Sender = <Saving path>; LEAD PC = <Server path>. Basa lang.
 * DEPENDS : js/core/config.js, storage.js, queue.js, csv-reader.js, master-analysis.js, chart-draw.js, correl-sync-config.js, dashboard-machines-config.js, calibration-tile-config.js, repeatability-reader.js, preview-tab.js
 * INPUT   : kind ('correl' | 'repeatability'), details (galing sa readInSavingPath / readForMachine), oras ngayon (ms), pangalan ng machine, isSender
 * OUTPUT  : elemento ng tile; Preview tab. Hindi nagtatapon ng error.
 * VERSION : v12 | 2026-11-22 | bagong file (Task 1: Calibration Correl at opsyonal na Calibration Repeatability sa Dashboard, Sender at LEAD PC)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const DM = root.dashboardMachinesConfig;
  const TILE = root.calibrationTileConfig;
  const TEXT = TILE.TEXT;
  const CLASS = TILE.CLASS;
  const MASTER_TEXT = CONFIG.TEXT.master;
  const detailsCache = new Map();
  const issueMap = new Map();
  let previewClearId = null;

  // Gumagawa ng elemento na may class at text (textContent lang, ligtas sa XSS).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
  }

  // Pinaikli ang pangalan para sa paghahambing (walang pagkakaiba ang laki ng letra at sobrang espasyo).
  function normalizeName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Pangalan ng folder ng machine, kapareho ng ginagamit ng export (correlConfig.SERVER).
  function getMachineFolderName(machineName) {
    const setting = root.correlConfig.SERVER;
    const cleaned = String(machineName || '').replace(setting.UNSAFE_NAME, '_').replace(setting.TRIM_NAME, '');
    return cleaned || setting.NO_MACHINE_FOLDER;
  }

  // Walang folder (NotFoundError) ba ang dahilan ng error?
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  // Susi ng dahilan: Sender = walang machine name; LEAD PC = kasama ang machine name.
  function getIssueKey(kind, machineName, isSender) {
    return isSender ? TILE.ISSUE.SENDER_PREFIX + kind : kind + '|' + normalizeName(machineName);
  }

  function setIssue(key, code, detail) {
    issueMap.set(key, { code, detail: detail || '' });
  }

  // Text ng dahilan kung bakit walang nabasa; walang laman kung walang naitalang dahilan.
  function getIssueText(kind, machineName, isSender) {
    const issue = issueMap.get(getIssueKey(kind, machineName, isSender));
    if (!issue) return '';
    const issueText = TEXT.issue;
    const template = (isSender && issueText[issue.code + 'Sender']) || issueText[issue.code] || issueText.error;
    const detail = issue.code === 'noFolder' && !issue.detail ? issueText.none : issue.detail;
    return template.replace('{folder}', TILE.KIND[kind].SUBFOLDER).replace('{detail}', detail);
  }

  // Halaga sa column B sa tabi ng label sa column A ng grid; walang laman kung wala.
  function findLabelValue(rowList, label) {
    const found = rowList.find((row) => String(row[0] || '').trim().toLowerCase() === label.toLowerCase());
    return found ? String(found[1] || '').trim() : '';
  }

  function toNumber(text) {
    if (text === '') return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
  }

  // Calibration Correl: kinukuha mula sa grid ang R Square, Date, AVG at table ng Barcode / Actual / Master.
  function readCorrelFields(grid) {
    const rowList = grid.rowList;
    const headerIndex = rowList.findIndex((row) => String(row[0] || '').trim() === MASTER_TEXT.barcode);
    const sliderList = [];
    if (headerIndex >= 0) {
      for (let index = headerIndex + 1; index < rowList.length; index += 1) {
        const barcode = String(rowList[index][0] || '').trim();
        if (!barcode) break;
        const actual = toNumber(String(rowList[index][1] || '').trim());
        const master = toNumber(String(rowList[index][2] || '').trim());
        sliderList.push({ barcode, actual, master, level: actual === null || master === null ? '' : root.masterAnalysis.classifyDeviation(actual, master) });
      }
    }
    return {
      rSquared: toNumber(findLabelValue(rowList, MASTER_TEXT.rSquared)),
      recordDate: findLabelValue(rowList, MASTER_TEXT.recordDate),
      actualAverage: findLabelValue(rowList, MASTER_TEXT.actualAverage),
      masterAverage: findLabelValue(rowList, MASTER_TEXT.masterAverage),
      sliderList
    };
  }

  // Binabasa ang Excel (parehong layout ng Master: Status sa buod, grid ng sheet) gamit ang repeatabilityReader; may cache kada file.
  async function readCached(file, kind) {
    const key = kind + '|' + file.name + '|' + file.lastModified + '|' + file.size;
    if (!detailsCache.has(key)) {
      const base = root.repeatabilityReader ? await root.repeatabilityReader.readDetailsFromFile(file) : null;
      detailsCache.set(key, base ? Object.assign({ kind }, base, kind === 'correl' ? readCorrelFields(base.grid) : {}) : null);
    }
    return detailsCache.get(key);
  }

  // Pinakabagong file (last modified) sa isang folder na tugma sa prefix at extension ng tipo; null kung wala.
  async function findLatestInFolder(folderHandle, kind) {
    const setting = TILE.KIND[kind];
    let latest = null;
    for await (const [fileName, fileHandle] of folderHandle.entries()) {
      if (fileHandle.kind !== 'file' || !fileName.startsWith(setting.FILE_PREFIX) || !fileName.toLowerCase().endsWith(setting.FILE_EXTENSION)) continue;
      const file = await fileHandle.getFile();
      if (!latest || file.lastModified > latest.lastModified) latest = file;
    }
    return latest;
  }

  // Hinahanap ang folder ng machine (hindi sensitibo sa laki ng letra); { handle } o { names } kapag wala.
  async function findMachineFolder(baseHandle, machineName) {
    const wanted = normalizeName(getMachineFolderName(machineName));
    const names = [];
    for await (const [folderName, handle] of baseHandle.entries()) {
      if (handle.kind !== 'directory') continue;
      if (normalizeName(folderName) === wanted) return { handle };
      names.push(folderName);
    }
    return { names: names.slice(0, TILE.ISSUE.FOLDER_LIST_LIMIT) };
  }

  // Sender: pinakabagong Excel sa <Saving path>\<subfolder>\<dayName>\ (o \<machine>\<dayName>\). dayName = yyyy-mm-dd. Null kung wala (may dahilan sa getIssueText).
  async function readInSavingPath(rootHandle, machineName, dayName, kind) {
    const issueKey = getIssueKey(kind, machineName, true);
    issueMap.delete(issueKey);
    try {
      let baseHandle;
      try {
        baseHandle = await rootHandle.getDirectoryHandle(TILE.KIND[kind].SUBFOLDER);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        setIssue(issueKey, 'noBaseFolder');
        return null;
      }
      const dayFolderList = [];
      try { dayFolderList.push(await baseHandle.getDirectoryHandle(dayName)); } catch (error) { if (!isNotFound(error)) throw error; }
      const machineFolder = await findMachineFolder(baseHandle, machineName);
      if (machineFolder.handle) {
        try { dayFolderList.push(await machineFolder.handle.getDirectoryHandle(dayName)); } catch (error) { if (!isNotFound(error)) throw error; }
      }
      if (dayFolderList.length === 0) { setIssue(issueKey, 'noDayFolder'); return null; }
      let latest = null;
      for (const dayFolder of dayFolderList) {
        const found = await findLatestInFolder(dayFolder, kind);
        if (found && (!latest || found.lastModified > latest.lastModified)) latest = found;
      }
      if (!latest) { setIssue(issueKey, 'noFile'); return null; }
      const details = await readCached(latest, kind);
      if (!details) setIssue(issueKey, 'unreadable', latest.name);
      return details;
    } catch (error) {
      setIssue(issueKey, 'error', error && error.name ? error.name : '');
      return null;
    }
  }

  // LEAD PC: pinakabagong Excel ng machine sa <Server path>\<subfolder>\<machine>\<petsa>\. Tinitingnan ang folder ng petsa mula pinakabago hanggang makakita ng file.
  async function readForMachine(serverHandle, machineName, kind) {
    const issueKey = getIssueKey(kind, machineName, false);
    issueMap.delete(issueKey);
    try {
      let baseHandle;
      try {
        baseHandle = await serverHandle.getDirectoryHandle(TILE.KIND[kind].SUBFOLDER);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        setIssue(issueKey, 'noBaseFolder');
        return null;
      }
      const machineFolder = await findMachineFolder(baseHandle, machineName);
      if (!machineFolder.handle) { setIssue(issueKey, 'noFolder', machineFolder.names.join(', ')); return null; }
      const dayList = [];
      for await (const [dayName, handle] of machineFolder.handle.entries()) {
        if (handle.kind === 'directory') dayList.push({ dayName, handle });
      }
      dayList.sort((first, second) => (first.dayName < second.dayName ? 1 : -1));
      for (const day of dayList) {
        const latest = await findLatestInFolder(day.handle, kind);
        if (!latest) continue;
        const details = await readCached(latest, kind);
        if (!details) setIssue(issueKey, 'unreadable', latest.name);
        return details;
      }
      setIssue(issueKey, 'noFile');
      return null;
    } catch (error) {
      setIssue(issueKey, 'error', error && error.name ? error.name : '');
      return null;
    }
  }

  // LEAD PC: binabasa ang Calibration Correl (at Calibration Repeatability kung includeRepeatability) ng bawat machine at inilalagay sa item.calibrationCorrel / item.calibrationRepeatability (null kung wala).
  async function attachToItems(serverHandle, machineItemList, includeRepeatability) {
    if (!serverHandle || !root.repeatabilityReader) return;
    await Promise.all(machineItemList.map(async (item) => {
      item.calibrationCorrel = await readForMachine(serverHandle, item.machineName, 'correl');
      item.calibrationRepeatability = includeRepeatability ? await readForMachine(serverHandle, item.machineName, 'repeatability') : null;
    }));
  }

  // ----- Preview sa bagong tab -----

  // Mensahe sa ilalim ng mga tile kapag hinarang ang bagong tab (nawawala pagkalipas ng ilang segundo).
  function showBlocked() {
    const element = document.querySelector(DM.SELECTOR.previewStatus);
    if (!element) return;
    element.textContent = DM.TEXT.preview.tab.blocked;
    element.classList.add('is-error');
    window.clearTimeout(previewClearId);
    previewClearId = window.setTimeout(() => { element.textContent = ''; element.classList.remove('is-error'); }, DM.TEXT.preview.clearMs);
  }

  // Linear regression (y = slope * x + intercept) at R squared; null kung hindi makalkula.
  function computeTrend(pointList) {
    const count = pointList.length;
    if (count < TILE.MIN_POINTS) return null;
    const sumX = pointList.reduce((total, point) => total + point.x, 0);
    const sumY = pointList.reduce((total, point) => total + point.y, 0);
    const sumXY = pointList.reduce((total, point) => total + point.x * point.y, 0);
    const sumXX = pointList.reduce((total, point) => total + point.x * point.x, 0);
    const sumYY = pointList.reduce((total, point) => total + point.y * point.y, 0);
    const spreadX = count * sumXX - sumX * sumX;
    const spreadY = count * sumYY - sumY * sumY;
    if (spreadX === 0) return null;
    const slope = (count * sumXY - sumX * sumY) / spreadX;
    const correlation = spreadY === 0 ? 0 : (count * sumXY - sumX * sumY) / Math.sqrt(spreadX * spreadY);
    return { slope, intercept: (sumY - slope * sumX) / count, rSquared: correlation * correlation };
  }

  // Scatter ng Calibration Correl: x = Master, y = Actual, kulay ayon sa level; ang R Square ay ang nasa file kung meron.
  function buildCorrelChart(details, machineName) {
    const pointList = details.sliderList.filter((slider) => typeof slider.actual === 'number' && typeof slider.master === 'number').map((slider) => ({ x: slider.master, y: slider.actual, level: slider.level, barcode: slider.barcode }));
    if (pointList.length < TILE.MIN_POINTS) return null;
    const trend = computeTrend(pointList);
    if (trend && typeof details.rSquared === 'number') trend.rSquared = details.rSquared;
    const box = document.createElement('div');
    box.className = 'chart-box';
    root.chart.drawScatter(box, { title: TEXT.correl.panelTitle + machineName, xTitle: DM.TEXT.preview.panel.correlChartX, yTitle: DM.TEXT.preview.panel.correlChartY, pointList, trend });
    return box;
  }

  // Line chart ng Calibration Repeatability mula sa sheet na Readings: bawat record ay isang linya, kasama ang MASTER. Null kung walang data.
  function buildRepeatabilityChart(details, machineName) {
    const readings = details.readings;
    if (!readings || readings.recordList.length === 0 || readings.barcodeList.length < 1) return null;
    const shownList = readings.recordList.slice(-CONFIG.MASTER.RANGE.MAX_LINES);
    const seriesList = shownList.map((record, index) => ({
      name: record.key, values: record.values, isMaster: false, colorIndex: index % TILE.CHART.COLOR_CYCLE,
      levelList: record.values.map((value, barcodeIndex) => (typeof value === 'number' && typeof readings.masterList[barcodeIndex] === 'number' ? root.masterAnalysis.classifyDeviation(value, readings.masterList[barcodeIndex]) : ''))
    }));
    seriesList.push({ name: MASTER_TEXT.masterSeries, values: readings.masterList, isMaster: true });
    const box = document.createElement('div');
    box.className = 'chart-box';
    root.chart.drawLines(box, { title: (machineName ? machineName + ' ' : '') + TEXT.repeatability.lineTitle, categoryList: readings.barcodeList, seriesList, hideLegend: false });
    return box;
  }

  // Kinukuha ang laman ng pinakabagong file para sa Preview. Ibinibigay { details } o { message }.
  async function loadPreviewDetails(kind, machineName, isSender) {
    const kindText = TEXT[kind];
    if (!root.storage.isFolderAccessSupported()) return { message: DM.TEXT.preview.error.unsupported };
    if (isSender) {
      const rootHandle = await root.storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle || !(await root.storage.hasPermission(rootHandle, true))) return { message: TEXT.noRoot };
      // Folder ng ngayon muna; kung wala, folder ng kahapon (Night shift na tumawid ng hatinggabi), kapareho ng tile.
      const details = (await readInSavingPath(rootHandle, machineName, root.csv.formatDateInput(new Date()), kind))
        || (await readInSavingPath(rootHandle, machineName, root.csv.formatDateInput(new Date(Date.now() - 86400000)), kind));
      return details ? { details } : { message: getIssueText(kind, machineName, true) || kindText.noFileSender };
    }
    const found = await root.queue.findServerHandle(true);
    if (found.state !== CONFIG.QUEUE.CONNECTION.ok) return { message: DM.TEXT.preview.error[found.state] || DM.TEXT.preview.error.error };
    const details = await readForMachine(found.handle, machineName, kind);
    return details ? { details } : { message: getIssueText(kind, machineName, false) || kindText.noFileLead };
  }

  // Pahina ng Preview tab: status, buod, chart at laman ng sheet.
  function buildPage(kind, details, machineName) {
    const stats = TEXT.stats;
    const sync = root.correlSyncConfig;
    const status = { text: details.status || '-', icon: DM.TEXT.correl.icon[details.status] || '', className: (sync && sync.STATUS_CLASS[details.status]) || '' };
    if (kind === 'correl') {
      return {
        title: TEXT.correl.panelTitle + machineName,
        status,
        statList: [
          [stats.rSquared, typeof details.rSquared === 'number' ? details.rSquared.toFixed(TILE.R_SQUARED_DIGITS) : '-'],
          [stats.record, details.recordDate || '-'],
          [stats.actualAverage, details.actualAverage || '-'],
          [stats.masterAverage, details.masterAverage || '-'],
          [stats.worst, details.worst || '-'],
          [stats.file, details.fileName]
        ],
        chartBox: buildCorrelChart(details, machineName),
        grid: details.grid,
        fileName: details.fileName,
        modifiedMs: details.modifiedMs
      };
    }
    return {
      title: TEXT.repeatability.panelTitle + machineName,
      status,
      statList: [
        [stats.score, typeof details.score === 'number' ? details.score.toFixed(TILE.SCORE_DIGITS) : '-'],
        [stats.averageDifference, typeof details.averageDifference === 'number' ? String(details.averageDifference) : '-'],
        [stats.maxDifference, typeof details.maxDifference === 'number' ? String(details.maxDifference) : '-'],
        [stats.worst, details.worst || '-'],
        [stats.records, details.records || '-'],
        [stats.range, details.range || '-'],
        [stats.mode, details.mode || '-'],
        [stats.exportedAt, details.exportedAt || '-'],
        [stats.file, details.fileName]
      ],
      chartBox: buildRepeatabilityChart(details, machineName),
      grid: details.grid,
      fileName: details.fileName,
      modifiedMs: details.modifiedMs
    };
  }

  // Click ng Preview: bagong tab (binubuksan agad sa click, bago ang anumang await).
  function openPreview(kind, machineName, isSender) {
    return root.previewTab.open({
      title: TEXT[kind].panelTitle + machineName,
      load: () => loadPreviewDetails(kind, machineName, isSender),
      buildPage: (details) => buildPage(kind, details, machineName),
      onBlocked: showBlocked
    });
  }

  // Button ng Preview (text at aria-label, hindi icon lang).
  function buildPreviewButton(kind, machineName, isSender) {
    const button = createElementWith('button', CLASS.previewButton, TEXT.previewButton);
    button.type = 'button';
    button.setAttribute('aria-label', TEXT[kind].previewAria + machineName);
    button.addEventListener('click', () => openPreview(kind, machineName, isSender));
    return button;
  }

  // Text ng buod sa ilalim ng status ayon sa tipo.
  function buildMetaText(kind, details) {
    const kindText = TEXT[kind];
    const updated = kindText.updated + (details.modifiedMs ? new Date(details.modifiedMs).toLocaleString() : '-');
    if (kind === 'correl') {
      const rSquared = typeof details.rSquared === 'number' ? details.rSquared.toFixed(TILE.R_SQUARED_DIGITS) : '-';
      return [kindText.rSquared + rSquared, kindText.worst + (details.worst || '-'), kindText.record + (details.recordDate || '-'), updated].join(' | ');
    }
    const score = typeof details.score === 'number' ? details.score.toFixed(TILE.SCORE_DIGITS) + '%' : '-';
    return [kindText.score + score, kindText.worst + (details.worst || '-'), kindText.range + (details.range || '-'), updated].join(' | ');
  }

  // Block sa tile: status (icon at text, hindi lang kulay), buod, Preview. Walang laman na kahon (may dahilan) kung walang nabasa.
  function buildBlock(kind, details, nowMs, machineName, isSender) {
    const sync = root.correlSyncConfig;
    const row = createElementWith('div', CLASS.row);
    row.append(createElementWith('span', CLASS.label, TEXT[kind].label));
    if (!details || !sync) {
      row.append(createElementWith('span', CLASS.empty, TEXT.none));
      const emptyBox = createElementWith('div', CLASS.box + ' ' + CLASS.none);
      emptyBox.append(row);
      const issueText = getIssueText(kind, machineName, isSender);
      if (issueText) emptyBox.append(createElementWith('p', CLASS.meta, issueText));
      return emptyBox;
    }
    const box = createElementWith('div', CLASS.box + ' ' + (sync.STATUS_CLASS[details.status] || ''));
    const badge = createElementWith('span', CLASS.badge);
    badge.append(createElementWith('span', CLASS.icon, DM.TEXT.correl.icon[details.status] || ''), createElementWith('span', '', details.status));
    row.append(badge);
    if (details.modifiedMs && nowMs - details.modifiedMs > sync.STALE_MS) row.append(createElementWith('span', CLASS.tag, TEXT.stale));
    row.append(buildPreviewButton(kind, machineName, isSender));
    box.append(row, createElementWith('p', CLASS.meta, buildMetaText(kind, details)));
    return box;
  }

  root.calibrationTile = Object.freeze({ buildBlock, readInSavingPath, readForMachine, attachToItems, openPreview });
})();
