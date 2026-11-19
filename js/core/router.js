/*
 * FILE    : js/core/router.js
 * PURPOSE : Nagloload ng page sa content area
 * DEPENDS : js/core/config.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 */
'use strict';
import { CONFIG } from './config.js';

const loadedStyleList = [];

// Kinukuha ang page name mula sa URL hash.
export function getPageFromHash() {
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

// Minamarkahan ang active link sa sidebar.
function setActiveLink(pageName) {
  document.querySelectorAll(CONFIG.SELECTOR.navLink).forEach((link) => {
    link.classList.toggle(CONFIG.ACTIVE_CLASS, link.dataset.page === pageName);
  });
}

// Nilo-load ang page: HTML, CSS, tapos JS (init ng page).
export async function loadPage(pageName) {
  const pageToLoad = CONFIG.PAGE_LIST.includes(pageName) ? pageName : CONFIG.NOT_FOUND_PAGE;
  showMessage(CONFIG.TEXT.loading);
  try {
    const response = await fetch(CONFIG.PAGE_FOLDER + pageToLoad + '.html');
    if (!response.ok) throw new Error('page');
    const template = document.createElement('template');
    template.innerHTML = await response.text();
    const styleList = [...template.content.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.getAttribute('href'));
    const scriptList = [...template.content.querySelectorAll('script[src]')].map((node) => node.getAttribute('src'));
    template.content.querySelectorAll('link, script').forEach((node) => node.remove());
    await Promise.all(styleList.map(ensureStylesheet));
    document.querySelector(CONFIG.SELECTOR.content).replaceChildren(template.content);
    for (const source of scriptList) {
      const pageModule = await import(new URL(source, document.baseURI).href);
      if (typeof pageModule.init === 'function') await pageModule.init();
    }
    setActiveLink(pageToLoad);
  } catch (error) {
    showMessage(CONFIG.TEXT.pageError);
  }
}
