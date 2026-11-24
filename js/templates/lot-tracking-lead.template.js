/*
 * FILE    : js/templates/lot-tracking-lead.template.js
 * PURPOSE : Kopya ng pages/lot-tracking-lead.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js, js/pages/lot-tracking-lead.js, js/core/lot-config.js, js/core/lot-lead-config.js, js/core/lot-shift.js, js/core/lot-monitoring-reader.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 5)
 * VERSION : v2 | 2026-11-24 | Task 1B: dagdag na column na Remarks
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('lot-tracking-lead', `<!-- PAGE: lot-tracking-lead -->
<link rel="stylesheet" href="css/pages/lot-tracking-lead.css">
<section class="page page-lot-tracking-lead" data-page="lot-tracking-lead">
  <header class="page-header">
    <h1 class="page-title">LOT Monitoring</h1>
    <p class="page-subtitle">Mga lote ng lahat ng machine mula sa Server path. Basa lang ang page na ito.</p>
  </header>
  <article class="card">
    <h2 class="card-title">Mga machine</h2>
    <div class="lot-lead-grid">
      <div class="form-group">
        <label class="form-label" for="lot-lead-day">Monitoring day</label>
        <input id="lot-lead-day" class="form-input" type="date">
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-lead-machine">Machine</label>
        <select id="lot-lead-machine" class="form-input"></select>
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-lead-status-filter">Status</label>
        <select id="lot-lead-status-filter" class="form-input"></select>
      </div>
    </div>
    <div class="lot-lead-actions">
      <button id="lot-lead-refresh" class="btn btn-primary" type="button">Refresh</button>
    </div>
    <p id="lot-lead-status" class="status" role="status"></p>
    <ul id="lot-lead-machines" class="lot-lead-machines"></ul>
  </article>
  <article class="card">
    <h2 class="card-title">Mga lote</h2>
    <p id="lot-lead-note" class="card-note"></p>
    <div class="table-wrap">
      <table class="lot-lead-table">
        <thead>
          <tr>
            <th scope="col">Barcode</th>
            <th scope="col">LOT Unit</th>
            <th scope="col">Wafer</th>
            <th scope="col">Blk</th>
            <th scope="col">Layer No.</th>
            <th scope="col">Start-Time</th>
            <th scope="col">End-Time</th>
            <th scope="col">Lot Duration (min)</th>
            <th scope="col">Operator</th>
            <th scope="col">Machine</th>
            <th scope="col">Status</th>
            <th scope="col">Remarks</th>
            <th scope="col">File Path</th>
          </tr>
        </thead>
        <tbody id="lot-lead-body"></tbody>
      </table>
    </div>
  </article>
</section>
<script src="js/core/lot-config.js"></script>
<script src="js/core/lot-lead-config.js"></script>
<script src="js/core/lot-shift.js"></script>
<script src="js/core/lot-monitoring-reader.js"></script>
<script src="js/pages/lot-tracking-lead.js"></script>
`);
})();
