BM ANALYZER WEB v1 | 2026-11-19
v4 | 2026-11-20 | Overall design: itim-at-puti, modern, simple, elegant; animation (page/card entrance, hover, ripple, spotlight, sliding sidebar indicator). Bagong css/theme.css at js/core/effects.js; index.html lang ang binago
v3 | 2026-11-20 | Dashboard: Date at oras (live), buwanang kalendaryo, Events (Add/Edit/Delete) na offline; naka-save sa localStorage at <BMWW>\settings\events.json
v2.9 | 2026-11-20 | Master (Range): mas maliit na font ng file panel; legend sa ilalim ng chart para sa napiling file lang (kasama ang MASTER)
v2.8 | 2026-11-20 | Master (Range): listahan ng file sa gilid ng chart, lahat naka-check; kapag na-uncheck ang file, nawawala ang linya nito sa chart
v2.7 | 2026-11-20 | Master: chart mas maliit (zoom out), kulay green / yellow / red kada reading (actual vs master)
v2.6 | 2026-11-20 | Master page: Latest Master (today, readonly) at Range Master analysis; gumagamit ng Data source 1 ng Settings; error trapping
v2.4 | 2026-11-20 | Settings: full path ng bawat folder (type/paste, may validation); tinanggal ang lock ng machine name
v2.5 | 2026-11-20 | LOT Tracking page (link sa sidebar, Barcode -> Operator -> bantay ng bagong file/folder sa Data source ng Settings)
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
js/core/csv-reader.js     | [v2.6] pagbasa ng CSV mula sa folder handle, parse ng petsa at numero
js/core/master-analysis.js| [v2.6] kalkulasyon ng Latest Master (R square) at Range Master (repeatability)
js/core/chart-draw.js     | [v2.6] SVG chart (scatter, line, bar), walang library
pages/master.html, js/pages/master.js, css/pages/master.css, js/templates/master.template.js | [v2.6] Master page
js/core/config.js       | constants, selectors, text
js/core/app.js          | entry point | router.js: nagloload ng page | security.js: right click, sanitize | storage.js: folder access
js/pages/dashboard.js, settings.js | init ng bawat page (nagre-register sa registry)
js/core/registry.js     | [v2] talaan ng template at page module
pages/calibration.html, master.html + css/pages + js/pages (+ js/templates) | [v2.3] placeholder page; wala pang laman
js/templates/sidebar|dashboard|settings|404.template.js | [v2] kopya ng HTML ng component/page bilang string (ito ang ginagamit ng app)
pages/lot-tracking.html | [v2.5] LOT Tracking page (markup; kopya ay js/templates/lot-tracking.template.js)
css/pages/lot-tracking.css | [v2.5] style ng LOT Tracking (naka-scope sa .page-lot-tracking)
js/pages/lot-tracking.js | [v2.5] logic ng LOT Tracking | js/templates/lot-tracking.template.js | [v2.5] kopya ng pages/lot-tracking.html bilang string

js/core/events-store.js | [v3] basa/sulat ng events (localStorage at settings/events.json)
js/pages/dashboard-events.js | [v3] orasan, kalendaryo, listahan at form ng events ng Dashboard (nagre-register sa window.BMWW.dashboardEvents)
css/pages/dashboard-events.css | [v3] style ng seksyon (naka-scope sa .page-dashboard)

css/theme.css | [v4] buong design: pinapalitan ang mga variable ng base.css (kulay, radius, shadow, font), animation at effects; naka-load sa huli sa index.html
js/core/effects.js | [v4] spotlight sa card, ripple sa button, sliding indicator ng sidebar (window.BMWW walang bagong export)

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
[v2.6] csv-reader.js (window.BMWW.csv):
createError(code)      | csv-reader.js | string->Error | Error na may .code para sa friendly na mensahe | master-analysis, master.js
parseCsv(text)         | csv-reader.js | string->array | CSV text papuntang rows (quotes, CRLF, BOM) | readCsvRows
listCsvFiles(handle)   | csv-reader.js | ->Promise<{fileList,skippedCount}> | lahat ng .csv sa mismong folder (walang subfolder) | analyzeLatest, analyzeRange
readCsvRows(file)      | csv-reader.js | File->Promise<array> | basa at parse; error 'fileTooLarge' kung lampas CSV_MAX_BYTES | analyzeLatest, analyzeRange
getCell(rows, r, c)    | csv-reader.js | ->string | ligtas na kuha ng cell (0-based) | master-analysis
countHeaders(rows)     | csv-reader.js | ->number | bilang ng hindi blangkong header sa row 2 (hanggang 300 column) | master-analysis
toNumber(value)        | csv-reader.js | ->number|null | numero o null | master-analysis, master.js
fixYear(year)          | csv-reader.js | number->number | 2-digit na taon ay 20xx | parseAnyDate
parseAnyDate(value)    | csv-reader.js | ->Date|null | M/D/Y, D/M/Y (kung una>12), Y-M-D, may oras o wala | master-analysis
padTwo(n)              | csv-reader.js | number->string | dalawang digit | formatDateTime, formatDateInput
formatDateTime(d, ampm)| csv-reader.js | ->string | mm/dd/yyyy hh:mm (o may AM/PM) | master-analysis, master.js
formatDateInput(d)     | csv-reader.js | ->string | yyyy-mm-dd para sa input type=date | master.js
parseDateInput(text)   | csv-reader.js | ->Date|null | mula sa input type=date | master.js
[v2.6] master-analysis.js (window.BMWW.masterAnalysis):
yieldToBrowser()       | master-analysis.js | ->Promise | hayaan ang browser mag-update ng screen | analyzeLatest, analyzeRange
startOfDay(d), isSameDay(a, b) | master-analysis.js | Date | 00:00 ng araw; pareho ba ang araw | analyzeLatest, analyzeRange
averageOf(list)        | master-analysis.js | ->number|null | average ng numero (fallback ng Actual/Master AVG) | analyzeLatest
readPoints(rows, r)    | master-analysis.js | ->{actualList,masterList} | 15 actual (F:T) at 15 master (DA:DO) sa isang row | analyzeLatest, analyzeRange
readBarcodes(rows)     | master-analysis.js | ->array | 15 barcode (row 4, F:T) | analyzeLatest, analyzeRange
computeRegression(x, y)| master-analysis.js | ->{slope,intercept,rSquared,pairCount}|null | tulad ng RSQ ng Excel; null kung kulang/pare-pareho | analyzeLatest
classifyLatest(r2)     | master-analysis.js | ->string | PASS >=0.99, FAIL <0.97, WARNING sa pagitan | analyzeLatest
classifyDeviation(actual, master) | master-analysis.js | ->'level-green'|'level-yellow'|'level-red'|'' | [v2.7] |actual-master| <= 1.5 green, <= 2.5 yellow, higit pa red (CONFIG.MASTER.DEVIATION) | master.js (levelOf)
classifyRange(avgDiff) | master-analysis.js | ->string | PASS <=1, WARNING <=3, FAIL >3 | computeRepeatability
computeRepeatability(columns, master, barcodes) | master-analysis.js | ->object | avg diff, score (100-avg diff), max diff, worst barcode, averages, kada barcode | analyzeRange
analyzeLatest(handle, date, onProgress) | master-analysis.js | ->Promise<object> | pinakabagong file (lastModified) na may 15 headers at record sa araw na iyon; MAX_FILES lang ang sinusuri | master.js (onRunLatest)
analyzeRange(handle, start, end, onProgress) | master-analysis.js | ->Promise<object> | lahat ng master file na ang lastModified ay nasa range; master = pinakabagong record; [v2.8] bawat column ay may fileName (pangalan ng CSV na pinanggalingan) | master.js (onRunRange)
[v2.6] chart-draw.js (window.BMWW.chart):
svgElement(name, attrs, text) | chart-draw.js | ->SVGElement | gawa ng SVG element (walang innerHTML) | lahat ng draw function
buildTicks(min, max)   | chart-draw.js | ->{tickList,minimum,maximum} | maayos na tick ng axis | drawScatter, drawLines, drawBars
formatTick(value)      | chart-draw.js | number->string | maikling numero | drawAxes, drawScatter
createSvg(container, title) | chart-draw.js | ->SVG | bagong SVG na may pamagat | drawScatter, drawLines, drawBars
drawAxes(svg, xScale, yScale, xTicks, yTicks, xTitle, yTitle) | chart-draw.js | - | grid, axis, label | draw functions
getPaddedRange(values) | chart-draw.js | ->{low,high} | [v2.7] saklaw ng data na may espasyo (CHART.PAD_RATIO), zoom out | drawScatter
drawScatter(container, options) | chart-draw.js | - | Actual vs Master, may trendline, equation at R square | master.js (renderLatest)
drawLines(container, options)   | chart-draw.js | - | line kada petsa + MASTER (makapal); [v2.8] series.colorIndex at options.hideLegend | master.js (drawRangeLines)
getColorIndex(series, seriesIndex) | chart-draw.js | ->number | [v2.8] colorIndex ng series (kung meron) o posisyon, modulo PALETTE_SIZE; hindi gumagalaw ang kulay kapag may na-uncheck | drawLines, appendLegend
appendLegend(container, seriesList) | chart-draw.js | - | legend (master lang kapag higit 12 series) | drawLines
drawBars(container, options)    | chart-draw.js | - | bar ng Actual AVG at Master AVG | master.js (renderLatest)
[v2.6] master.js (page):
levelOf(actual, master) | master.js | ->string | [v2.7] class ng kulay ng reading | renderLatest, renderRange
makeLevelLegend()      | master.js | ->ul | [v2.7] legend ng green / yellow / red mula sa CONFIG.MASTER.DEVIATION | renderLatest, renderRange
query(key), makeElement(tag, class, text), setStatus(statusKey, msg, kind), getErrorMessage(error), setBusy(bool) | master.js | helper ng page; getErrorMessage ay nagmamapa ng error.code o error.name (NotFoundError, NotAllowedError, SecurityError) sa friendly na mensahe
getReadyHandle()       | master.js | ->Promise<Handle> | handle ng Data source 1 at permission (galing sa click) | onRunLatest, onRunRange
renderSource()         | master.js | - | ipinapakita ang full path (o pangalan) ng Data source 1 | init
clearSection(statusKey, resultKey) | master.js | - | linis ng mensahe at resulta | onRunLatest, onRunRange
makeStatusBadge(status), makeStatList(entries), makeTable(headers, rows), formatNumber(v, digits) | master.js | gawa ng elemento ng resulta (textContent lang)
renderLatest(result), renderRange(result) | master.js | - | ipinapakita ang status, stats, table, chart; [v2.8] renderRange: chart + file panel sa gilid | onRunLatest, onRunRange
groupByFile(columnList) | master.js | array->{groupList,groupMap} | [v2.8] pinagsasama ang linya kada file: {name, colorIndex, recordCount}, ayon sa unang labas | renderRange
drawRangeLines(lineBox, result, shownList, groupMap, selectedNameSet) | master.js | - | [v2.8] iginuguhit ang line chart; napiling file lang (at MASTER) ang kasama; walang legend sa ilalim | renderRange (redraw)
makeSelectedLegend(groupMap, selectedNameSet) | master.js | ->ul | [v2.9] legend: MASTER + napiling file lang, kulay ng linya | drawRangeLines
makeFilePanel(groupList, selectedNameSet, onChange) | master.js | ->aside | [v2.8] checkbox ng bawat file (lahat naka-check) + 'Napili: n / total'; change event ay nag-a-update ng selectedNameSet at tumatawag ng onChange | renderRange
[v2.8] CONFIG.TEXT.master: filePanelTitle, filePanelNote, fileRecords, fileSelected, fileNoneSelected | js/core/config.js | text ng file panel
[v2.8] Events: change | .file-checkbox | master.js | tatawag ng redraw ng line chart | (isang listener kada checkbox; nawawala kasama ng resulta kapag nag-Run ulit)
onRunLatest()          | master.js | ->Promise | click ng Run Latest Master (today) | click
onRunRange()           | master.js | ->Promise | click ng Run Range Master; sinusuri ang petsa bago magbasa | click
init() (master)        | master.js | ->Promise | [v2.6] default na petsa, source, listener | router
[v2.6] Ang master.js ay nasa window.BMWW.csv, .masterAnalysis, .chart.
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
createEmptyLote()     | lot-tracking.js | ->{barcode,operator,startMs,endMs} | [v2.5] walang laman na lote | module, onNewLote
query(key)             | lot-tracking.js | string->Element | [v2.5] hanap ng elemento sa CONFIG.LOT.SELECTOR | lahat
isActive()             | lot-tracking.js | ->bool | [v2.5] may simula at wala pang wakas ang lote | renderLote, handleBarcode, onNewLote, init
pad(n), formatDate(ms), formatTime(ms), formatDateTime(ms) | lot-tracking.js | ms->string | [v2.5] yyyy-mm-dd, hh:mm:ss | renderLote, renderResults
setStatus(msg, isErr)  | lot-tracking.js | - | [v2.5] status sa ilalim ng form | lahat
setResultNote(msg)     | lot-tracking.js | - | [v2.5] tala sa ibabaw ng RESULT | renderResults, clearResults, refreshResults
renderLote()           | lot-tracking.js | - | [v2.5] form values at badge (ONGOING/DONE/Walang lote) | startLote, endLote, onNewLote, init
parseName(name)        | lot-tracking.js | string->{wafer,blk,layer} | [v2.5] regex CONFIG.LOT.NAME_PATTERN (hal. 4A05520A -> 4A055, A, 20) | buildItem
buildItem(...)         | lot-tracking.js | -> item | [v2.5] isang row ng RESULT | scanDirectory
scanDirectory(handle, label, path, depth, earliestMs, list) | lot-tracking.js | ->Promise<ms> | [v2.5] basa-lang na hanap ng bagong file/folder, hanggang MAX_DEPTH; ibinabalik ang pinakabagong modified sa loob | refreshResults
loadSources()          | lot-tracking.js | ->Promise | [v2.5] kuha ng handle ng source1..3 mula sa IndexedDB (HANDLE_KEY) | init
requestAccess()        | lot-tracking.js | ->Promise | [v2.5] hingi ng permission sa bawat source (kapag may kilos ng user) | startLote
renderResults(list, warnings) / clearResults() | lot-tracking.js | - | [v2.5] talaan ng RESULT (textContent lang) | refreshResults, startLote, onNewLote
refreshResults()       | lot-tracking.js | ->Promise | [v2.5] isang beses na hanap sa lahat ng source (may guard laban sa dobleng takbo) | timer, startLote, endLote, init
startTimer() / stopTimer() | lot-tracking.js | - | [v2.5] auto refresh kada CONFIG.LOT.REFRESH_MS | startLote, endLote, onNewLote, init
endLote() / startLote(operator) | lot-tracking.js | ->Promise | [v2.5] tapusin / simulan ang lote (Start/End = ngayon) | handleBarcode, handleOperator
handleBarcode() / handleOperator() | lot-tracking.js | - | [v2.5] Enter sa Barcode (parehong barcode = END) / Operator (2-30 chars) | keydown
onNewLote() / isEnterKey(event) / init() | lot-tracking.js | - | [v2.5] NEW LOTE button; Enter key lang; init ng page | click, keydown, router

[v3] events-store.js (window.BMWW.eventsStore):
isValidDateText(value)  | events-store.js | string->bool | tama ba ang YYYY-MM-DD (totoong petsa) | normalizeEvent, dashboard-events
isValidTimeText(value)  | events-store.js | string->bool | HH:MM o walang oras | normalizeEvent, dashboard-events
normalizeEvent(raw)     | events-store.js | object->object|null | linis at validate ng isang event (title/note sanitize, id, petsa, oras) | normalizeList
normalizeList(list)     | events-store.js | array->array | valid lang, walang dobleng id, hanggang MAX_EVENTS | readLocalEvents, readEventsFile, saveEvents
sortEvents(list)        | events-store.js | array->array | ayos ayon sa petsa, oras, title | store, dashboard-events
createId()              | events-store.js | ->string | bagong id ng event | dashboard-events (readForm)
stripPending(list)      | events-store.js | array->array | tanggal ang pending mark bago i-save sa file | writeEventsFile, saveEvents
readLocalEvents()       | events-store.js | ->array | basa ng localStorage 'bmww.events' (try/catch) | loadEvents, dashboard-events (init)
writeLocalEvents(list)  | events-store.js | array | sulat sa localStorage (try/catch) | loadEvents, saveEvents
readEventsFile(handle)  | events-store.js | handle->Promise<array|null> | basa ng settings/events.json; null kung wala pa; error kung sira | loadEvents
writeEventsFile(h,list) | events-store.js | handle,array->Promise | sulat ng settings/events.json {version,savedAt,events} | loadEvents, saveEvents
findRootHandle(ask)     | events-store.js | bool->Promise<{handle,state}> | hawak ng BMWW folder at permission; state: ok/noFolder/noPermission/unsupported | loadEvents
mergeWithPending(f,l)   | events-store.js | array,array->array | file ang pangunahin; isinasama ang pending na nai-save habang walang file | loadEvents
loadEvents(ask)         | events-store.js | bool->Promise<{events,fileState}> | file muna kung mabubuksan, kung hindi ay lokal; hindi nagtatapon ng error | dashboard-events (init, handleGrant)
saveEvents(list)        | events-store.js | array->Promise<{events,fileState}> | sulat sa file (kung ok) at localStorage; pending kapag hindi naisulat sa file | dashboard-events (persist)
[v3] dashboard-events.js (window.BMWW.dashboardEvents):
pad / toDateKey / fromDateKey / formatLongDate | dashboard-events.js | helper ng petsa (oras ng PC, hindi UTC)
getElements()           | dashboard-events.js | ->object|null | lahat ng elemento ayon sa CONFIG.SELECTOR.events | init
countByDate(list)       | dashboard-events.js | array->Map | bilang ng event kada petsa | renderCalendar
setMessage / setFormStatus | dashboard-events.js | string | mensahe ng resulta / error ng form (textContent) | handlers
stopClock / updateClock / startClock | dashboard-events.js | - | live na oras at petsa; humihinto kapag wala na ang pahina; nire-render ang kalendaryo kapag nagpalit ang araw | init
renderWeekdays / renderCalendar | dashboard-events.js | - | pangalan ng araw at 42 na araw ng buwan (marka: today, selected, has-event, outside) | init, renderAll
changeMonth(step) / selectDate(key) / handleToday() | dashboard-events.js | - | lipat ng buwan / pili ng petsa / balik sa ngayon | click handlers
createActionButton / createEventItem / renderDayList | dashboard-events.js | - | listahan ng events ng napiling petsa (textContent lang) | renderAll
renderStorageNote() / renderAll() | dashboard-events.js | - | tala kung saan naka-save at button na Payagan ang folder / buong render | init, handlers
openForm(item) / closeForm() / readForm() | dashboard-events.js | - | form ng Add/Edit, validation | click, submit
persist(list) / handleSubmit / handleListClick / handleGrant / bindEvents / init | dashboard-events.js | - | save, Edit/Delete, permission ng folder, listeners, simula (tinatawag ng dashboard.js) | dashboard.js

[v4] effects.js:
isReducedMotion()       | effects.js | ->bool | tinitingnan ang CONFIG.REDUCED_MOTION_QUERY | handlePointerMove, handlePointerDown
handlePointerMove(e)    | effects.js | event | itinatakda ang --mx / --my ng card para sa spotlight (requestAnimationFrame) | pointermove sa document
handlePointerDown(e)    | effects.js | event | gumagawa ng .ripple sa pinindot na .btn; tinatanggal pagkatapos ng animation | pointerdown sa document
updateIndicator()       | effects.js | - | inilalagay ang .sidebar-indicator sa .is-active na link (translateY at height) | scheduleIndicator
scheduleIndicator()     | effects.js | - | pinagsasama ang sunud-sunod na update sa isang frame | MutationObserver ng sidebar, resize
initEffects()           | effects.js | - | nilalagay ang mga listener at observer | effects.js (sarili)

C. VARIABLES / CONSTANTS
CONFIG (config.js, frozen): PATH_LIST (v2.2: server, root, source1, source2, source3; v2.3: required sa root, gated sa iba), ROW_CLASS, REDUCED_MOTION_QUERY, SCROLL_BEHAVIOR (v2.3), PAGE_LIST (v2.3: dashboard, settings, calibration, master), ROOT_KEY, LEGACY_NAME_FIELD, BADGE (v2.2), PAGE_FOLDER [LUMA v2], COMPONENT_FOLDER [LUMA v2], SIDEBAR_TEMPLATE (v2), DEFAULT_PAGE, NOT_FOUND_PAGE, PAGE_LIST, OPEN_CLASS, ACTIVE_CLASS,
  STORAGE_KEY, DB_NAME, DB_STORE, HANDLE_KEY, ROOT_FOLDER_NAME, SETTINGS_SUBFOLDER, SETTINGS_FILE, SETTINGS_PATH_LABEL,
  MACHINE_MODE, LEAD_PC_NAME, MACHINE_NAME_MAX, [v2.4] FULL_PATH_MAX, FULL_PATH_PATTERN, PATH_SEPARATOR, FOLDER_PATHS_FIELD, ROW_INPUT_CLASS, SELECTOR (lahat ng id/selector), TEXT (lahat ng mensahe)
window.BMWW (config.js) | [v2] tanging global: namespace ng app (CONFIG, registry, router, security, storage)
[v2.6] CONFIG.MASTER (SOURCE_KEY, CSV_EXTENSION, CSV_MAX_BYTES, HEADER_COUNT=15, HEADER_SCAN_COLUMNS, HEADER_ROW, BARCODE_ROW, DATA_START_ROW, DATE_COLUMN, ACTUAL_START_COLUMN, POINT_COUNT, MASTER_START_COLUMN, ACTUAL_AVG_COLUMN, MASTER_AVG_COLUMN, LATEST{PASS_MIN, FAIL_BELOW, MAX_FILES}, RANGE{PASS_MAX, WARNING_MAX, DEFAULT_DAYS, NO_PAIR_DIFFERENCE, MAX_LINES}, STATUS, STATUS_CLASS, ERROR_BY_NAME) | 0-based ang index (row 4 ng Excel = 3; column DA = 104)
[v2.7] CONFIG.MASTER.DEVIATION (GREEN_MAX 1.5, YELLOW_MAX 2.5, ROUND_DIGITS, LEVEL{green,yellow,red}); CONFIG.CHART.PAD_RATIO (0.15); TEXT.master.levelLegendTitle / levelGreen / levelYellow / levelRed
[v2.6] CONFIG.CHART (WIDTH, HEIGHT, PADDING, TICK_COUNT, PALETTE_SIZE, LEGEND_MAX); SELECTOR.master; TEXT.master (kasama ang TEXT.master.error)
sourceHandle (let), isBusy (let) sa master.js, nasa loob ng IIFE | folder handle ng Data source 1; bantay para hindi dalawang beses tumakbo
loadedStyleList, loadedScriptList (router.js, const array, nasa loob ng IIFE) | tala ng CSS/JS na na-load na
settings (let), handleMap, rowMap (const object) sa settings.js, nasa loob ng IIFE | kasalukuyang settings, folder handles ayon sa path key, at elemento ng bawat row
SEL, TEXT (settings.js, const) | shortcut sa CONFIG
INPUT (settings.js, const) | [v2.4] shortcut sa CONFIG.ROW_INPUT_CLASS (class ng full path input)
[BINURA v2.4] SELECTOR.settings.lockBadge, TEXT.machineWarn / machineLocked / confirmLock / badgeLocked / badgeOpen; pinalitan ng TEXT.machineNote
CONFIG.LOT (config.js, v2.5): PAGE, SOURCE_KEYS, SOURCE_LABEL, REFRESH_MS (3000), START_TOLERANCE_MS (1000), MAX_DEPTH (5), MAX_ROWS (30), BARCODE_MAX, OPERATOR_MIN, OPERATOR_MAX, IGNORED_PREFIX, NAME_PATTERN, TYPE, PATH_COLUMN, EMPTY_CELL, SELECTOR, TEXT; PAGE_LIST ay may 'lot-tracking'
lote, pendingBarcode, sourceList, timerId, isScanning (lot-tracking.js, let, nasa loob ng IIFE) | [v2.5] kasalukuyang lote, barcode na hinihintay ang operator, mga source handle, timer, guard

[v3] CONFIG.EVENTS (config.js): STORAGE_KEY 'bmww.events', FILE_NAME 'events.json', FILE_VERSION, ID_PREFIX, LOCALE 'en-PH', WEEK_START (0=Linggo), CELL_COUNT 42, CLOCK_MS 1000, TITLE_MAX 60, NOTE_MAX 300, ID_MAX, MAX_EVENTS 500, DATE_PATTERN, TIME_PATTERN, ATTR, ACTION, CLASS, FILE_STATE{ok,noFolder,noPermission,unsupported,error}
[v3] CONFIG.SELECTOR.events (lahat ng id ng seksyon), CONFIG.SELECTOR.eventDay / eventAction, CONFIG.TEXT.events (lahat ng mensahe)
[v3] elements, state (let), clockTimerId (let) sa dashboard-events.js, nasa loob ng IIFE | mga elemento ng seksyon; state {eventList, fileState, todayKey, selectedDate, viewYear, viewMonth, editingId, isBusy}; timer ng orasan
[v3] currentFileState, currentRootHandle (let) sa events-store.js, nasa loob ng IIFE | huling state ng file at hawak ng BMWW folder
[v3] Event: {id, title, date 'YYYY-MM-DD', time 'HH:MM' o '', note}; pending (true) ay sa localStorage lang

[v4] EFFECTS (effects.js, const frozen, nasa loob ng IIFE) | CARD, SPOT_X/SPOT_Y, BUTTON, RIPPLE_CLASS, SIDEBAR_LIST, LINK, ACTIVE_CLASS, INDICATOR_CLASS, READY_CLASS. [Paalala: nasa effects.js at hindi sa config.js para hindi galawin ang config.js; puwedeng ilipat sa susunod.]
[v4] frameId, indicatorFrameId (let) sa effects.js | id ng requestAnimationFrame
[v4] CSS VARIABLES sa css/theme.css: --glow, --spot (liwanag ng background at spotlight), --ease; pinalitan ang --color-*, --radius, --radius-sm, --shadow, --shadow-hover, --ring, --transition, --font-main. Dark mode: itim, charcoal at puti.

D. EVENTS
click       | #menu-button, #overlay, .sidebar-link | app.js | buksan/isara ang menu
hashchange  | window | app.js | loadPage
contextmenu | document | security.js | harang maliban sa input/textarea
keydown     | document | security.js | harang ng shortcuts
change      | input[name=machine-mode] | settings.js | renderMachine
click       | button ng bawat path (gawa ng JS), #save-settings | settings.js | pili/save
click       | #latest-run, #range-run | master.js | onRunLatest, onRunRange
input       | full path input ng bawat path (gawa ng JS) | settings.js | onFullPathInput
[BINURA v2.2] #pick-root, #pick-source -> pinalitan ng mga button sa path list
keydown     | #lot-barcode, #lot-operator | lot-tracking.js | [v2.5] Enter: handleBarcode / handleOperator
focus       | #lot-barcode | lot-tracking.js | [v2.5] select ng laman para mapalitan ng bagong scan
click       | #lot-new | lot-tracking.js | [v2.5] onNewLote
setInterval | window | lot-tracking.js | [v2.5] refreshResults kada 3 segundo habang ONGOING

click       | #cal-prev, #cal-next, #cal-today, #ev-add, #ev-cancel, #ev-grant | dashboard-events.js | lipat ng buwan, ngayon, bagong event, cancel, payagan ang folder
click       | #cal-grid (delegation sa [data-date]) | dashboard-events.js | handleGridClick -> selectDate
click       | #ev-list (delegation sa [data-action]) | dashboard-events.js | handleListClick (Edit / Delete may confirm)
submit      | #ev-form | dashboard-events.js | handleSubmit
setInterval | window | dashboard-events.js | updateClock kada 1 segundo; humihinto kapag wala na ang #dash-clock-time sa pahina

pointermove | document | effects.js | spotlight ng card
pointerdown | document | effects.js | ripple ng button
resize      | window | effects.js | scheduleIndicator
MutationObserver | #sidebar (childList, subtree, class) | effects.js | scheduleIndicator kapag nagbago ang active link

E. STORAGE / API
localStorage "bmww.settings" | settings.js, dashboard.js | {machineMode, machineName, [BINURA v2.4: machineNameLocked], [v2.4] folderPaths{server,root,source1,source2,source3}, rootFolderName, sourceFolderName (para sa Dashboard), folderNames{server,root,source1,source2,source3}, savedAt} | cache
IndexedDB "bmww-db" / store "handles" (keys rootFolder, serverFolder, sourceFolder, sourceFolder2, sourceFolder3) | storage.js | folder handles | iwas pili ulit
File: <BMWW>\settings\settings.json | storage.js | parehong object | pangunahing tala (C:\desktop\BMWW\settings)
Walang backend/API sa v1 (api/ ay walang laman).
[v2.5] LOT Tracking: binabasa ang machineName mula sa localStorage "bmww.settings" at ang handle ng source1..3 mula sa IndexedDB (key sa CONFIG.HANDLE_KEY). Walang sinusulat; basa lang sa mga folder.

[v3] localStorage "bmww.events" | events-store.js | array ng event (may pending mark) | cache at pang-offline
[v3] File: <BMWW>\settings\events.json | events-store.js | {version, savedAt, events[]} | pangunahing tala; ang file ang nananaig kapag nabasa; ang pending na event ay isinasama pabalik sa file kapag nabuksan ulit
[v3] Gumagamit ng parehong BMWW folder handle (IndexedDB key rootFolder) at SETTINGS_SUBFOLDER ng Settings. Walang network/API.

F. CSS VARIABLES [v2.7: css/pages/master.css --level-green, --level-yellow, --level-red, --level-yellow-text, --master-warning, --chart-1..8] (css/base.css): --color-primary, --color-primary-dark, --color-primary-soft, --color-on-primary, --color-bg, --color-surface, --color-text, --color-muted, --color-border,
  --color-cta, --color-cta-dark, --color-on-cta (green, para sa Save/Buy/Purchase), --color-focus, --color-success, --color-danger, --color-overlay,
  --space-1/2/3/4/6/8, --radius, --radius-sm, --shadow, --shadow-hover, --ring, --transition, --sidebar-width, --content-max, --touch-size, --font-size-label, --font-main
  Dark mode: prefers-color-scheme block sa base.css, variables lang ang pinapalitan.

G. DEPENDENCY MAP (v2: classic scripts, ayos ng <script defer> sa index.html ang mahalaga)
index.html -> config.js -> registry.js -> security.js -> storage.js -> router.js -> js/templates/*.js -> app.js
app.js -> security.js, router.js, registry.js (sidebar)
router.js -> registry.js (template) -> ensureScript -> js/pages/*.js (nagre-register sa registry)
master.js -> config, storage, csv-reader, master-analysis, chart-draw | master-analysis.js -> csv-reader | csv-reader.js, chart-draw.js -> config (v2.6; ayos sa index.html: storage, csv-reader, master-analysis, chart-draw, router)
settings.js -> config, security, storage | dashboard.js -> config, storage (lahat sa window.BMWW)

[v3] events-store.js -> config, security, storage | dashboard-events.js -> config, security, events-store | dashboard.js -> dashboardEvents.init | ayos sa index.html: ... storage.js, events-store.js ... (dashboard-events.js ay nilo-load ng router mula sa template)

[v4] index.html -> css/theme.css (huling CSS) at js/core/effects.js (pagkatapos ng router.js, bago ang templates at app.js) | effects.js -> config (REDUCED_MOTION_QUERY, SELECTOR.sidebar)

PAGE CONTRACTS
PAGE: dashboard | INPUT: localStorage "bmww.settings" | OUTPUT: pangalan, folder, huling save
  HTML ID: dash-machine, dash-mode, dash-root, dash-source, dash-saved | DEPENDS: readLocalSettings
PAGE: calibration | INPUT: wala pa | OUTPUT: placeholder (wala pang laman) | HTML ID: wala | DEPENDS: registry.registerPage [v2.3]
PAGE: master [v2.6] | INPUT: Data source 1 (folder handle sa IndexedDB, full path sa localStorage 'bmww.settings'), CSV sa folder, #range-start, #range-end | OUTPUT: status, stats, table, chart (hindi sine-save)
  HTML ID: master-source, latest-start, latest-end, latest-run, latest-status, latest-result, range-start, range-end, range-run, range-status, range-result | DEPENDS: storage.loadHandle, hasPermission, readLocalSettings, csv.*, masterAnalysis.*, chart.*
PAGE: settings | INPUT: radio, #machine-name, folder picker, full path input (type/paste, [v2.4]), settings.json | OUTPUT: settings.json sa BMWW\settings, localStorage
  HTML ID: machine-note, machine-name, path-list, save-settings, settings-status (ang row ng bawat path ay gawa ng JS mula sa CONFIG.PATH_LIST)
  DEPENDS: sanitizeInput, pickFolder, hasPermission, saveHandle, loadHandle, writeSettingsFile, readSettingsFile
PAGE: lot-tracking [v2.5] | INPUT: Barcode, Operator, machineName (Settings), folder handle ng Data source 1-3 | OUTPUT: Start/End Date at Time, badge, talaan ng bagong file/folder (walang sine-save)
  HTML ID: lot-badge, lot-machine, lot-barcode, lot-operator, lot-start-date, lot-start-time, lot-end-date, lot-end-time, lot-new, lot-status, lot-result-note, lot-result-body (nasa CONFIG.LOT.SELECTOR)
  DEPENDS: sanitizeInput, readLocalSettings, isFolderAccessSupported, loadHandle, hasPermission

PAGE: dashboard [v3 dagdag] | INPUT: localStorage "bmww.events", <BMWW>\settings\events.json, oras ng PC, form (title, petsa, oras, note) | OUTPUT: orasan, kalendaryo, listahan ng events, sine-save sa localStorage at events.json
  HTML ID: dash-clock-time, dash-clock-date, cal-prev, cal-next, cal-today, cal-title, cal-weekdays, cal-grid, ev-selected-label, ev-list, ev-add, ev-form, ev-form-title, ev-title, ev-date, ev-time, ev-note, ev-save, ev-cancel, ev-form-status, ev-message, ev-status, ev-grant | DEPENDS: eventsStore.loadEvents, saveEvents, sortEvents, createId, isValidDateText, isValidTimeText, security.sanitizeInput

=== KNOWN ISSUES / TODO ===
2026-11-20 | [v2.8] Hindi pa nasubukan sa tunay na browser at tunay na CSV; jsdom test lang (3 gawa-gawang file: uncheck/re-check, kulay, Run ulit).
2026-11-20 | [v2.8] Kada FILE ang checkbox (maraming linya/record ang isang file; sabay silang nawawala). Kung gusto mo kada record (petsa) ang checkbox, sabihin.
2026-11-20 | [v2.8] Mahigit 8 file: umuulit ang kulay (8 ang PALETTE_SIZE). Kapag may na-uncheck, nagre-rescale ang y-axis ayon sa natitirang linya. Ang MASTER ay laging nakikita (walang checkbox).
2026-11-20 | [v2.7] Ang kulay ay para sa bawat reading (point sa scatter, dot sa line chart, cell sa table). Ang 1.6 hanggang 2.5 ay yellow; ang pagitan ng 1.5 at 1.6 (hal. 1.55) ay yellow rin. Nasa CONFIG.MASTER.DEVIATION ang limitasyon.
2026-11-20 | [v2.7] Hindi pa nakita sa tunay na screen ang laki ng chart (jsdom lang); sabihin kung kulang pa ang zoom out.
2026-11-20 | [v2.6] Hindi pa nasubukan sa tunay na CSV at browser; jsdom test lang gamit ang gawa-gawang CSV. Ang column ay galing sa Excel macro (F:T actual, DA:DO master, U at DQ average, row 4 barcode, row 2 header = 15).
2026-11-20 | [v2.6] Date filter ay last modified ng file (hindi created date ng Excel); hindi nababasa ng browser ang created date.
2026-11-20 | [v2.6] Latest Master: sinusuri mula pinakabago hanggang MAX_FILES (60) na file; ang unang master file na may record ngayong araw ang gagamitin (ang Excel ay isang file lang, ang pinakabago).
2026-11-20 | [v2.6] Binabasa lang ang CSV sa mismong Data source 1 folder (walang subfolder). Comma ang delimiter.
2026-11-20 | [v2.6] Range Master: table ay buod kada barcode (hindi buong matrix ng Excel); ang chart ay huling 150 na record lang.
2026-11-20 | [v2.6] Latest Calibration at Range Calibration (Calibration page) ay hindi pa ginagawa.
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
2026-11-20 | LOT Tracking: hindi nasubukan sa browser ang v2.5; unang test ay sa device ng user.
2026-11-20 | LOT Tracking: walang "date created" sa browser; Date Modified (lastModified) ang gamit. Ang folder ay may petsa lang kung may file sa loob nito (petsa = pinakabagong file).
2026-11-20 | LOT Tracking: file na luma pero na-edit pagkatapos ng Start Time ay lalabas din sa RESULT.
2026-11-20 | LOT Tracking: ang hanap kada 3 segundo ay maaaring mabigat sa folder na napakaraming file; palitan ang CONFIG.LOT.REFRESH_MS o MAX_DEPTH.
2026-11-20 | LOT Tracking: ang lote ay nasa memorya lang (nawawala kapag nag-refresh ang browser); wala pang monitoring file, Remarks, SERVER/SEND PC, at LEAD PC view.
2026-11-20 | LOT Tracking: ginagamit ang Data source 1-3 ng Settings (ang Excel ay may File Path 1 at 2 lang).
2026-11-20 | Events: oras ng PC ang gamit; walang online time sync, kaya itama ang oras ng PC paminsan-minsan.
2026-11-20 | Events: kapag sabay mag-save ang dalawang PC sa iisang events.json, ang huling nag-save ang mananalo (walang real-time sync).
2026-11-20 | Events: ang pagbura habang walang permission sa folder ay hindi naitatala sa file; babalik ang event mula sa file pagkatapos pumayag ang folder.
2026-11-20 | Events: kailangang pindutin ang Payagan ang folder sa bawat bagong pagbukas ng browser kung humihingi ulit ng permission ang Chrome/Edge.
2026-11-20 | Events: wala pang paulit-ulit na event (kada linggo/buwan) at wala pang reminder/abiso.
2026-11-20 | Events: hindi pa nasusubukan sa totoong Chrome/Edge ng gumawa (jsdom at fake folder handle lang); unang test ay sa device mo.
2026-11-20 | Design: itim-at-puti ang theme; ang green/yellow/red sa Master at ang kulay ng linya ng chart ay hindi pinalitan dahil may ibig sabihin.
2026-11-20 | Design: hindi pa nakikita sa totoong Chrome/Edge ng gumawa (jsdom lang); ang unang visual test ay sa device mo.
2026-11-20 | Design: color-mix() (topbar blur sa mobile) ay nangangailangan ng bagong Chrome/Edge (111 pataas); may fallback na solid na kulay.
2026-11-20 | Design: ang constants ng effects.js ay nasa effects.js, hindi sa config.js (Rule 7); puwedeng ilipat kapag pinayagan ang pag-edit ng config.js.
