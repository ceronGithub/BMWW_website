/*
 * FILE     : js/core/access-guard.js
 * PURPOSE  : Autochecker ng mga folder (Saving path, Server path, Data source 1 hanggang 3; LEAD PC: walang Data source): sinusuri pagkabukas ng app at kada 30 segundo,
 *            nagpapakita ng banner kung ano ang kulang, isang click na Payagan lahat, at awtomatikong pagbalik ng settings mula sa BMWW kapag blangko ang browser
 * DEPENDS  : js/core/config.js, js/core/storage.js, js/core/access-guard-config.js; settings-type-config.js; opsyonal: settings-restore.js, monitor.js, router.js
 * USED BY  : js/core/app.js (start), index.html (script)
 * VERSION  : v22 | 2026-11-24 | bagong file (Batch B: Task 5 at 9)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const GUARD = root.accessGuardConfig;
  const STATUS = GUARD.STATUS;
  const TEXT = GUARD.TEXT;
  const storage = root.storage;

  // ===== STATE =====
  let entryList = [];
  let barElement = null;
  let timerId = null;
  let isChecking = false;
  let isRequesting = false;
  let message = '';
  let isStarted = false;

  // ===== DATA =====
  /**
   * PARA SAAN    : alamin kung itatago ang path sa uri ng machine (Data source sa LEAD PC)
   * GINAGAWA     : LEAD PC + key na nasa settingsTypeConfig.LEAD_HIDDEN_KEYS (constants lang; hindi kailangan ang settings-type.js na naglo-load lang sa Settings page)
   * INPUT/OUTPUT : key (string), mode (string) -> boolean
   * TINATAWAG NG : access-guard.js collectEntries
   * TUMATAWAG SA : wala
   */
  function isHiddenForMode(key, mode) {
    const typeConfig = root.settingsTypeConfig;
    return Boolean(typeConfig) && mode === CONFIG.MACHINE_MODE.LEAD_PC && typeConfig.LEAD_HIDDEN_KEYS.includes(key);
  }

  /**
   * PARA SAAN    : alamin kung mababasa ang folder (nakakabit ang drive o server)
   * GINAGAWA     : sinusubukang basahin ang unang entry ng folder
   * INPUT/OUTPUT : handle -> Promise<boolean> (false kapag may error)
   * TINATAWAG NG : access-guard.js inspectEntry
   * TUMATAWAG SA : handle.values
   */
  async function folderExists(handle) {
    try {
      await handle.values().next();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * PARA SAAN    : alamin ang kalagayan ng isang folder (walang hinihinging permission)
   * GINAGAWA     : loadHandle, queryPermission, tapos folderExists; kapag walang handle: needPick o notSet ayon sa naka-save na pangalan
   * INPUT/OUTPUT : pathItem ({key, label}), settings -> Promise<{key, label, status, handle}>
   * TINATAWAG NG : access-guard.js collectEntries
   * TUMATAWAG SA : storage.loadHandle, handle.queryPermission, access-guard.js folderExists
   */
  async function inspectEntry(pathItem, settings) {
    const names = settings.folderNames || {};
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    const hasSavedName = Boolean(names[pathItem.key] || paths[pathItem.key]);
    let handle = null;
    try {
      handle = await storage.loadHandle(CONFIG.HANDLE_KEY[pathItem.key]);
    } catch (error) {
      handle = null;
    }
    const base = { key: pathItem.key, label: pathItem.label, handle };
    if (!handle) return { ...base, status: hasSavedName ? STATUS.needPick : STATUS.notSet };
    let permission = 'prompt';
    try {
      permission = await handle.queryPermission({ mode: 'readwrite' });
    } catch (error) {
      permission = 'prompt';
    }
    if (permission !== 'granted') return { ...base, status: STATUS.needPermission };
    return { ...base, status: (await folderExists(handle)) ? STATUS.ok : STATUS.missing };
  }

  /**
   * PARA SAAN    : kolektahin ang kalagayan ng lahat ng folder na kailangan ng uri ng machine
   * GINAGAWA     : inspectEntry sa bawat path; kapag wala pang settings (walang uri), hindi isinasama ang notSet at needPick
   * INPUT/OUTPUT : wala -> Promise<Array>
   * TINATAWAG NG : access-guard.js recheck
   * TUMATAWAG SA : storage.readLocalSettings, access-guard.js isHiddenForMode, inspectEntry
   */
  async function collectEntries() {
    const settings = storage.readLocalSettings();
    const mode = settings.machineMode || '';
    const result = [];
    for (const pathItem of CONFIG.PATH_LIST) {
      if (isHiddenForMode(pathItem.key, mode)) continue;
      const entry = await inspectEntry(pathItem, settings);
      if (!mode && (entry.status === STATUS.notSet || entry.status === STATUS.needPick)) continue;
      result.push(entry);
    }
    return result;
  }

  // ===== RENDER =====
  /**
   * PARA SAAN    : gumawa ng element na may class at text nang walang innerHTML
   * GINAGAWA     : createElement, className, textContent
   * INPUT/OUTPUT : tagName, className, text -> HTMLElement
   * TINATAWAG NG : access-guard.js ensureBar, buildRow, render
   * TUMATAWAG SA : wala
   */
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  /**
   * PARA SAAN    : kunin o gawin ang banner sa itaas ng content
   * GINAGAWA     : hinahanap ang #access-guard; kung wala, ginagawa at inilalagay bago ang #content
   * INPUT/OUTPUT : wala -> HTMLElement | null (kung walang #content)
   * TINATAWAG NG : access-guard.js render
   * TUMATAWAG SA : access-guard.js makeElement
   */
  function ensureBar() {
    if (barElement && document.contains(barElement)) return barElement;
    const content = document.querySelector(GUARD.SELECTOR.content);
    if (!content || !content.parentNode) return null;
    barElement = makeElement('section', 'access-guard');
    barElement.id = GUARD.ID.bar;
    barElement.setAttribute('role', 'status');
    barElement.setAttribute('aria-live', 'polite');
    content.parentNode.insertBefore(barElement, content);
    return barElement;
  }

  /**
   * PARA SAAN    : isang linya ng banner (folder, kalagayan, button)
   * GINAGAWA     : pangalan, status text, at button (Payagan / Suriin ulit) o link sa Settings
   * INPUT/OUTPUT : entry -> HTMLElement
   * TINATAWAG NG : access-guard.js render
   * TUMATAWAG SA : access-guard.js makeElement, requestOne, recheck
   */
  function buildRow(entry) {
    const row = makeElement('li', 'access-guard-row');
    const text = makeElement('div', 'access-guard-text');
    text.append(makeElement('strong', '', entry.label), makeElement('span', 'access-guard-status', TEXT.statusLabel[entry.status]));
    row.append(text);
    if (entry.status === STATUS.needPermission) {
      const button = makeElement('button', 'btn btn-secondary access-guard-button', TEXT.allowOne);
      button.type = 'button';
      button.addEventListener('click', () => requestOne(entry));
      row.append(button);
    } else if (entry.status === STATUS.missing) {
      const button = makeElement('button', 'btn btn-secondary access-guard-button', TEXT.recheck);
      button.type = 'button';
      button.addEventListener('click', () => recheck());
      row.append(button);
    } else {
      const link = makeElement('a', 'btn btn-secondary access-guard-button', TEXT.openSettings);
      link.href = GUARD.SETTINGS_HREF;
      row.append(link);
    }
    return row;
  }

  /**
   * PARA SAAN    : ipakita o itago ang banner ayon sa kalagayan ng mga folder
   * GINAGAWA     : kapag lahat ay ok, itinatago; kung hindi, listahan ng may problema, button na Payagan lahat at mga tagubilin ayon sa uri ng problema
   * INPUT/OUTPUT : wala (gumagamit ng entryList at message) -> void
   * TINATAWAG NG : access-guard.js recheck, requestAll, requestOne
   * TUMATAWAG SA : access-guard.js ensureBar, makeElement, buildRow, requestAll
   */
  function render() {
    const bar = ensureBar();
    if (!bar) return;
    const issueList = entryList.filter((entry) => entry.status !== STATUS.ok);
    if (!issueList.length) {
      bar.hidden = true;
      bar.replaceChildren();
      return;
    }
    const has = (status) => issueList.some((entry) => entry.status === status);
    const head = makeElement('div', 'access-guard-head');
    head.append(makeElement('h2', 'access-guard-title', TEXT.title));
    if (has(STATUS.needPermission)) {
      const allButton = makeElement('button', 'btn btn-primary access-guard-all', isRequesting ? TEXT.working : TEXT.allowAll);
      allButton.type = 'button';
      allButton.disabled = isRequesting;
      allButton.addEventListener('click', () => requestAll());
      head.append(allButton);
    }
    const list = makeElement('ul', 'access-guard-list');
    issueList.forEach((entry) => list.append(buildRow(entry)));
    const helpList = [];
    if (has(STATUS.needPermission)) helpList.push(TEXT.helpPermission);
    if (has(STATUS.notSet) || has(STATUS.needPick)) helpList.push(TEXT.helpSettings);
    if (has(STATUS.missing)) helpList.push(TEXT.helpMissing);
    const children = [head, list, ...helpList.map((help) => makeElement('p', 'access-guard-help', help))];
    if (message) children.push(makeElement('p', 'access-guard-help access-guard-message', message));
    bar.replaceChildren(...children);
    bar.hidden = false;
  }

  // ===== ACTIONS =====
  /**
   * PARA SAAN    : kapag blangko ang settings ng browser pero may BMWW na may permission, ibalik ang settings mula sa file (Task 9)
   * GINAGAWA     : restoreFromFolder; kapag restored, isinusulat sa localStorage (walang sinusulat sa file)
   * INPUT/OUTPUT : wala -> Promise<boolean> (true kung naibalik)
   * TINATAWAG NG : access-guard.js start, afterGrant
   * TUMATAWAG SA : storage.readLocalSettings, settingsRestore.restoreFromFolder, storage.writeLocalSettings
   */
  async function restoreSettingsIfBlank() {
    const rootEntry = entryList.find((entry) => entry.key === CONFIG.ROOT_KEY);
    if (!rootEntry || rootEntry.status !== STATUS.ok || !root.settingsRestore) return false;
    if (storage.readLocalSettings().machineMode) return false;
    try {
      const outcome = await root.settingsRestore.restoreFromFolder(rootEntry.handle, '');
      if (outcome.result !== root.settingsRestoreConfig.RESULT.restored) return false;
      storage.writeLocalSettings(outcome.settings);
      message = TEXT.restored;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * PARA SAAN    : pagkatapos mabigyan ng permission: ibalik ang settings kung blangko, i-restart ang monitor, at i-refresh ang Settings page kung bukas
   * GINAGAWA     : restoreSettingsIfBlank, monitor.start(false), router.loadPage('settings') kung nasa Settings
   * INPUT/OUTPUT : wala -> Promise<void>
   * TINATAWAG NG : access-guard.js requestOne, requestAll
   * TUMATAWAG SA : access-guard.js restoreSettingsIfBlank, recheck, monitor.start, router.loadPage
   */
  async function afterGrant() {
    await recheck();
    await restoreSettingsIfBlank();
    await recheck();
    if (root.monitor) {
      try { await root.monitor.start(false); } catch (error) { /* hindi kritikal */ }
    }
    if (root.router && root.router.getPageFromHash() === GUARD.SETTINGS_PAGE) {
      try { await root.router.loadPage(GUARD.SETTINGS_PAGE); } catch (error) { /* hindi kritikal */ }
    }
  }

  /**
   * PARA SAAN    : humingi ng permission sa isang folder (galing sa click)
   * GINAGAWA     : storage.hasPermission(handle, true) at afterGrant kapag pumayag
   * INPUT/OUTPUT : entry -> Promise<boolean>
   * TINATAWAG NG : click sa button na Payagan ng isang folder
   * TUMATAWAG SA : storage.hasPermission, access-guard.js afterGrant, render
   */
  async function requestOne(entry) {
    let isAllowed = false;
    try {
      isAllowed = await storage.hasPermission(entry.handle, true);
    } catch (error) {
      isAllowed = false;
    }
    if (isAllowed) await afterGrant();
    else render();
    return isAllowed;
  }

  /**
   * PARA SAAN    : isang click para sa lahat ng folder na kailangan ng permission
   * GINAGAWA     : isa-isang humihingi; kung hindi pinayagan ang iba o pumalya, may mensahe at pinipindot na lang ang Payagan ng bawat isa
   * INPUT/OUTPUT : wala -> Promise<boolean> (true kung lahat ay napayagan)
   * TINATAWAG NG : click sa Payagan lahat
   * TUMATAWAG SA : storage.hasPermission, access-guard.js afterGrant, render
   */
  async function requestAll() {
    if (isRequesting) return false;
    isRequesting = true;
    message = '';
    render();
    let isAllAllowed = true;
    for (const entry of entryList.filter((item) => item.status === STATUS.needPermission)) {
      try {
        if (!(await storage.hasPermission(entry.handle, true))) isAllAllowed = false;
      } catch (error) {
        isAllAllowed = false;
      }
    }
    isRequesting = false;
    if (!isAllAllowed) message = TEXT.requestFailed;
    await afterGrant();
    return isAllAllowed;
  }

  /**
   * PARA SAAN    : suriin ulit ang lahat ng folder at i-update ang banner (walang hinihinging permission)
   * GINAGAWA     : collectEntries at render; hindi nagpapatong ng dalawang pagsusuri
   * INPUT/OUTPUT : wala -> Promise<Array> (entryList)
   * TINATAWAG NG : timer, visibilitychange, focus, settings-changed, access-guard.js start, afterGrant, button na Suriin ulit
   * TUMATAWAG SA : access-guard.js collectEntries, render
   */
  async function recheck() {
    if (isChecking) return entryList;
    isChecking = true;
    try {
      entryList = await collectEntries();
      if (entryList.every((entry) => entry.status === STATUS.ok)) message = '';
    } catch (error) {
      entryList = [];
    } finally {
      isChecking = false;
    }
    render();
    return entryList;
  }

  // ===== INIT =====
  /**
   * PARA SAAN    : kapag bumalik sa tab o nag-focus ang window
   * GINAGAWA     : recheck kung nakikita ang tab
   * INPUT/OUTPUT : wala -> void
   * TINATAWAG NG : visibilitychange, focus
   * TUMATAWAG SA : access-guard.js recheck
   */
  function handleResume() {
    if (document.visibilityState === 'hidden') return;
    recheck();
  }

  /**
   * PARA SAAN    : simulan ang autochecker
   * GINAGAWA     : recheck, ibalik ang settings kung blangko, timer kada 30 segundo, at pakikinig sa pagbalik sa tab at pagbabago ng settings; isang beses lang
   * INPUT/OUTPUT : wala -> Promise<void>
   * TINATAWAG NG : app.js initApp
   * TUMATAWAG SA : access-guard.js recheck, restoreSettingsIfBlank, handleResume
   */
  async function start() {
    if (isStarted || !storage.isFolderAccessSupported()) return;
    isStarted = true;
    await recheck();
    if (await restoreSettingsIfBlank()) await afterGrant();
    timerId = window.setInterval(recheck, GUARD.CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    window.addEventListener(CONFIG.SETTINGS_CHANGED_EVENT, recheck);
  }

  /**
   * PARA SAAN    : itigil ang autochecker (para sa test)
   * GINAGAWA     : tinatanggal ang timer at listener
   * INPUT/OUTPUT : wala -> void
   * TINATAWAG NG : wala (test lang)
   * TUMATAWAG SA : wala
   */
  function stop() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
    isStarted = false;
    document.removeEventListener('visibilitychange', handleResume);
    window.removeEventListener('focus', handleResume);
    window.removeEventListener(CONFIG.SETTINGS_CHANGED_EVENT, recheck);
  }

  root.accessGuard = Object.freeze({ start, stop, recheck, requestAll, getEntries: () => entryList.slice() });
})();
