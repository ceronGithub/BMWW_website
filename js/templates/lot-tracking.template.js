/*
 * FILE    : js/templates/lot-tracking.template.js
 * PURPOSE : Kopya ng pages/lot-tracking.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js, js/pages/lot-tracking.js, js/core/lot-config.js, js/core/lot-unit-collector.js, js/core/lot-active-store.js, js/core/lot-validation.js, js/core/lot-beep.js, js/core/xlsx-writer.js, js/core/lot-shift.js, js/core/lot-monitoring-export.js, js/core/lot-monitoring-store.js
 * VERSION : v2.5 | 2026-11-20 | bagong file
 * VERSION : v2.6 | 2026-11-22 | Yugto 1: column na LOT Unit at Unang nakita, script ng lot-config, lot-unit-collector at lot-active-store
 * VERSION : v2.7 | 2026-11-22 | Yugto 1: script ng lot-validation at lot-beep
 * VERSION : v2.8 | 2026-11-23 | Yugto 2: script ng xlsx-writer, lot-shift, lot-monitoring-export at lot-monitoring-store
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('lot-tracking', `<!-- PAGE: lot-tracking -->
<link rel="stylesheet" href="css/pages/lot-tracking.css">
<section class="page page-lot-tracking" data-page="lot-tracking">
  <header class="page-header">
    <h1 class="page-title">LOT Tracking</h1>
    <p class="page-subtitle">I-scan ang Barcode at ilagay ang Operator. Babantayan ang bagong file o folder sa mga Data source ng Settings.</p>
  </header>
  <article class="card">
    <div class="card-head">
      <h2 class="card-title">Lote information</h2>
      <span id="lot-badge" class="badge badge-neutral"></span>
    </div>
    <div class="lot-grid">
      <div class="form-group">
        <label class="form-label" for="lot-machine">Machine</label>
        <input id="lot-machine" class="form-input" type="text" readonly>
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-barcode">Barcode</label>
        <input id="lot-barcode" class="form-input" type="text" autocomplete="off" spellcheck="false">
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-operator">Operator</label>
        <input id="lot-operator" class="form-input" type="text" autocomplete="off" spellcheck="false">
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-start-date">Start Date</label>
        <input id="lot-start-date" class="form-input" type="text" readonly>
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-start-time">Start Time</label>
        <input id="lot-start-time" class="form-input" type="text" readonly>
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-end-date">End Date</label>
        <input id="lot-end-date" class="form-input" type="text" readonly>
      </div>
      <div class="form-group">
        <label class="form-label" for="lot-end-time">End Time</label>
        <input id="lot-end-time" class="form-input" type="text" readonly>
      </div>
    </div>
    <div class="lot-actions">
      <button id="lot-new" class="btn btn-primary" type="button">NEW LOTE</button>
    </div>
    <p id="lot-status" class="status" role="status"></p>
  </article>
  <article class="card">
    <h2 class="card-title">Result</h2>
    <p id="lot-result-note" class="card-note"></p>
    <div class="table-wrap">
      <table class="lot-table">
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">LOT Unit</th>
            <th scope="col">Date Modified</th>
            <th scope="col">Unang nakita</th>
            <th scope="col">Type</th>
            <th scope="col">Path</th>
            <th scope="col">Wafer</th>
            <th scope="col">Blk</th>
            <th scope="col">Layer No.</th>
            <th scope="col">File Name</th>
          </tr>
        </thead>
        <tbody id="lot-result-body"></tbody>
      </table>
    </div>
  </article>
</section>
<script src="js/core/lot-config.js"></script>
<script src="js/core/lot-unit-collector.js"></script>
<script src="js/core/lot-active-store.js"></script>
<script src="js/core/lot-validation.js"></script>
<script src="js/core/lot-beep.js"></script>
<script src="js/core/xlsx-writer.js"></script>
<script src="js/core/lot-shift.js"></script>
<script src="js/core/lot-monitoring-export.js"></script>
<script src="js/core/lot-monitoring-store.js"></script>
<script src="js/pages/lot-tracking.js"></script>
`);
})();
