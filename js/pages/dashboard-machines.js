/*
 * FILE    : js/pages/dashboard-machines.js
 * PURPOSE : Dashboard: role badge (LEAD PC = monitor only, MACHINE = sender), at listahan ng machine na nagpapadala (LEAD PC)
 *           o status ng sariling Data source (machine)
 * DEPENDS : js/core/preview-tab.js, js/core/trend-tile.js (kung naka-load), js/core/preview-chart.js, js/core/chart-draw.js, js/core/correl-excel-reader.js, js/core/dashboard-machines-config.js, js/core/config.js, js/core/storage.js, js/core/queue.js, js/core/monitor.js, js/core/compare-sync.js, js/core/correl-sync.js, js/core/correl-preview.js, js/core/calibration-tile.js, js/core/dashboard-options.js (kung naka-load)
 * INPUT   : localStorage settings (machine name/mode), queue snapshot sa Server path (LEAD PC), monitor.getState (machine)
 * OUTPUT  : mga elemento sa #dm-section at #dm-role (textContent lang, walang innerHTML)
 * VERSION : v12 | 2026-11-22 | Task 1: tile ng Sender at LEAD PC: Master Correl, Calibration Correl (bago), Worst slider (nasa itaas na ng Trend), Trend; ang Master Repeatability at Calibration Repeatability ay opsyonal na (checkbox sa #dm-options, default OFF; dashboard-options.js). Slot ng Master Unit Correl (future upgrade) ay nasa pagitan ng Calibration Correl at Worst slider. Bago: buildCalibrationBlock, isOptionShown, mountOptions
 * VERSION : v11 | 2026-11-22 | Task 1: OUTDATED badge sa bawat block (Correl, Repeatability, Trend, Compare) kapag galing sa nakaraang shift (withFreshness, shift-freshness.js); kusang refresh kapag nagpalit ng shift (stopShiftWatch); kapag walang file sa folder ng ngayon, tinitingnan din ang folder ng kahapon (readWithYesterday)
 * VERSION : v9.4 | 2026-11-22 | Trend block sa tile (buildTrendBlock; LEAD PC: item.trend galing sa Server path; Sender: ownTrend galing sa Saving path); ang tile at Preview ay nasa js/core/trend-tile.js
 * VERSION : v8.13 | 2026-11-21 | FAIL ng Master Repeatability: naka-highlight ang tile (dm-tile-alert), chip na Repeatability fail sa buod, at nauuna sa pagkakasunod (hasRepeatabilityFail)
 * VERSION : v8.12 | 2026-11-21 | Master Repeatability sa tile: LEAD PC (renderLead: attachToItems, buildMachineTile) at Sender (ownRepeatability sa readOwnCorrel at renderSender); ang tile at Preview ay nasa js/core/repeatability-tile.js
 * VERSION : v8.10 | 2026-11-21 | LEAD PC: may Preview na rin ang worst slider sa tile ng machine; binabasa ang Master Compare Excel sa <Server path>\\master-compare\\<machine> (loadCompareDetails ay may LEAD PC branch)
 * VERSION : v8.9 | 2026-11-21 | Preview ay bagong tab (previewTab.open) na nagpapakita ng buod, chart at laman ng Excel; inalis ang popup, handleExplorerClick, buildCorrelTable, buildCompareTable, fillPreviewBody, fillCompareBody; dagdag na buildCorrelPage, buildComparePage
 * VERSION : v8.8 | 2026-11-21 | Preview: malaking panel na may chart (Master Correl) at Preview ng worst slider ng sariling machine (Compare); panel ay galing na sa preview-panel.js; inalis ang closePreviewPanel at buildPreviewTable
 * VERSION : v7.8 | 2026-11-21 | itinatago ang stale at hindi naka-register na machine (lumang pangalan); buod ay kinukuwenta ulit
 * VERSION : v7.7 | 2026-11-21 | ipinapakita sa #dm-message ang dahilan kung bakit hindi nabasa ang Master Correl Excel ng machine
 * VERSION : v8.7 | 2026-11-21 | Preview: maliit na panel (popout) na may laman ng pinakabagong Master Correl file (buod at table); Sender = Saving path, LEAD PC = Server path; may button na Buksan sa File Explorer sa loob ng panel
 * VERSION : v8.6 | 2026-11-21 | Sender: ipinapakita sa sariling tile ang resulta ng Compare sliders (worst slider) mula sa pinakabagong Excel sa <Saving path>\\master-compare\\<petsa ngayon>; binabasa kada refresh (ownCompare)
 * VERSION : v8.4 | 2026-11-21 | Sender: binabasa ang Saving path kada refresh at BAGO mag-render (readOwnCorrel); hiwalay at hindi hinihintay ang pagpapadala sa Server (publishOwnCorrel); inalis ang rereadOwnCorrel
 * VERSION : v8.3 | 2026-11-21 | Sender: itinatago ang "Walang Data source folder" kapag nababasa na ang Master Correl sa Saving path (renderSender)
 * VERSION : v8.2 | 2026-11-21 | Sender: ipinapakita sa sariling tile ang Master Correl (Status, R Square, Record) ng pinakabagong file sa Saving path ngayong araw; binabasa kada refresh
 * VERSION : v8.1 | 2026-11-21 | rereadOwnCorrel: Sender ay binabasa ang <Saving path>\\master-correl\\<petsa ngayon> (pinakabagong file) sa halip na i-analyze ang Data source 1
 * VERSION : v7.6 | 2026-11-21 | LEAD PC: tuwing refresh, binabasa ang pinakabagong Excel sa <Server path>\master-correl\<machine>\<petsa>\ (Status, R Square, Record) at ito ang ginagamit kapag mas bago kaysa sa correl\<machine>.json
 * VERSION : v7.5 | 2026-11-21 | Tuwing refresh ng page, binabasa ulit ng machine ang pinakabagong Master Correl (source1) at ipinapadala ang status sa Server path
 * VERSION : v7.4 | 2026-11-21 | Preview button sa Master Correl ng tile: binubuksan sa Windows (File Explorer) ang pinakabagong Master Correl file ng machine
 * VERSION : v7.3 | 2026-11-21 | status ng Master Correl ng machine (<Server path>\correl): badge na PASS / WARNING / FAIL sa tile, chip na Correl fail, FAIL ay nauuna sa listahan
 * VERSION : v6 | 2026-11-21 | Task 1D: bagong file
 * VERSION : v7 | 2026-11-21 | worst slider ng machine (<Server path>\compare): alert sa tile, chip, at listahan ng slider (actual at master)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const DM = root.dashboardMachinesConfig;
  const SEL = DM.SELECTOR;
  const TEXT = DM.TEXT;
  const QUEUE = CONFIG.QUEUE;
  const MONITOR = CONFIG.MONITOR;
  let timerId = null;
  let isBusy = false;
  let previewClearId = null;
  let stopShiftWatch = null;

  // Gumagawa ng elemento na may class at text (textContent lang, ligtas sa XSS).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
  }

  // Nilalagyan ng OUTDATED badge ang block kapag ang data (modifiedMs) ay galing sa nakaraang shift. Walang epekto kung hindi nai-load ang shift-freshness.js.
  function withFreshness(block, dataMs, nowMs) {
    return root.shiftFreshness ? root.shiftFreshness.mark(block, dataMs, nowMs) : block;
  }

  // Petsa (yyyy-mm-dd) ng kahapon; para sa Night shift na tumawid ng hatinggabi.
  function getYesterdayName() {
    return root.csv.formatDateInput(new Date(Date.now() - 86400000));
  }

  // Tinatawag ang reader gamit ang petsa ngayon; kung walang nabasa, subukan ang petsa ng kahapon. Ibinibigay ang unang may laman (o null).
  async function readWithYesterday(reader) {
    const today = await reader(root.csv.formatDateInput(new Date()));
    return today || reader(getYesterdayName());
  }

  // Hinahanap ang elemento ng page; null kung wala na ang page.
  function query(selector) {
    return document.querySelector(selector);
  }

  // Role ng PC ayon sa naka-save na settings.
  function getRole(settings) {
    if (settings.machineMode === CONFIG.MACHINE_MODE.LEAD_PC) return DM.ROLE.lead;
    if (settings.machineMode === CONFIG.MACHINE_MODE.USER_INPUT && settings.machineName) return DM.ROLE.sender;
    return DM.ROLE.unset;
  }

  // "12s ago" mula sa oras (ms); "wala pa" kung walang oras.
  function formatAgo(timeMs, nowMs) {
    if (!timeMs) return TEXT.never;
    const seconds = Math.max(0, Math.round((nowMs - timeMs) / 1000));
    if (seconds < 5) return TEXT.justNow;
    if (seconds < 60) return seconds + TEXT.agoSecond;
    if (seconds < 3600) return Math.floor(seconds / 60) + TEXT.agoMinute;
    return Math.floor(seconds / 3600) + TEXT.agoHour;
  }

  // Badge ng role (icon + label + note) para madaling makilala kahit hindi kulay ang tinitingnan.
  function buildRoleBadge(role) {
    const badge = createElementWith('span', 'dm-role-badge dm-role-' + role.key);
    badge.append(createElementWith('span', 'dm-role-icon', role.icon), createElementWith('span', 'dm-role-label', role.label));
    if (role.note) badge.append(createElementWith('span', 'dm-role-note', role.note));
    return badge;
  }

  // Maliit na chip na may label at bilang.
  function buildChip(label, count, extraClass) {
    const chip = createElementWith('li', 'dm-chip' + (extraClass ? ' ' + extraClass : ''));
    chip.append(createElementWith('span', 'dm-chip-count', String(count)), createElementWith('span', 'dm-chip-label', label));
    return chip;
  }

  // Buod ng mga machine sa taas ng listahan.
  function renderSummary(summary, alertCount, correlFailCount, repeatabilityFailCount) {
    const list = createElementWith('ul', 'dm-chip-list');
    const labels = TEXT.summary;
    list.append(
      buildChip(labels.total, summary.total),
      buildChip(labels.active, summary.active, 'dm-chip-active'),
      buildChip(labels.ongoing, summary.ongoing, 'dm-chip-ongoing'),
      buildChip(labels.done, summary.done),
      buildChip(labels.stale, summary.stale, 'dm-chip-stale'),
      buildChip(labels.noStatus, summary.noStatus),
      buildChip(labels.worstSlider, alertCount, 'dm-chip-alert'),
      buildChip(labels.correlFail, correlFailCount, 'dm-chip-correl-fail'),
      buildChip(labels.repeatabilityFail, repeatabilityFailCount, 'dm-chip-correl-fail')
    );
    query(SEL.summary).replaceChildren(list);
  }

  // Wafer / blk / layer bilang isang linya (walang laman kung wala).
  function formatLot(wafer, blk, layer) {
    const parts = [];
    if (wafer) parts.push('Wafer ' + wafer);
    if (blk) parts.push('Blk ' + blk);
    if (layer) parts.push('Layer ' + layer);
    return parts.join(' | ');
  }

  // May na-detect bang worst slider ang machine (galing sa compare file)?
  function hasAlert(item) {
    return Boolean(item.compare && item.compare.status.detected && item.compare.status.worst);
  }

  // FAIL ba ang huling Master Correl ng machine (galing sa <Server path>\correl)?
  function hasCorrelFail(item) {
    return Boolean(item.correl) && item.correl.status.status === CONFIG.MASTER.STATUS.fail;
  }

  // FAIL ba ang huling Master Repeatability ng machine (galing sa Excel sa <Server path>\\master-repeatability)?
  function hasRepeatabilityFail(item) {
    return isOptionShown('masterRepeatability') && Boolean(item.repeatability) && item.repeatability.status === CONFIG.MASTER.STATUS.fail;
  }

  // Ranggo ng machine item para sa pagkakasunod (alert, Correl FAIL o Repeatability FAIL muna, tapos ongoing; no status sa huli).
  function getRank(item) {
    if (hasAlert(item) || hasCorrelFail(item) || hasRepeatabilityFail(item)) return DM.RANK.alert;
    if (item.presence === QUEUE.PRESENCE.stale) return DM.RANK.stale;
    if (item.presence === QUEUE.PRESENCE.noStatus || !item.status) return DM.RANK.noStatus;
    return DM.RANK[item.status.state] === undefined ? DM.RANK.idle : DM.RANK[item.status.state];
  }

  // Inaayos ang listahan: ayon sa ranggo, tapos sa pangalan (natural sort).
  function sortItems(itemList) {
    return [...itemList].sort((first, second) => {
      const difference = getRank(first) - getRank(second);
      if (difference !== 0) return difference;
      return first.machineName.localeCompare(second.machineName, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  // Numero sa tatlong decimal; '-' kung wala.
  function formatReading(value) {
    return typeof value === 'number' ? value.toFixed(DM.COMPARE.DIGITS) : '-';
  }

  // Numero na may sign (+0.250); '-' kung wala.
  function formatSignedReading(value) {
    if (typeof value !== 'number') return '-';
    return (value > 0 ? '+' : '') + value.toFixed(DM.COMPARE.DIGITS);
  }

  // Basa ng compare status ng lahat ng machine mula sa Server path; walang laman na Map kung pumalya.
  async function readCompareMap(serverHandle) {
    const compareMap = new Map();
    if (!root.compareSync || !serverHandle) return compareMap;
    try {
      const list = await root.compareSync.readCompareList(serverHandle);
      list.forEach((item) => compareMap.set(item.status.machineName.toLowerCase(), item));
    } catch (error) {
      // hindi mabasa ang compare folder: ituloy ang listahan ng machine nang walang alert
    }
    return compareMap;
  }

  // Basa ng status ng Master Correl ng lahat ng machine mula sa Server path; walang laman na Map kung pumalya.
  async function readCorrelMap(serverHandle) {
    const correlMap = new Map();
    if (!root.correlSync || !serverHandle) return correlMap;
    try {
      const list = await root.correlSync.readCorrelList(serverHandle);
      list.forEach((item) => correlMap.set(item.status.machineName.toLowerCase(), item));
    } catch (error) {
      // hindi mabasa ang correl folder: ituloy ang listahan nang walang badge
    }
    return correlMap;
  }

  // Basa ng pinakabagong Excel ng bawat machine sa <Server path>\\master-correl\\<machine>\\<petsa>\\; ginagamit kapag mas bago ito kaysa sa correl\\<machine>.json.
  async function applyLatestCorrelExcel(serverHandle, machineItemList) {
    const issueList = [];
    if (!root.correlExcelReader || !serverHandle) return issueList;
    let correlFolder;
    try {
      correlFolder = await serverHandle.getDirectoryHandle(root.correlConfig.SERVER.SUBFOLDER);
    } catch (error) {
      return issueList;
    }
    await Promise.all(machineItemList.map(async (item) => {
      const excelItem = await root.correlExcelReader.readLatestForMachine(correlFolder, item.machineName);
      if (excelItem && (!item.correl || excelItem.modifiedMs > item.correl.modifiedMs)) item.correl = excelItem;
      const issue = excelItem ? null : root.correlExcelReader.getIssue(item.machineName);
      if (issue && !item.correl) {
        const detail = issue.code === 'noFolder' && !issue.detail ? TEXT.excelIssue.none : issue.detail;
        issueList.push((TEXT.excelIssue[issue.code] || TEXT.excelIssue.error).replace('{machine}', item.machineName).replace('{detail}', detail));
      }
    }));
    return issueList;
  }

  // Maliit na table ng mga slider na kailangang tingnan: Actual at Master (previous > today), Diff, Trend.
  function buildSliderTable(sliderList) {
    const text = TEXT.compare;
    const compareConfig = root.compareConfig;
    const wrap = createElementWith('div', 'dm-table-wrap');
    const table = createElementWith('table', 'dm-table');
    const headRow = document.createElement('tr');
    text.columns.forEach((column) => headRow.append(createElementWith('th', '', column)));
    const head = document.createElement('thead');
    head.append(headRow);
    const body = document.createElement('tbody');
    sliderList.forEach((slider) => {
      const row = document.createElement('tr');
      const trend = compareConfig ? compareConfig.TREND_SYMBOL[slider.trend] + ' ' + compareConfig.TREND_TEXT[slider.trend] : '';
      const levelClass = DM.COMPARE.LEVEL_CLASS[slider.level] || '';
      [
        slider.barcode,
        formatReading(slider.previousActual) + text.arrow + formatReading(slider.currentActual),
        formatReading(slider.previousMaster) + text.arrow + formatReading(slider.currentMaster),
        formatReading(slider.currentDifference),
        trend
      ].forEach((value, index) => row.append(createElementWith('td', index === 3 ? levelClass : '', value)));
      body.append(row);
    });
    table.append(head, body);
    wrap.append(table);
    return wrap;
  }

  // Alert ng worst slider sa tile ng machine: actual at master (previous at today), at listahan ng slider. previewMachineName (opsyonal) = may Preview button (Sender at LEAD PC).
  function buildAlertBlock(compareItem, nowMs, previewMachineName) {
    const text = TEXT.compare;
    const status = compareItem.status;
    const worst = status.worst;
    const box = createElementWith('div', 'dm-alert ' + (DM.COMPARE.LEVEL_CLASS[worst.level] || ''));
    const title = createElementWith('p', 'dm-alert-title', text.title.replace('{barcode}', worst.barcode));
    const levelText = DM.COMPARE.LEVEL_TEXT[worst.level];
    if (levelText) title.append(createElementWith('span', 'dm-alert-level', levelText));
    // Preview: Sender = Excel sa Saving path; LEAD PC = Excel ng machine sa Server path.
    if (previewMachineName) title.append(buildComparePreviewButton(previewMachineName));
    const updatedMs = compareItem.modifiedMs || Date.parse(status.updatedAt);
    if (updatedMs && nowMs - updatedMs > DM.COMPARE.STALE_MS) title.append(createElementWith('span', 'dm-tag', text.stale));
    box.append(title);
    box.append(createElementWith('p', 'dm-alert-line', text.today.replace('{actual}', formatReading(worst.currentActual)).replace('{master}', formatReading(worst.currentMaster)).replace('{diff}', formatReading(worst.currentDifference))));
    if (status.hasPrevious && worst.previousDifference !== null) {
      box.append(createElementWith('p', 'dm-alert-line', text.previous.replace('{actual}', formatReading(worst.previousActual)).replace('{master}', formatReading(worst.previousMaster)).replace('{diff}', formatReading(worst.previousDifference)).replace('{change}', formatSignedReading(worst.change))));
    } else {
      box.append(createElementWith('p', 'dm-alert-line', text.noPrevious));
    }
    const recordMs = Date.parse(status.recordDate);
    box.append(createElementWith('p', 'card-note dm-alert-meta', text.record + (recordMs ? new Date(recordMs).toLocaleDateString() : '-') + ' | ' + text.sent + formatAgo(updatedMs, nowMs)));
    if (status.sliderList.length > 0) {
      const details = createElementWith('details', 'dm-details');
      details.append(createElementWith('summary', '', text.detailsSummary.replace('{n}', String(status.sliderList.length))), buildSliderTable(status.sliderList));
      box.append(details);
    }
    return withFreshness(box, updatedMs, nowMs);
  }

  // Mensahe ng Preview sa #dm-preview-status (hindi ito binubura ng refresh); kusang nawawala pagkalipas ng ilang segundo.
  function setPreviewStatus(message, isError) {
    const element = query(SEL.previewStatus);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', Boolean(isError));
    window.clearTimeout(previewClearId);
    if (message) previewClearId = window.setTimeout(() => setPreviewStatus('', false), TEXT.preview.clearMs);
  }

  // ----- Preview: bagong tab na nagpapakita ng laman ng Excel file na nabasa (ang tab ay nasa js/core/preview-tab.js) -----

  // Pahina ng Master Correl para sa tab: status, buod, chart at grid ng sheet.
  function buildCorrelPage(details, machineName) {
    const panelText = TEXT.preview.panel;
    const stats = panelText.stats;
    const sync = root.correlSyncConfig;
    return {
      title: panelText.title + machineName,
      status: { text: details.status || '-', icon: TEXT.correl.icon[details.status] || '', className: (sync && sync.STATUS_CLASS[details.status]) || '' },
      statList: [
        [stats.rSquared, typeof details.rSquared === 'number' ? details.rSquared.toFixed(4) : '-'],
        [stats.record, details.recordDate || '-'],
        [stats.actualAverage, details.actualAverage || '-'],
        [stats.masterAverage, details.masterAverage || '-'],
        [stats.worst, details.worst || '-'],
        [stats.file, details.fileName]
      ],
      chartBox: root.previewChart.buildCorrelChart(details, machineName),
      grid: details.grid,
      fileName: details.fileName,
      modifiedMs: details.modifiedMs
    };
  }

  // Kinukuha ang laman ng pinakabagong Master Correl file: Sender = <Saving path> ngayong araw; LEAD PC = <Server path>\\master-correl\\<machine>. Ibinibigay { details } o { message }.
  async function loadPreviewDetails(machineName) {
    const panelText = TEXT.preview.panel;
    if (!root.correlExcelReader || !root.storage.isFolderAccessSupported()) return { message: TEXT.preview.error.unsupported };
    const settings = root.storage.readLocalSettings();
    if (getRole(settings).key === DM.ROLE.sender.key) {
      const rootHandle = await root.storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle || !(await root.storage.hasPermission(rootHandle, true))) return { message: panelText.noRoot };
      const details = await readWithYesterday((dayName) => root.correlExcelReader.readLatestDetailsInSavingPath(rootHandle, machineName, dayName));
      return details ? { details } : { message: panelText.noFileSender };
    }
    const found = await root.queue.findServerHandle(true);
    if (found.state !== QUEUE.CONNECTION.ok) return { message: TEXT.preview.error[found.state] || TEXT.preview.error.error };
    let correlFolder;
    try {
      correlFolder = await found.handle.getDirectoryHandle(root.correlConfig.SERVER.SUBFOLDER);
    } catch (error) {
      return { message: panelText.noFileLead };
    }
    const details = await root.correlExcelReader.readLatestDetailsForMachine(correlFolder, machineName);
    return details ? { details } : { message: panelText.noFileLead };
  }

  // Click ng Preview ng Master Correl: bagong tab (binubuksan agad sa click) na nagpapakita ng pinakabagong Master Correl file.
  function handlePreviewClick(machineName) {
    return root.previewTab.open({
      title: TEXT.preview.panel.title + machineName,
      load: () => loadPreviewDetails(machineName),
      buildPage: (details) => buildCorrelPage(details, machineName),
      onBlocked: () => setPreviewStatus(TEXT.preview.tab.blocked, true)
    });
  }

  // Kinukuha ang laman ng pinakabagong Master Compare file: Sender = <Saving path> ngayong araw; LEAD PC = <Server path>\\master-compare\\<machine>. Ibinibigay { details } o { message }.
  async function loadCompareDetails(machineName) {
    const compareText = TEXT.preview.panel.compare;
    if (!root.correlExcelReader || !root.storage.isFolderAccessSupported()) return { message: TEXT.preview.error.unsupported };
    if (getRole(root.storage.readLocalSettings()).key !== DM.ROLE.sender.key) {
      const found = await root.queue.findServerHandle(true);
      if (found.state !== QUEUE.CONNECTION.ok) return { message: TEXT.preview.error[found.state] || TEXT.preview.error.error };
      let compareFolder;
      try {
        compareFolder = await found.handle.getDirectoryHandle(root.compareConfig.SERVER.SUBFOLDER);
      } catch (error) {
        return { message: compareText.noFileLead };
      }
      const leadDetails = await root.correlExcelReader.readLatestCompareDetailsForMachine(compareFolder, machineName);
      return leadDetails ? { details: leadDetails } : { message: compareText.noFileLead };
    }
    const rootHandle = await root.storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    if (!rootHandle || !(await root.storage.hasPermission(rootHandle, true))) return { message: compareText.noRoot };
    const details = await readWithYesterday((dayName) => root.correlExcelReader.readLatestCompareDetailsInSavingPath(rootHandle, machineName, dayName));
    return details ? { details } : { message: compareText.noFileSender };
  }

  // Pahina ng Compare para sa tab: worst slider, buod, chart at grid ng sheet.
  function buildComparePage(details, machineName) {
    const compareText = TEXT.preview.panel.compare;
    const stats = compareText.stats;
    const worst = details.worst;
    return {
      title: compareText.title + machineName,
      status: { text: worst.barcode + (DM.COMPARE.LEVEL_TEXT[worst.level] ? ' ' + DM.COMPARE.LEVEL_TEXT[worst.level] : ''), icon: '', className: DM.PREVIEW_TAB.LEVEL_BADGE[worst.level] || '' },
      statList: [
        [stats.worst, worst.barcode + ' (' + formatReading(worst.currentDifference) + ')'],
        [stats.today, details.todayDate || '-'],
        [stats.previous, details.previousDate || '-'],
        [stats.rSquaredToday, details.rSquaredToday || '-'],
        [stats.rSquaredPrevious, details.rSquaredPrevious || '-'],
        [stats.todayFile, details.todayFile || '-'],
        [stats.previousFile, details.previousFile || '-'],
        [stats.file, details.fileName]
      ],
      chartBox: root.previewChart.buildCompareChart(details, machineName),
      grid: details.grid,
      fileName: details.fileName,
      modifiedMs: details.modifiedMs
    };
  }

  // Click ng Preview ng worst slider: parehong tab ng Master Correl, laman ay galing sa Master Compare Excel.
  function handleComparePreviewClick(machineName) {
    return root.previewTab.open({
      title: TEXT.preview.panel.compare.title + machineName,
      load: () => loadCompareDetails(machineName),
      buildPage: (details) => buildComparePage(details, machineName),
      onBlocked: () => setPreviewStatus(TEXT.preview.tab.blocked, true)
    });
  }

  // Preview button ng worst slider (sariling tile ng machine lang).
  function buildComparePreviewButton(machineName) {
    const button = createElementWith('button', 'btn btn-secondary dm-preview-button', TEXT.compare.preview);
    button.type = 'button';
    button.setAttribute('aria-label', TEXT.compare.previewAria + machineName);
    button.addEventListener('click', () => handleComparePreviewClick(machineName));
    return button;
  }

  // Preview button ng Master Correl ng isang machine (text at aria-label, hindi icon lang).
  function buildPreviewButton(machineName) {
    const button = createElementWith('button', 'btn btn-secondary dm-preview-button', TEXT.preview.button);
    button.type = 'button';
    button.setAttribute('aria-label', TEXT.preview.aria + machineName);
    button.addEventListener('click', () => handlePreviewClick(machineName));
    return button;
  }

  // Status ng Master Correl sa tile: PASS / WARNING / FAIL (may icon at text, hindi lang kulay), R Square, petsa ng record at kailan naipadala.
  function buildCorrelBlock(correlItem, nowMs) {
    const text = TEXT.correl;
    const sync = root.correlSyncConfig;
    const row = createElementWith('div', 'dm-correl-row');
    row.append(createElementWith('span', 'dm-correl-label', text.label));
    if (!correlItem || !sync) {
      row.append(createElementWith('span', 'dm-correl-empty', text.none));
      const emptyBox = createElementWith('div', 'dm-correl dm-correl-none');
      emptyBox.append(row);
      return emptyBox;
    }
    const status = correlItem.status;
    const box = createElementWith('div', 'dm-correl ' + (sync.STATUS_CLASS[status.status] || ''));
    const badge = createElementWith('span', 'dm-correl-badge');
    badge.append(createElementWith('span', 'dm-correl-icon', text.icon[status.status] || ''), createElementWith('span', '', status.status));
    row.append(badge);
    const updatedMs = correlItem.modifiedMs || Date.parse(status.updatedAt);
    if (updatedMs && nowMs - updatedMs > sync.STALE_MS) row.append(createElementWith('span', 'dm-tag', text.stale));
    row.append(buildPreviewButton(status.machineName));
    const recordMs = Date.parse(status.recordDate);
    const rSquared = typeof status.rSquared === 'number' ? status.rSquared.toFixed(sync.R_SQUARED_DIGITS) : '-';
    box.append(row, createElementWith('p', 'card-note dm-correl-meta', text.rSquared + rSquared + ' | ' + text.record + (recordMs ? new Date(recordMs).toLocaleDateString() : '-') + ' | ' + text.sent + formatAgo(updatedMs, nowMs)));
    return withFreshness(box, updatedMs, nowMs);
  }

  // Block ng Trend (picture, UPDATED, Preview) sa tile; ang gawa ay nasa js/core/trend-tile.js. Walang laman na block kung hindi nai-load ang module.
  function buildTrendBlock(trendInfo, machineName) {
    return root.trendTile ? root.trendTile.buildBlock(trendInfo, machineName) : document.createDocumentFragment();
  }

  // Block ng Calibration Correl o Calibration Repeatability (kind = 'correl' | 'repeatability'); ang gawa ay nasa js/core/calibration-tile.js. Walang laman kung hindi nai-load ang module.
  function buildCalibrationBlock(kind, details, nowMs, machineName, isSender) {
    if (!root.calibrationTile) return document.createDocumentFragment();
    return withFreshness(root.calibrationTile.buildBlock(kind, details || null, nowMs, machineName, isSender), details && details.modifiedMs, nowMs);
  }

  // Ipinapakita ba ang opsyonal na block (field: masterRepeatability | calibrationRepeatability)? Default OFF kapag wala ang dashboard-options.js.
  function isOptionShown(field) {
    return Boolean(root.dashboardOptions) && root.dashboardOptions.get()[field] === true;
  }

  // Mga block ng tile sa iisang pagkakasunod (Sender at LEAD PC): Master Correl, Calibration Correl, [Master Unit Correl: future upgrade], Worst slider, Trend, tapos ang opsyonal na Master Repeatability at Calibration Repeatability.
  function buildTileBlocks(data, nowMs, machineName, isSender) {
    const blockList = [buildCorrelBlock(data.correl, nowMs), buildCalibrationBlock('correl', data.calibrationCorrel, nowMs, machineName, isSender)];
    // Dito ilalagay ang Master Unit Correl (future upgrade).
    if (data.compare && data.compare.status.detected && data.compare.status.worst) blockList.push(buildAlertBlock(data.compare, nowMs, machineName));
    blockList.push(withFreshness(buildTrendBlock(data.trend || null, machineName), data.trend && data.trend.modifiedMs, nowMs));
    if (isOptionShown('masterRepeatability')) blockList.push(withFreshness(root.repeatabilityTile.buildBlock(data.repeatability || null, nowMs, machineName, isSender), data.repeatability && data.repeatability.modifiedMs, nowMs));
    if (isOptionShown('calibrationRepeatability')) blockList.push(buildCalibrationBlock('repeatability', data.calibrationRepeatability, nowMs, machineName, isSender));
    return blockList;
  }

  // Tile ng isang machine sa LEAD PC view.
  function buildMachineTile(item, nowMs) {
    const tile = createElementWith('article', DM.CLASS.tile + ' ' + DM.CLASS.tileRole.sender + ' ' + DM.CLASS.presence[item.presence] + (hasAlert(item) || hasCorrelFail(item) || hasRepeatabilityFail(item) ? ' dm-tile-alert' : ''));
    const head = createElementWith('div', 'dm-tile-head');
    head.append(createElementWith('h3', 'dm-tile-name', item.machineName), buildRoleBadge(DM.ROLE.sender));
    tile.append(head, ...buildTileBlocks(item, nowMs, item.machineName, false));

    const presenceRow = createElementWith('p', 'dm-presence');
    presenceRow.append(createElementWith('span', 'dm-dot'), createElementWith('span', 'dm-presence-label', DM.LABEL.presence[item.presence]));
    if (!item.registered) presenceRow.append(createElementWith('span', 'dm-tag', TEXT.notRegistered));
    tile.append(presenceRow);

    const status = item.status;
    if (status && item.presence === QUEUE.PRESENCE.active) {
      const stateRow = createElementWith('p', 'dm-state-row');
      stateRow.append(createElementWith('span', 'dm-state ' + (DM.CLASS.state[status.state] || ''), DM.LABEL.state[status.state] || status.state));
      const modeLabel = DM.LABEL.mode[status.mode];
      if (modeLabel) stateRow.append(createElementWith('span', 'dm-tag', modeLabel));
      tile.append(stateRow);
      const lot = formatLot(status.wafer, status.blk, status.layer);
      if (lot) tile.append(createElementWith('p', 'dm-lot', lot));
      tile.append(createElementWith('p', 'dm-file', status.fileName || TEXT.noFile));
    }
    tile.append(createElementWith('p', 'card-note dm-ago', formatAgo(item.modifiedMs || (status ? Date.parse(status.updatedAt) : 0), nowMs)));
    return tile;
  }

  // Naka-pin na tile ng LEAD PC (monitor lang, walang dot).
  function buildLeadTile(settings) {
    const tile = createElementWith('article', DM.CLASS.tile + ' ' + DM.CLASS.tileRole.lead);
    const head = createElementWith('div', 'dm-tile-head');
    head.append(createElementWith('h3', 'dm-tile-name', settings.machineName || CONFIG.LEAD_PC_NAME), buildRoleBadge(DM.ROLE.lead));
    tile.append(head, createElementWith('p', 'card-note', TEXT.leadTileNote));
    return tile;
  }

  // Mensahe at button na Payagan ayon sa lagay ng koneksyon o monitor.
  function setMessage(message, canGrant) {
    const messageElement = query(SEL.message);
    const grantButton = query(SEL.grant);
    if (messageElement) messageElement.textContent = message;
    if (grantButton) grantButton.hidden = !canGrant;
  }

  // LEAD PC: binabasa ang queue at ipinapakita ang lahat ng machine.
  async function renderLead(settings, shouldRequest) {
    const nowMs = Date.now();
    const snapshot = await root.queue.loadSnapshot(shouldRequest, nowMs);
    if (!query(SEL.section)) return;
    query(SEL.pinned).replaceChildren(buildLeadTile(settings));
    const grid = query(SEL.grid);
    if (snapshot.state !== QUEUE.CONNECTION.ok) {
      query(SEL.summary).replaceChildren();
      grid.replaceChildren();
      setMessage(TEXT.connection[snapshot.state] || TEXT.connection.error, snapshot.state === QUEUE.CONNECTION.noPermission);
      return;
    }
    if (DM.HIDE_ORPHANS) snapshot.machineItemList = snapshot.machineItemList.filter((item) => item.registered || item.presence !== QUEUE.PRESENCE.stale);
    snapshot.summary = root.queue.summarize(snapshot.machineItemList);
    const compareMap = await readCompareMap(snapshot.handle);
    const correlMap = await readCorrelMap(snapshot.handle);
    if (!query(SEL.section)) return;
    snapshot.machineItemList.forEach((item) => {
      item.compare = compareMap.get(item.machineName.toLowerCase()) || null;
      item.correl = correlMap.get(item.machineName.toLowerCase()) || null;
    });
    const excelIssueList = await applyLatestCorrelExcel(snapshot.handle, snapshot.machineItemList);
    await root.repeatabilityTile.attachToItems(snapshot.handle, snapshot.machineItemList);
    if (root.trendTile) await root.trendTile.attachToItems(snapshot.handle, snapshot.machineItemList);
    if (root.calibrationTile) await root.calibrationTile.attachToItems(snapshot.handle, snapshot.machineItemList, isOptionShown('calibrationRepeatability'));
    if (!query(SEL.section)) return;
    renderSummary(snapshot.summary, snapshot.machineItemList.filter(hasAlert).length, snapshot.machineItemList.filter(hasCorrelFail).length, snapshot.machineItemList.filter(hasRepeatabilityFail).length);
    const sortedList = sortItems(snapshot.machineItemList);
    grid.replaceChildren(...sortedList.map((item) => buildMachineTile(item, nowMs)));
    setMessage(sortedList.length === 0 ? TEXT.emptyGrid : excelIssueList.join(' | '), false);
  }

  // Pinakamahalagang state ng sariling machine: ongoing, kung wala ay done, kung wala ay idle.
  function getOwnOverallState(sourceMap) {
    const stateList = MONITOR.SOURCE_KEYS.map((key) => (sourceMap[key] ? sourceMap[key].state : QUEUE.STATE.idle));
    if (stateList.includes(QUEUE.STATE.ongoing)) return QUEUE.STATE.ongoing;
    if (stateList.includes(QUEUE.STATE.done)) return QUEUE.STATE.done;
    return QUEUE.STATE.idle;
  }

  // Isang hilera ng Data source sa tile ng sariling machine.
  function buildSourceRow(key, source) {
    const row = createElementWith('li', 'dm-source-row');
    row.append(createElementWith('span', 'dm-source-name', DM.LABEL.source[key]));
    if (!source) {
      row.append(createElementWith('span', 'dm-state ' + DM.CLASS.state.idle, DM.LABEL.state.idle));
      return row;
    }
    row.append(createElementWith('span', 'dm-state ' + (DM.CLASS.state[source.state] || ''), DM.LABEL.state[source.state] || source.state));
    const modeLabel = DM.LABEL.mode[source.mode];
    if (modeLabel) row.append(createElementWith('span', 'dm-tag', modeLabel));
    const lot = formatLot(source.wafer, source.blk, source.layer);
    const detail = [lot, source.fileName].filter(Boolean).join(' | ');
    if (detail) row.append(createElementWith('span', 'dm-source-detail', detail));
    return row;
  }

  // Machine (not-LEAD PC): sariling status lang ang ipinapakita.
  function renderSender(settings, shouldRequest) {
    const nowMs = Date.now();
    const monitorState = root.monitor.getState();
    const tile = createElementWith('article', DM.CLASS.tile + ' ' + DM.CLASS.tileRole.sender + ' ' + DM.CLASS.presence.active);
    const head = createElementWith('div', 'dm-tile-head');
    head.append(createElementWith('h3', 'dm-tile-name', settings.machineName), buildRoleBadge(DM.ROLE.sender));
    // Worst slider (Compare vs previous) ng araw na ito, galing sa <Saving path>\\master-compare\\<petsa ngayon>; nasa itaas ng Trend (buildTileBlocks).
    tile.append(head, createElementWith('p', 'card-note', TEXT.senderTileNote), ...buildTileBlocks({ correl: ownCorrel, calibrationCorrel: ownCalibrationCorrel, compare: ownCompare, trend: ownTrend, repeatability: ownRepeatability, calibrationRepeatability: ownCalibrationRepeatability }, nowMs, settings.machineName, true));
    const isRunning = monitorState.state === MONITOR.STATE.running;
    if (isRunning) {
      const overall = getOwnOverallState(monitorState.sources);
      const stateRow = createElementWith('p', 'dm-state-row');
      stateRow.append(createElementWith('span', 'dm-state ' + DM.CLASS.state[overall], DM.LABEL.state[overall]));
      tile.append(stateRow);
      const list = createElementWith('ul', 'dm-source-list');
      MONITOR.SOURCE_KEYS.forEach((key) => list.append(buildSourceRow(key, monitorState.sources[key])));
      tile.append(list);
      tile.append(createElementWith('p', 'card-note dm-ago', TEXT.lastSent + formatAgo(monitorState.lastWriteMs, nowMs)));
    }
    query(SEL.pinned).replaceChildren(tile);
    query(SEL.summary).replaceChildren();
    query(SEL.grid).replaceChildren();
    // Kapag nababasa na ang Master Correl sa Saving path, hindi na kailangan ang paalala tungkol sa Data source folder.
    const hideNoSource = monitorState.state === MONITOR.STATE.noSource && Boolean(ownCorrel);
    const message = hideNoSource ? '' : (TEXT.monitor[monitorState.state] || (monitorState.lastError ? TEXT.monitor.error : ''));
    setMessage(message, monitorState.state === MONITOR.STATE.noPermission);
  }

  // Role ay hindi pa naka-set: gabay lang.
  function renderUnset() {
    query(SEL.pinned).replaceChildren();
    query(SEL.summary).replaceChildren();
    query(SEL.grid).replaceChildren();
    setMessage(TEXT.unsetNote, false);
  }

  // Isang ikot ng refresh; hindi nag-o-overlap.
  async function refresh(shouldRequest) {
    if (isBusy) return;
    if (!query(SEL.section)) {
      stopTimer();
      return;
    }
    isBusy = true;
    try {
      const settings = root.storage.readLocalSettings();
      const role = getRole(settings);
      const roleElement = query(SEL.role);
      if (roleElement) roleElement.replaceChildren(buildRoleBadge(role));
      query(SEL.title).textContent = role.key === DM.ROLE.sender.key ? TEXT.titleSender : TEXT.titleLead;
      if (role.key === DM.ROLE.lead.key) await renderLead(settings, shouldRequest);
      else if (role.key === DM.ROLE.sender.key) {
        await readOwnCorrel(settings);
        renderSender(settings, shouldRequest);
        publishOwnCorrel(settings);
      }
      else renderUnset();
      if (query(SEL.updated)) query(SEL.updated).textContent = TEXT.updatedPrefix + new Date().toLocaleTimeString();
    } catch (error) {
      setMessage(TEXT.connection.error, false);
    } finally {
      isBusy = false;
    }
  }

  // Pinipigil ang timer.
  function stopTimer() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
    if (stopShiftWatch) stopShiftWatch();
    stopShiftWatch = null;
  }

  // Click ng Payagan: humihingi ng permission (LEAD PC: Server folder; machine: simula ulit ng monitor).
  async function handleGrantClick() {
    const settings = root.storage.readLocalSettings();
    if (getRole(settings).key === DM.ROLE.sender.key) await root.monitor.start(true);
    await refresh(true);
  }

  // Machine lang: kada refresh, tinitingnan (Master Correl at Compare) ang <Saving path>\\master-correl\\<petsa ngayon>\\ (o \\<machine>\\<petsa ngayon>\\) at binabasa ang pinakabagong Excel doon.
  // Ang nabasa ay inilalagay sa ownCorrel (ipinapakita ng renderSender) at ipinapadala sa Server path. Tahimik kung walang Saving path, walang permission, walang folder o walang file (walang popup).
  let ownCorrel = null;
  let ownCompare = null;
  let ownRepeatability = null;
  let ownCalibrationCorrel = null;
  let ownCalibrationRepeatability = null;
  let ownTrend = null;
  let isOwnReading = false;
  async function readOwnCorrel(settings) {
    if (isOwnReading) return;
    if (!root.correlExcelReader || !root.storage.isFolderAccessSupported()) return;
    isOwnReading = true;
    try {
      const machineName = typeof settings.machineName === 'string' ? settings.machineName.trim() : '';
      if (!machineName) { ownCorrel = null; ownCompare = null; ownRepeatability = null; ownTrend = null; ownCalibrationCorrel = null; ownCalibrationRepeatability = null; return; }
      const rootHandle = await root.storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
      if (!rootHandle || !(await root.storage.hasPermission(rootHandle, false))) { ownCorrel = null; ownCompare = null; ownRepeatability = null; ownTrend = null; ownCalibrationCorrel = null; ownCalibrationRepeatability = null; return; }
      ownCorrel = await readWithYesterday((dayName) => root.correlExcelReader.readLatestInSavingPath(rootHandle, machineName, dayName));
      ownCompare = await readWithYesterday((dayName) => root.correlExcelReader.readLatestCompareInSavingPath(rootHandle, machineName, dayName));
      ownRepeatability = await readWithYesterday((dayName) => root.repeatabilityReader.readInSavingPath(rootHandle, dayName));
      ownTrend = root.trendTile ? await root.trendTile.readOwn(rootHandle) : null;
      ownCalibrationCorrel = root.calibrationTile ? await readWithYesterday((dayName) => root.calibrationTile.readInSavingPath(rootHandle, machineName, dayName, 'correl')) : null;
      ownCalibrationRepeatability = root.calibrationTile && isOptionShown('calibrationRepeatability') ? await readWithYesterday((dayName) => root.calibrationTile.readInSavingPath(rootHandle, machineName, dayName, 'repeatability')) : null;
    } catch (error) {
      ownCalibrationCorrel = null;
      ownCalibrationRepeatability = null;
      ownCorrel = null;
      ownCompare = null;
      ownRepeatability = null;
      ownTrend = null;
    } finally {
      isOwnReading = false;
    }
  }

  // Ipinapadala ang nabasang Master Correl (ownCorrel) sa <Server path>\\correl\\<machine>.json para sa LEAD PC. Hindi hinihintay ng render; hindi nagtatapon ng error.
  async function publishOwnCorrel(settings) {
    const latest = ownCorrel;
    if (!latest || !root.correlSync || !root.queue) return;
    try {
      const found = await root.queue.findServerHandle(false);
      if (found.state !== CONFIG.QUEUE.CONNECTION.ok) return;
      await root.correlSync.writeCorrelStatus(found.handle, Object.assign({}, latest.status, { machineMode: settings.machineMode, updatedAt: new Date(latest.modifiedMs).toISOString() }));
    } catch (error) {
      // hindi mabasa ang Server: susubukan ulit sa susunod na refresh
    }
  }

  // Inilalagay ang checkbox ng opsyonal na Repeatability sa #dm-options; kapag may binago, refresh agad. Walang epekto kung wala ang container o ang dashboard-options.js.
  function mountOptions() {
    const container = root.calibrationTileConfig ? query(root.calibrationTileConfig.SELECTOR.options) : null;
    if (!container || !root.dashboardOptions) return;
    // Kapag abala pa ang kasalukuyang refresh, ulitin pagkaraan ng sandali (hanggang 10 beses) para hindi mawala ang pagbabago.
    const rerender = (attempt) => {
      if (!query(SEL.section)) return;
      if (isBusy && attempt < 10) window.setTimeout(() => rerender(attempt + 1), 300);
      else refresh(false);
    };
    root.dashboardOptions.mount(container, () => rerender(0));
  }

  // Init ng page, tinatawag ng dashboard.js.
  function init() {
    stopTimer();
    isBusy = false;
    mountOptions();
    const grantButton = query(SEL.grant);
    if (grantButton) grantButton.addEventListener('click', handleGrantClick);
    refresh(false);
    timerId = window.setInterval(() => refresh(false), DM.POLL_MS);
    // Kapag nagpalit ang shift (7:30 AM / 7:30 PM), agad mag-refresh at suriin ulit ang OUTDATED sa lahat ng tile (Sender at LEAD PC).
    if (root.shiftFreshness) stopShiftWatch = root.shiftFreshness.watch(() => refresh(false));
  }

  root.dashboardMachines = Object.freeze({ init });
})();
