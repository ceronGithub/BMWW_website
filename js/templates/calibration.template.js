/*
 * FILE    : js/templates/calibration.template.js
 * PURPOSE : Kopya ng pages/calibration.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.3 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('calibration', `<!-- PAGE: calibration -->
<link rel="stylesheet" href="css/pages/calibration.css">
<section class="page page-calibration" data-page="calibration">
  <header class="page-header">
    <h1 class="page-title">Calibration</h1>
    <p class="page-subtitle">Calibration ng BM Analyzer.</p>
  </header>
  <div class="card empty-state">
    <h2 class="card-title">Wala pang laman ang pahinang ito</h2>
    <p class="card-note">Idadagdag dito ang mga tool ng Calibration.</p>
  </div>
</section>
<script src="js/pages/calibration.js"></script>
`);
})();
