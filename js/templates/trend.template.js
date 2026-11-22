/*
 * FILE    : js/templates/trend.template.js
 * PURPOSE : Kopya ng pages/trend.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v9.6 | 2026-11-22 | dagdag na script ng trend-day-config at trend-day-search (clickable na petsa at point)
 * VERSION : v9.4 | 2026-11-22 | kasabay ng pages/trend.html (Export to Excel at 5 bagong script)
 * VERSION : v9.3 | 2026-11-22 | bagong file (kasabay ng pages/trend.html)
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('trend', `<!-- PAGE: trend -->
<link rel="stylesheet" href="css/pages/trend.css">
<section class="page page-trend" data-page="trend">
  <header class="page-header">
    <h1 class="page-title">Trend</h1>
    <p class="page-subtitle">Trend ng master mula sa Data source 1: Day shift 7:30 AM - 6:30 PM at Night shift 7:30 PM - 6:30 AM ng kinabukasan.</p>
  </header>

  <div class="card">
    <h2 class="card-title">Data source</h2>
    <p id="trend-source" class="source-path"></p>
    <p class="card-note">Galing sa Settings (Data source 1). Ang UCL, CL at LCL ay itinatakda rin sa Settings. <a href="#settings">Buksan ang Settings</a></p>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Trend</h2>
        <p class="card-note">Piliin ang Start date at End date. Sa bawat petsa, kinukuha ang pinakahuling master record ng Day shift at ng Night shift. Ang Mean Offset, Stdev, CV, Slope, Intercept at R2 ay galing sa master file.</p>
      </div>
    </div>
    <div class="date-row">
      <div class="form-group">
        <label class="form-label" for="trend-start">Start date</label>
        <input id="trend-start" class="form-input" type="date">
      </div>
      <div class="form-group">
        <label class="form-label" for="trend-end">End date</label>
        <input id="trend-end" class="form-input" type="date">
      </div>
    </div>
    <div class="action-row">
      <button id="trend-run" class="btn btn-primary" type="button">Run Trend</button>
      <button id="trend-reset-all" class="btn btn-secondary" type="button" disabled>Reset lahat ng Set</button>
      <button id="trend-export" class="btn btn-secondary" type="button" disabled>Export to Excel</button>
    </div>
    <p id="trend-status" class="status" role="status"></p>
    <p id="trend-export-status" class="status" role="status"></p>
    <div id="trend-summary" class="result-area"></div>
    <div id="trend-changes"></div>
    <div id="trend-charts" class="trend-chart-grid"></div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Mga record ng araw</h2>
        <p class="card-note">Pumili ng petsa para makita ang mga record at file ng araw na iyon, kasama ang Mean Offset, Stdev, CV, Slope, Intercept at R2. Pindutin ang Set para palitan ang point ng shift na iyon sa chart.</p>
      </div>
    </div>
    <div class="form-group trend-day-picker">
      <label class="form-label" for="trend-day-date">Petsa</label>
      <input id="trend-day-date" class="form-input" type="date" disabled>
    </div>
    <p id="trend-day-status" class="status" role="status"></p>
    <div id="trend-day-result" class="result-area"></div>
  </div>
</section>
<script src="js/core/master-shift-config.js"></script>
<script src="js/core/master-shift.js"></script>
<script src="js/core/trend-config.js"></script>
<script src="js/core/trend-limits.js"></script>
<script src="js/core/trend-overrides.js"></script>
<script src="js/core/trend-reader.js"></script>
<script src="js/core/trend-day-config.js"></script>
<script src="js/core/trend-chart.js"></script>
<script src="js/core/trend-day-search.js"></script>
<script src="js/core/xlsx-writer.js"></script>
<script src="js/core/trend-export-config.js"></script>
<script src="js/core/trend-sync.js"></script>
<script src="js/core/trend-image.js"></script>
<script src="js/core/trend-export.js"></script>
<script src="js/pages/trend.js"></script>
`);
})();
