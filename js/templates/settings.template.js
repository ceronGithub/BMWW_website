/*
 * FILE    : js/templates/settings.template.js
 * PURPOSE : Kopya ng pages/settings.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.2 | 2026-11-20 | kasabay ng pages/settings.html (bagong layout)
 * VERSION : v2.4 | 2026-11-20 | kasabay ng pages/settings.html (walang lock badge)
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('settings', `<!-- PAGE: settings -->
<link rel="stylesheet" href="css/pages/settings.css">
<section class="page page-settings" data-page="settings">
  <header class="page-header">
    <h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Itakda ang pangalan ng machine at ang mga folder na gagamitin ng BM Analyzer.</p>
  </header>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Machine name</h2>
        <p id="machine-note" class="card-note"></p>
      </div>
    </div>
    <div class="radio-group" role="radiogroup" aria-label="Uri ng machine name">
      <label class="radio-row"><input type="radio" name="machine-mode" value="user-input"><span>User input</span></label>
      <label class="radio-row"><input type="radio" name="machine-mode" value="lead-pc"><span>Lead PC</span></label>
    </div>
    <div class="form-group">
      <label class="form-label" for="machine-name">Pangalan ng machine</label>
      <input id="machine-name" class="form-input" type="text" maxlength="30" autocomplete="off">
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-title">Mga path</h2>
        <p class="card-note">Piliin ang bawat folder, tapos i-type o i-paste ang full path nito. Hindi maibibigay ng browser ang buong path, pangalan lang ng folder.</p>
      </div>
    </div>
    <ul id="path-list" class="path-list"></ul>
  </div>

  <div class="save-bar">
    <p id="settings-status" class="status" role="status"></p>
    <button id="save-settings" class="btn btn-primary" type="button">Save settings</button>
  </div>
</section>
<script src="js/pages/settings.js"></script>
`);
})();
