/*
 * FILE    : js/core/preview-tab.js
 * PURPOSE : Preview ng Dashboard (Master Correl at Worst slider) sa BAGONG TAB: binubuksan ang tab sa mismong click, binabasa ang Excel file, at ipinapakita ang buod, chart at laman ng sheet
 * DEPENDS : js/core/dashboard-machines-config.js, js/core/preview-tab-style.js
 * INPUT   : open({ title, load, buildPage, onBlocked }): load = async () => ({ details } o { message }); buildPage = (details) => { title, status, statList, chartBox, grid, fileName, modifiedMs }; onBlocked = () => void (hinarang ng browser ang tab)
 * OUTPUT  : bagong tab na may HTML na nabuo sa Blob URL (walang document.write, walang innerHTML); hindi nagtatapon ng error
 * NOTE    : Ang tab ay binubuksan BAGO ang anumang await para hindi ito harangin ng popup blocker. Basa lang; walang sinusulat sa file o folder.
 * VERSION : v8.9 | 2026-11-21 | bagong file (pamalit sa popup na preview-panel.js)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const DM = root.dashboardMachinesConfig;
  const TAB = DM.PREVIEW_TAB;
  const TEXT = DM.TEXT.preview.tab;

  // Gumagawa ng elemento sa dokumento ng tab (textContent lang, ligtas sa XSS).
  function createElementIn(doc, tagName, className, text) {
    const element = doc.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
  }

  // Card na may heading at laman.
  function buildCard(doc, headingText, contentList) {
    const card = createElementIn(doc, 'section', 'tab-card');
    card.append(createElementIn(doc, 'h2', 'tab-heading', headingText), ...contentList);
    return card;
  }

  // Ang buong laman ng sheet bilang table: letra ng column sa taas at numero ng row sa kaliwa (parang Excel).
  function buildSheet(doc, grid) {
    if (!grid || grid.rowList.length === 0) return createElementIn(doc, 'p', 'tab-note', TEXT.noSheet);
    const wrap = createElementIn(doc, 'div', 'sheet-wrap');
    const table = createElementIn(doc, 'table', 'sheet');
    const headRow = doc.createElement('tr');
    headRow.append(createElementIn(doc, 'th', '', TEXT.rowHeader));
    grid.columnList.forEach((letter) => headRow.append(createElementIn(doc, 'th', '', letter)));
    const head = doc.createElement('thead');
    head.append(headRow);
    const body = doc.createElement('tbody');
    grid.rowList.forEach((cellList, rowIndex) => {
      const row = doc.createElement('tr');
      row.append(createElementIn(doc, 'th', '', String(rowIndex + 1)));
      cellList.forEach((value) => {
        const isNumber = value !== '' && Number.isFinite(Number(value));
        row.append(createElementIn(doc, 'td', isNumber ? TAB.NUMBER_CLASS : '', value));
      });
      body.append(row);
    });
    table.append(head, body);
    wrap.append(table);
    return wrap;
  }

  // Binubuo ang buong HTML ng tab (string) mula sa spec ng pahina.
  function buildDocument(spec) {
    const doc = document.implementation.createHTMLDocument(spec.title);
    doc.documentElement.setAttribute('lang', TEXT.lang);
    const charset = doc.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    const viewport = doc.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    const style = doc.createElement('style');
    style.textContent = root.previewTabStyle;
    doc.head.prepend(charset, viewport);
    doc.head.append(style);
    const main = createElementIn(doc, 'main', 'tab-main');
    const head = createElementIn(doc, 'header', 'tab-head');
    head.append(createElementIn(doc, 'h1', 'tab-title', spec.title));
    if (spec.status) {
      const badge = createElementIn(doc, 'span', 'tab-badge ' + spec.status.className);
      badge.append(createElementIn(doc, 'span', '', spec.status.icon), createElementIn(doc, 'span', '', spec.status.text));
      head.append(badge);
    }
    const savedText = spec.modifiedMs ? TEXT.readAt + new Date(spec.modifiedMs).toLocaleString() : '';
    head.append(createElementIn(doc, 'p', 'tab-note', [spec.fileName, savedText].filter(Boolean).join(' | ')));
    const stats = createElementIn(doc, 'dl', 'tab-stats');
    spec.statList.forEach((pair) => stats.append(createElementIn(doc, 'dt', '', pair[0]), createElementIn(doc, 'dd', '', pair[1])));
    const statsCard = createElementIn(doc, 'section', 'tab-card');
    statsCard.append(stats);
    main.append(head, statsCard);
    if (spec.chartBox) main.append(buildCard(doc, TEXT.chartHeading, [doc.importNode(spec.chartBox, true)]));
    main.append(buildCard(doc, TEXT.sheetHeading, [createElementIn(doc, 'p', 'tab-note', TEXT.sheetNote), buildSheet(doc, spec.grid)]));
    doc.body.append(main);
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }

  // Mensahe lang sa bagong tab (habang naglo-load o kapag may problema).
  function showMessage(tab, title, message) {
    try {
      tab.document.title = title;
      tab.document.body.replaceChildren(createElementIn(tab.document, 'p', '', message));
    } catch (error) {
      // sarado na ang tab o hindi na ma-access
    }
  }

  // Binubuksan ang tab, binabasa ang file, at pinapalitan ang tab ng nabuong pahina.
  async function open(options) {
    const tab = window.open(TAB.BLANK_URL, TAB.TARGET);
    if (!tab) {
      options.onBlocked();
      return;
    }
    try { tab.opener = null; } catch (error) { /* hindi mababago ang opener */ }
    showMessage(tab, options.title, TEXT.loading);
    let loaded;
    try {
      loaded = await options.load();
    } catch (error) {
      loaded = { message: DM.TEXT.preview.error.error };
    }
    if (tab.closed) return;
    if (!loaded.details) {
      showMessage(tab, options.title, loaded.message);
      return;
    }
    const url = URL.createObjectURL(new Blob([buildDocument(options.buildPage(loaded.details))], { type: 'text/html' }));
    tab.location.replace(url);
    window.setTimeout(() => URL.revokeObjectURL(url), TAB.REVOKE_MS);
  }

  root.previewTab = Object.freeze({ open, buildDocument });
})();
