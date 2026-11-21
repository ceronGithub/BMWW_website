/*
 * FILE    : js/pages/dashboard-machines.js
 * PURPOSE : Dashboard: role badge (LEAD PC = monitor only, MACHINE = sender), at listahan ng machine na nagpapadala (LEAD PC)
 *           o status ng sariling Data source (machine)
 * DEPENDS : js/core/dashboard-machines-config.js, js/core/config.js, js/core/storage.js, js/core/queue.js, js/core/monitor.js
 * INPUT   : localStorage settings (machine name/mode), queue snapshot sa Server path (LEAD PC), monitor.getState (machine)
 * OUTPUT  : mga elemento sa #dm-section at #dm-role (textContent lang, walang innerHTML)
 * VERSION : v6 | 2026-11-21 | Task 1D: bagong file
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
  function renderSummary(summary) {
    const list = createElementWith('ul', 'dm-chip-list');
    const labels = TEXT.summary;
    list.append(
      buildChip(labels.total, summary.total),
      buildChip(labels.active, summary.active, 'dm-chip-active'),
      buildChip(labels.ongoing, summary.ongoing, 'dm-chip-ongoing'),
      buildChip(labels.done, summary.done),
      buildChip(labels.stale, summary.stale, 'dm-chip-stale'),
      buildChip(labels.noStatus, summary.noStatus)
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

  // Ranggo ng machine item para sa pagkakasunod (ongoing muna, no status sa huli).
  function getRank(item) {
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

  // Tile ng isang machine sa LEAD PC view.
  function buildMachineTile(item, nowMs) {
    const tile = createElementWith('article', DM.CLASS.tile + ' ' + DM.CLASS.tileRole.sender + ' ' + DM.CLASS.presence[item.presence]);
    const head = createElementWith('div', 'dm-tile-head');
    head.append(createElementWith('h3', 'dm-tile-name', item.machineName), buildRoleBadge(DM.ROLE.sender));
    tile.append(head);

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
    renderSummary(snapshot.summary);
    const sortedList = sortItems(snapshot.machineItemList);
    grid.replaceChildren(...sortedList.map((item) => buildMachineTile(item, nowMs)));
    setMessage(sortedList.length === 0 ? TEXT.emptyGrid : '', false);
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

  // Init ng page, tinatawag ng dashboard.js.
  function init() {
    stopTimer();
    isBusy = false;
    const grantButton = query(SEL.grant);
    if (grantButton) grantButton.addEventListener('click', handleGrantClick);
    refresh(false);
    timerId = window.setInterval(() => refresh(false), DM.POLL_MS);
  }

  root.dashboardMachines = Object.freeze({ init });
})();
