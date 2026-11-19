BM ANALYZER WEB v1 | 2026-11-19
v2.4 | 2026-11-20 | Settings: full path ng bawat folder (type/paste, may validation); tinanggal ang lock ng machine name
v2 | 2026-11-20 | ayos ng design (CSS lang): green CTA, focus/active states, dark mode, layout
v2.3 | 2026-11-20 | Settings flow (Saving path muna bago mabuksan ang ibang path), sidebar: Calibration at Master (placeholder page)
v2.2 | 2026-11-20 | Settings: server path, saving path (BMWW), 3 data source path; bagong design ng Settings (badge, sticky save bar)
v2.1 | 2026-11-20 | gumagana na sa double-click: walang fetch at walang type="module"; template at registry (Rule 18)

PAANO BUKSAN (Rule 18)
[v2.1] Puwede nang i-double-click ang index.html (walang fetch, walang module). Template ang ginamit (js/templates/).
Kung gusto pa rin ng local server: python -m http.server 8000 tapos http://localhost:8000
Suportadong browser: Chrome/Edge (huling bersyon). Ang folder picker ay Chrome/Edge lang.
Hindi nababasa ng browser ang path nang kusa. Kailangang piliin ng user ang BMWW folder.

=== OVERVIEW ===
A. FILES
index.html              | shell: sidebar + #content
components/sidebar.html | links ng Dashboard at Settings
pages/dashboard.html, settings.html, 404.html | mga page (404 walang sariling css/js) [v2: pinagkukunan ng markup; kailangang i-sync sa js/templates]
css/base.css            | variables, reset | layout.css: sidebar/responsive | components.css: card, button, form
css/pages/dashboard.css, settings.css | style ng page (naka-scope)
js/core/config.js       | constants, selectors, text
js/core/app.js          | entry point | router.js: nagloload ng page | security.js: right click, sanitize | storage.js: folder access
js/pages/dashboard.js, settings.js | init ng bawat page (nagre-register sa registry)
js/core/registry.js     | [v2] talaan ng template at page module
pages/calibration.html, master.html + css/pages + js/pages (+ js/templates) | [v2.3] placeholder page; wala pang laman
js/templates/sidebar|dashboard|settings|404.template.js | [v2] kopya ng HTML ng component/page bilang string (ito ang ginagamit ng app)

B. FUNCTIONS (File | Input->Output | Ginagawa | Tinatawag ng)
loadSidebar()          | app.js | ->Promise | [v2] kinukuha ang template 'sidebar' sa registry (walang fetch) | initApp
setMenuOpen(isOpen)    | app.js | bool | toggle ng class sidebar-open | bindMenu
bindMenu()             | app.js | - | click ng menu button, overlay, nav link | initApp
handleNavigate()       | app.js | ->Promise | loadPage(getPageFromHash()) | initApp, hashchange
initApp()              | app.js | ->Promise | simula ng app | app.js
getPageFromHash()      | router.js | ->string | page name mula sa hash | app.js
showMessage(message)   | router.js | string | mensahe sa #content (textContent) | loadPage
ensureStylesheet(href) | router.js | string->Promise | load ng CSS nang isang beses | loadPage
setActiveLink(name)    | router.js | string | active state sa sidebar | loadPage
loadPage(pageName)     | router.js | string->Promise | [v2] template mula sa registry, CSS, ensureScript, registry.getPage().init(); try/catch, friendly error | app.js
ensureScript(src)      | router.js | string->Promise | [v2] load ng JS ng page nang isang beses (classic script) | loadPage
registerTemplate(n,h)  | registry.js | string,string | [v2] save ng HTML template | js/templates/*.template.js
getTemplate(name)      | registry.js | string->string|null | [v2] kuha ng template | loadPage, loadSidebar
registerPage(n,api)    | registry.js | string,object | [v2] save ng page module {init} | js/pages/*.js
getPage(name)          | registry.js | string->object|null | [v2] kuha ng page module | loadPage
[v2] Ang security.js ay nasa window.BMWW.security at ang storage.js ay nasa window.BMWW.storage (pareho ang pangalan ng function).
isEditable(target)     | security.js | Element->bool | input/textarea ba | blockContextMenu
blockContextMenu(e)    | security.js | event | harang ng right click | contextmenu listener
blockShortcut(e)       | security.js | event | harang ng F12, Ctrl+U/S, Ctrl+Shift+I/J/C | keydown listener
sanitizeInput(v, max)  | security.js | ->string | tanggal control chars, trim, limit | settings.js
initSecurity()         | security.js | - | naglalagay ng listeners | initApp
isFolderAccessSupported() | storage.js | ->bool | may showDirectoryPicker ba | settings.js
openDatabase()         | storage.js | ->Promise<IDB> | bukas ng IndexedDB | saveHandle, loadHandle
saveHandle(key, h)     | storage.js | ->Promise | save ng folder handle | settings.js
loadHandle(key)        | storage.js | ->Promise | kuha ng handle o null | settings.js
pickFolder()           | storage.js | ->Promise<Handle> | folder picker | settings.js
hasPermission(h, ask)  | storage.js | ->Promise<bool> | check/hingi ng permission | settings.js
readLocalSettings()    | storage.js | ->object | basa ng localStorage cache | settings.js, dashboard.js
writeLocalSettings(s)  | storage.js | object | save sa localStorage | settings.js
writeSettingsFile(r,s) | storage.js | ->Promise | gawa ng BMWW\settings at settings.json | settings.js (onSave)
readSettingsFile(r)    | storage.js | ->Promise | basa ng settings.json o null | settings.js (loadState)
setText(key, value)    | dashboard.js | - | lagay ng text | init
init() (dashboard)     | dashboard.js | - | ipakita ang settings | router
query(key)             | settings.js | ->Element | hanap ng elemento | lahat ng function ng settings.js
setStatus(msg, isErr)  | settings.js | - | status message | lahat
getSelectedMode()      | settings.js | ->string | napiling uri | renderMachine, onSave
renderMachine()        | settings.js | - | [v2.4] field ng machine name ayon sa uri (walang lock) | init, onSave, radio change
[BINURA v2.2] folderLabel(h, name) -> pinalitan ng getPathState(key)
[LUMA v2.2] renderFolders() -> pinalitan ng renderPaths()
getSavedName(key)      | settings.js | string->string | naka-save na pangalan ng folder (kasama ang lumang field) | getPathState, onSave
isPathLocked(pathItem) | settings.js | object->bool | [v2.3] sarado ba ang path (gated at wala pang Saving path) | renderPaths, onPickFolder
getPathState(key)      | settings.js | string->{name,text,variant} | pangalan at badge ng path | renderPaths
clearAttention()       | settings.js | - | [v2.3] tanggal ng highlight sa row | onPickFolder, onSave
focusRootRow()         | settings.js | - | [v2.3] highlight, scroll at focus sa Saving path row (respeto sa reduced motion) | onSave
init() (calibration/master) | js/pages/calibration.js, master.js | - | [v2.3] walang ginagawa pa | router
buildPathRows()        | settings.js | - | gumagawa ng row ng bawat path mula sa CONFIG.PATH_LIST (textContent lang) [v2.4: may full path input] | init
getSavedFullPath(key)  | settings.js | string->string | [v2.4] naka-save na full path (settings.folderPaths) | init
getInputFullPath(key)  | settings.js | string->string | [v2.4] full path sa input, nilinis ng sanitizeInput | renderPaths, onSave
getLastSegment(path)   | settings.js | string->string | [v2.4] pangalan ng folder sa dulo ng path | validateFullPath
validateFullPath(key, path) | settings.js | ->string | [v2.4] error message o '' (pattern at tugma sa pangalan ng folder; walang laman ay ayos) | checkAllFullPaths
onFullPathInput(key)   | settings.js | string | [v2.4] tanggal ng error at update ng ipinapakitang path | input listener ng full path
checkAllFullPaths(map) | settings.js | object->string | [v2.4] suri ng lahat ng full path, highlight ng unang mali | onSave
getSettingsLocation(p) | settings.js | string->string | [v2.4] lokasyon ng settings.json para sa mensahe (full path kung alam) | onSave
renderPaths()          | settings.js | - | full path (o pangalan ng folder), badge, note, button at lock state ng bawat path [v2.3, v2.4] | init, onPickFolder, onSave
loadState()            | settings.js | ->Promise | basa ng naunang settings | init
onPickFolder(key)      | settings.js | path key | pili at save ng handle; ang 'root' (saving path) ay dapat BMWW | click ng bawat path button
onSave()               | settings.js | ->Promise | [v2.4] save ng machine name (walang lock) at full path sa file at localStorage | click
init() (settings)      | settings.js | ->Promise | simula ng page | router

C. VARIABLES / CONSTANTS
CONFIG (config.js, frozen): PATH_LIST (v2.2: server, root, source1, source2, source3; v2.3: required sa root, gated sa iba), ROW_CLASS, REDUCED_MOTION_QUERY, SCROLL_BEHAVIOR (v2.3), PAGE_LIST (v2.3: dashboard, settings, calibration, master), ROOT_KEY, LEGACY_NAME_FIELD, BADGE (v2.2), PAGE_FOLDER [LUMA v2], COMPONENT_FOLDER [LUMA v2], SIDEBAR_TEMPLATE (v2), DEFAULT_PAGE, NOT_FOUND_PAGE, PAGE_LIST, OPEN_CLASS, ACTIVE_CLASS,
  STORAGE_KEY, DB_NAME, DB_STORE, HANDLE_KEY, ROOT_FOLDER_NAME, SETTINGS_SUBFOLDER, SETTINGS_FILE, SETTINGS_PATH_LABEL,
  MACHINE_MODE, LEAD_PC_NAME, MACHINE_NAME_MAX, [v2.4] FULL_PATH_MAX, FULL_PATH_PATTERN, PATH_SEPARATOR, FOLDER_PATHS_FIELD, ROW_INPUT_CLASS, SELECTOR (lahat ng id/selector), TEXT (lahat ng mensahe)
window.BMWW (config.js) | [v2] tanging global: namespace ng app (CONFIG, registry, router, security, storage)
loadedStyleList, loadedScriptList (router.js, const array, nasa loob ng IIFE) | tala ng CSS/JS na na-load na
settings (let), handleMap, rowMap (const object) sa settings.js, nasa loob ng IIFE | kasalukuyang settings, folder handles ayon sa path key, at elemento ng bawat row
SEL, TEXT (settings.js, const) | shortcut sa CONFIG
INPUT (settings.js, const) | [v2.4] shortcut sa CONFIG.ROW_INPUT_CLASS (class ng full path input)
[BINURA v2.4] SELECTOR.settings.lockBadge, TEXT.machineWarn / machineLocked / confirmLock / badgeLocked / badgeOpen; pinalitan ng TEXT.machineNote

D. EVENTS
click       | #menu-button, #overlay, .sidebar-link | app.js | buksan/isara ang menu
hashchange  | window | app.js | loadPage
contextmenu | document | security.js | harang maliban sa input/textarea
keydown     | document | security.js | harang ng shortcuts
change      | input[name=machine-mode] | settings.js | renderMachine
click       | button ng bawat path (gawa ng JS), #save-settings | settings.js | pili/save
input       | full path input ng bawat path (gawa ng JS) | settings.js | onFullPathInput
[BINURA v2.2] #pick-root, #pick-source -> pinalitan ng mga button sa path list

E. STORAGE / API
localStorage "bmww.settings" | settings.js, dashboard.js | {machineMode, machineName, [BINURA v2.4: machineNameLocked], [v2.4] folderPaths{server,root,source1,source2,source3}, rootFolderName, sourceFolderName (para sa Dashboard), folderNames{server,root,source1,source2,source3}, savedAt} | cache
IndexedDB "bmww-db" / store "handles" (keys rootFolder, serverFolder, sourceFolder, sourceFolder2, sourceFolder3) | storage.js | folder handles | iwas pili ulit
File: <BMWW>\settings\settings.json | storage.js | parehong object | pangunahing tala (C:\desktop\BMWW\settings)
Walang backend/API sa v1 (api/ ay walang laman).

F. CSS VARIABLES (css/base.css): --color-primary, --color-primary-dark, --color-primary-soft, --color-on-primary, --color-bg, --color-surface, --color-text, --color-muted, --color-border,
  --color-cta, --color-cta-dark, --color-on-cta (green, para sa Save/Buy/Purchase), --color-focus, --color-success, --color-danger, --color-overlay,
  --space-1/2/3/4/6/8, --radius, --radius-sm, --shadow, --shadow-hover, --ring, --transition, --sidebar-width, --content-max, --touch-size, --font-size-label, --font-main
  Dark mode: prefers-color-scheme block sa base.css, variables lang ang pinapalitan.

G. DEPENDENCY MAP (v2: classic scripts, ayos ng <script defer> sa index.html ang mahalaga)
index.html -> config.js -> registry.js -> security.js -> storage.js -> router.js -> js/templates/*.js -> app.js
app.js -> security.js, router.js, registry.js (sidebar)
router.js -> registry.js (template) -> ensureScript -> js/pages/*.js (nagre-register sa registry)
settings.js -> config, security, storage | dashboard.js -> config, storage (lahat sa window.BMWW)

PAGE CONTRACTS
PAGE: dashboard | INPUT: localStorage "bmww.settings" | OUTPUT: pangalan, folder, huling save
  HTML ID: dash-machine, dash-mode, dash-root, dash-source, dash-saved | DEPENDS: readLocalSettings
PAGE: calibration, master | INPUT: wala pa | OUTPUT: placeholder (wala pang laman) | HTML ID: wala | DEPENDS: registry.registerPage [v2.3]
PAGE: settings | INPUT: radio, #machine-name, folder picker, full path input (type/paste, [v2.4]), settings.json | OUTPUT: settings.json sa BMWW\settings, localStorage
  HTML ID: machine-note, machine-name, path-list, save-settings, settings-status (ang row ng bawat path ay gawa ng JS mula sa CONFIG.PATH_LIST)
  DEPENDS: sanitizeInput, pickFolder, hasPermission, saveHandle, loadHandle, writeSettingsFile, readSettingsFile

=== KNOWN ISSUES / TODO ===
2026-11-20 | [v2.4] Hindi makukuha ng browser ang full path; tina-type/pine-paste ng user. Sinusuri lang kung tugma ang dulo ng path sa pangalan ng folder; hindi nito nalalaman kung tama ang buong path.
2026-11-20 | [v2.4] Dashboard ay nagpapakita pa rin ng pangalan ng folder (hindi pa ginagalaw); susunod ang full path doon kung gusto.
2026-11-20 | [v2.4] Hindi pa nasubukan sa tunay na browser; jsdom smoke test lang ang nagawa.
2026-11-19 | Hindi pa nasubukan sa browser; unang test ay sa device ng user.
2026-11-19 | Hindi puwedeng pumili ang browser ng "Desktop" mismo; piliin ang BMWW folder (gumawa muna nito).
2026-11-19 | [AYOS v2.4] Ang lock ng machine name ay nasa settings.json at localStorage; kung buburahin ang pareho, mababago ulit.
2026-11-19 | Data source folder ay napipili at nase-save pa lang; wala pang pagbasa ng data (susunod na hakbang).
2026-11-19 | 404 page ay walang sariling css/js.
2026-11-20 | Hindi pa nasubukan sa browser ang bagong design; unang test ay sa device ng user.
2026-11-20 | Dark mode ay sumusunod sa setting ng device (walang toggle button).
2026-11-20 | Ang HTML ng page/sidebar ay may dalawang kopya (pages/*.html at js/templates/*.template.js); kapag nag-edit, i-update ang pareho.
2026-11-20 | Hindi pa nasubukan sa browser ang double-click mode; hindi sigurado kung gagana ang folder picker at IndexedDB sa file:// (unang test sa device ng user).
2026-11-20 | window.BMWW ay isang global (namespace); kailangan ito dahil walang module sa file://.
2026-11-20 | Bilang ng path = 5 (server, saving, 3 data source); palitan ang CONFIG.PATH_LIST kung iba ang kailangan.
2026-11-20 | Pangalan lang ng folder ang nakukuha ng browser (hindi ang buong path); kailangang piliin ulit ang folder kapag nag-expire ang permission.
2026-11-20 | Dashboard ay nagpapakita pa lang ng saving path at data source 1; susunod ang bagong design na may lahat ng path.
2026-11-20 | Calibration at Master ay placeholder lang; hinihintay ang laman na gusto ng user.
2026-11-20 | [AYOS v2.4: walang lock na ang machine name] Machine name ay nila-lock sa unang Save (kailangan muna ang Saving path); ang ibang path ay bubukas pagkapili ng BMWW.
2026-11-20 | Dashboard ay hindi pa nagbabago ayon sa kumpleto/hindi kumpletong Settings (Part 2).
