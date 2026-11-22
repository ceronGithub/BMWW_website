/*
 * FILE    : js/core/repeatability-tile.js
 * PURPOSE : Tile ng Master Repeatability sa Dashboard (status, Repeatability %, Worst slider, Range, dahilan kung walang nabasa) at Preview sa bagong tab (buod, chart at sheet)
 * DEPENDS : js/core/config.js, queue.js, storage.js, csv-reader.js, master-analysis.js, chart-draw.js, dashboard-machines-config.js, correl-sync-config.js, repeatability-tile-config.js, repeatability-reader.js, preview-tab.js
 * INPUT   : details (galing sa repeatabilityReader), oras ngayon (ms), pangalan ng machine, isSender (true = Sender, false = LEAD PC)
 * OUTPUT  : elemento ng tile; Preview tab (basa lang). Hindi nagtatapon ng error.
 * VERSION : v11.1 | 2026-11-22 | Preview ng Sender: kung walang file sa folder ng ngayon, tinitingnan din ang folder ng kahapon (Night shift na tumawid ng hatinggabi)
 * VERSION : v8.14 | 2026-11-22 | (1) Preview tab ay may line chart (buildChart) mula sa sheet na Readings. (2) Kapag walang nabasa, ipinapakita sa tile at sa Preview ang dahilan (getIssueText)
 * VERSION : v8.12 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const DM = root.dashboardMachinesConfig;
  const TILE = root.repeatabilityTileConfig;
  const TEXT = TILE.TEXT;
  const CLASS = TILE.CLASS;
  const MASTER_TEXT = CONFIG.TEXT.master;
  let previewClearId = null;

  // Gumagawa ng elemento na may class at text (textContent lang, ligtas sa XSS).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
  }

  // Text ng dahilan kung bakit walang nabasa (galing sa repeatabilityReader.getIssue); walang laman kung walang naitalang dahilan.
  function getIssueText(machineName, isSender) {
    if (!root.repeatabilityReader || !root.repeatabilityReader.getIssue) return '';
    const issue = root.repeatabilityReader.getIssue(machineName, isSender);
    if (!issue) return '';
    const issueText = TEXT.issue;
    const template = (isSender && issueText[issue.code + 'Sender']) || issueText[issue.code] || issueText.error;
    const detail = issue.code === 'noFolder' && !issue.detail ? issueText.none : issue.detail;
    return template.replace('{detail}', detail);
  }

  // Level (green / yellow / red) ng reading vs master, kapareho ng screen; walang laman kung walang halaga.
  function getLevel(value, masterValue) {
    if (typeof value !== 'number' || typeof masterValue !== 'number') return '';
    return root.masterAnalysis.classifyDeviation(value, masterValue);
  }

  // Line chart ng Preview mula sa sheet na Readings: bawat record ay isang linya, x = barcode, kasama ang MASTER. Huling MAX_LINES lang (kapareho ng screen). Null kapag walang data.
  function buildChart(details, machineName) {
    const readings = details.readings;
    if (!readings || readings.recordList.length === 0 || readings.barcodeList.length < TILE.CHART.MIN_BARCODES) return null;
    const shownList = readings.recordList.slice(-CONFIG.MASTER.RANGE.MAX_LINES);
    const seriesList = shownList.map((record, index) => ({
      name: record.key, values: record.values, isMaster: false, colorIndex: index % TILE.CHART.COLOR_CYCLE,
      levelList: record.values.map((value, barcodeIndex) => getLevel(value, readings.masterList[barcodeIndex]))
    }));
    seriesList.push({ name: MASTER_TEXT.masterSeries, values: readings.masterList, isMaster: true });
    const box = document.createElement('div');
    box.className = 'chart-box';
    root.chart.drawLines(box, { title: (machineName ? machineName + ' ' : '') + MASTER_TEXT.lineTitle, categoryList: readings.barcodeList, seriesList, hideLegend: false });
    return box;
  }

  // Mensahe sa ilalim ng mga tile kapag hinarang ang bagong tab (nawawala pagkalipas ng ilang segundo).
  function showBlocked() {
    const element = document.querySelector(DM.SELECTOR.previewStatus);
    if (!element) return;
    element.textContent = DM.TEXT.preview.tab.blocked;
    element.classList.add('is-error');
    window.clearTimeout(previewClearId);
    previewClearId = window.setTimeout(() => { element.textContent = ''; element.classList.remove('is-error'); }, DM.TEXT.preview.clearMs);
  }

  // Kinukuha ang laman ng pinakabagong file: Sender = <Saving path> ngayong araw; LEAD PC = <Server path>. Ibinibigay { details } o { message }.
  async function loadPreviewDetails(machineName, isSender) {
    const panelText = TEXT.panel;
    if (!root.storage.isFolderAccessSupported()) return { message: DM.TEXT.preview.error.unsupported };
    if (isSender) {
      const rootHandle = await root.storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle || !(await root.storage.hasPermission(rootHandle, true))) return { message: panelText.noRoot };
      // Folder ng ngayon muna; kung wala, folder ng kahapon (Night shift na tumawid ng hatinggabi), kapareho ng tile ng Dashboard.
      const details = (await root.repeatabilityReader.readInSavingPath(rootHandle, root.csv.formatDateInput(new Date())))
        || (await root.repeatabilityReader.readInSavingPath(rootHandle, root.csv.formatDateInput(new Date(Date.now() - 86400000))));
      return details ? { details } : { message: getIssueText(machineName, true) || panelText.noFileSender };
    }
    const found = await root.queue.findServerHandle(true);
    if (found.state !== CONFIG.QUEUE.CONNECTION.ok) return { message: DM.TEXT.preview.error[found.state] || DM.TEXT.preview.error.error };
    const details = await root.repeatabilityReader.readForMachine(found.handle, machineName);
    return details ? { details } : { message: getIssueText(machineName, false) || panelText.noFileLead };
  }

  // Pahina ng Preview tab: status, buod, chart (mula sa sheet na Readings) at laman ng sheet.
  function buildPage(details, machineName) {
    const stats = TEXT.panel.stats;
    const sync = root.correlSyncConfig;
    const scoreText = typeof details.score === 'number' ? details.score.toFixed(TILE.SCORE_DIGITS) : '-';
    return {
      title: TEXT.panel.title + machineName,
      status: { text: details.status || '-', icon: DM.TEXT.correl.icon[details.status] || '', className: (sync && sync.STATUS_CLASS[details.status]) || '' },
      statList: [
        [stats.score, scoreText],
        [stats.averageDifference, typeof details.averageDifference === 'number' ? String(details.averageDifference) : '-'],
        [stats.maxDifference, typeof details.maxDifference === 'number' ? String(details.maxDifference) : '-'],
        [stats.worst, details.worst || '-'],
        [stats.records, details.records || '-'],
        [stats.range, details.range || '-'],
        [stats.mode, details.mode || '-'],
        [stats.exportedAt, details.exportedAt || '-'],
        [stats.file, details.fileName]
      ],
      chartBox: buildChart(details, machineName),
      grid: details.grid,
      fileName: details.fileName,
      modifiedMs: details.modifiedMs
    };
  }

  // Click ng Preview: bagong tab (binubuksan agad sa click, bago ang anumang await).
  function openPreview(machineName, isSender) {
    return root.previewTab.open({
      title: TEXT.panel.title + machineName,
      load: () => loadPreviewDetails(machineName, isSender),
      buildPage: (details) => buildPage(details, machineName),
      onBlocked: showBlocked
    });
  }

  // Button ng Preview.
  function buildPreviewButton(machineName, isSender) {
    const button = createElementWith('button', CLASS.previewButton, TEXT.previewButton);
    button.type = 'button';
    button.setAttribute('aria-label', TEXT.previewAria + machineName);
    button.addEventListener('click', () => openPreview(machineName, isSender));
    return button;
  }

  // Block ng Master Repeatability sa tile: status (icon at text, hindi lang kulay), Repeatability %, Worst slider, Range at kailan nabago ang file.
  function buildBlock(details, nowMs, machineName, isSender) {
    const sync = root.correlSyncConfig;
    const row = createElementWith('div', CLASS.row);
    row.append(createElementWith('span', CLASS.label, TEXT.label));
    if (!details || !sync) {
      row.append(createElementWith('span', CLASS.empty, TEXT.none));
      const emptyBox = createElementWith('div', CLASS.box + ' ' + CLASS.none);
      emptyBox.append(row);
      const issueText = getIssueText(machineName, isSender);
      if (issueText) emptyBox.append(createElementWith('p', CLASS.meta, issueText));
      return emptyBox;
    }
    const box = createElementWith('div', CLASS.box + ' ' + (sync.STATUS_CLASS[details.status] || ''));
    const badge = createElementWith('span', CLASS.badge);
    badge.append(createElementWith('span', CLASS.icon, DM.TEXT.correl.icon[details.status] || ''), createElementWith('span', '', details.status));
    row.append(badge);
    if (details.modifiedMs && nowMs - details.modifiedMs > sync.STALE_MS) row.append(createElementWith('span', CLASS.tag, TEXT.stale));
    row.append(buildPreviewButton(machineName, isSender));
    const scoreText = typeof details.score === 'number' ? details.score.toFixed(TILE.SCORE_DIGITS) + '%' : '-';
    const metaText = [TEXT.score + scoreText, TEXT.worst + (details.worst || '-'), TEXT.range + (details.range || '-'), TEXT.updated + (details.modifiedMs ? new Date(details.modifiedMs).toLocaleString() : '-')].join(' | ');
    box.append(row, createElementWith('p', CLASS.meta, metaText));
    return box;
  }

  // LEAD PC: binabasa ang pinakabagong Excel ng bawat machine at inilalagay sa item.repeatability (null kung wala). Hindi nagtatapon ng error.
  async function attachToItems(serverHandle, machineItemList) {
    if (!serverHandle || !root.repeatabilityReader) return;
    await Promise.all(machineItemList.map(async (item) => {
      item.repeatability = await root.repeatabilityReader.readForMachine(serverHandle, item.machineName);
    }));
  }

  root.repeatabilityTile = Object.freeze({ buildBlock, attachToItems, openPreview });
})();
