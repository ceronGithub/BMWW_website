/*
 * FILE    : js/pages/lot-tracking-lead.js
 * PURPOSE : LEAD PC view ng LOT Tracking: ipinapakita ang monitoring ng lahat ng machine mula sa Server path (basa lang)
 * DEPENDS : js/core/config.js, js/core/registry.js, js/core/lot-config.js, js/core/lot-lead-config.js, js/core/lot-shift.js, js/core/lot-monitoring-reader.js
 * USED BY : pages/lot-tracking-lead.html (script tag), js/templates/lot-tracking-lead.template.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 5)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const MON = root.lotConfig.MONITORING;
  const LEAD = root.lotLeadConfig;
  const SEL = LEAD.SELECTOR;
  const TEXT = LEAD.TEXT;
  const lotShift = root.lotShift;
  const reader = root.lotMonitoringReader;

  let timerId = null;
  let isLoading = false;
  let isDayAutomatic = true;
  let lastResult = { state: LEAD.STATE.ok, machineList: [] };

  // Hinahanap ang elemento ayon sa key ng selector.
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  // Nagpapakita ng status (error o success).
  function setMessage(message, isError) {
    const element = query('message');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', isError);
    element.classList.toggle('is-success', !isError);
  }

  // Monitoring day ngayon bilang yyyy-mm-dd (nagpapalit sa simula ng Day shift ng Settings).
  function getCurrentDay() {
    return lotShift.getMonitoringDay(Date.now()).iso;
  }

  // Napiling petsa kung tama ang anyo at totoong petsa; walang laman kung hindi.
  function getSelectedDay() {
    const value = query('day').value;
    if (!LEAD.DAY_PATTERN.test(value)) return '';
    const parts = value.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const isReal = date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2];
    return isReal ? value : '';
  }

  // Gumagawa ng option para sa select.
  function buildOption(value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }

  // Inilalagay ang mga opsyon ng filter ng Status (Lahat, ONGOING, DONE).
  function fillStatusOptions() {
    query('statusFilter').replaceChildren(...LEAD.STATUS_OPTION_LIST.map((option) => buildOption(option.value, option.label)));
  }

  // Binubuo ulit ang filter ng Machine mula sa nabasang listahan; pinananatili ang napili kung nandoon pa.
  function fillMachineOptions(machineList) {
    const select = query('machine');
    const selectedValue = select.value;
    const optionList = [buildOption(LEAD.ALL_VALUE, TEXT.allMachines)];
    machineList.forEach((entry) => optionList.push(buildOption(entry.folderName, entry.machine)));
    select.replaceChildren(...optionList);
    const isStillThere = machineList.some((entry) => entry.folderName === selectedValue);
    select.value = isStillThere ? selectedValue : LEAD.ALL_VALUE;
  }

  // Mga machine na ipapakita ayon sa filter ng Machine.
  function getVisibleMachineList() {
    const selectedValue = query('machine').value;
    if (selectedValue === LEAD.ALL_VALUE) return lastResult.machineList;
    return lastResult.machineList.filter((entry) => entry.folderName === selectedValue);
  }

  // Bilang ng ONGOING na row sa doc ng machine.
  function countOngoing(doc) {
    return doc.rows.filter((row) => row.status === MON.STATUS.ongoing).length;
  }

  // Isang linya ng buod ng machine: ilan ang ONGOING (o mensahe kung walang file) at huling update.
  function buildMachineLine(entry) {
    const item = document.createElement('li');
    item.className = 'lot-lead-machine';
    if (!entry.doc) {
      item.textContent = entry.machine + ': ' + TEXT[entry.problem];
      return item;
    }
    const ongoingCount = countOngoing(entry.doc);
    const countText = ongoingCount > 0 ? ongoingCount + TEXT.ongoingCount : TEXT.noOngoing;
    item.textContent = entry.machine + ': ' + countText + ' (' + TEXT.updated + lotShift.formatDateTime(entry.doc.updatedMs) + ')';
    item.classList.toggle('is-ongoing', ongoingCount > 0);
    return item;
  }

  // Inilalagay ang buod kada machine sa itaas ng table.
  function renderMachineList(machineList) {
    const list = query('machineList');
    if (lastResult.state !== LEAD.STATE.ok) { list.replaceChildren(); return; }
    if (lastResult.machineList.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'lot-lead-machine';
      empty.textContent = TEXT.noMachines;
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(...machineList.map(buildMachineLine));
  }

  // Lahat ng row ng mga napiling machine na pasok sa filter ng Status. Nauuna ang ONGOING, tapos pinakabagong Start-Time.
  function buildRowList(machineList) {
    const statusValue = query('statusFilter').value;
    const rowList = [];
    machineList.forEach((entry) => {
      if (!entry.doc) return;
      entry.doc.rows.forEach((row) => {
        if (statusValue === LEAD.ALL_VALUE || row.status === statusValue) rowList.push(row);
      });
    });
    const rank = (row) => (row.status === MON.STATUS.ongoing ? 0 : 1);
    rowList.sort((first, second) => rank(first) - rank(second) || second.startMs - first.startMs);
    return rowList;
  }

  // Cell ng isang column; textContent lang ang ginagamit (galing sa file ang laman).
  function buildCell(column, row) {
    const cell = document.createElement('td');
    const value = row[column.field];
    if (column.field === 'status') {
      const badge = document.createElement('span');
      badge.className = 'badge ' + (value === MON.STATUS.ongoing ? LEAD.BADGE.ongoing : LEAD.BADGE.done);
      badge.textContent = value || LEAD.EMPTY_CELL;
      cell.append(badge);
      return cell;
    }
    if (column.type === 'time') cell.textContent = value > 0 ? lotShift.formatDateTime(value) : LEAD.EMPTY_CELL;
    else if (column.field === 'lotDurationMin') cell.textContent = row.endMs > 0 ? String(value) : LEAD.EMPTY_CELL;
    else cell.textContent = value === '' ? LEAD.EMPTY_CELL : String(value);
    if (column.field === 'filePath') cell.className = 'lot-lead-path';
    return cell;
  }

  // Inilalagay ang mga row sa table (hanggang LEAD.MAX_ROWS) at ang tala sa itaas nito.
  function renderTable(rowList) {
    const columnList = LEAD.COLUMN_FIELD_LIST.map((field) => MON.COLUMN_LIST.find((column) => column.field === field));
    const shownList = rowList.slice(0, LEAD.MAX_ROWS);
    const tableRowList = shownList.map((row) => {
      const tableRow = document.createElement('tr');
      tableRow.append(...columnList.map((column) => buildCell(column, row)));
      return tableRow;
    });
    query('resultBody').replaceChildren(...tableRowList);
    let note = '';
    if (lastResult.state === LEAD.STATE.ok && rowList.length === 0 && lastResult.machineList.length > 0) note = TEXT.noRows;
    if (rowList.length > LEAD.MAX_ROWS) note = TEXT.showingLimit.replace('{n}', String(LEAD.MAX_ROWS));
    query('resultNote').textContent = note;
  }

  // Ipinapakita ang buong resulta ayon sa kasalukuyang filter (hindi nagbabasa ng file).
  function render() {
    const visibleList = getVisibleMachineList();
    renderMachineList(visibleList);
    renderTable(lastResult.state === LEAD.STATE.ok ? buildRowList(visibleList) : []);
  }

  // Binabasa ang monitoring ng lahat ng machine at ipinapakita. Isa lang ang sabay; hindi nagtatapon ng error.
  async function load(shouldRequest) {
    if (isLoading) return;
    const day = getSelectedDay();
    if (!day) { setMessage(TEXT.dayInvalid, true); return; }
    isLoading = true;
    try {
      lastResult = await reader.readDay(day, shouldRequest);
      if (!query('resultBody')) return;
      fillMachineOptions(lastResult.machineList);
      render();
      if (lastResult.state === LEAD.STATE.ok) setMessage(TEXT.loaded + lotShift.formatDateTime(Date.now()), false);
      else setMessage(TEXT[lastResult.state], true);
    } catch (error) {
      if (query('message')) setMessage(TEXT.readError, true);
    } finally {
      isLoading = false;
    }
  }

  // Itinitigil ang auto refresh.
  function stopTimer() {
    if (timerId === null) return;
    window.clearInterval(timerId);
    timerId = null;
  }

  // Auto refresh: titigil kapag wala na ang page; kapag hindi pa binago ng user ang petsa, sumusunod ito sa monitoring day ngayon.
  function onTick() {
    if (!query('resultBody')) { stopTimer(); return; }
    if (isDayAutomatic) query('day').value = getCurrentDay();
    load(false);
  }

  // Init ng page, tinatawag ng router.
  async function init() {
    stopTimer();
    isLoading = false;
    isDayAutomatic = true;
    lastResult = { state: LEAD.STATE.ok, machineList: [] };
    query('day').value = getCurrentDay();
    fillStatusOptions();
    fillMachineOptions([]);
    query('day').addEventListener('change', () => { isDayAutomatic = query('day').value === getCurrentDay(); load(false); });
    query('machine').addEventListener('change', render);
    query('statusFilter').addEventListener('change', render);
    query('refresh').addEventListener('click', () => load(true));
    timerId = window.setInterval(onTick, LEAD.REFRESH_MS);
    await load(false);
  }

  root.registry.registerPage(LEAD.PAGE, Object.freeze({ init }));
})();
