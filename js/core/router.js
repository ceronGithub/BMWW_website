/*
 * FILE    : js/core/router.js
 * PURPOSE : Nagloload ng page sa content area
 * DEPENDS : js/core/config.js, js/core/registry.js, js/core/storage.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | template mula sa registry at classic script (walang fetch, walang import)
 * VERSION : v5.3 | 2026-11-21 | isPageBlocked at applyNavAccess: hinaharang ang Search Files, Calibration, Master sa LEAD PC
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const registry = root.registry;
  const loadedStyleList = [];
  const loadedScriptList = [];

  // Kinukuha ang page name mula sa URL hash.
  function getPageFromHash() {
    const name = window.location.hash.replace('#', '');
    return name || CONFIG.DEFAULT_PAGE;
  }

  // Nagpapakita ng mensahe sa content area gamit ang textContent.
  function showMessage(message) {
    const paragraph = document.createElement('p');
    paragraph.className = 'state-message';
    paragraph.textContent = message;
    document.querySelector(CONFIG.SELECTOR.content).replaceChildren(paragraph);
  }

  // Nilo-load ang CSS ng page nang isang beses lang.
  function ensureStylesheet(href) {
    const url = new URL(href, document.baseURI).href;
    if (loadedStyleList.includes(url)) return Promise.resolve();
    loadedStyleList.push(url);
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.addEventListener('load', resolve);
      link.addEventListener('error', resolve);
      document.head.append(link);
    });
  }

  // Nilo-load ang JS ng page nang isang beses lang (classic script, gumagana sa file://).
  function ensureScript(src) {
    const url = new URL(src, document.baseURI).href;
    if (loadedScriptList.includes(url)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.addEventListener('load', () => { loadedScriptList.push(url); resolve(); });
      script.addEventListener('error', () => { script.remove(); reject(new Error('script')); });
      document.head.append(script);
    });
  }

  // Minamarkahan ang active link sa sidebar.
  function setActiveLink(pageName) {
    document.querySelectorAll(CONFIG.SELECTOR.navLink).forEach((link) => {
      link.classList.toggle(CONFIG.ACTIVE_CLASS, link.dataset.page === pageName);
    });
  }

  // LEAD PC ba ang machine na ito? Binabasa ang settings sa localStorage (parehong pinagkukunan ng monitor at dashboard).
  function isLeadPc() {
    return root.storage.readLocalSettings().machineMode === CONFIG.MACHINE_MODE.LEAD_PC;
  }

  // Bawal ba sa machine na ito ang page? Ang LEAD PC ay hindi puwede sa Search Files, Calibration at Master.
  function isPageBlocked(pageName) {
    return isLeadPc() && CONFIG.LEAD_BLOCKED_PAGES.includes(pageName);
  }

  // Itinatago ang mga link ng bawal na page sa sidebar (ibinabalik kapag hindi na LEAD PC).
  function applyNavAccess() {
    document.querySelectorAll(CONFIG.SELECTOR.navLink).forEach((link) => {
      const item = link.closest('li');
      if (item) item.hidden = isPageBlocked(link.dataset.page);
    });
  }

  // Nilo-load ang page: template, CSS, JS, tapos init ng page.
  async function loadPage(pageName) {
    // Kung bawal ang page (LEAD PC na nag-type ng #master sa URL), ibabalik sa Dashboard. Ang hashchange ang magbubukas ng Dashboard.
    if (isPageBlocked(pageName)) {
      window.location.replace('#' + CONFIG.DEFAULT_PAGE);
      return;
    }
    const pageToLoad = CONFIG.PAGE_LIST.includes(pageName) ? pageName : CONFIG.NOT_FOUND_PAGE;
    showMessage(CONFIG.TEXT.loading);
    try {
      const html = registry.getTemplate(pageToLoad);
      if (html === null) throw new Error('page');
      const template = document.createElement('template');
      template.innerHTML = html;
      const styleList = [...template.content.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.getAttribute('href'));
      const scriptList = [...template.content.querySelectorAll('script[src]')].map((node) => node.getAttribute('src'));
      template.content.querySelectorAll('link, script').forEach((node) => node.remove());
      await Promise.all(styleList.map(ensureStylesheet));
      document.querySelector(CONFIG.SELECTOR.content).replaceChildren(template.content);
      for (const source of scriptList) await ensureScript(source);
      const pageApi = registry.getPage(pageToLoad);
      if (pageApi && typeof pageApi.init === 'function') await pageApi.init();
      setActiveLink(pageToLoad);
    } catch (error) {
      showMessage(CONFIG.TEXT.pageError);
    }
  }

  root.router = Object.freeze({ loadPage, getPageFromHash, isPageBlocked, applyNavAccess });
})();
