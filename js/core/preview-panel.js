/*
 * FILE    : js/core/preview-panel.js
 * PURPOSE : Iisang panel (popout) para sa lahat ng Preview ng Dashboard (Master Correl at Worst slider): shell, loading, mensahe, Isara, buod (stats) at table na may highlight sa chart
 * DEPENDS : js/core/dashboard-machines-config.js, js/core/chart-draw.js (highlight)
 * INPUT   : open({ title, load, fill, explorer }) kung saan load = async () => ({ details } o { message }), fill = (body, details) => void, explorer = { onClick(noteElement) } (opsyonal)
 * OUTPUT  : overlay na nakadikit sa document.body; close() ang nag-aalis; hindi nagtatapon ng error
 * VERSION : v8.8 | 2026-11-21 | bagong file (inilipat dito ang panel mula sa dashboard-machines.js para iisa ang itsura ng lahat ng Preview)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const DM = root.dashboardMachinesConfig;
  const PANEL_TEXT = DM.TEXT.preview.panel;
  const SETTINGS = DM.PREVIEW_PANEL;
  let overlay = null;
  let keyHandler = null;

  // Gumagawa ng elemento na may class at text (textContent lang, ligtas sa XSS).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
  }

  // Isinasara ang panel at inaalis ang mga listener.
  function close() {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    window.removeEventListener('hashchange', close);
    keyHandler = null;
    if (overlay) overlay.remove();
    overlay = null;
  }

  // Buod: listahan ng [label, halaga] bilang dl.
  function buildStats(pairList) {
    const list = createElementWith('dl', 'dm-preview-stats');
    pairList.forEach((pair) => list.append(createElementWith('dt', '', pair[0]), createElementWith('dd', '', pair[1])));
    return list;
  }

  // Table: columnList = mga header; rowList = [{ barcode, cellList: [{ text, className }] }]. Kapag may chartBox, ang pagpindot sa row ay naghi-highlight ng point sa chart.
  function buildTable(columnList, rowList, chartBox) {
    const wrap = createElementWith('div', 'dm-table-wrap dm-preview-table-wrap');
    const table = createElementWith('table', 'dm-table');
    const headRow = document.createElement('tr');
    columnList.forEach((column) => headRow.append(createElementWith('th', '', column)));
    const head = document.createElement('thead');
    head.append(headRow);
    const body = document.createElement('tbody');
    let selectedRow = null;
    const select = (row, barcode) => {
      const shouldClear = selectedRow === row;
      if (selectedRow) selectedRow.classList.remove(SETTINGS.SELECTED_CLASS);
      selectedRow = shouldClear ? null : row;
      if (selectedRow) selectedRow.classList.add(SETTINGS.SELECTED_CLASS);
      root.chart.highlight(chartBox, shouldClear ? '' : barcode);
    };
    rowList.forEach((item) => {
      const row = document.createElement('tr');
      item.cellList.forEach((cell) => row.append(createElementWith('td', cell.className || '', cell.text)));
      if (chartBox) {
        row.classList.add('dm-preview-row');
        row.tabIndex = 0;
        row.addEventListener('click', () => select(row, item.barcode));
        row.addEventListener('keydown', (event) => { if (SETTINGS.SELECT_KEYS.includes(event.key)) { event.preventDefault(); select(row, item.barcode); } });
      }
      body.append(row);
    });
    table.append(head, body);
    wrap.append(table);
    return wrap;
  }

  // Binubuksan ang panel. Ang laman ay galing sa options.load at inilalagay ng options.fill.
  async function open(options) {
    close();
    const panel = createElementWith('div', 'dm-preview-panel');
    const current = createElementWith('div', 'page-dashboard dm-preview-overlay');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', options.title);
    const head = createElementWith('div', 'dm-preview-head');
    const closeButton = createElementWith('button', 'btn btn-secondary dm-preview-close', PANEL_TEXT.close);
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', PANEL_TEXT.closeAria);
    head.append(createElementWith('h3', 'dm-preview-title', options.title), closeButton);
    const body = createElementWith('div', 'dm-preview-body');
    body.append(createElementWith('p', 'card-note', PANEL_TEXT.loading));
    panel.append(head, body);
    if (options.explorer) {
      const note = createElementWith('p', 'card-note dm-preview-note');
      const explorerButton = createElementWith('button', 'btn btn-secondary dm-preview-explorer', PANEL_TEXT.openExplorer);
      explorerButton.type = 'button';
      explorerButton.addEventListener('click', () => options.explorer.onClick(note));
      const foot = createElementWith('div', 'dm-preview-foot');
      foot.append(explorerButton, note);
      panel.append(foot);
    }
    current.append(panel);
    document.body.append(current);
    overlay = current;
    keyHandler = (event) => { if (event.key === SETTINGS.CLOSE_KEY) close(); };
    document.addEventListener('keydown', keyHandler);
    window.addEventListener('hashchange', close);
    closeButton.addEventListener('click', close);
    current.addEventListener('click', (event) => { if (event.target === current) close(); });
    closeButton.focus();
    let loaded;
    try {
      loaded = await options.load();
    } catch (error) {
      loaded = { message: DM.TEXT.preview.error.error };
    }
    if (overlay !== current) return;
    if (loaded.details) options.fill(body, loaded.details);
    else body.replaceChildren(createElementWith('p', 'dm-preview-message', loaded.message));
  }

  root.previewPanel = Object.freeze({ open, close, buildStats, buildTable });
})();
