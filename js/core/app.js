/*
 * FILE    : js/core/app.js
 * PURPOSE : Entry point: sidebar, menu, routing
 * DEPENDS : config.js, security.js, router.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 */
'use strict';
import { CONFIG } from './config.js';
import { initSecurity } from './security.js';
import { loadPage, getPageFromHash } from './router.js';

// Nilo-load ang sidebar component.
async function loadSidebar() {
  const holder = document.querySelector(CONFIG.SELECTOR.sidebar);
  try {
    const response = await fetch(CONFIG.COMPONENT_FOLDER + 'sidebar.html');
    if (!response.ok) throw new Error('sidebar');
    holder.innerHTML = await response.text();
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
  bindMenu();
  window.addEventListener('hashchange', handleNavigate);
  await handleNavigate();
}

initApp();
