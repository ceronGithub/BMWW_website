/*
 * FILE    : js/templates/404.template.js
 * PURPOSE : Kopya ng pages/404.html bilang template string, para gumana sa double-click (file://)
 * DEPENDS : js/core/registry.js
 * VERSION : v2 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  window.BMWW.registry.registerTemplate('404', `<section class="page page-not-found" data-page="404">
  <h1 class="page-title">Hindi nakita ang page</h1>
  <p class="card-note">Bumalik sa <a href="#dashboard">Dashboard</a>.</p>
</section>
`);
})();
