/*
 * FILE    : js/pages/bat-card.js
 * PURPOSE : Settings: mga card ng .bat tool na kapareho ng itsura ng card ng File Watcher (babala, tick, hakbang sa File Explorer,
 *           path na may Copy, Paano i-uninstall) at card na "Kailangan bago mag-setup".
 *           HINDI nag-i-install, nag-u-uninstall o nagpapatakbo ng kahit anong program ang website.
 *           Ang user mismo ang mag-double-click ng .bat (mas ligtas).
 * INPUT   : <div id="bat-tools-card"> sa settings page; window.location (para malaman ang path ng website);
 *           window.BMWW.batToolsConfig (js/core/bat-tools-config.js)
 * OUTPUT  : DOM lang (textContent lang, walang innerHTML). Walang isinusulat sa disk.
 * DEPENDS : js/core/bat-tools-config.js. Tinatawag ng js/pages/settings.js: init()
 * VERSION : v1 | 2026-11-24 | bagong file (Batch K: v32)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const config = root && root.batToolsConfig;
  if (!config) return;

  const TEXT = config.TEXT;
  const STEP_KIND = config.STEP_KIND;

  let statusList = [];
  let copyTimer = 0;

  // Gumagawa ng elemento na may class at text (textContent lang).
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  // Pangalan ng file, command o folder na may espesyal na itsura sa loob ng hakbang.
  function makeFileName(fileName) {
    return makeElement('code', 'batcard-file', fileName);
  }

  // Hinuhulaan ang Windows path ng folder ng tool ayon sa kinabuksan ng website (file://).
  // Ibinibigay ang { path, isExact }. Kung hindi file://, relative na path lang at isExact false.
  function getFolderPath(folderRelative) {
    const fallback = { path: folderRelative, isExact: false };
    const location = window.location;
    if (location.protocol !== 'file:') return fallback;
    try {
      const folderPart = decodeURIComponent(location.pathname).replace(/[^/]*$/, '').replace(/\/+$/, '');
      let basePath = folderPart.replace(/^\/([A-Za-z]:)/, '$1').replace(/\//g, config.SEPARATOR);
      if (location.host) basePath = config.SEPARATOR + config.SEPARATOR + location.host + basePath;
      return { path: basePath + config.SEPARATOR + folderRelative, isExact: true };
    } catch (error) {
      return fallback;
    }
  }

  // Ipinapakita ang mensahe ng Copy (sa isang status lang), at binubura pagkalipas ng ilang segundo.
  function showCopyStatus(statusElement, message) {
    statusList.forEach((element) => { element.textContent = ''; });
    statusElement.textContent = message;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => { statusElement.textContent = ''; }, config.COPY_STATUS_MS);
  }

  // Kinokopya ang laman ng field sa clipboard. Kung hindi puwede, pinipili ang text para si user na ang mag-Ctrl+C.
  async function copyField(field, statusElement) {
    try {
      if (!(navigator.clipboard && window.isSecureContext)) throw new Error('noClipboard');
      await navigator.clipboard.writeText(field.value);
      showCopyStatus(statusElement, TEXT.copied);
    } catch (error) {
      field.focus();
      field.select();
      let isCopied = false;
      try { isCopied = document.execCommand('copy'); } catch (copyError) { isCopied = false; }
      showCopyStatus(statusElement, isCopied ? TEXT.copied : TEXT.copyManual);
    }
  }

  // Readonly na field (isang linya o marami) na may Copy button at status. Ginagamit sa path at sa command.
  function buildCopyBlock(value, labelText, isMultiLine) {
    const block = document.createElement('div');
    const row = makeElement('div', 'batcard-copy-row');
    const field = document.createElement(isMultiLine ? 'textarea' : 'input');
    if (isMultiLine) field.rows = 4;
    else field.type = 'text';
    field.className = 'form-input batcard-copy-field';
    field.readOnly = true;
    field.spellcheck = false;
    field.value = value;
    field.setAttribute('aria-label', labelText);
    const statusElement = makeElement('p', 'card-note batcard-copy-status');
    statusElement.setAttribute('role', 'status');
    statusList.push(statusElement);
    const copyButton = makeElement('button', 'btn btn-secondary', TEXT.copyButton);
    copyButton.type = 'button';
    copyButton.addEventListener('click', () => copyField(field, statusElement));
    row.append(field, copyButton);
    block.append(row, statusElement);
    return block;
  }

  // Ang path ng folder ng tool (readonly), Copy button at paalala kung hindi eksakto.
  function buildPathBlock(folderRelative) {
    const pathInfo = getFolderPath(folderRelative);
    const block = buildCopyBlock(pathInfo.path, TEXT.pathLabel, false);
    if (!pathInfo.isExact) block.append(makeElement('p', 'card-note', TEXT.pathNotExact));
    return block;
  }

  // Inilalagay ang mga bahagi ng hakbang sa <li>: string = text, { file } = code.
  function appendParts(listItem, partList) {
    partList.forEach((part) => {
      if (typeof part === 'string') listItem.append(part);
      else listItem.append(makeFileName(part.file));
    });
  }

  // Gumagawa ng isang hakbang (<li>): File Explorer, path, o text (may command kung meron).
  function buildStepItem(stepConfig, tool) {
    if (stepConfig.kind === STEP_KIND.explorer) return makeElement('li', '', TEXT.openExplorer);
    if (stepConfig.kind === STEP_KIND.path) {
      const pathItem = makeElement('li', '', TEXT.pasteLabel);
      pathItem.append(buildPathBlock(tool.folder));
      return pathItem;
    }
    const listItem = document.createElement('li');
    appendParts(listItem, stepConfig.parts);
    if (stepConfig.command) listItem.append(buildCopyBlock(stepConfig.command, TEXT.commandLabel, true));
    return listItem;
  }

  // Ang kahon ng mga hakbang ng isang panel: pamagat, intro, listahan ng hakbang at manual na paraan.
  function buildStepsBox(panel, tool) {
    const wrap = makeElement('div', 'batcard-steps');
    const title = makeElement('h3', 'batcard-steps-title', panel.title);
    title.tabIndex = -1;
    wrap.append(title);
    if (panel.intro) wrap.append(makeElement('p', 'card-note', panel.intro));
    if (panel.stepList.length > 0) {
      const list = makeElement('ol', 'batcard-steps-list');
      panel.stepList.forEach((stepConfig) => list.append(buildStepItem(stepConfig, tool)));
      wrap.append(list);
    }
    if (panel.manual) {
      const manual = makeElement('div', 'batcard-manual');
      manual.append(makeElement('h4', 'batcard-manual-title', panel.manual.title));
      const manualText = makeElement('p', 'card-note');
      appendParts(manualText, panel.manual.parts);
      manual.append(manualText);
      wrap.append(manual);
    }
    return { wrap, title };
  }

  // Ang kahon ng babala na may warning sign.
  function buildWarning(panel) {
    const box = makeElement('div', 'batcard-warning');
    const sign = makeElement('span', 'batcard-warn-sign', '!');
    sign.setAttribute('aria-hidden', 'true');
    const body = makeElement('div', 'batcard-warning-body');
    const title = makeElement('h3', 'batcard-warning-title', TEXT.warningTitle);
    title.tabIndex = -1;
    const list = makeElement('ul', 'batcard-warning-list');
    panel.warningList.forEach((line) => list.append(makeElement('li', '', line)));
    body.append(title, list);
    box.setAttribute('role', 'alert');
    box.append(sign, body);
    return { box, title };
  }

  // Ang checkbox na kailangang i-tick bago lumabas ang mga hakbang.
  function buildAcknowledge(onChange) {
    const label = makeElement('label', 'batcard-ack');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', () => onChange(checkbox.checked));
    label.append(checkbox, makeElement('span', '', TEXT.acknowledge));
    return { label, checkbox };
  }

  // Gumagawa ng panel (nakatago sa simula). May babala at tick kung may warningList; wala kung wala.
  // Ibinibigay ang { element, focusTarget, reset }.
  function buildPanel(tool, panel, onClose) {
    const element = makeElement('div', 'batcard-panel');
    element.id = 'batcard-' + tool.id + '-' + panel.id;
    element.hidden = true;
    const stepsBox = buildStepsBox(panel, tool);
    const childList = [];
    let focusTarget = stepsBox.title;
    let reset = () => {};
    if (panel.warningList) {
      const warning = buildWarning(panel);
      const acknowledge = buildAcknowledge((isChecked) => { stepsBox.wrap.hidden = !isChecked; });
      stepsBox.wrap.hidden = true;
      focusTarget = warning.title;
      reset = () => { acknowledge.checkbox.checked = false; stepsBox.wrap.hidden = true; };
      childList.push(warning.box, acknowledge.label);
    }
    childList.push(stepsBox.wrap);
    const closeButton = makeElement('button', 'btn btn-secondary batcard-close', TEXT.closeButton);
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => onClose(panel.id));
    element.append(...childList, closeButton);
    return { element, focusTarget, reset };
  }

  // Gumagawa ng card ng isang tool: pamagat, para saan, kailangan, mga button at mga panel.
  function buildToolCard(tool) {
    const card = makeElement('div', 'card batcard');
    card.id = 'batcard-' + tool.id;
    const panelMap = {};
    const buttonMap = {};

    function closePanel(panelId, shouldFocusButton) {
      panelMap[panelId].element.hidden = true;
      buttonMap[panelId].setAttribute('aria-expanded', 'false');
      if (shouldFocusButton) buttonMap[panelId].focus();
    }

    function openPanel(panelId) {
      Object.keys(panelMap).forEach((otherId) => { if (otherId !== panelId) closePanel(otherId, false); });
      const record = panelMap[panelId];
      record.reset();
      statusList.forEach((element) => { element.textContent = ''; });
      record.element.hidden = false;
      buttonMap[panelId].setAttribute('aria-expanded', 'true');
      record.focusTarget.focus({ preventScroll: true });
      if (typeof record.element.scrollIntoView === 'function') record.element.scrollIntoView({ block: 'nearest' });
    }

    function togglePanel(panelId) {
      if (panelMap[panelId].element.hidden) openPanel(panelId);
      else closePanel(panelId, false);
    }

    const head = makeElement('div', 'card-head');
    const titleWrap = document.createElement('div');
    const titleRow = makeElement('div', 'batcard-title-row');
    titleRow.append(makeElement('h2', 'card-title', tool.title));
    if (tool.audience) titleRow.append(makeElement('span', 'batcard-tag', tool.audience));
    titleWrap.append(titleRow, makeElement('p', 'card-note', tool.purpose));
    const requires = makeElement('p', 'card-note batcard-requires');
    requires.append(makeElement('strong', '', TEXT.requiresLabel), ' ' + tool.requires);
    titleWrap.append(requires);
    if (tool.limitation) titleWrap.append(makeElement('p', 'card-note', tool.limitation));
    head.append(titleWrap);

    const actions = makeElement('div', 'batcard-actions');
    tool.panelList.forEach((panel) => {
      const button = makeElement('button', 'btn btn-secondary', panel.button);
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'batcard-' + tool.id + '-' + panel.id);
      button.addEventListener('click', () => togglePanel(panel.id));
      buttonMap[panel.id] = button;
      panelMap[panel.id] = buildPanel(tool, panel, (panelId) => closePanel(panelId, true));
      actions.append(button);
    });

    card.append(head, actions);
    tool.panelList.forEach((panel) => card.append(panelMap[panel.id].element));
    return card;
  }

  // Ang card na "Kailangan bago mag-setup": listahan ng kailangan sa bagong PC.
  function buildSetupCard() {
    const setup = config.SETUP;
    const card = makeElement('div', 'card batcard');
    card.id = 'batcard-' + setup.id;
    const head = makeElement('div', 'card-head');
    const titleWrap = document.createElement('div');
    titleWrap.append(makeElement('h2', 'card-title', setup.title), makeElement('p', 'card-note', setup.note));
    head.append(titleWrap);
    const list = makeElement('ul', 'batcard-need-list');
    setup.needList.forEach((need) => {
      const item = document.createElement('li');
      item.append(makeElement('strong', 'batcard-need-label', need.label), ': ' + need.text);
      list.append(item);
    });
    card.append(head, list, makeElement('p', 'card-note', setup.footnote));
    return card;
  }

  // Ginagawa ang mga card sa loob ng #bat-tools-card. Tinatawag ng settings page kada bukas nito.
  function init() {
    const container = document.getElementById(config.CARD_ID);
    if (!container) return;
    window.clearTimeout(copyTimer);
    statusList = [];
    container.replaceChildren(buildSetupCard(), ...config.TOOL_LIST.map(buildToolCard));
  }

  root.batCard = Object.freeze({ init });
})();
