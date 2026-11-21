/*
 * FILE    : js/templates/dashboard.template.js
 * PURPOSE : Kopya ng pages/dashboard.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v7.6 | 2026-11-21 | kasabay ng pages/dashboard.html (script ng correl-excel-reader)
 * VERSION : v7.4 | 2026-11-21 | kasabay ng pages/dashboard.html (Preview button ng Master Correl)
 * VERSION : v7.3 | 2026-11-21 | kasabay ng pages/dashboard.html (script ng correl-sync-config at correl-sync)
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v3 | 2026-11-20 | kopya na ng bagong pages/dashboard.html (Date at oras, kalendaryo, Events)
 * VERSION : v6 | 2026-11-21 | Task 1D: kopya ng bagong pages/dashboard.html (role badge at machine view)
 * VERSION : v7 | 2026-11-21 | dagdag na script ng master-compare-config at compare-sync
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('dashboard', `<!-- PAGE: dashboard -->
<link rel="stylesheet" href="css/pages/dashboard.css">
<link rel="stylesheet" href="css/pages/dashboard-events.css">
<link rel="stylesheet" href="css/pages/dashboard-machines.css">
<section class="page page-dashboard" data-page="dashboard">
  <h1 class="page-title">Dashboard</h1>
  <div class="card-grid">
    <article class="card"><h2 class="card-title">Machine name</h2><p id="dash-machine" class="card-value"></p><p id="dash-mode" class="card-note"></p><p id="dm-role" class="dm-role"></p></article>
    <article class="card"><h2 class="card-title">Save folder (BMWW)</h2><p id="dash-root" class="card-value"></p></article>
    <article class="card"><h2 class="card-title">Data source folder</h2><p id="dash-source" class="card-value"></p></article>
    <article class="card"><h2 class="card-title">Last saved</h2><p id="dash-saved" class="card-value"></p></article>
  </div>
  <section id="dm-section" class="dm" aria-labelledby="dm-title">
    <div class="dm-head">
      <h2 id="dm-title" class="dm-title"></h2>
      <p id="dm-updated" class="card-note"></p>
    </div>
    <div id="dm-summary"></div>
    <div id="dm-pinned" class="dm-pinned"></div>
    <div id="dm-grid" class="dm-grid"></div>
    <p id="dm-message" class="status" role="status"></p>
    <p id="dm-preview-status" class="status" role="status"></p>
    <button id="dm-grant" class="btn btn-secondary" type="button" hidden>Payagan ang folder</button>
  </section>
  <div class="dash-events">
    <article class="card dash-clock">
      <h2 class="card-title">Date at oras</h2>
      <p id="dash-clock-time" class="clock-time"></p>
      <p id="dash-clock-date" class="clock-date"></p>
    </article>
    <article class="card dash-calendar">
      <div class="calendar-head">
        <button id="cal-prev" class="btn btn-secondary calendar-nav" type="button" aria-label="Nakaraang buwan">&#8249;</button>
        <h2 id="cal-title" class="calendar-title" aria-live="polite"></h2>
        <button id="cal-next" class="btn btn-secondary calendar-nav" type="button" aria-label="Susunod na buwan">&#8250;</button>
        <button id="cal-today" class="btn btn-secondary" type="button">Ngayon</button>
      </div>
      <div id="cal-weekdays" class="calendar-weekdays" aria-hidden="true"></div>
      <div id="cal-grid" class="calendar-grid"></div>
    </article>
    <article class="card dash-day">
      <div class="card-head">
        <h2 id="ev-selected-label" class="card-title"></h2>
        <button id="ev-add" class="btn btn-primary" type="button">+ Add event</button>
      </div>
      <ul id="ev-list" class="event-list"></ul>
      <form id="ev-form" class="event-form" novalidate hidden>
        <h3 id="ev-form-title" class="event-form-title"></h3>
        <div class="form-group"><label class="form-label" for="ev-title">Title</label><input id="ev-title" class="form-input" type="text" autocomplete="off" required></div>
        <div class="form-group"><label class="form-label" for="ev-date">Petsa</label><input id="ev-date" class="form-input" type="date" required></div>
        <div class="form-group"><label class="form-label" for="ev-time">Oras (opsyonal)</label><input id="ev-time" class="form-input" type="time"></div>
        <div class="form-group"><label class="form-label" for="ev-note">Note (opsyonal)</label><input id="ev-note" class="form-input" type="text" autocomplete="off"></div>
        <div class="event-form-actions">
          <button id="ev-save" class="btn btn-primary" type="submit">I-save</button>
          <button id="ev-cancel" class="btn btn-secondary" type="button">Cancel</button>
        </div>
        <p id="ev-form-status" class="status" role="status"></p>
      </form>
      <p id="ev-message" class="status" role="status"></p>
      <p id="ev-status" class="card-note"></p>
      <button id="ev-grant" class="btn btn-secondary" type="button" hidden>Payagan ang folder</button>
    </article>
  </div>
</section>
<script src="js/pages/dashboard.js"></script>
<script src="js/pages/dashboard-events.js"></script>
<script src="js/core/master-compare-config.js"></script>
<script src="js/core/compare-sync.js"></script>
<script src="js/core/correl-sync-config.js"></script>
<script src="js/core/correl-sync.js"></script>
<script src="js/core/master-export-config.js"></script>
<script src="js/core/correl-export-config.js"></script>
<script src="js/core/master-open-latest.js"></script>
<script src="js/core/correl-preview.js"></script>
<script src="js/core/correl-excel-reader.js"></script>
<script src="js/core/dashboard-machines-config.js"></script>
<script src="js/pages/dashboard-machines.js"></script>
`);
})();
