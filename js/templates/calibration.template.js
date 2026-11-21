/*
 * FILE    : js/templates/calibration.template.js
 * PURPOSE : Kopya ng pages/calibration.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v9.2 | 2026-11-22 | kasabay ng pages/calibration.html (card na Calibration Repeatability at mga script/css nito)
 * VERSION : v9.1 | 2026-11-22 | kasabay ng pages/calibration.html (card na Compare sliders at mga script/css nito)
 * VERSION : v9.0 | 2026-11-22 | kasabay ng pages/calibration.html (Calibration correl at mga script nito)
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.3 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('calibration', `<!-- PAGE: calibration -->
<link rel="stylesheet" href="css/pages/calibration.css">
<link rel="stylesheet" href="css/pages/calibration-compare.css">
<link rel="stylesheet" href="css/pages/calibration-repeatability.css">
<section class="page page-calibration" data-page="calibration">
  <header class="page-header">
    <h1 class="page-title">Calibration</h1>
    <p class="page-subtitle">Calibration correl mula sa Data source 1.</p>
  </header>

  <div class="card">
    <h2 class="card-title">Data source</h2>
    <p id="calibration-source" class="source-path"></p>
    <p class="card-note">Galing sa Settings (Data source 1). <a href="#settings">Buksan ang Settings</a></p>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Calibration correl</h2>
        <p class="card-note">Pinakabagong calibration record ngayong araw: Actual (After) laban sa Master. Ang Date ay laging today at hindi puwedeng baguhin.</p>
      </div>
    </div>
    <div class="date-row">
      <div class="form-group">
        <label class="form-label" for="calibration-date">Date</label>
        <input id="calibration-date" class="form-input" type="date" readonly>
      </div>
    </div>
    <div class="action-row action-row-split">
      <button id="calibration-run" class="btn btn-primary" type="button">Calibration Correl</button>
    </div>
    <p id="calibration-status" class="status" role="status"></p>
    <div id="calibration-result" class="result-area"></div>
  </div>
  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Compare sliders</h2>
        <p class="card-note">Ihambing ang mga slider ng huling Calibration Correl sa naunang calibration record. Hindi ito kusang tumatakbo; pindutin ang Compare vs previous.</p>
      </div>
    </div>
    <div class="action-row compare-actions">
      <button id="calibration-compare-run" class="btn btn-primary" type="button" disabled>Compare vs previous</button>
    </div>
    <p id="calibration-compare-status" class="status" role="status"></p>
    <div id="calibration-compare-result" class="result-area"></div>
  </div>
  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Calibration Repeatability</h2>
        <p class="card-note">Piliin ang Start date at End date. Ang petsa ng file (last modified) ang gagamitin. Ang Actual ay ang After at ang Master ay galing sa calibration CSV.</p>
      </div>
    </div>
    <div class="date-row">
      <div class="form-group">
        <label class="form-label" for="calibration-range-start">Start date</label>
        <input id="calibration-range-start" class="form-input" type="date">
      </div>
      <div class="form-group">
        <label class="form-label" for="calibration-range-end">End date</label>
        <input id="calibration-range-end" class="form-input" type="date">
      </div>
    </div>
    <fieldset class="mode-group">
      <legend class="form-label">Data points</legend>
      <label class="mode-option"><input type="radio" name="calibration-range-mode" value="all" checked><span>All data points (flat)</span></label>
      <label class="mode-option"><input type="radio" name="calibration-range-mode" value="shift"><span>Latest per shift: Morning 7:30 AM - 6:30 PM, Night 7:30 PM - 6:30 AM</span></label>
    </fieldset>
    <div class="action-row action-row-split">
      <button id="calibration-range-run" class="btn btn-primary" type="button">Calibration Repeatability</button>
    </div>
    <p id="calibration-range-status" class="status" role="status"></p>
    <div id="calibration-range-result" class="result-area"></div>
  </div>
</section>
<script src="js/core/master-export-config.js"></script>
<script src="js/core/xlsx-writer.js"></script>
<script src="js/core/calibration-config.js"></script>
<script src="js/core/calibration-analysis.js"></script>
<script src="js/core/calibration-export.js"></script>
<script src="js/core/master-compare-config.js"></script>
<script src="js/core/master-compare.js"></script>
<script src="js/core/calibration-compare-config.js"></script>
<script src="js/core/calibration-compare.js"></script>
<script src="js/core/calibration-compare-export.js"></script>
<script src="js/core/calibration-compare-ui.js"></script>
<script src="js/core/master-shift-config.js"></script>
<script src="js/core/master-shift.js"></script>
<script src="js/core/calibration-repeatability-config.js"></script>
<script src="js/core/calibration-repeatability.js"></script>
<script src="js/core/calibration-repeatability-export.js"></script>
<script src="js/core/calibration-repeatability-ui.js"></script>
<script src="js/pages/calibration.js"></script>
`);
})();
