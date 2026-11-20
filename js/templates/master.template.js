/*
 * FILE    : js/templates/master.template.js
 * PURPOSE : Kopya ng pages/master.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.3 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-20 | kasabay ng pages/master.html (Latest Master at Range Master)
 * VERSION : v2.8 | 2026-11-20 | kasabay ng pages/master.html (Master Repeatability, Export to Excel)
 * VERSION : v2.12 | 2026-11-21 | kasabay ng pages/master.html (mode radio at script ng shift)
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('master', `<!-- PAGE: master -->
<link rel="stylesheet" href="css/pages/master.css">
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
        <p class="card-note">Pinakabagong master record ngayong araw. Hindi ma-e-edit ang petsa.</p>
      </div>
    </div>
    <div class="date-row">
      <div class="form-group">
        <label class="form-label" for="latest-start">Start date</label>
        <input id="latest-start" class="form-input" type="date" readonly aria-readonly="true">
      </div>
      <div class="form-group">
        <label class="form-label" for="latest-end">End date</label>
        <input id="latest-end" class="form-input" type="date" readonly aria-readonly="true">
      </div>
    </div>
    <div class="action-row">
      <button id="latest-run" class="btn btn-primary" type="button">Run Latest Master</button>
    </div>
    <p id="latest-status" class="status" role="status"></p>
    <div id="latest-result" class="result-area"></div>
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
<script src="js/pages/master.js"></script>
`);
})();
