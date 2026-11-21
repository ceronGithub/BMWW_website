/*
 * FILE    : js/pages/dashboard-machines.js
 * PURPOSE : Dashboard: role badge (LEAD PC = monitor only, MACHINE = sender), at listahan ng machine na nagpapadala (LEAD PC)
 *           o status ng sariling Data source (machine)
 * DEPENDS : js/core/correl-excel-reader.js, js/core/dashboard-machines-config.js, js/core/config.js, js/core/storage.js, js/core/queue.js, js/core/monitor.js, js/core/compare-sync.js, js/core/correl-sync.js, js/core/correl-preview.js
 * INPUT   : localStorage settings (machine name/mode), queue snapshot sa Server path (LEAD PC), monitor.getState (machine)
 * OUTPUT  : mga elemento sa #dm-section at #dm-role (textContent lang, walang innerHTML)
 * VERSION : v7.8 | 2026-11-21 | itinatago ang stale at hindi naka-register na machine (lumang pangalan); buod ay kinukuwenta ulit
 * VERSION : v7.7 | 2026-11-21 | ipinapakita sa #dm-message ang dahilan kung bakit hindi nabasa ang Master Correl Excel ng machine
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
  let isPreviewBusy = false;
  let previewClearId = null;

  // Gumagawa ng elemento na may class at text (textContent lang, ligtas sa XSS).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
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
  function renderSummary(summary, alertCount, correlFailCount) {
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
      buildChip(labels.correlFail, correlFailCount, 'dm-chip-correl-fail')
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

  // Ranggo ng machine item para sa pagkakasunod (alert o Correl FAIL muna, tapos ongoing; no status sa huli).
  function getRank(item) {
    if (hasAlert(item) || hasCorrelFail(item)) return DM.RANK.alert;
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

  // Alert ng worst slider sa tile ng machine: actual at master (previous at today), at listahan ng slider.
  function buildAlertBlock(compareItem, nowMs) {
    const text = TEXT.compare;
    const status = compareItem.status;
    const worst = status.worst;
    const box = createElementWith('div', 'dm-alert ' + (DM.COMPARE.LEVEL_CLASS[worst.level] || ''));
    const title = createElementWith('p', 'dm-alert-title', text.title.replace('{barcode}', worst.barcode));
    const levelText = DM.COMPARE.LEVEL_TEXT[worst.level];
    if (levelText) title.append(createElementWith('span', 'dm-alert-level', levelText));
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
    return box;
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

  // Click ng Preview: binubuksan sa Windows (File Explorer) ang pinakabagong Master Correl file ng machine. Isa lang ang sabay na tumatakbo.
  async function handlePreviewClick(machineName) {
    if (isPreviewBusy || !root.correlPreview) return;
    isPreviewBusy = true;
    const text = TEXT.preview;
    try {
      setPreviewStatus(text.opening + machineName + '...', false);
      const result = await root.correlPreview.previewLatest(machineName, true);
      if (result.ok) setPreviewStatus(text.opened + result.openedPath + text.openedHint, false);
      else setPreviewStatus(text.error[result.code] || text.error.error, true);
    } finally {
      isPreviewBusy = false;
    }
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
    return box;
  }

  // Tile ng isang machine sa LEAD PC view.
  function buildMachineTile(item, nowMs) {
    const tile = createElementWith('article', DM.CLASS.tile + ' ' + DM.CLASS.tileRole.sender + ' ' + DM.CLASS.presence[item.presence] + (hasAlert(item) || hasCorrelFail(item) ? ' dm-tile-alert' : ''));
    const head = createElementWith('div', 'dm-tile-head');
    head.append(createElementWith('h3', 'dm-tile-name', item.machineName), buildRoleBadge(DM.ROLE.sender));
    tile.append(head, buildCorrelBlock(item.correl, nowMs));
    if (hasAlert(item)) tile.append(buildAlertBlock(item.compare, nowMs));

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
    if (!query(SEL.section)) return;
    renderSummary(snapshot.summary, snapshot.machineItemList.filter(hasAlert).length, snapshot.machineItemList.filter(hasCorrelFail).length);
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
    tile.append(head, createElementWith('p', 'card-note', TEXT.senderTileNote));
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
    const message = TEXT.monitor[monitorState.state] || (monitorState.lastError ? TEXT.monitor.error : '');
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
      else if (role.key === DM.ROLE.sender.key) renderSender(settings, shouldRequest);
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
  }

  // Click ng Payagan: humihingi ng permission (LEAD PC: Server folder; machine: simula ulit ng monitor).
  async function handleGrantClick() {
    const settings = root.storage.readLocalSettings();
    if (getRole(settings).key === DM.ROLE.sender.key) await root.monitor.start(true);
    await refresh(true);
  }

  // Machine lang: binabasa ulit ang pinakabagong Master Correl ng araw na ito (Data source 1) at ipinapadala ang status sa Server path,
  // para laging bago ang nakikita ng LEAD PC. Tahimik kung walang source, walang permission, o walang record ngayong araw (walang popup).
  async function rereadOwnCorrel() {
    const settings = root.storage.readLocalSettings();
    if (getRole(settings).key !== DM.ROLE.sender.key) return;
    if (!root.masterAnalysis || !root.correlSync || !root.storage.isFolderAccessSupported()) return;
    try {
      const sourceHandle = await root.storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.MASTER.SOURCE_KEY]);
      if (!sourceHandle || !(await root.storage.hasPermission(sourceHandle, false))) return;
      const nowDate = new Date();
      const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
      const result = await root.masterAnalysis.analyzeLatest(sourceHandle, today, null, today);
      await root.correlSync.publishStatus(result, settings, false);
    } catch (error) {
      // walang master record ngayon o hindi mabasa ang source: ituloy ang dashboard, susubukan ulit sa susunod na refresh
    }
  }

  // Init ng page, tinatawag ng dashboard.js.
  function init() {
    stopTimer();
    isBusy = false;
    const grantButton = query(SEL.grant);
    if (grantButton) grantButton.addEventListener('click', handleGrantClick);
    refresh(false);
    // Sa bawat refresh/pagbukas ng Dashboard: basahin ulit ang pinakabagong Master Correl (hindi hinaharang ang unang render).
    rereadOwnCorrel();
    timerId = window.setInterval(() => refresh(false), DM.POLL_MS);
  }

  root.dashboardMachines = Object.freeze({ init });
})();
