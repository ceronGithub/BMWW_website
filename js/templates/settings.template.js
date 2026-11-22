/*
 * FILE    : js/templates/settings.template.js
 * PURPOSE : Kopya ng pages/settings.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v15 | 2026-11-22 | kasabay ng pages/settings.html (card na Shift)
 * VERSION : v10 | 2026-11-22 | kasabay ng pages/settings.html (banner na Ibalik ang settings, css at script)
 * VERSION : v9.3 | 2026-11-22 | kasabay ng pages/settings.html (card na Trend limits)
 * VERSION : v2 | 2026-11-20 | bagong file
 * VERSION : v2.2 | 2026-11-20 | kasabay ng pages/settings.html (bagong layout)
 * VERSION : v2.4 | 2026-11-20 | kasabay ng pages/settings.html (walang lock badge)
 * VERSION : v2.18 | 2026-11-21 | kasabay ng pages/settings.html (paalala na may hindi pa na-save)
 * VERSION : v3.2 | 2026-11-21 | kasabay ng pages/settings.html (card ng Install File Watcher, css at script)
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('settings', `<!-- PAGE: settings -->
<link rel="stylesheet" href="css/pages/settings.css">
<link rel="stylesheet" href="css/pages/watcher-install.css">
<link rel="stylesheet" href="css/pages/trend-settings.css">
<link rel="stylesheet" href="css/pages/shift-settings.css">
<link rel="stylesheet" href="css/pages/settings-restore.css">
<section class="page page-settings" data-page="settings">
  <header class="page-header">
    <h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Itakda ang pangalan ng machine at ang mga folder na gagamitin ng BM Analyzer.</p>
  </header>

  <div id="settings-restore" class="restore-banner" role="status" hidden>
    <p id="settings-restore-text" class="restore-banner-text"></p>
    <button id="settings-restore-button" class="btn btn-secondary" type="button">Ibalik ang settings</button>
  </div>

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
        <p class="card-note">Piliin ang bawat folder, tapos ilagay ang full path nito (kailangan ito pagkatapos mapili ang folder). Hindi maibibigay ng browser ang buong path, pangalan lang ng folder. Pindutin ang Save settings para ma-save ang mga pagbabago.</p>
      </div>
    </div>
    <ul id="path-list" class="path-list"></ul>
  </div>

  <div id="watcher-card" class="card"></div>

  <div id="trend-limits-card" class="card"></div>

  <div id="shift-settings-card" class="card"></div>

  <div class="save-bar">
    <p id="settings-unsaved" class="unsaved-note" role="status" hidden>May pagbabago na hindi pa na-save. Pindutin ang Save settings para ma-save.</p>
    <p id="settings-status" class="status" role="status"></p>
    <button id="save-settings" class="btn btn-primary" type="button">Save settings</button>
  </div>
</section>
<script src="js/pages/watcher-install.js"></script>
<script src="js/core/trend-config.js"></script>
<script src="js/core/trend-limits.js"></script>
<script src="js/core/trend-settings.js"></script>
<script src="js/core/shift-settings-config.js"></script>
<script src="js/core/shift-settings.js"></script>
<script src="js/core/settings-restore-config.js"></script>
<script src="js/core/settings-restore.js"></script>
<script src="js/pages/settings.js"></script>
`);
})();
