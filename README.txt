BM ANALYZER WEB v1 | 2026-11-19

PAANO BUKSAN (Rule 18)
Hindi gumagana ang fetch() sa double-click (file://). Gumamit ng local server:
  1. I-unzip ang folder. 2. Sa loob ng folder: python -m http.server 8000
  3. Buksan sa Chrome o Edge: http://localhost:8000
Suportadong browser: Chrome/Edge (huling bersyon). Ang folder picker ay Chrome/Edge lang.
Hindi nababasa ng browser ang path nang kusa. Kailangang piliin ng user ang BMWW folder.

=== OVERVIEW ===
A. FILES
index.html              | shell: sidebar + #content
components/sidebar.html | links ng Dashboard at Settings
pages/dashboard.html, settings.html, 404.html | mga page (404 walang sariling css/js)
css/base.css            | variables, reset | layout.css: sidebar/responsive | components.css: card, button, form
css/pages/dashboard.css, settings.css | style ng page (naka-scope)
js/core/config.js       | constants, selectors, text
js/core/app.js          | entry point | router.js: nagloload ng page | security.js: right click, sanitize | storage.js: folder access
js/pages/dashboard.js, settings.js | init ng bawat page

B. FUNCTIONS (File | Input->Output | Ginagawa | Tinatawag ng)
loadSidebar()          | app.js | ->Promise | kinukuha ang components/sidebar.html | initApp
setMenuOpen(isOpen)    | app.js | bool | toggle ng class sidebar-open | bindMenu
bindMenu()             | app.js | - | click ng menu button, overlay, nav link | initApp
handleNavigate()       | app.js | ->Promise | loadPage(getPageFromHash()) | initApp, hashchange
initApp()              | app.js | ->Promise | simula ng app | app.js
getPageFromHash()      | router.js | ->string | page name mula sa hash | app.js
showMessage(message)   | router.js | string | mensahe sa #content (textContent) | loadPage
ensureStylesheet(href) | router.js | string->Promise | load ng CSS nang isang beses | loadPage
setActiveLink(name)    | router.js | string | active state sa sidebar | loadPage
loadPage(pageName)     | router.js | string->Promise | fetch, CSS, JS, init ng page; try/catch, friendly error | app.js
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
renderMachine()        | settings.js | - | field at lock state | init, onSave, radio change
folderLabel(h, name)   | settings.js | ->string | label ng folder | renderFolders
renderFolders()        | settings.js | - | pangalan ng folder | init, onPickFolder, onSave
loadState()            | settings.js | ->Promise | basa ng naunang settings | init
onPickFolder(kind)     | settings.js | 'root'|'source' | pili at save ng handle; root ay dapat BMWW | click
onSave()               | settings.js | ->Promise | save sa file; lock ng machine name | click
init() (settings)      | settings.js | ->Promise | simula ng page | router

C. VARIABLES / CONSTANTS
CONFIG (config.js, frozen): PAGE_FOLDER, COMPONENT_FOLDER, DEFAULT_PAGE, NOT_FOUND_PAGE, PAGE_LIST, OPEN_CLASS, ACTIVE_CLASS,
  STORAGE_KEY, DB_NAME, DB_STORE, HANDLE_KEY, ROOT_FOLDER_NAME, SETTINGS_SUBFOLDER, SETTINGS_FILE, SETTINGS_PATH_LABEL,
  MACHINE_MODE, LEAD_PC_NAME, MACHINE_NAME_MAX, SELECTOR (lahat ng id/selector), TEXT (lahat ng mensahe)
loadedStyleList (router.js, let array, module-only) | tala ng CSS na na-load na
settings, rootHandle, sourceHandle (settings.js, let, module-only) | kasalukuyang settings at folder handles
SEL, TEXT (settings.js, const) | shortcut sa CONFIG

D. EVENTS
click       | #menu-button, #overlay, .sidebar-link | app.js | buksan/isara ang menu
hashchange  | window | app.js | loadPage
contextmenu | document | security.js | harang maliban sa input/textarea
keydown     | document | security.js | harang ng shortcuts
change      | input[name=machine-mode] | settings.js | renderMachine
click       | #pick-root, #pick-source, #save-settings | settings.js | pili/save

E. STORAGE / API
localStorage "bmww.settings" | settings.js, dashboard.js | {machineMode, machineName, machineNameLocked, rootFolderName, sourceFolderName, savedAt} | cache
IndexedDB "bmww-db" / store "handles" (keys rootFolder, sourceFolder) | storage.js | folder handles | iwas pili ulit
File: <BMWW>\settings\settings.json | storage.js | parehong object | pangunahing tala (C:\desktop\BMWW\settings)
Walang backend/API sa v1 (api/ ay walang laman).

F. CSS VARIABLES: --color-primary, --color-bg, --color-surface, --color-text, --color-border, --space-*, --radius, --shadow, --sidebar-width, --touch-size (css/base.css)

G. DEPENDENCY MAP
index.html -> app.js -> security.js
app.js -> router.js -> pages/*.html -> js/pages/*.js
settings.js -> config.js, security.js, storage.js | dashboard.js -> config.js, storage.js

PAGE CONTRACTS
PAGE: dashboard | INPUT: localStorage "bmww.settings" | OUTPUT: pangalan, folder, huling save
  HTML ID: dash-machine, dash-mode, dash-root, dash-source, dash-saved | DEPENDS: readLocalSettings
PAGE: settings | INPUT: radio, #machine-name, folder picker, settings.json | OUTPUT: settings.json sa BMWW\settings, localStorage
  HTML ID: machine-note, machine-name, pick-root, root-label, pick-source, source-label, save-settings, settings-status
  DEPENDS: sanitizeInput, pickFolder, hasPermission, saveHandle, loadHandle, writeSettingsFile, readSettingsFile

=== KNOWN ISSUES / TODO ===
2026-11-19 | Hindi pa nasubukan sa browser; unang test ay sa device ng user.
2026-11-19 | Hindi puwedeng pumili ang browser ng "Desktop" mismo; piliin ang BMWW folder (gumawa muna nito).
2026-11-19 | Ang lock ng machine name ay nasa settings.json at localStorage; kung buburahin ang pareho, mababago ulit.
2026-11-19 | Data source folder ay napipili at nase-save pa lang; wala pang pagbasa ng data (susunod na hakbang).
2026-11-19 | 404 page ay walang sariling css/js.
