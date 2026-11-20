/*
 * FILE    : js/pages/watcher-install.js
 * PURPOSE : Settings: card ng File Watcher. Install: may babala muna; kapag tinanggap ng user, ipinapakita ang
 *           folder path ng installer at ang eksaktong gagawin sa File Explorer. Uninstall: hakbang sa pagtanggal.
 *           HINDI nag-i-install o nag-u-uninstall ang website at hindi ito nagpapatakbo ng kahit anong program.
 *           Ang user mismo ang mag-double-click ng .bat (mas ligtas).
 * INPUT   : <div id="watcher-card"> sa settings page; window.location (para malaman ang path ng website)
 * OUTPUT  : DOM lang (textContent lang, walang innerHTML). Walang isinusulat sa disk.
 * DEPENDS : walang. Tinatawag ng js/pages/settings.js: init() at setUnlocked(isUnlocked)
 * VERSION : v1 | 2026-11-21 | bagong file
 * VERSION : v1.1 | 2026-11-21 | dagdag na button at panel na "Paano i-uninstall" (laging bukas, hindi kailangan ng Saving path)
 * VERSION : v1.2 | 2026-11-21 | text ng watcher: kasama ang Data source 1 (ModifiedWatchPaths)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  // Mga constant (pansamantala dito; ililipat sa js/core/config.js kapag pinayagan)
  const WATCHER = Object.freeze({
    CARD_ID: 'watcher-card',
    FOLDER_RELATIVE: 'tools\\file-watcher',
    INSTALL_FILE: 'install-watcher.bat',
    UNINSTALL_FILE: 'uninstall-watcher.bat',
    CONFIG_FILE: 'watcher-config.txt',
    STARTUP_COMMAND: 'shell:startup',
    STARTUP_SHORTCUT: 'BMWW File Watcher',
    SEPARATOR: '\\',
    COPY_STATUS_MS: 4000,
    PANEL: Object.freeze({ install: 'install', uninstall: 'uninstall' })
  });

  const TEXT = Object.freeze({
    title: 'File Watcher (optional)',
    noteReady: 'Kusang nagbubukas ng website kapag may bagong file sa CLO1A o CLO1A1 (o na-modify na file sa Data source 1), kahit nakasara ang browser. Ang user ang mag-i-install nito sa Windows.',
    noteLocked: 'Piliin muna ang Saving path (BMWW) para mabuksan ang Install. Laging bukas ang Paano i-uninstall.',
    installButton: 'Install File Watcher',
    uninstallButton: 'Paano i-uninstall',
    closeButton: 'Isara',
    warningTitle: 'Babala bago mag-install',
    warningList: [
      'Ang installer ay magpapatakbo ng PowerShell script na tumatakbo nang naka-hide at kusang magsisimula tuwing mag-log in sa Windows.',
      'Basa lang ang binabantayan nito: ang mga folder sa WatchPaths (CLO1A at CLO1A1) at sa ModifiedWatchPaths (Data source 1). Wala itong binabago o binubura doon.',
      'Sa company laptop: ipaalam o ipa-approve muna sa IT. Maaaring i-block ito ng antivirus o ng policy ng kumpanya.',
      'Kung may lumabas na block o babala ng Windows o antivirus, huwag itong lampasan. Itigil at sabihin sa IT.',
      'Hindi ito mai-install ng website. Ikaw mismo ang magpapatakbo ng installer sa File Explorer.'
    ],
    acknowledge: 'Naiintindihan ko ang babala at gusto kong magpatuloy.',
    stepsTitle: 'Gawin ito sa File Explorer',
    stepOpen: 'Buksan ang File Explorer (pindutin ang Win + E).',
    stepPaste: 'I-paste ang path na ito sa address bar sa taas, tapos pindutin ang Enter:',
    stepConfigBefore: '(Optional) I-double-click ang ',
    stepConfigAfter: ' para tingnan ang WatchPaths (CLO1A at CLO1A1) at ModifiedWatchPaths (ilagay dito ang full path ng Data source 1). Isara pagkatapos.',
    stepInstallBefore: 'I-double-click ang ',
    stepInstallAfter: '. Hindi kailangan ang "Run as administrator".',
    stepDone: 'Dapat lumabas sa itim na window ang "TAPOS: tumatakbo na ang watcher". Pindutin ang kahit anong key para isara ito.',
    installToUninstall: 'Para tanggalin ito sa susunod, pindutin ang "Paano i-uninstall" sa card na ito.',
    uninstallTitle: 'Paano tanggalin ang File Watcher',
    uninstallIntro: 'Ligtas ito. Titigil ang watcher at hindi na ito kusang tatakbo sa pag-log in. Hindi nito binubura ang mga folder mo, ang mga file sa CLO1A, CLO1A1 at Data source 1, o ang website.',
    uninstallRunBefore: 'I-double-click ang ',
    uninstallRunAfter: '. Hindi kailangan ang "Run as administrator".',
    uninstallResult: 'Dapat lumabas sa itim na window ang "Natanggal ang shortcut sa Startup." (o "Walang shortcut sa Startup." kung wala pa), "Itinigil ang watcher." kung may tumatakbo, at "TAPOS." Pindutin ang kahit anong key para isara ito.',
    uninstallCheckBefore: 'Para makasiguro: pindutin ang Win + R, i-type ang ',
    uninstallCheckMiddle: ', tapos Enter. Dapat wala nang "',
    uninstallCheckAfter: '" sa folder na bubukas.',
    uninstallManualTitle: 'Kung hindi gumana o naka-block ang .bat',
    uninstallManualBefore: 'Pindutin ang Win + R, i-type ang ',
    uninstallManualMiddle: ', Enter, tapos burahin ang "',
    uninstallManualAfter: '" sa folder na bubukas. Hindi na ito kusang tatakbo sa susunod na pag-log in. Titigil ang kasalukuyang tumatakbo kapag nag-restart o nag-sign out ka. Kung company laptop, sabihin sa IT kung bakit na-block.',
    pathLabel: 'Path ng folder ng watcher',
    copyButton: 'Copy path',
    copied: 'Na-copy ang path.',
    copyManual: 'Hindi nakopya nang kusa. Napili na ang path; pindutin ang Ctrl + C.',
    pathNotExact: 'Hindi mahulaan ang eksaktong path dahil hindi double-click (file) ang pagbukas ng website. Hanapin ang folder na ito sa loob ng folder ng website.'
  });

  let isUnlocked = false;
  let refs = null;
  let copyTimer = 0;

  // Gumagawa ng elemento na may class at text (textContent lang).
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  // Gumagawa ng pangalan ng file na may espesyal na itsura sa loob ng hakbang.
  function makeFileName(fileName) {
    return makeElement('code', 'watcher-file', fileName);
  }

  // Hinuhulaan ang Windows path ng tools\file-watcher ayon sa kinabuksan ng website (file://).
  // Ibinibigay ang { path, isExact }. Kung hindi file:// o may problema, relative na path lang at isExact false.
  function getWatcherFolderPath() {
    const fallback = { path: WATCHER.FOLDER_RELATIVE, isExact: false };
    const location = window.location;
    if (location.protocol !== 'file:') return fallback;
    try {
      const folderPart = decodeURIComponent(location.pathname).replace(/[^/]*$/, '').replace(/\/+$/, '');
      let basePath = folderPart.replace(/^\/([A-Za-z]:)/, '$1').replace(/\//g, WATCHER.SEPARATOR);
      if (location.host) basePath = WATCHER.SEPARATOR + WATCHER.SEPARATOR + location.host + basePath;
      return { path: basePath + WATCHER.SEPARATOR + WATCHER.FOLDER_RELATIVE, isExact: true };
    } catch (error) {
      return fallback;
    }
  }

  // Ipinapakita ang mensahe ng Copy (sa isang status lang), at binubura pagkalipas ng ilang segundo.
  function showCopyStatus(statusElement, message) {
    refs.statusList.forEach((element) => { element.textContent = ''; });
    statusElement.textContent = message;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => { statusElement.textContent = ''; }, WATCHER.COPY_STATUS_MS);
  }

  // Kinokopya ang path sa clipboard. Kung hindi puwede, pinipili ang text para si user na ang mag-Ctrl+C.
  async function copyPath(input, statusElement) {
    try {
      if (!(navigator.clipboard && window.isSecureContext)) throw new Error('noClipboard');
      await navigator.clipboard.writeText(input.value);
      showCopyStatus(statusElement, TEXT.copied);
    } catch (error) {
      input.focus();
      input.select();
      let isCopied = false;
      try { isCopied = document.execCommand('copy'); } catch (copyError) { isCopied = false; }
      showCopyStatus(statusElement, isCopied ? TEXT.copied : TEXT.copyManual);
    }
  }

  // Ang path ng folder (readonly), Copy button, status at paalala kung hindi eksakto. Ginagamit sa Install at Uninstall.
  function buildPathBlock() {
    const block = document.createElement('div');
    const pathInfo = getWatcherFolderPath();
    const row = makeElement('div', 'watcher-path-row');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input watcher-path-input';
    input.readOnly = true;
    input.spellcheck = false;
    input.value = pathInfo.path;
    input.setAttribute('aria-label', TEXT.pathLabel);
    const statusElement = makeElement('p', 'card-note watcher-copy-status');
    statusElement.setAttribute('role', 'status');
    refs.statusList.push(statusElement);
    const copyButton = makeElement('button', 'btn btn-secondary', TEXT.copyButton);
    copyButton.type = 'button';
    copyButton.addEventListener('click', () => copyPath(input, statusElement));
    row.append(input, copyButton);
    block.append(row, statusElement);
    if (!pathInfo.isExact) block.append(makeElement('p', 'card-note', TEXT.pathNotExact));
    return block;
  }

  // Ang kahon ng babala na may warning sign.
  function buildWarning() {
    const box = makeElement('div', 'watcher-warning');
    const sign = makeElement('span', 'watcher-warn-sign', '!');
    sign.setAttribute('aria-hidden', 'true');
    const body = makeElement('div', 'watcher-warning-body');
    refs.warningTitle = makeElement('h3', 'watcher-warning-title', TEXT.warningTitle);
    refs.warningTitle.tabIndex = -1;
    const list = makeElement('ul', 'watcher-warning-list');
    TEXT.warningList.forEach((line) => list.append(makeElement('li', '', line)));
    body.append(refs.warningTitle, list);
    box.setAttribute('role', 'alert');
    box.append(sign, body);
    return box;
  }

  // Ang checkbox na kailangang i-tick bago lumabas ang mga hakbang ng install.
  function buildAcknowledge() {
    const label = makeElement('label', 'watcher-ack');
    refs.acknowledge = document.createElement('input');
    refs.acknowledge.type = 'checkbox';
    refs.acknowledge.addEventListener('change', onAcknowledgeChange);
    label.append(refs.acknowledge, makeElement('span', '', TEXT.acknowledge));
    return label;
  }

  // Ang mga hakbang ng install: path ng folder at ang gagawin ni user.
  function buildInstallSteps() {
    const wrap = makeElement('div', 'watcher-steps');
    wrap.hidden = true;
    wrap.append(makeElement('h3', 'watcher-steps-title', TEXT.stepsTitle));
    const list = makeElement('ol', 'watcher-steps-list');
    const stepPaste = makeElement('li', '', TEXT.stepPaste);
    stepPaste.append(buildPathBlock());
    const stepConfig = makeElement('li');
    stepConfig.append(TEXT.stepConfigBefore, makeFileName(WATCHER.CONFIG_FILE), TEXT.stepConfigAfter);
    const stepInstall = makeElement('li');
    stepInstall.append(TEXT.stepInstallBefore, makeFileName(WATCHER.INSTALL_FILE), TEXT.stepInstallAfter);
    list.append(makeElement('li', '', TEXT.stepOpen), stepPaste, stepConfig, stepInstall, makeElement('li', '', TEXT.stepDone));
    wrap.append(list, makeElement('p', 'card-note', TEXT.installToUninstall));
    refs.steps = wrap;
    return wrap;
  }

  // Gumagawa ng panel na may Isara button sa dulo. Nakatago sa simula.
  function buildPanel(panelName, childList) {
    const panel = makeElement('div', 'watcher-panel');
    panel.id = 'watcher-panel-' + panelName;
    panel.hidden = true;
    const closeButton = makeElement('button', 'btn btn-secondary watcher-close', TEXT.closeButton);
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => closePanel(panelName, true));
    panel.append(...childList, closeButton);
    refs.panelMap[panelName] = panel;
    return panel;
  }

  // Ang panel ng install: babala, checkbox, hakbang.
  function buildInstallPanel() {
    return buildPanel(WATCHER.PANEL.install, [buildWarning(), buildAcknowledge(), buildInstallSteps()]);
  }

  // Ang panel ng uninstall: hakbang, pagsusuri, at manual na paraan. Walang babala o tick (ligtas ito).
  function buildUninstallPanel() {
    const wrap = makeElement('div', 'watcher-steps');
    refs.uninstallTitle = makeElement('h3', 'watcher-steps-title', TEXT.uninstallTitle);
    refs.uninstallTitle.tabIndex = -1;
    wrap.append(refs.uninstallTitle, makeElement('p', 'card-note', TEXT.uninstallIntro));
    const list = makeElement('ol', 'watcher-steps-list');
    const stepPaste = makeElement('li', '', TEXT.stepPaste);
    stepPaste.append(buildPathBlock());
    const stepRun = makeElement('li');
    stepRun.append(TEXT.uninstallRunBefore, makeFileName(WATCHER.UNINSTALL_FILE), TEXT.uninstallRunAfter);
    const stepCheck = makeElement('li');
    stepCheck.append(TEXT.uninstallCheckBefore, makeFileName(WATCHER.STARTUP_COMMAND), TEXT.uninstallCheckMiddle, makeFileName(WATCHER.STARTUP_SHORTCUT), TEXT.uninstallCheckAfter);
    list.append(makeElement('li', '', TEXT.stepOpen), stepPaste, stepRun, makeElement('li', '', TEXT.uninstallResult), stepCheck);
    const manual = makeElement('div', 'watcher-manual');
    manual.append(makeElement('h4', 'watcher-manual-title', TEXT.uninstallManualTitle));
    const manualText = makeElement('p', 'card-note');
    manualText.append(TEXT.uninstallManualBefore, makeFileName(WATCHER.STARTUP_COMMAND), TEXT.uninstallManualMiddle, makeFileName(WATCHER.STARTUP_SHORTCUT), TEXT.uninstallManualAfter);
    manual.append(manualText);
    wrap.append(list, manual);
    return buildPanel(WATCHER.PANEL.uninstall, [wrap]);
  }

  // Binubuksan ang panel (isa lang ang bukas). Ang install ay laging nagsisimula sa babala (naka-untick, nakatago ang hakbang).
  function openPanel(panelName) {
    Object.keys(refs.panelMap).forEach((name) => { if (name !== panelName) closePanel(name, false); });
    if (panelName === WATCHER.PANEL.install) {
      refs.acknowledge.checked = false;
      refs.steps.hidden = true;
    }
    refs.statusList.forEach((element) => { element.textContent = ''; });
    const panel = refs.panelMap[panelName];
    panel.hidden = false;
    refs.buttonMap[panelName].setAttribute('aria-expanded', 'true');
    const focusTarget = panelName === WATCHER.PANEL.install ? refs.warningTitle : refs.uninstallTitle;
    focusTarget.focus({ preventScroll: true });
    if (typeof panel.scrollIntoView === 'function') panel.scrollIntoView({ block: 'nearest' });
  }

  // Isinasara ang panel. Kapag galing sa Isara button, ibinabalik ang focus sa button nito.
  function closePanel(panelName, shouldFocusButton) {
    refs.panelMap[panelName].hidden = true;
    refs.buttonMap[panelName].setAttribute('aria-expanded', 'false');
    if (shouldFocusButton) refs.buttonMap[panelName].focus();
  }

  // Lalabas lang ang mga hakbang ng install kapag naka-tick ang "Naiintindihan ko".
  function onAcknowledgeChange() {
    refs.steps.hidden = !refs.acknowledge.checked;
  }

  // Click ng Install File Watcher: buksan o isara ang panel (walang ini-install).
  function onInstallClick() {
    if (!isUnlocked) return;
    togglePanel(WATCHER.PANEL.install);
  }

  // Click ng Paano i-uninstall: buksan o isara ang panel (walang tinatanggal).
  function onUninstallClick() {
    togglePanel(WATCHER.PANEL.uninstall);
  }

  // Binubuksan kung sarado, isinasara kung bukas.
  function togglePanel(panelName) {
    if (refs.panelMap[panelName].hidden) openPanel(panelName);
    else closePanel(panelName, false);
  }

  // Ina-update ang Install button at note ayon sa may Saving path na o wala pa. Laging bukas ang Uninstall.
  function applyLock() {
    if (!refs) return;
    refs.buttonMap[WATCHER.PANEL.install].disabled = !isUnlocked;
    refs.note.textContent = isUnlocked ? TEXT.noteReady : TEXT.noteLocked;
    if (!isUnlocked) closePanel(WATCHER.PANEL.install, false);
  }

  // Gumagawa ng button na may aria para sa panel nito.
  function buildButton(panelName, label, onClick) {
    const button = makeElement('button', 'btn btn-secondary', label);
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'watcher-panel-' + panelName);
    button.addEventListener('click', onClick);
    refs.buttonMap[panelName] = button;
    return button;
  }

  // Ginagawa ang card sa loob ng #watcher-card. Tinatawag ng settings page kada bukas nito.
  function init() {
    const container = document.getElementById(WATCHER.CARD_ID);
    if (!container) { refs = null; return; }
    window.clearTimeout(copyTimer);
    refs = { panelMap: {}, buttonMap: {}, statusList: [] };
    const head = makeElement('div', 'card-head');
    const titleWrap = document.createElement('div');
    titleWrap.append(makeElement('h2', 'card-title', TEXT.title));
    refs.note = makeElement('p', 'card-note');
    titleWrap.append(refs.note);
    head.append(titleWrap);
    const actions = makeElement('div', 'watcher-actions');
    actions.append(
      buildButton(WATCHER.PANEL.install, TEXT.installButton, onInstallClick),
      buildButton(WATCHER.PANEL.uninstall, TEXT.uninstallButton, onUninstallClick)
    );
    refs.buttonMap[WATCHER.PANEL.install].classList.add('watcher-install-button');
    refs.buttonMap[WATCHER.PANEL.uninstall].classList.add('watcher-uninstall-button');
    container.replaceChildren(head, actions, buildInstallPanel(), buildUninstallPanel());
    applyLock();
  }

  // Sinasabi ng settings page kung may Saving path na (bukas ang Install) o wala pa (sarado).
  function setUnlocked(value) {
    isUnlocked = Boolean(value);
    applyLock();
  }

  root.watcherInstall = Object.freeze({ init, setUnlocked });
})();
