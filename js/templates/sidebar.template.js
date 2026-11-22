/*
 * FILE    : js/templates/sidebar.template.js
 * PURPOSE : Kopya ng components/sidebar.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.3 | 2026-11-20 | kasabay ng components/sidebar.html (dagdag na link: Calibration, Master)
 * VERSION : v2.5 | 2026-11-20 | kasabay ng components/sidebar.html (dagdag na link: LOT Tracking)
 * VERSION : v2.8 | 2026-11-20 | kasabay ng components/sidebar.html (dagdag na link: Search Files)
 * VERSION : v9.3 | 2026-11-22 | kasabay ng components/sidebar.html (dagdag na link: Trend)
 * VERSION : v19 | 2026-11-23 | kasabay ng components/sidebar.html (Yugto 5: dagdag na link: LOT Monitoring)
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('sidebar', `<nav class="sidebar-nav" aria-label="Pangunahing menu">
  <p class="sidebar-brand">BM Analyzer</p>
  <ul class="sidebar-list">
    <li><a class="sidebar-link" href="#dashboard" data-page="dashboard">Dashboard</a></li>
    <li><a class="sidebar-link" href="#lot-tracking" data-page="lot-tracking">LOT Tracking</a></li>
    <li><a class="sidebar-link" href="#lot-tracking-lead" data-page="lot-tracking-lead">LOT Monitoring</a></li>
    <li><a class="sidebar-link" href="#file-search" data-page="file-search">Search Files</a></li>
    <li><a class="sidebar-link" href="#calibration" data-page="calibration">Calibration</a></li>
    <li><a class="sidebar-link" href="#master" data-page="master">Master</a></li>
    <li><a class="sidebar-link" href="#trend" data-page="trend">Trend</a></li>
    <li><a class="sidebar-link" href="#settings" data-page="settings">Settings</a></li>
  </ul>
</nav>
`);
})();
