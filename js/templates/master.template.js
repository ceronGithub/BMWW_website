/*
 * FILE    : js/templates/master.template.js
 * PURPOSE : Kopya ng pages/master.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v8.11 | 2026-11-21 | kasabay ng pages/master.html (Latest Master: readonly na Date, walang Open latest correl file at Export to Excel; script ng repeatability-sync)
 * VERSION : v7.3 | 2026-11-21 | dagdag na script ng correl-sync-config at correl-sync (status ng Master Correl para sa LEAD PC)
 * VERSION : v7.1 | 2026-11-21 | kasabay ng pages/master.html (card na Compare sliders)
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.17c | 2026-11-21 | kasabay ng pages/master.html (Latest Master: iisang Date)
 * VERSION : v2.3 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-20 | kasabay ng pages/master.html (Latest Master at Range Master)
 * VERSION : v2.8 | 2026-11-20 | kasabay ng pages/master.html (Master Repeatability, Export to Excel)
 * VERSION : v2.12 | 2026-11-21 | kasabay ng pages/master.html (mode radio at script ng shift)
 * VERSION : v2.14 | 2026-11-21 | button na Open latest repeatability file (kaliwa ng Export to Excel); Run Latest Master ay naging Master Correl
 * VERSION : v2.15 | 2026-11-21 | Master Correl: editable na ang Start date at End date
 * VERSION : v2.16 | 2026-11-21 | Master Correl: Open latest correl file at Export to Excel; script ng correl-export
 * VERSION : v3.5 | 2026-11-21 | kasabay ng pages/master.html (Compare vs previous)
 * VERSION : v7 | 2026-11-21 | dagdag na script ng compare-sync (kopya ng bagong pages/master.html)
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('master', `<!-- PAGE: master -->
<link rel="stylesheet" href="css/pages/master.css">
<link rel="stylesheet" href="css/pages/master-compare.css">
<section class="page page-master" data-page="master">
  <header class="page-header">
    <h1 class="page-title">Master</h1>
    <p class="page-subtitle">Latest Master at Master Repeatability mula sa Data source 1.</p>
  </header>

  <div class="card">
    <h2 class="card-title">Data source</h2>
    <p id="master-source" class="source-path"></p>
    <p class="card-note">Galing sa Settings (Data source 1). <a href="#settings">Buksan ang Settings</a></p>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Latest Master</h2>
        <p class="card-note">Pinakabagong master record ngayong araw. Ang Date ay laging today at hindi puwedeng baguhin.</p>
      </div>
    </div>
    <div class="date-row">
      <div class="form-group">
        <label class="form-label" for="latest-date">Date</label>
        <input id="latest-date" class="form-input" type="date" readonly>
      </div>
    </div>
    <div class="action-row action-row-split">
      <button id="latest-run" class="btn btn-primary" type="button">Master Correl</button>
    </div>
    <p id="latest-status" class="status" role="status"></p>
    <div id="latest-result" class="result-area"></div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Compare sliders</h2>
        <p class="card-note">Ihambing ang mga slider ng huling Master Correl sa naunang record. Hindi ito kusang tumatakbo; pindutin ang Compare vs previous.</p>
      </div>
    </div>
    <div class="action-row compare-actions">
      <button id="compare-run" class="btn btn-primary" type="button" disabled>Compare vs previous</button>
    </div>
    <p id="compare-status" class="status" role="status"></p>
    <div id="compare-result" class="result-area"></div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Master Repeatability</h2>
        <p class="card-note">Piliin ang Start date at End date. Ang petsa ng file (last modified) ang gagamitin.</p>
      </div>
    </div>
    <div class="date-row">
      <div class="form-group">
        <label class="form-label" for="range-start">Start date</label>
        <input id="range-start" class="form-input" type="date">
      </div>
      <div class="form-group">
        <label class="form-label" for="range-end">End date</label>
        <input id="range-end" class="form-input" type="date">
      </div>
    </div>
    <fieldset class="mode-group">
      <legend class="form-label">Data points</legend>
      <label class="mode-option"><input type="radio" name="range-mode" value="all" checked><span>All data points (flat)</span></label>
      <label class="mode-option"><input type="radio" name="range-mode" value="shift"><span>Latest per shift: Morning 7:30 AM - 6:30 PM, Night 7:30 PM - 6:30 AM</span></label>
    </fieldset>
    <div class="action-row action-row-split">
      <button id="range-run" class="btn btn-primary" type="button">Master Repeatability</button>
      <button id="range-open-latest" class="btn btn-secondary" type="button">Open latest repeatability file</button>
      <button id="range-export" class="btn btn-secondary" type="button" disabled>Export to Excel</button>
    </div>
    <p id="range-status" class="status" role="status"></p>
    <div id="range-result" class="result-area"></div>
  </div>
</section>
<script src="js/core/master-export-config.js"></script>
<script src="js/core/master-shift-config.js"></script>
<script src="js/core/master-shift.js"></script>
<script src="js/core/xlsx-writer.js"></script>
<script src="js/core/master-export.js"></script>
<script src="js/core/master-open-latest.js"></script>
<script src="js/core/correl-export-config.js"></script>
<script src="js/core/correl-export.js"></script>
<script src="js/core/repeatability-sync-config.js"></script>
<script src="js/core/repeatability-sync.js"></script>
<script src="js/core/master-compare-config.js"></script>
<script src="js/core/master-compare.js"></script>
<script src="js/core/master-compare-export.js"></script>
<script src="js/core/compare-sync.js"></script>
<script src="js/core/correl-sync-config.js"></script>
<script src="js/core/correl-sync.js"></script>
<script src="js/core/master-compare-ui.js"></script>
<script src="js/pages/master.js"></script>
`);
})();
