/*
 * FILE    : js/templates/master.template.js
 * PURPOSE : Kopya ng pages/master.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.3 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('master', `<!-- PAGE: master -->
<link rel="stylesheet" href="css/pages/master.css">
<section class="page page-master" data-page="master">
  <header class="page-header">
    <h1 class="page-title">Master</h1>
    <p class="page-subtitle">Master data ng BM Analyzer.</p>
  </header>
  <div class="card empty-state">
    <h2 class="card-title">Wala pang laman ang pahinang ito</h2>
    <p class="card-note">Idadagdag dito ang mga tool ng Master.</p>
  </div>
</section>
<script src="js/pages/master.js"></script>
`);
})();
