/*
 * FILE    : js/core/registry.js
 * PURPOSE : Talaan ng page template at page module (kapalit ng fetch at import, para gumana sa double-click)
 * DEPENDS : js/core/config.js
 * VERSION : v2 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const templateMap = {};
  const pageMap = {};

  // Nagre-register ng HTML template (string) ayon sa pangalan.
  function registerTemplate(name, html) {
    templateMap[name] = html;
  }

  // Kinukuha ang HTML template; null kung wala.
  function getTemplate(name) {
    return Object.prototype.hasOwnProperty.call(templateMap, name) ? templateMap[name] : null;
  }

  // Nagre-register ng page module (may init function).
  function registerPage(name, pageApi) {
    pageMap[name] = pageApi;
  }

  // Kinukuha ang page module; null kung wala.
  function getPage(name) {
    return Object.prototype.hasOwnProperty.call(pageMap, name) ? pageMap[name] : null;
  }

  root.registry = Object.freeze({ registerTemplate, getTemplate, registerPage, getPage });
})();
