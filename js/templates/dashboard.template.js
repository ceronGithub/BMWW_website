/*
 * FILE    : js/templates/dashboard.template.js
 * PURPOSE : Kopya ng pages/dashboard.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('dashboard', `<!-- PAGE: dashboard -->
<link rel="stylesheet" href="css/pages/dashboard.css">
<section class="page page-dashboard" data-page="dashboard">
  <h1 class="page-title">Dashboard</h1>
  <div class="card-grid">
    <article class="card"><h2 class="card-title">Machine name</h2><p id="dash-machine" class="card-value"></p><p id="dash-mode" class="card-note"></p></article>
    <article class="card"><h2 class="card-title">Save folder (BMWW)</h2><p id="dash-root" class="card-value"></p></article>
    <article class="card"><h2 class="card-title">Data source folder</h2><p id="dash-source" class="card-value"></p></article>
    <article class="card"><h2 class="card-title">Last saved</h2><p id="dash-saved" class="card-value"></p></article>
  </div>
</section>
<script src="js/pages/dashboard.js"></script>
`);
})();
