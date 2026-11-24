/*
 * FILE    : js/core/app.js
 * PURPOSE : Entry point: sidebar, menu, routing
 * DEPENDS : config.js, registry.js, security.js, router.js, monitor.js
 * VERSION : v22 | 2026-11-24 | Batch B: sinisimulan ang accessGuard.start (autochecker ng folder) pagkatapos ng monitor
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | sidebar mula sa registry (walang fetch, walang import)
 * VERSION : v5.2 | 2026-11-21 | sinisimulan ang monitor (monitor.start) pagkatapos buksan ang unang page
 * VERSION : v5.3 | 2026-11-21 | itinatago sa sidebar ang Search Files, Calibration, Master kapag LEAD PC; nag-a-update kapag nagbago ang settings
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const { initSecurity } = root.security;
  const { loadPage, getPageFromHash, isPageBlocked, applyNavAccess } = root.router;

  // Nilalagay ang sidebar component (template mula sa registry).
  async function loadSidebar() {
    const holder = document.querySelector(CONFIG.SELECTOR.sidebar);
    try {
      const html = root.registry.getTemplate(CONFIG.SIDEBAR_TEMPLATE);
      if (html === null) throw new Error('sidebar');
      holder.innerHTML = html;
    } catch (error) {
      holder.textContent = CONFIG.TEXT.sidebarError;
    }
  }

  // Binubuksan o isinasara ang mobile menu.
  function setMenuOpen(isOpen) {
    document.body.classList.toggle(CONFIG.OPEN_CLASS, isOpen);
  }

  // Nilalagay ang click handlers ng menu.
  function bindMenu() {
    document.querySelector(CONFIG.SELECTOR.menuButton).addEventListener('click', () => setMenuOpen(!document.body.classList.contains(CONFIG.OPEN_CLASS)));
    document.querySelector(CONFIG.SELECTOR.overlay).addEventListener('click', () => setMenuOpen(false));
    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest(CONFIG.SELECTOR.navLink)) setMenuOpen(false);
    });
  }

  // Nagbubukas ng page ayon sa hash.
  function handleNavigate() {
    return loadPage(getPageFromHash());
  }

  // Simula ng app.
  async function initApp() {
    initSecurity();
    await loadSidebar();
    applyNavAccess();
    bindMenu();
    window.addEventListener('hashchange', handleNavigate);
    // Kapag nagbago ang settings (hal. naging LEAD PC): i-update ang sidebar, at paalisin sa page na hindi na puwede.
    window.addEventListener(CONFIG.SETTINGS_CHANGED_EVENT, () => {
      applyNavAccess();
      if (isPageBlocked(getPageFromHash())) handleNavigate();
    });
    await handleNavigate();
    root.monitor.start(false);
    if (root.accessGuard) root.accessGuard.start();
  }

  initApp();
})();
