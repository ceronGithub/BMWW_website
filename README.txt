=== PROJECT OVERVIEW (Rule 21) | v17 | 2026-11-23 ===
1. PANGALAN AT LAYUNIN: BM ANALYZER WEB (BMWW). Offline na HTML/CSS/JS na bersyon ng BM-ANALYZER.xlsm: sinusubaybayan ang LOT Tracking, Master at Calibration (Correl, Repeatability), Trend, at Search Files ng mga machine, at ipinapakita ang lagay ng lahat ng machine sa LEAD PC. Walang backend; ang browser (Chrome/Edge) ay nagbabasa at nagsusulat sa mga folder na pinili sa Settings.
2. SINO ANG GUMAGAMIT: SENDER (MWW PC / machine) = nag-scan ng lote, nagpapatakbo ng Master at Calibration, nagsusulat sa Saving path at Server path. LEAD PC = monitor lang: binabasa ang Server path ng lahat ng machine; hindi nagsusulat ng lote, hindi nagse-Send.
3. MGA PAGE (html | css | js): dashboard | dashboard*.css | dashboard.js, dashboard-machines.js, dashboard-events.js ; calibration | calibration*.css | calibration.js ; master | master*.css | master.js ; trend | trend*.css | trend.js ; settings | settings*.css | settings.js ; lot-tracking | lot-tracking.css | lot-tracking.js (Barcode, Operator, RESULT, monitoring, Remarks, On hold) ; file-search | file-search.css | file-search.js (hanap at kopya ng file sa Server path) ; 404.
4. DALOY NG DATA (LOT Tracking): Barcode -> Operator -> hanap ng bagong file/folder sa Data source 2 at 3 -> LOT Unit (X.csv + X_Time.csv = isa) -> monitoring JSON at Excel sa Saving path at Server path -> Remarks (dialog) -> kung On hold: hold file sa onhold\ ng Server path at Saving path -> END (parehong barcode) = DONE. Hindi pa: Send (Yugto 4), LEAD PC view (Yugto 5), bantay na walang lote (Yugto 6).
5. MGA CORE MODULE: js/core/registry.js (rehistro ng page at template) | router.js (nagloload ng page) | config.js (constants) | security.js (right click, sanitize) | storage.js (folder handle, settings, Saving path at Server path) | shift-times.js (global na oras ng shift) | lot-*.js (LOT Tracking: config, unit-collector, active-store, validation, beep, shift, monitoring-store, monitoring-export, remarks, onhold) | xlsx-writer.js (gumagawa ng .xlsx). May iba pang module para sa Master, Calibration, Trend at Dashboard (87 file sa js/core; tingnan ang OVERVIEW A).
6. FOLDER MAP: pages/ (isang html kada page) | css/ (base, layout, components) at css/pages/ | js/core/ (modules) | js/pages/ (logic kada page) | js/templates/ (kopya ng html bilang string para gumana sa double-click) | components/ (sidebar) | assets/ (images, icons, fonts) | tools/ (file-watcher, SETUP-PER-PC) | api/ (walang laman; walang backend).
7. PAANO BUKSAN: i-double-click ang index.html (template ang gamit, walang fetch) o python -m http.server 8000 at http://localhost:8000. Chrome/Edge (huling bersyon) lang ang suportado para sa folder picker. Piliin sa Settings ang Machine name, Saving path, Server path at mga Data source; pagkatapos mag-refresh, humihingi ulit ng permission (Enter sa Barcode).
8. MGA LIMITASYON: hindi nasubukan sa totoong Chrome/Edge ang LOT Tracking Yugto 1 hanggang 3 (Node at jsdom lang); tumatakbo lang ang pagbabantay habang bukas ang tab; Date Modified ang oras ng file (hindi Date Created); walang lock sa pagsulat sa bukas na file (isang machine = isang file); ang Excel ng monitoring ay hindi maisusulat kapag bukas sa Excel. Buong listahan: KNOWN ISSUES / TODO.

v17 | 2026-11-23 | LOT Tracking Yugto 3 (batay sa LOT Tracking Spec v2): Remarks at On hold. (1) Pagkatapos maitala ang LOT Unit, may Remarks dialog (<dialog>, hindi window.prompt) na may 9 na opsyon: 1st Meas., 2nd Meas., 1st Re-lap, 2nd Re-lap, 1st Re-measure, 2nd Re-measure, Final Meas., Manual input, On hold. Isang beses kada unit; Cancel o Esc = walang Remarks at hindi na uulitin (kahit mag-refresh ang page). (2) Manual input: hanggang 100 letra at hindi puwedeng magsimula sa =, +, - o @. (3) Final Meas.: kapag may Final Meas. na ang wafer sa ibang row ng monitoring ng araw na iyon, may babala (hindi hadlang). (4) On hold: hold file <Barcode>__<LOT Unit>.txt (Barcode, LOT Unit, Wafer, Operator, Machine, Time, PC name) sa <Server path>\\onhold\\ at <Saving path>\\onhold\\; kapag isa lang ang naisulat, may babala kung alin ang pumalya; itinatala pa rin sa monitoring ang On hold. (5) Kapag nagsimula ulit ang lote ng barcode, tinatanggal ang hold file ng barcode na iyon sa dalawang folder. Ang PC name ay ang Machine name ng Settings (wala pang hiwalay na PC name). Bago: js/core/lot-remarks.js, js/core/lot-onhold.js. Binago (may permission mo, 'go'): js/core/lot-config.js (v4), js/core/lot-monitoring-store.js (v2), js/pages/lot-tracking.js (v2.9), pages/lot-tracking.html, js/templates/lot-tracking.template.js (v2.9, magkapareho), css/pages/lot-tracking.css (v2.9), README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa config.js, index.html, Settings at iba pang page. Nasubukan sa Node at jsdom; hindi pa sa totoong Chrome/Edge.
v16 | 2026-11-23 | LOT Tracking Yugto 2 (batay sa LOT Tracking Spec v2): monitoring. (1) Pag-scan ng lote (Operator Enter) = gumagawa agad ng row na walang LOT Unit (ONGOING, NOT SENT, Shift, Machine, Start). (2) Bawat bagong LOT Unit sa RESULT ay itinatala nang isang beses: ang unang unit ay pumupuno sa row na iyon, ang susunod ay bagong row sa ilalim ng block (Wafer, Blk, Layer No., LOT Unit, File Path). (3) Auto-DONE: kapag END MEASUREMENT, iba ang na-scan na barcode, o NEW LOTE: ang ONGOING na row ng block ay DONE, End-Time = ngayon, Lot Duration (min, 2 decimal). (4) Shift (Day mula sa simula ng Day hanggang bago ang simula ng Night ng Settings; ang iba ay Night) at monitoring day (nagpapalit sa simula ng Day sa Settings, hindi sa hatinggabi; ang Start na 06:30 ay sa file ng nakaraang araw). (5) Imbakan: JSON (source of truth, version 1) at Excel sa <Saving path>\monitoring\ddmmyyyy_MONITORING.json/.xlsx at <Server path>\monitoring\<machine>\ddmmyyyy_MONITORING.json/.xlsx; kusang sulat kada pagbabago. (6) Humihingi ng permission ang Enter sa Barcode (Saving path, Server path at mga Data source). Bago: js/core/lot-shift.js, js/core/lot-monitoring-store.js, js/core/lot-monitoring-export.js. Binago (may permission mo, 'go'): js/core/lot-config.js (v3), js/pages/lot-tracking.js (v2.8), pages/lot-tracking.html, js/templates/lot-tracking.template.js (v2.8, magkapareho), README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa config.js, css, index.html, xlsx-writer.js, shift-times.js, storage.js at Settings.
v15 | 2026-11-22 | Yugto 0: global na shift sa Settings. Bagong card na 'Shift' sa Settings (Day/Morning simula at wakas, Night simula at wakas; default 07:30, 18:30, 19:30, 06:30) na isinasave sa settings ng machine (field shiftTimes). Ang LOT Tracking (susunod na yugto), Master, Calibration, Trend at OUTDATED ay sumusunod na sa Settings sa pamamagitan ng root.shiftTimes; ang master-shift-config.js at shift-freshness-config.js ay gumagamit na ng getter (walang binago sa mga gumagamit nito). Walang pagbabago sa gawi kung hindi babaguhin ang default. Bagong file: shift-times.js (naka-load sa index.html), shift-settings-config.js, shift-settings.js, css/pages/shift-settings.css.
v14 | 2026-11-22 | LOT Tracking Yugto 1 (natitira): (1) Ang Barcode ay ginagawang uppercase (lotValidation.normalizeBarcode). (2) Ang Operator ay 2 hanggang 30 na titik, numero, espasyo, ., - o _ (lotValidation.isValidOperator); kapag mali, may mensahe at nananatili ang Barcode. (3) Esc sa Operator = Cancel: nililinis ang Barcode, Operator at RESULT, walang lote na sinimulan. (4) Beep (lotBeep.playBeep) kapag END MEASUREMENT (parehong barcode). (5) Data source 2 at 3 lang ang binabantayan ng LOT (lotConfig.SOURCE.KEYS; File Path 1 = Data source 2, File Path 2 = Data source 3, kapareho ng Search Files). (6) Nilalaktawan na ang file/folder na hindi tumama sa pangalan ng LOT Unit (SHOW_UNMATCHED = false). (7) Tinanggal ang CONFIG.LOT.SOURCE_KEYS at CONFIG.LOT.PATH_COLUMN sa config.js. Bagong file: lot-validation.js, lot-beep.js.
v13 | 2026-11-22 | LOT Tracking Yugto 1 (batay sa LOT Tracking Spec BMWW web): isang row kada LOT Unit sa RESULT (ang X.csv at X_Time.csv ay iisang unit; pangunahing file = hindi _Time, kung pareho ang uri ay ang pinakaluma; Date = pinakabagong oras ng mga file ng unit), bagong column na LOT Unit at Unang nakita (oras na unang nakita ng scanner ang unit), at ang aktibong lote ay naka-save sa localStorage bmww.activeLote kaya hindi nawawala kapag nag-refresh ang page (END at NEW LOTE ang nagbubura). Bago: js/core/lot-config.js, js/core/lot-unit-collector.js, js/core/lot-active-store.js. Binago (may permission mo, 'go'): js/pages/lot-tracking.js, pages/lot-tracking.html, js/templates/lot-tracking.template.js (mga file na ito ay v2.6), README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa config.js, css, index.html, settings, at iba pang page. Date Modified ang gamit sa filter (hindi mababasa ng browser ang Date Created). Nasubukan sa Node lang (13 kaso); hindi pa sa totoong Chrome/Edge.
v12 | 2026-11-22 | Task 1: Dashboard tile (Sender at LEAD PC): ang pagkakasunod ay Master Correl, Calibration Correl (BAGO), [slot ng Master Unit Correl: future upgrade, wala pang laman], Worst slider (inilipat sa TAAS ng Trend), Trend. Ang Master Repeatability at Calibration Repeatability ay OPSYONAL na: checkbox 'Ipakita sa tile (opsyonal)' sa Dashboard (naka-save sa localStorage bmww.dashboardOptions; default naka-OFF; ang FAIL ng Master Repeatability ay hindi na nagha-highlight ng tile kapag nakatago). Calibration Correl: Sender = <Saving path>\\calibration-correl\\<petsa ngayon> (o kahapon); LEAD PC = <Server path>\\calibration-correl\\<machine>\\<petsa>; may status, R Square, Worst slider, Record, Updated, OUTDATED badge at Preview (scatter at sheet). Calibration Repeatability (opsyonal) ay galing sa calibration-repeatability folder (pareho). Bago: js/core/calibration-tile-config.js, js/core/calibration-tile.js, js/core/dashboard-options.js, css/pages/dashboard-options.css. Binago (may permission mo, 'go'): js/pages/dashboard-machines.js, pages/dashboard.html, js/templates/dashboard.template.js, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa correl-excel-reader.js, repeatability-reader.js, repeatability-tile.js, trend-tile.js, config.js, index.html, Master at Calibration pages.
v11.5 | 2026-11-22 | Layout ng Calibration Repeatability at Master Repeatability: ang panel ng Files (may checkbox kada file) ay nasa TAAS ng chart na, 1 column kada row (isang file kada row) sa lahat ng laki ng screen, at scrollable (max-height 13rem; dati ay nasa kanan ng chart sa desktop, 17rem ang lapad). CSS lang: order: -1 sa .file-panel, tinanggal ang 2-column na rule ng .range-chart-layout sa 1024px pataas, max-height ng .file-list. Walang ginalaw sa JS at HTML (pareho pa rin ang pagkakasunod ng element sa DOM: chart muna, panel pangalawa; ang CSS ang nagpapalit ng pwesto). Hindi nasubukan sa totoong browser. Binago (may permission mo, 'paki iba ang layout'): css/pages/calibration-repeatability.css, css/pages/master.css, README.txt, 00_INSTRUCTIONS.txt. Walang bagong file. Walang ginalaw sa calibration-repeatability-ui.js, master.js at calibration.css.
v11.4 | 2026-11-22 | Calibration Repeatability: ayos sa maling barcode. Dati, ang listahan ng barcode ng buong resulta ay galing sa UNANG file na pumasa (pinakamatanda ayon sa modified time), kaya kapag 15-slider na 5AHG447 ang nauna, iyon ang lumabas sa table at ang tunay na calibration (30 slider, 5AHG459) ay nabasa bilang walang value. Ngayon: ang reference na barcode ay ang PINAKAMAHABANG listahan sa mga file ng saklaw (kapag pareho ang haba, ang mas bago). Ang file na ang tugmang barcode ay mas mababa sa kalahati ng reference (RANGE.MIN_BARCODE_OVERLAP = 0.5 sa calibration-repeatability-config.js) ay nilalaktawan at nasa result.skippedFileList; ang 'calibration files' sa screen at Excel ay ang mga ginamit lang (ang 'CSV files' ay ang lahat sa saklaw). Ang 29-slider at 30-slider na 5AHG459 ay parehong ginagamit (ang kulang na barcode ay blangko). Nasubukan sa Node (totoong CalibSts_261114085817.csv at CalibSts_261115090645.csv + gawang 15-slider na 5AHG447): 30 barcode na 5AHG459, nilaktawan ang 2 file na 447, Avg diff ng 30-slider ay 1.195 (tugma sa kamay na kalkulasyon). Binago (may permission mo, 'sige'): js/core/calibration-repeatability.js (analyzeRange, readRecordMaps, pickReferenceBarcodeList, overlapRatio; tinanggal ang readPoints na hindi na gamit), js/core/calibration-repeatability-config.js (RANGE), README.txt, 00_INSTRUCTIONS.txt. Walang bagong file. Walang ginalaw sa calibration-repeatability-ui.js, calibration-repeatability-export.js, calibration-analysis.js, master-analysis.js at Master.
v11.3 | 2026-11-22 | Calibration Repeatability: bawat record ay inihahambing na sa SARILING Master (Master ng parehong record, tulad ng Calibration Correl), hindi na sa Master ng pinakabagong record lang. Ang Avg diff, Max diff, Worst slider, Repeatability % at PASS/WARNING/FAIL ay kinukuwenta sa ganitong paraan. Ang Master column ng table at ang MASTER line ng chart ay Master pa rin ng pinakabagong record (para sa display). Kung pareho ang Master ng lahat ng record, walang pagbabago sa numero (nasubukan). Binago (may permission mo, 'go'): js/core/calibration-repeatability.js (computeOwnMasterStats; column.masterValues), README.txt, 00_INSTRUCTIONS.txt. Walang bagong file. Walang ginalaw sa master-analysis.js, calibration-repeatability-ui.js at calibration-repeatability-export.js.
v11.2 | 2026-11-22 | Calibration: suporta na ang Daily Check record. Kapag blangko ang After ng isang record, ang Before ang gagamiting Actual (ang R2 ng Daily Check sa file ay tugma sa Before vs Master; ang R2 ng buong calibration ay tugma sa After vs Master; nasubukan sa CalibSts.csv at CalibSts_261114085817.csv). Ang record na blangko ang After at Before ay nilalaktawan at hindi binibilang. Ang pangalan ay may dagdag na ' (Daily Check)': sa File ng Calibration Correl at Compare, at sa pangalan ng record (legend, Excel) ng Calibration Repeatability, na pinaghahalo ang Calibration at Daily Check sa iisang chart. Ang Calibration Correl ay kinukuha na ang pinakabagong record na may laman. Binago (may permission mo, 'go'): js/core/calibration-config.js (GROUP.before, TEXT.typeSuffix), js/core/calibration-analysis.js, js/core/calibration-repeatability.js, js/core/calibration-compare.js, README.txt, 00_INSTRUCTIONS.txt. Walang bagong file. Walang ginalaw sa Master, Dashboard at calibration.js.
v11.1 | 2026-11-22 | Preview ng Master Repeatability (Sender): kung walang file sa <Saving path>\\master-repeatability\\<petsa ngayon>, tinitingnan din ang folder ng kahapon, para tumugma sa tile ng Dashboard sa Night shift pagkatapos ng hatinggabi. Binago (may permission mo, 'continue'): js/core/repeatability-tile.js, README.txt, 00_INSTRUCTIONS.txt. Walang bagong file.
v11 | 2026-11-22 | Task 1: OUTDATED indicator sa Dashboard (Sender at LEAD PC). Ang bawat block ng tile (Master Correl, Master Repeatability, Trend, worst slider) ay may dilaw na badge na 'OUTDATED - Galing sa nakaraang shift (Day, Nov 22)' kapag ang oras ng file (modifiedMs) ay mas luma kaysa sa simula ng kasalukuyang shift; lumalabo rin ang block. Shift: Day 7:30 AM hanggang bago mag-7:30 PM, Night 7:30 PM hanggang bago mag-7:30 AM (walang puwang). Kapag nagpalit ang shift habang bukas ang Dashboard, agad nagre-refresh (tinitingnan kada 10 segundo, at pagbalik sa tab) at lumalabas/nawawala ang badge. Ang Sender ay tumitingin na rin sa folder ng kahapon kung walang file sa folder ng ngayon (Night shift na tumawid ng hatinggabi), kasama ang Preview ng Correl at Compare. Task 2: editable na ang Date ng Calibration Correl (LATEST.DATE_READONLY = false) para sa pag-test. Bago: js/core/shift-freshness-config.js, js/core/shift-freshness.js, css/pages/shift-freshness.css. Binago (may permission mo, 'go'): js/pages/dashboard-machines.js, pages/dashboard.html, js/templates/dashboard.template.js, js/core/calibration-config.js, pages/calibration.html, js/templates/calibration.template.js, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa repeatability-tile.js, trend-tile.js, correl-excel-reader.js, calibration.js at iba pa.
v10.1 | 2026-11-22 | Settings: hiwalay na subfolder ng settings ng machine, sa Saving path at Server path: <path>\settings\machines\sender\<machine>.json (User input) at <path>\settings\machines\monitoring\LEAD PC.json (LEAD PC). Ang events.json ay nananatili sa <path>\settings. Ang LEAD PC ay nagbabasa ng lahat ng .json sa <Server>\settings\machines\sender bilang naka-register na machine, at pati sa lumang <Server>\settings (fallback para sa machine na hindi pa nag-Save ng bagong layout; kapag magkapareho ang pangalan, ang nasa sender ang masusunod). Pag-Save sa machine: isusulat sa tamang subfolder at buburahin ang lumang file (lumang flat o kabilang subfolder; pagpalit ng pangalan o mode). Hindi nabubura ang settings.json at events.json. Binago (may permission mo, 'go'): js/core/storage.js, js/core/queue.js, js/pages/settings.js, js/core/config.js, js/core/settings-restore.js, README.txt. Walang bagong file. Walang ginalaw sa events-store.js, index.html, dashboard-machines.js at 00_INSTRUCTIONS.txt.
v10 | 2026-11-22 | Settings: ibalik ang naka-save na settings pagkasara ng tab o sa ibang browser (hal. Edge -> Chrome). (1) Pagkapili ng BMWW folder sa Settings, kung blangko pa ang form at may <machine>.json sa BMWW\settings, awtomatikong napupunan ang machine name, mode, full path ng bawat folder at Trend limits (walang sinusulat sa file; hindi dirty). (2) Kapag may naka-save nang BMWW handle pero nawala ang permission (nagsara ang browser), may banner na Ibalik ang settings; pagpindot, hihingi ng permission at babasahin ang file (hindi papalitan ang mga binago mo na hindi pa na-save). (3) Checker ng settings folder: checkSettingsFolder -> missing, empty, hasFiles (Task 1). Ang Server path at Data source ay kailangan pa ring piliin ulit sa bawat browser (hindi puwedeng i-save ang folder handle sa file). Bago: js/core/settings-restore-config.js, js/core/settings-restore.js, css/pages/settings-restore.css. Binago (may permission mo, 'go'): js/pages/settings.js, pages/settings.html, js/templates/settings.template.js, README.txt. Walang ginalaw sa config.js, storage.js, index.html at 00_INSTRUCTIONS.txt.
v9.6 | 2026-11-22 | Trend (Task 2): clickable ang bawat data point at ang petsa (label sa X axis) ng 6 chart (click o Enter / Space, may tabindex at role button; naka-highlight ang napiling petsa). Kapag na-click, ang petsa ay ilalagay sa 'Mga record ng araw' (Petsa picker), hahanapin sa Data source 1 (binabasa ulit ang mga master file na na-modify mula 00:00 ng petsa hanggang +2 araw), at lalabas ang mga record, file at 6 na value, at gagalaw ang screen papunta roon. Puwedeng palitan ng user ang petsa sa picker (walang min/max na): hahanapin din ito sa Data source 1, kahit labas sa saklaw ng chart (walang Set button doon; 'Labas sa saklaw'). Kapag hindi pinayagan ang access o pumalya ang paghahanap, ipinapakita ang mga record mula sa huling Run Trend kasama ang pulang mensahe. Bago: js/core/trend-day-config.js, js/core/trend-day-search.js. Binago (may permission mo, 'yes please'): js/core/trend-chart.js, js/pages/trend.js, css/pages/trend.css, pages/trend.html, js/templates/trend.template.js, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa Dashboard, Master, Calibration, trend-reader.js at trend-config.js.
v9.5 | 2026-11-22 | Trend: (1) 1 col per row ang 6 chart sa screen sa lahat ng laki ng screen (css/pages/trend.css: tinanggal ang 2 column sa 1280px pataas). (2) 1 col per row na rin ang picture (trend-export-config.js IMAGE.COLUMNS = 1). (3) Excel ng Export to Excel ay 2 sheet na lang: sheet 1 'Data' (pababa ang pagtala: isang point kada row, kasama ang UCL/CL/LCL column ng naka-set) at sheet 2 'Charts' (lahat ng 6 chart sa iisang sheet, isang column, puti ang background); wala nang Summary, Points at sheet kada value. (4) xlsx-writer.js: sheet.chartList (maraming chart sa isang sheet), chart.dataSheet (data ay nasa ibang sheet) at chart.byColumn (pababa ang data); ang sheet.chart (isa) ay pareho pa rin ang resulta (nasubukan: magkapareho ang bytes). Binago (may permission mo): css/pages/trend.css, js/core/trend-export-config.js, js/core/trend-export.js, js/core/xlsx-writer.js, README.txt, 00_INSTRUCTIONS.txt. Walang bagong file. Walang ginalaw sa trend.html, trend.template.js, trend.js, Dashboard, Master at Calibration.
v9.4 | 2026-11-22 | Trend: Export to Excel at Trend sa Dashboard. Sa Trend page, pagkatapos ng Run Trend, ang button na Export to Excel ang gumagawa ng (1) Excel (Summary, Points at 6 na sheet na may line chart at UCL/CL/LCL) sa <Saving path>\trend\<petsa>\ LANG (walang Excel sa Server), (2) picture (PNG) ng 6 chart sa <Saving path>\trend\trend_latest.png para sa sariling Dashboard, at (3) kopya ng picture at trend_latest.json sa <Server path>\trend\<machine name>\ para sa LEAD PC. Ang Dashboard (tile ng sariling machine at ng bawat machine sa LEAD PC) ay may TREND block: thumbnail, badge na UPDATED kapag may bagong export na hindi pa nakikita ng browser na ito, at Preview (picture sa bagong tab; nawawala ang UPDATED pagkapindot). Walang nagbabago sa Dashboard hangga't walang nag-click ng Export. Bago: js/core/trend-export-config.js, trend-image.js, trend-sync.js, trend-export.js, trend-tile.js, css/pages/trend-tile.css. Binago (may permission mo, 'sige'): pages/trend.html, js/templates/trend.template.js, js/pages/trend.js, pages/dashboard.html, js/templates/dashboard.template.js, js/pages/dashboard-machines.js, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa trend-config.js, trend-chart.js, trend-reader.js, xlsx-writer.js at config.js.
v9.3 | 2026-11-22 | Trend: bagong page sa sidebar (Trend). Binabasa ang master CSV (15 headers) ng Data source 1 at kinukuha ang Mean Offset, Stdev, CV, Slope, Intercept, R2 ng bawat record. Sa bawat petsa, dalawang point: Day shift 7:30 AM-6:30 PM at Night shift 7:30 PM-6:30 AM ng kinabukasan (default: pinakahuling record ng shift; gamit ang masterShift.getShiftOf). 6 na chart na may UCL, CL, LCL (itinatakda sa Settings > Trend limits, iisa para sa lahat ng cantilever), pulang point kapag labas sa limit, at marker (patayong linya at pangalan) kapag nagpalit ng cantilever. Pumili ng petsa para makita ang mga record at file ng araw na iyon kasama ang 6 na value; Set = papalitan ang point ng shift sa chart ng napiling record, Reset = ibalik sa pinakahuli (naka-save ang Set sa localStorage bmww.trendOverrides). Bago: js/core/trend-config.js, trend-limits.js, trend-overrides.js, trend-reader.js, trend-chart.js, trend-settings.js, js/pages/trend.js, js/templates/trend.template.js, pages/trend.html, css/pages/trend.css, css/pages/trend-settings.css. Binago (may permission mo, 'sige'): components/sidebar.html, js/templates/sidebar.template.js, js/core/config.js (PAGE_LIST at LEAD_BLOCKED_PAGES), index.html (1 script ng trend template), pages/settings.html, js/templates/settings.template.js, js/pages/settings.js (3 hook), README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa Master, Calibration, master-shift.js, master-analysis.js at Dashboard.
v9.2 | 2026-11-22 | Calibration: bagong card na Calibration Repeatability (kopya ng Master Repeatability). Binabasa ang lahat ng calibration CSV ("Calibration Status List") ng Data source 1 na ang petsa (last modified) ay nasa pagitan ng Start date at End date (default 7 araw); Actual = After at Master = Master group ng CSV. Mode: All data points (flat) o Latest per shift (Morning 7:30 AM-6:30 PM, Night 7:30 PM-6:30 AM). Lumalabas ang badge PASS/WARNING/FAIL, Repeatability %, Avg diff, Worst slider, Max diff, table kada barcode, line chart (isang linya kada record, may MASTER) na may file panel (i-uncheck ang file para alisin ang linya). Kusang Excel pagkatapos ng run: <Saving path>\calibration-repeatability\<petsa>\ (bagong file) at kopya (overwrite) sa <Server path>\calibration-repeatability\<machine name>\<petsa ngayon>\calibration-repeatability_latest.xlsx. Bago: js/core/calibration-repeatability-config.js, calibration-repeatability.js, calibration-repeatability-export.js, calibration-repeatability-ui.js, css/pages/calibration-repeatability.css. Binago (may permission mo, 'ok na'): pages/calibration.html, js/templates/calibration.template.js, js/pages/calibration.js, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa Master, config.js, master-analysis.js, calibration-analysis.js at Dashboard.
v9.1 | 2026-11-22 | Calibration: bagong card na Compare sliders (Compare vs previous), kopya ng sa Master. Ihahambing ang Calibration Correl ngayon laban sa pinakabagong calibration record BAGO ang Date (hanggang 7 araw pabalik, COMPARE.LOOKBACK_DAYS). Hindi kusang tumatakbo; pindutin ang button. Kung walang worst slider (lahat green) walang compare. Kusang Excel pagkatapos: <Saving path>\calibration-compare\<petsa>\ (bagong file) at kopya (overwrite) sa <Server path>\calibration-compare\<machine name>\<petsa>\calibration-compare_latest.xlsx. Bago: js/core/calibration-compare-config.js, calibration-compare.js, calibration-compare-export.js, calibration-compare-ui.js, css/pages/calibration-compare.css. Binago (may permission): pages/calibration.html, js/templates/calibration.template.js, js/pages/calibration.js, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa Master, config.js, calibration-analysis.js at Dashboard.
v9.0 | 2026-11-22 | Calibration correl: ang Calibration page ay may Calibration Correl na (kopya ng Master Correl). Binabasa ang pinakabagong calibration CSV ("Calibration Status List") ng Data source 1 ngayong araw; kinukuha ang After (Actual) at Master, R Square, status PASS/WARNING/FAIL, table na may green/yellow/red, scatter chart at bar chart; barcode ay puwedeng pindutin para laki-an ang point. Kusang Excel export pagkatapos ng run: <Saving path>\calibration-correl\<petsa>\ at kopya (overwrite) sa <Server path>\calibration-correl\<machine name>\<petsa>\calibration-correl_latest.xlsx. Bago: js/core/calibration-config.js, calibration-analysis.js, calibration-export.js. Binago (may permission): pages/calibration.html, js/templates/calibration.template.js, js/pages/calibration.js, css/pages/calibration.css, README.txt, 00_INSTRUCTIONS.txt. Walang ginalaw sa Master, config.js at iba pa.
v8.15 | 2026-11-22 | Master Repeatability: tinanggal ang button na Open latest repeatability file at Export to Excel (redundant na dahil kusang nag-e-export pagkatapos ng Master Repeatability, Saving path at kopya sa Server path; Preview sa Dashboard na ang tingin sa laman). Binago: pages/master.html, js/templates/master.template.js, js/pages/master.js, README.txt. Walang bagong file at walang binurang file (ang master-open-latest.js ay ginagamit pa ng Dashboard).
v8.14 | 2026-11-22 | Master Repeatability, mula sa Master Correl: (1) Preview tab ng Dashboard ay may line chart (bawat record ay isang linya, may MASTER, kulay ng dot ayon sa green/yellow/red) mula sa sheet na Readings ng Excel. (2) Excel ng Master Repeatability ay may row na Machine sa buod at <machine name> sa pamagat ng chart (kapareho ng Master Correl at ng screen). (3) Kapag walang nabasa na Repeatability Excel, ipinapakita sa tile at sa Preview ang dahilan (walang folder, walang file, hindi mabasa, error). Binago: js/core/repeatability-reader.js, repeatability-tile.js, repeatability-tile-config.js, master-export.js, master-export-config.js, repeatability-sync.js, README.txt. Walang bagong file.
v8.13 | 2026-11-21 | Dashboard (LEAD PC): kapag FAIL ang Master Repeatability ng machine, naka-highlight ang tile (dm-tile-alert), may chip na 'Repeatability fail' sa buod, at nauuna ang machine sa listahan. Binago: js/pages/dashboard-machines.js, js/core/dashboard-machines-config.js, README.txt.
v8.12 | 2026-11-21 | Dashboard: tile ng MASTER REPEATABILITY (status PASS/WARNING/FAIL, Repeatability %, Worst slider, Range, Updated, Preview) sa ilalim ng MASTER CORREL, sa LEAD PC at sa Sender. LEAD PC: binabasa ang pinakabagong Excel sa <Server path>\master-repeatability\<machine name>\<petsa>\ (walang bagong .json). Sender: binabasa ang <Saving path>\master-repeatability\<petsa ngayon>\. Preview ay bagong tab (buod at laman ng sheet, walang chart). Bago: js/core/repeatability-tile-config.js, repeatability-reader.js, repeatability-tile.js. Binago: js/pages/dashboard-machines.js, pages/dashboard.html, js/templates/dashboard.template.js, README.txt.
v8.11 | 2026-11-21 | (1) Latest Master: tinanggal ang button na Open latest correl file at Export to Excel (tuloy ang kusang export pagkatapos ng Master Correl). (2) Date ng Latest Master ay laging today at readonly. (3) Master Repeatability: kusang Export to Excel pagkatapos ng run (Saving path) at kopya (overwrite) sa <Server path>\master-repeatability\<machine name>\<petsa ngayon>\master-repeatability_latest.xlsx; ang manual na Export to Excel ay ganoon na rin. Bago: js/core/repeatability-sync-config.js, js/core/repeatability-sync.js. Binago: pages/master.html, js/templates/master.template.js, js/pages/master.js, README.txt.
v8.7 | 2026-11-21 | Preview (Master Correl) sa Dashboard: lumalabas na ang maliit na panel (popout) na may Status, R Square, Record, Actual/Master AVG, Worst slider, file at table ng Barcode / Actual / Master / Diff (pula o dilaw ang Diff kapag lampas sa limit). Sender: binabasa ang pinakabagong file sa <Saving path>\\master-correl\\<petsa ngayon>; LEAD PC: sa <Server path>\\master-correl\\<machine>. Isara gamit ang Isara, Esc, o pindutin ang labas. May button sa loob na Buksan sa File Explorer (dating Preview). Binago: js/pages/dashboard-machines.js (handlePreviewClick, loadPreviewDetails, fillPreviewBody, buildPreviewTable, closePreviewPanel, handleExplorerClick), js/core/correl-excel-reader.js (readDetailsFromFile, readLatestDetailsInSavingPath, readLatestDetailsForMachine), js/core/dashboard-machines-config.js (TEXT.preview.panel), css/pages/dashboard-machines.css, README.txt.
v8.6 | 2026-11-21 | Dashboard ng Sender: ang sariling tile ay may resulta rin ng Compare sliders (worst slider, Actual/Master ng Previous at Today, listahan ng slider na kailangang tingnan) mula sa pinakabagong Excel sa <Saving path>\\master-compare\\<petsa ngayon> (o \\<machine>\\<petsa ngayon>). Binabasa kada refresh, kasabay ng Master Correl. Basa lang. Binago: js/core/correl-excel-reader.js (readLatestCompareInSavingPath, readCompareFromFile, findLatestInDayFolders), js/pages/dashboard-machines.js (ownCompare, renderSender, readOwnCorrel), README.txt.
v8.5 | 2026-11-21 | Compare sliders: kapag pinindot ang Compare vs previous at may nabuong compare (may worst slider at may naunang record), kusang gumagawa ng Excel: bagong file sa <Saving path>\\master-compare\\<petsa> at kopya (overwrite) sa <Server path>\\master-compare\\<machine>\\<petsa>\\master-compare_latest.xlsx. COMPARE.AUTO_EXPORT = false para patayin. Binago: js/core/master-compare-ui.js (autoExportCompare), js/core/master-compare-export.js (writeBlob, copyToServer), js/core/master-compare-config.js (AUTO_EXPORT, SERVER, TEXT), README.txt.
v8.4 | 2026-11-21 | Dashboard ng Sender: kada refresh (pagbukas at bawat 5 segundo) ay binabasa muna ang pinakabagong file sa <Saving path>\\master-correl\\<petsa ngayon> (o \\<machine>\\<petsa ngayon>) bago mag-render, kaya agad lumalabas ang Master Correl; ang pagpapadala sa Server ay hiwalay at hindi hinihintay. Binago: js/pages/dashboard-machines.js (readOwnCorrel, publishOwnCorrel; [BINURA v8.4] rereadOwnCorrel), js/core/correl-excel-reader.js (findDayFolders), README.txt.
v8.3 | 2026-11-21 | Dashboard ng Sender: hindi na ipinapakita ang "Walang Data source folder. Itakda sa Settings." kapag may nabasang Master Correl sa <Saving path>\\master-correl\\<petsa ngayon>. Binago: js/pages/dashboard-machines.js (renderSender), README.txt.
v8.2 | 2026-11-21 | Dashboard ng Sender: ang sariling tile ay may MASTER CORREL (Status, R Square, Record) mula sa pinakabagong file sa <Saving path>\\master-correl\\<petsa ngayon>; binabasa kada 5 segundo kasabay ng refresh at ipinapadala pa rin sa Server. Binago: js/pages/dashboard-machines.js (ownCorrel, isOwnReading, renderSender, rereadOwnCorrel), README.txt.
v8.1 | 2026-11-21 | (1) Master Correl: laging gumagawa ng bagong Excel sa Saving path kada click ng Run Latest Master at ino-overwrite ang master-correl_latest.xlsx sa Server path (CORREL.AUTO.SKIP_SAME = false; true para ibalik ang skip kapag pareho ang record). (2) Dashboard ng Sender: tuwing refresh, tinitingnan ang <Saving path>\\master-correl\\<petsa ngayon>\\, binabasa ang pinakabagong file at ipinapadala ang Status, R Square at Record sa <Server path>\\correl\\<machine>.json; inalis na ang pag-analyze ng Data source 1 sa Dashboard. Inalis ang Export compare to Excel sa Compare sliders. (3) Compare sliders: 2 column kada row ang R Square / Status / Lumalala-Gumaganda-Pareho / Previous. Binago: js/pages/master.js, js/core/correl-export-config.js, js/core/correl-excel-reader.js (readLatestInSavingPath), js/pages/dashboard-machines.js (rereadOwnCorrel), js/core/master-compare-ui.js (inalis ang onExport), pages/master.html, js/templates/master.template.js, css/pages/master-compare.css, README.txt.
BM ANALYZER WEB v1 | 2026-11-19
v8 | 2026-11-21 | Master Correl: kusang Export to Excel pagkatapos ng Run Latest Master (Saving path at Server path). Nilalaktawan kapag ang record (machine + petsa ng record + file + R Square) ay na-export na at nakopya na sa Server; ang huling na-export ay nasa localStorage key bmww.correlAutoExport. Ang Saving path ay may timestamp pa rin kada export; ang kopya sa Server ay iisang file na ino-overwrite: <Server path>\\master-correl\\<machine>\\<petsa>\\master-correl_latest.xlsx. Manual Export to Excel ay nandiyan pa rin. CORREL.AUTO.ENABLED = false para patayin ang kusang export. Binago: js/pages/master.js (exportCorrelFiles, autoExportCorrel, getCorrelExportKey, readExportedKey, writeExportedKey), js/core/correl-export.js (copyToServer), js/core/correl-export-config.js (AUTO, SERVER.FILE_NAME, TEXT.autoSkipped), README.txt.
v7.9 | 2026-11-21 | Fix: bug sa animation ng sidebar kapag nagpalit ng machine type (User input <-> Lead PC): hindi ina-update ang itim na indicator kapag itinago o ibinalik ang mga link (hidden ng li), kaya naiwan ito sa maling pwesto at nawala ang puting text ng active link. Ngayon ay minamanmanan na ang hidden. Binago: js/core/effects.js, README.txt.
v7.8 | 2026-11-21 | Dashboard (LEAD PC): (1) hindi na ipinapakita ang machine na STALE at hindi naka-register (hal. lumang pangalan ng machine na naiwan sa queue); DM.HIDE_ORPHANS = false para ibalik. Walang binubura sa Server. (2) 2 column na lang kada row. Binago: js/pages/dashboard-machines.js, js/core/dashboard-machines-config.js (HIDE_ORPHANS), css/pages/dashboard-machines.css, README.txt.
v7.7 | 2026-11-21 | Dashboard (LEAD PC): kapag hindi nabasa ang Master Correl Excel ng machine, ipinapakita sa ilalim ng listahan ang dahilan (walang folder na ganito ang pangalan + mga folder na nakita, walang file, hindi mabasa, error). Case-insensitive na ang hanap sa folder ng machine. Binago: js/core/correl-excel-reader.js (getIssue, findMachineFolder, normalizeName), js/core/dashboard-machines-config.js (TEXT.excelIssue), js/pages/dashboard-machines.js, README.txt.
v7.6 | 2026-11-21 | (1) Dashboard (machine): tuwing refresh, binabasa ulit ang pinakabagong Master Correl (Data source 1) at ipinapadala ang status sa Server path. (2) Dashboard (LEAD PC): tuwing refresh, binabasa ang pinakabagong Excel sa <Server path>\\master-correl\\<machine name>\\<petsa>\\ (Status, R Square, Record) at ito ang ipinapakita sa MASTER CORREL ng tile kapag mas bago kaysa sa correl\\<machine>.json. Basa lang. Bago: js/core/correl-excel-reader.js (window.BMWW.correlExcelReader.readLatestForMachine(correlFolderHandle, machineName)). Binago: js/pages/dashboard-machines.js (rereadOwnCorrel, applyLatestCorrelExcel), pages/dashboard.html, js/templates/dashboard.template.js, README.txt.
v7.3 | 2026-11-21 | PASS / WARNING / FAIL ng Master Correl sa LEAD PC: pagkatapos ng Master Correl, kusang ipinapadala ng machine ang status (galing sa R Square: PASS >= 0.99, FAIL < 0.97, WARNING sa pagitan) sa <Server path>\correl\<machine name>.json. Sa Dashboard ng LEAD PC, may badge na MASTER CORREL (icon at text) sa tile ng bawat machine, chip na "Correl fail", at ang machine na FAIL ay nauuna sa listahan. Bago: js/core/correl-sync-config.js, js/core/correl-sync.js. Binago: js/pages/master.js, js/pages/dashboard-machines.js, js/core/dashboard-machines-config.js, css/pages/dashboard-machines.css, pages/master.html, pages/dashboard.html, js/templates/master.template.js, js/templates/dashboard.template.js, README.txt, 00_INSTRUCTIONS.txt.
v7.2 | 2026-11-21 | Master Correl: Export to Excel ay may kopya na rin sa Server path: <Server path>\master-correl\<machine name>\<petsa ng export>\<file>.xlsx (bukod sa <Saving path>\master-correl\<petsa>). Kapag pumalya ang Server (walang Server path, walang permission, o error sa sulat), naka-save pa rin sa Saving path at may pulang mensahe kung bakit hindi nakopya. Binago: js/core/correl-export-config.js (SERVER, text), js/core/correl-export.js (copyToServer, getMachineFolderName, writeBlob), js/pages/master.js (findServerForCopy, copyCorrelToServer, onExportCorrel), README.txt, 00_INSTRUCTIONS.txt. Walang bagong file.
v7.1 | 2026-11-21 | Master: bagong hiwalay na card na "Compare sliders" (Compare vs previous, Export compare to Excel, status at resulta; dating nasa loob ng Latest Master card). Hindi na kusang tumatakbo ang compare pagkatapos ng Master Correl (CompareConfig.AUTO_RUN = false). Inalis ang "Worst slider" sa stat list ng Master Correl (nasa Compare sliders na; nandoon pa rin sa Excel ng Correl at sa Repeatability). Binago: pages/master.html, js/templates/master.template.js, js/pages/master.js, js/core/master-compare-ui.js, js/core/master-compare-config.js, README.txt, 00_INSTRUCTIONS.txt. Walang bagong file.
v3.5 | 2026-11-21 | Master Correl: bagong Compare vs previous (Correl ngayon laban sa naunang record, para makita kung lumalala ang isang slider) at Export compare to Excel sa <Saving path>\master-compare\<petsa ng export>. Bagong: js/core/master-compare-config.js, master-compare.js, master-compare-export.js, master-compare-ui.js, css/pages/master-compare.css. Binago: pages/master.html, js/templates/master.template.js, js/pages/master.js (3 linya), README.txt
v2.22 | 2026-11-21 | Worst slider: (1) Master Correl ay may "Worst slider" na (barcode na may pinakamalaking |actual - master|, may diff sa panaklong) sa screen at sa buod ng Excel. (2) Ang "Worst barcode" ng Repeatability ay "Worst slider" na (screen at Excel). master-analysis.js: findWorstSlider. Binago: master-analysis.js, master.js, correl-export.js, config.js (text lang)
v2.21 | 2026-11-21 | (1) Master (Correl at Repeatability): pindutin ang barcode sa table (o ang point / label ng barcode sa chart) para lumaki ang data point ng barcode na iyon at ma-highlight ang row; pindutin ulit para ibalik. Hindi nawawala ang napili kapag nag-uncheck ng file sa Repeatability. chart-draw.js: highlight(), data-barcode, CHART.HIGHLIGHT_SCALE (config.js); master.js: bindBarcodeSelect; master.css. (2) Excel ng Master Correl: tinanggal ang legend ng chart (CORREL.CHART.SHOW_LEGEND = false; puwedeng ibalik); nandoon pa rin ang trendline, equation, R squared at kulay ng bawat point. Binago: xlsx-writer.js (chart.hideLegend), correl-export.js, correl-export-config.js
v2.20 | 2026-11-21 | (1) Master Correl: ang Open latest correl file ay nagbubukas na ng FOLDER (<Saving path>\master-correl\<petsa>) sa File Explorer at naka-highlight ang pinakabagong file; hindi na Excel ang bumubukas. Ang Open latest repeatability file ay Excel pa rin. Bagong mode na bmww-open:reveal:<path> sa open-file.ps1 (ipalit lang ang file, hindi kailangang i-install ulit). (2) Settings: kapag pumili ng folder, awtomatikong nilalagay ang Full path (hula = parent + pangalan ng folder) at lumalabas agad sa ilalim ng pangalan ng path; ang parent ay galing sa nasa field na, sa ibang Data source, o sa config (C:\BM-Logging). Hindi mababasa ng browser ang totoong path kaya hula ito; puwedeng baguhin. Binago: open-file.ps1, master-open-latest.js, master-export-config.js, correl-export-config.js, master.js, config.js (AUTO_PATH at text lang), settings.js. Bagong tools/SETUP-PER-PC.txt
v2.19 | 2026-11-21 | Excel ng Master Correl: (1) table na Barcode, Actual, Master (dating Master, Actual, Barcode). (2) Legend ng chart: isang entry kada point na may kulay at text na "<Actual> / <Master>" (xlsx-writer.js: chart.pointSeriesList; tinatanggal ang legend entry ng trendline). (3) Pamagat ng chart: <machine name> Master Correl (exportCorrel may bagong parameter na machineName). Binago: xlsx-writer.js, correl-export.js, correl-export-config.js (COLUMN, LEGEND_*), master.js
v2.18 | 2026-11-21 | Settings: (1) kailangan na ang full path ng bawat path na may napiling folder (o naka-save na pangalan); mensahe ng error at highlight kapag wala. Ang path na wala pang folder ay hindi hinihingian. (2) Paalala na "May pagbabago na hindi pa na-save" (#settings-unsaved) kapag may binago sa machine name, uri, full path o folder; nawawala pagkatapos ng matagumpay na Save. Binago: settings.js, settings.css, settings.html, settings.template.js, config.js (text at selector lang)
v2.17c | 2026-11-21 | Master: Latest Master (Master Correl) ay iisang Date na lang (id #latest-date; wala nang Start date at End date). Ang Date ang ginagamit bilang start at end sa analyzeLatest, kaya pareho pa rin ang kalkulasyon. Binago: pages/master.html, js/templates/master.template.js, master.js, config.js (selector latestDate, text badDate)
v2.17b | 2026-11-21 | Master: (1) Correl chart: itim na text na (ang class na chart-grid ng container ay nagmamana ng stroke sa text, kaya mukhang puti); line.chart-grid at div.chart-grid na lang sa master.css. (2) Repeatability chart: hindi na naputol ang nakahilig na label ng barcode (chart-draw.js: dagdag na taas ayon sa pinakamahabang label; CHART.LABEL_* sa config.js). Binago: master.css, chart-draw.js, config.js
v2.17 | 2026-11-21 | Master: (1) chart text mas malaki at malinaw (pamagat, axis, equation). (2) Pamagat ng scatter = <machine name> Master Correl; ng line chart = <machine name> Master Repeatability. (3) Naaalala ang huling resulta ng Master Correl at Master Repeatability (petsa, mode, napiling file) kapag umalis at bumalik sa Master page. Binago: config.js (text at padding lang), chart-draw.js, master.js, master.css
v2.16 | 2026-11-21 | Master Correl: Export to Excel (isang sheet: buod, table na Master / Actual / Barcode na may green-yellow-red, at scatter chart na may trendline at R squared) sa <Saving path>\master-correl\<petsa ng export>; at Open latest correl file (kaliwa ng Export, gamit ang bmww-open: handler). Bagong js/core/correl-export-config.js at correl-export.js; xlsx-writer.js: scatter chart, STYLE.precise (4 decimal), computeColumnWidths (galing sa master-export.js); master-open-latest.js: may target; tools/open-handler/open-file.ps1: pinapayagan din ang master-correl. Binago rin: master.js, master.css, master.html, master.template.js, master-export.js
v2.15 | 2026-11-21 | Master: (1) Open latest repeatability file ay walang download na: binubuksan sa Excel gamit ang Windows handler na bmww-open: (bagong tools/open-handler: install-open-handler.bat, open-file.ps1, README-OPEN.txt; kailangan ng FULL PATH ng Saving path sa Settings). (2) Master Correl: editable na ang Start date at End date; pinakabagong master record sa pagitan ng dalawang petsa (analyzeLatest may optional na endDate). Binago: master-open-latest.js, master-export-config.js, master-analysis.js, config.js (text lang), master.js, master.html, master.template.js
v2.14 | 2026-11-21 | Master: (1) Export to Excel: puting cell at header (manipis na border, walang gridlines), autofit ang lahat ng column sa Repeatability at Readings, mas malaki (1000 x 720 px) at fixed na chart sa Readings (hindi lumiliit kapag nag-autofit). (2) Bagong button na Open latest repeatability file sa kaliwa ng Export to Excel. (3) Run Latest Master ay Master Correl na. Bagong js/core/master-open-latest.js; binago: xlsx-writer.js, master-export.js, master-export-config.js, master.js, master.css, master.html, master.template.js
v2.13 | 2026-11-21 | Export to Excel: ang sheet na Readings ay may line chart (Excel chart, hindi larawan) sa kanan ng table. Binago: xlsx-writer.js, master-export.js, master-export-config.js
v2.12 | 2026-11-21 | Master Repeatability: dalawang mode (All data points flat / Latest per shift: Morning 7:30 AM-6:30 PM, Night 7:30 PM-6:30 AM kada petsa). Bagong master-shift.js at master-shift-config.js; binago: master.js, master.html, template, master.css, master-export.js
v2.11 | 2026-11-21 | Export: isang subfolder (master-repeatability), sa loob nito ay folder na petsa ng export. Binago: master-export.js
v2.10 | 2026-11-20 | Master: Range Master ay Master Repeatability; chart sa ibaba na may scroll, legend = petsa; Export to Excel (.xlsx) sa <Saving path>\master-repeatability\<petsa ng export>
v3.4 | 2026-11-21 | tools/file-watcher: Data source 1 ay binabantayan na rin (ModifiedWatchPaths sa watcher-config.txt) at kasama ang na-modify na file, hindi lang bago (DebounceSeconds). Binago: watch-new-files.ps1, watcher-config.txt, README-WATCHER.txt, js/pages/watcher-install.js (text lang)
v3.3 | 2026-11-21 | Settings: dagdag na button at panel na "Paano i-uninstall" sa card ng File Watcher (hakbang sa File Explorer, pagsusuri gamit ang shell:startup, at manual na paraan kung naka-block ang .bat). Laging bukas, hindi kailangan ng Saving path. Binago lang: js/pages/watcher-install.js at css/pages/watcher-install.css
v3.2 | 2026-11-21 | Settings: card na Install File Watcher (babala, tick na "Naiintindihan ko", tapos path ng folder at hakbang sa File Explorer). Hindi nag-i-install ang website; ang user mismo ang magpapatakbo ng install-watcher.bat. Bagong js/pages/watcher-install.js at css/pages/watcher-install.css
v3.1 | 2026-11-21 | tools/file-watcher: script sa Windows na kusang nagbubukas ng website kapag may bagong file sa CLO1A/CLO1A1 (hindi parte ng website)
v3.0 | 2026-11-21 | Search Files: Preview kada file sa Result (text, CSV, larawan, PDF)
v2.9 | 2026-11-21 | Search Files: tanong kung papalitan ang kapangalan (overwrite), send log sa <Saving path>\logs\send-log.txt, alaala ng huling manual destination
v2.8 | 2026-11-20 | Search Files page: hanap sa CLO1A/CLO1A1 (by name, by range date, latest), resulta na may scroll, Send to (Path o manual input)
v7 | 2026-11-21 | Compare vs previous: gumagawa lang kapag may na-detect na worst slider (yellow o red; green lahat = walang compare), kusa pagkatapos ng Run Latest Master; mas malinis na screen (banner ng worst slider, table ng Actual/Master/Diff ng Previous at Today, default na kailangang tingnan lang, buod na maikli); Excel ay may Actual at Master; sulat ng <Server path>\compare\<machine name>.json at alert/listahan ng slider sa tile ng machine sa Dashboard ng LEAD PC. Bago: js/core/compare-sync.js. Binago: master-compare-config/-ui/-export, master-compare.js, master-compare.css, master.html at template, dashboard.html at template, dashboard-machines(.js/-config/.css), README
v6 | 2026-11-21 | Task 1D: Dashboard machine view. Role badge (LEAD PC = MONITOR ONLY, MACHINE = SENDER); sa LEAD PC: naka-pin na tile ng LEAD PC, chips, at tile ng bawat machine na may dot (ACTIVE/STALE/NO STATUS), state (ONGOING/DONE/IDLE), mode, lot at oras; sa machine: sariling status lang. Bagong dashboard-machines-config.js, dashboard-machines.js, dashboard-machines.css; binago: dashboard.html, dashboard.template.js, dashboard.js, README
v5.2 | 2026-11-21 | Task 1C: monitor ng Data source 1, 2, 3 sa not-LEAD PC (Calibration/Master, Online/Offline; ONGOING at DONE) at sulat ng status sa <Server path>\queue. Bagong js/core/monitor.js; sinisimulan ng app.js. Wala pang UI (1D)
v5.1 | 2026-11-21 | Task 1B: queue sa Server path (<Server path>\queue\<machine name>.json): sulat ng status ng sariling machine, basa ng lahat, listahan ng machine mula sa server settings. Bagong js/core/queue.js; wala pang UI at wala pang tumatawag (1C monitor, 1D Dashboard)
v5 | 2026-11-20 | Task 1A: Settings ay sine-save kada machine (<machine name>.json) sa <Saving path>\settings at <Server path>\settings. Config.js, storage.js, settings.js lang ang binago
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
pages/calibration.html, master.html + css/pages + js/pages (+ js/templates) | [v2.3] placeholder page; wala pang laman [LUMA v9.0: may laman na ang Calibration, tingnan ang [v9.0] CALIBRATION CORREL sa dulo]
js/templates/sidebar|dashboard|settings|404.template.js | [v2] kopya ng HTML ng component/page bilang string (ito ang ginagamit ng app)
pages/lot-tracking.html | [v2.5] LOT Tracking page (markup; kopya ay js/templates/lot-tracking.template.js)
css/pages/lot-tracking.css | [v2.5] style ng LOT Tracking (naka-scope sa .page-lot-tracking)
js/pages/lot-tracking.js | [v2.5] logic ng LOT Tracking | js/templates/lot-tracking.template.js | [v2.5] kopya ng pages/lot-tracking.html bilang string
js/core/master-export-config.js | [v2.10] constants ng export (subfolder, kulay, text, selector) sa window.BMWW.exportConfig (hiwalay para hindi galawin ang config.js)
js/core/master-shift-config.js | [v2.12] constants ng mode at oras ng shift (window.BMWW.shiftConfig)
js/core/master-shift.js | [v2.12] pinipili ang record ayon sa mode (window.BMWW.masterShift)
js/core/xlsx-writer.js  | [v2.10] gumagawa ng .xlsx nang walang library (ZIP store + XML) sa window.BMWW.xlsx
js/core/correl-export-config.js, js/core/correl-export.js | [v2.16] Export to Excel ng Master Correl (window.BMWW.correlConfig, correlExport)
js/core/calibration-config.js, js/core/calibration-analysis.js, js/core/calibration-export.js | [v9.0] BAGO: Calibration correl (window.BMWW.calibrationConfig, calibrationAnalysis, calibrationExport)
js/core/master-compare-config.js, master-compare.js, master-compare-export.js, master-compare-ui.js, css/pages/master-compare.css | [v3.5] Compare vs previous ng Master Correl (window.BMWW.compareConfig, masterCompare, compareExport, compareUi)
js/core/compare-sync.js | [v7] sulat at basa ng <Server path>\compare\<machine name>.json (worst slider para sa LEAD PC) | window.BMWW.compareSync
js/core/master-compare-config.js, master-compare.js, master-compare-export.js, master-compare-ui.js, css/pages/master-compare.css, pages/master.html, js/templates/master.template.js | [v7] BINAGO: detect ng worst slider, kusang compare, actual/master, banner, filter, sync; dagdag na script ng compare-sync
js/core/master-open-latest.js | [v2.14] hinahanap at binubuksan ang pinakabagong na-export na Repeatability .xlsx (window.BMWW.masterOpenLatest)
js/core/master-export.js| [v2.10] bumubuo ng Excel mula sa resulta ng Master Repeatability at sine-save sa subfolder ng Saving path (window.BMWW.masterExport)

js/core/events-store.js | [v3] basa/sulat ng events (localStorage at settings/events.json)
js/core/queue.js        | [v5.1] queue ng machine sa Server path (status, listahan ng machine, presence) | window.BMWW.queue
js/core/monitor.js      | [v5.2] monitor ng Data source 1, 2, 3 ng sariling machine; nagsusulat ng status sa queue | window.BMWW.monitor
js/pages/dashboard-events.js | [v3] orasan, kalendaryo, listahan at form ng events ng Dashboard (nagre-register sa window.BMWW.dashboardEvents)
css/pages/dashboard-events.css | [v3] style ng seksyon (naka-scope sa .page-dashboard)
js/core/dashboard-machines-config.js | [v6] constants, selector at text ng machine view | window.BMWW.dashboardMachinesConfig
js/pages/dashboard-machines.js | [v6] role badge (LEAD PC = monitor only, MACHINE = sender), listahan ng machine (LEAD PC), sariling status (machine) | window.BMWW.dashboardMachines
css/pages/dashboard-machines.css | [v6] style ng role badge, tile, dot, chips (naka-scope sa .page-dashboard)
pages/dashboard.html, js/templates/dashboard.template.js, js/pages/dashboard.js | [v6] BINAGO: role badge slot (#dm-role), seksyong #dm-section, link/script ng bago, isang linya sa init

css/theme.css | [v4] buong design: pinapalitan ang mga variable ng base.css (kulay, radius, shadow, font), animation at effects; naka-load sa huli sa index.html
js/core/effects.js | [v4] spotlight sa card, ripple sa button, sliding indicator ng sidebar (window.BMWW walang bagong export)
[v7.1] pages/master.html, js/templates/master.template.js, js/pages/master.js, js/core/master-compare-ui.js, js/core/master-compare-config.js | BINAGO: card na Compare sliders (hiwalay sa Latest Master), walang kusang compare, walang Worst slider sa stat list ng Correl
[v7.2] js/core/correl-export-config.js, js/core/correl-export.js, js/pages/master.js | BINAGO: kopya ng Excel ng Master Correl sa Server path
js/core/correl-sync-config.js, js/core/correl-sync.js | [v7.3] BAGO: status ng Master Correl (PASS / WARNING / FAIL) na ipinapadala sa LEAD PC (window.BMWW.correlSyncConfig, correlSync)
js/core/correl-excel-reader.js | [v7.6] BAGO: binabasa ang pinakabagong Master Correl Excel ng machine sa <Server path>\master-correl\<machine>\<petsa>\ (window.BMWW.correlExcelReader)
[v7.3] js/pages/master.js, js/pages/dashboard-machines.js, js/core/dashboard-machines-config.js, css/pages/dashboard-machines.css, pages/master.html, js/templates/master.template.js, pages/dashboard.html, js/templates/dashboard.template.js | BINAGO: pagpapadala at pagpapakita ng status ng Master Correl; dagdag na script ng correl-sync-config at correl-sync

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
drawRangeLines(lineBox, legendHost, result, shownList, groupMap, selectedNameSet) | master.js | - | [v2.8] iginuguhit ang line chart; napiling file lang (at MASTER) ang kasama; [v2.10] ang legend ay makeDateLegend sa legendHost (sa ilalim ng chart) | renderRange (redraw)
[BINURA v2.10] makeSelectedLegend(groupMap, selectedNameSet) | master.js | ->ul | [v2.9] legend ng file name; pinalitan ng makeDateLegend (petsa) | drawRangeLines
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
writeSettingsFile(r,s) | storage.js | ->Promise | gawa ng BMWW\settings at settings.json | settings.js (onSave) [LUMA v5: hindi na tinatawag ng settings.js; nasa export pa rin]
readSettingsFile(r)    | storage.js | ->Promise | basa ng settings.json o null | settings.js (loadState) [LUMA v5: hindi na tinatawag ng settings.js; nasa export pa rin]
[v5] toMachineFileName(name) | storage.js | string->string | ligtas na pangalan ng file: pinapalitan ang <>:"/\|?* ng _, tinatanggal ang dulong tuldok/espasyo, dagdag na _ sa CON/PRN/AUX/NUL/COM1-9/LPT1-9 at sa settings.json / events.json; walang laman -> 'machine'; dagdag na .json | settings.js (onSave)
[v5] writeMachineSettings(folderHandle, fileName, s) | storage.js | ->Promise | gawa ng subfolder settings (kung wala) at sulat ng <fileName> sa loob; ginagamit sa Saving path at Server path | settings.js (onSave, writeToServer)
[v5] removeMachineSettings(folderHandle, fileName) | storage.js | ->Promise<bool> | bura ng lumang <machine>.json; hindi kailanman binubura ang settings.json at events.json; false kapag wala o pumalya | settings.js (onSave, writeToServer)
[v5] readJsonFile(folder, fileName) | storage.js | ->Promise<object|null> | basa at JSON.parse ng isang file; null kung wala o sira | readMachineSettings
[v5] readMachineSettings(rootHandle, preferredFileName) | storage.js | ->Promise<object|null> | una ang preferredFileName; kung wala, ang pinakabagong <machine>.json (may machineName; laktaw ang settings.json at events.json); huli ang lumang settings.json | settings.js (loadState)
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
init() (calibration/master) | js/pages/calibration.js, master.js | - | [v2.3] walang ginagawa pa [LUMA v9.0: may init na ang calibration.js; tingnan ang [v9.0]] | router
buildPathRows()        | settings.js | - | gumagawa ng row ng bawat path mula sa CONFIG.PATH_LIST (textContent lang) [v2.4: may full path input] | init
getSavedFullPath(key)  | settings.js | string->string | [v2.4] naka-save na full path (settings.folderPaths) | init
getInputFullPath(key)  | settings.js | string->string | [v2.4] full path sa input, nilinis ng sanitizeInput | renderPaths, onSave
getLastSegment(path)   | settings.js | string->string | [v2.4] pangalan ng folder sa dulo ng path | validateFullPath
validateFullPath(key, path) | settings.js | ->string | [v2.4] error message o '' (pattern at tugma sa pangalan ng folder; walang laman ay ayos) | checkAllFullPaths
onFullPathInput(key)   | settings.js | string | [v2.4] tanggal ng error at update ng ipinapakitang path | input listener ng full path
checkAllFullPaths(map) | settings.js | object->string | [v2.4] suri ng lahat ng full path, highlight ng unang mali | onSave
getSettingsLocation(p) | settings.js | string->string | [v2.4] lokasyon ng settings.json para sa mensahe (full path kung alam) | onSave [v5: ginagamit din para sa Server path]
[v5] getFileLocation(fullPath, fileName) | settings.js | string,string->string | <path>\settings\<fileName> para sa mensahe | onSave
[v5] isSameFileName(a, b) | settings.js | string,string->bool | pareho ba ang pangalan (hindi sensitibo sa laki ng letra, tulad ng Windows); iwas mabura ang kakasulat lang na file kapag laki ng letra lang ang binago | onSave, writeToServer
[v5] writeToServer(serverHandle, isAllowed, fileName, data, previousFile) | settings.js | ->Promise<'saved'|'skipped'|'failed'> | sulat sa <Server path>\settings; 'skipped' kung walang Server path, 'failed' kung walang permission o may error; binubura ang lumang file kapag nagpalit ng pangalan; walang itinatapon na error | onSave
[v5] onSave (binago) | settings.js | - | sulat muna sa Saving path (kailangan), tapos sa Server path (kung meron). Kapag pumalya ang server, nananatiling naka-save ang Saving path at error message ang lumalabas | click #save-button
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
[v2.10] xlsx-writer.js: computeCrc(bytes) | CRC32 | buildZip; columnLetter(i) | 0->A | buildCell; escapeXml(text) | tanggal control chars, escape | buildCell, buildPackageEntries; buildCell(cell,r,c) | cell o {v,s} -> XML | buildSheetXml; buildSheetView(freeze) | freeze panes | buildSheetXml; buildSheetXml(sheet) | worksheet XML | buildPackageEntries; buildStylesXml(colorMap) | styles (STYLE index) | buildPackageEntries; buildPackageEntries(sheetList,colorMap) | bahagi ng .xlsx | buildWorkbook; buildZip(entryList) | ->Blob | buildWorkbook; buildWorkbook(sheetList,colorMap) | ->Blob | master-export.js
[v2.10] master-export.js: padTwo(v); numberCell(value,style); getLevelStyle(actual,master) | green/yellow/red style (parehong rule ng screen) ; formatDay(date) ; buildSummarySheet(result,exportedAt,sourceText) | sheet 'Repeatability' (buod + per barcode) ; buildReadingsSheet(result) | sheet 'Readings' (lahat ng record, MASTER row, freeze) ; buildFileName(result,exportedAt) | master-repeatability_start_to_end_yyyymmdd-hhmmss.xlsx ; buildBlob(result,exportedAt,sourceText) ; exportRepeatability(result,rootHandle,sourceText) | ->Promise<{folderName,fileName}> | gumagawa ng subfolder kung wala, sumusulat ng file | onExport (master.js)
[v2.10] master.js: getExportButton(); updateExportButton() | bukas lang kapag may resulta at hindi busy | setBusy, onRunRange, init ; getExportErrorMessage(error) | friendly na mensahe | onExport ; makeDateLegend(seriesList) | legend ng petsa (may scroll) | renderRange ; onExport() | click ng Export to Excel: kuha ng handle ng Saving path, permission, exportRepeatability
[v2.13] xlsx-writer.js: absoluteRef(col,row) | $B$3 | buildSeriesXml ; quoteSheetName(name) | 'name' | buildChartXml ; buildStringCache(list) / buildNumberCache(list) | cache ng chart | buildSeriesXml ; buildSeriesXml(series,index,sheetRef,chart) | XML ng isang linya | buildChartXml ; buildChartXml(sheetName,chart) | line chart XML (categories = barcode, y-axis yMin/yMax) | buildPackageEntries ; buildDrawingXml(anchor) | posisyon ng chart sa sheet | buildPackageEntries ; buildRelsXml(type,target) | rels | buildPackageEntries. Ang sheet ay may optional na .chart; ginagawa ang xl/drawings, xl/charts at rels.
[v2.13] master-export.js: getChartColumnList(result) | huling CONFIG.MASTER.RANGE.MAX_LINES (150) na record | buildSummarySheet, buildReadingsChart ; buildReadingsChart(result, leadCount) | ->chart spec | buildReadingsSheet (linya = record, petsa ang pangalan; MASTER makapal na itim; y-axis min/max mula sa data + CHART.PAD_RATIO)
[v2.12] master-shift.js: getShiftOf(date) | Date->{name,dayKey}|null | Morning 07:30-18:30; Night 19:30-06:30 (00:00-06:30 ay night ng nakaraang petsa); labas sa dalawa = null | pickLatestPerShift ; pickLatestPerShift(columnList) | ->array | pinakahuling record ng Morning at ng Night kada petsa (max 2 kada petsa), may .shift at .shiftDay | applyMode ; applyMode(result, mode) | ->result | 'all' = lahat ng data point; 'shift' = pickLatestPerShift at kalkulasyon ulit ng stats (computeRepeatability); error 'noRecordInShift' | onRunRange (master.js)
[v2.12] master.js: getSelectedMode() | ->'all'|'shift' | radio name=range-mode | onRunRange ; getErrorMessage ay tumitingin din sa shiftConfig.TEXT.error. master-export.js: mode sa sheet Repeatability, column 'Shift' sa Readings (shift mode lang), suffix _all/_shift sa pangalan ng file
[v2.10] renderRange: chart ay nasa ibaba ng table, sa loob ng .chart-scroll (x at y scroll), katabi ang file panel; ang legend ay date legend (makeDateLegend, galing sa napiling file) na pumalit sa makeSelectedLegend [BINURA v2.10] (hideLegend ng chart-draw ang gamit).

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

[v5.1] queue.js (window.BMWW.queue):
pickFrom(group, value, fallback) | queue.js | ->value | nasa listahan ba ang value (mode, state, source, machineMode) kung hindi ay fallback | normalizeStatus
toIsoOrEmpty(value)    | queue.js | ->string | ISO na petsa o '' kung hindi valid | normalizeStatus
normalizeStatus(raw)   | queue.js | object->object|null | linis at validate ng status (machineName sanitize, mode/state/source ayon sa listahan, limit ng haba, petsa ISO); idle ay laging state idle; null kung walang machine name. Lahat ng galing sa file ay dumadaan dito | buildStatus, writeQueueStatus, readQueueList
buildStatus(identity, fields, nowMs) | queue.js | ->object|null | status ng sariling machine; updatedAt = nowMs (heartbeat) | monitor (1C)
readEntryJson(entry)   | queue.js | ->Promise<{data,modifiedMs}|null> | basa ng JSON; null kung sira o lampas FILE_MAX_BYTES | readQueueList, readMachineList
listJsonEntries(folder)| queue.js | ->Promise<entry[]> | mga .json sa folder, hanggang MAX_FILES, laktaw ang settings.json at events.json | readQueueList, readMachineList
isNotFound(error)      | queue.js | ->bool | NotFoundError lang (walang folder) ang itinuturing na walang laman; ibang error ay itatapon | readQueueList, readMachineList
writeQueueStatus(serverHandle, status) | queue.js | ->Promise<object> | sulat sa <Server path>\queue\<machine name>.json (gawa ng subfolder); nagtatapon ng error kung invalid ang status | monitor (1C)
removeQueueStatus(serverHandle, machineName) | queue.js | ->Promise<bool> | bura ng queue file ng machine; false kung wala o pumalya | Dashboard (1D, kung kailangan)
readQueueList(serverHandle) | queue.js | ->Promise<[{status,fileName,modifiedMs}]> | lahat ng valid na status; sira/hindi json/lampas sa laki ay nilalaktawan; walang queue folder = []; pumalyang server = error | loadSnapshot
readMachineList(serverHandle) | queue.js | ->Promise<[{machineName,machineMode,fileName}]> | mga naka-register na machine mula sa <Server path>\settings; hindi kasama ang LEAD PC (machineMode lead-pc) | loadSnapshot
getPresence(queueItem, nowMs) | queue.js | ->'active'|'stale'|'noStatus' | noStatus kung walang queue file; stale kung lampas STALE_MS mula sa oras ng file sa server (o updatedAt kung wala) | combineMachines, summarize
combineMachines(machineList, queueList, nowMs) | queue.js | ->[{machineName,registered,status,modifiedMs,presence}] | pinagsasama ayon sa machine name (hindi sensitibo sa laki ng letra); naka-register na walang queue = noStatus; nasa queue lang = registered false; natural sort (MWW 2 bago MWW 10) | loadSnapshot
summarize(machineItemList) | queue.js | ->{total,active,stale,noStatus,ongoing,done} | bilang; ongoing at done ay mula sa active lang | loadSnapshot, Dashboard (1D)
findServerHandle(shouldRequest) | queue.js | ->Promise<{handle,state}> | hawak ng Server path at permission; state: ok/noFolder/noPermission/unsupported; shouldRequest true lang kapag galing sa click | loadSnapshot, monitor (1C)
loadSnapshot(shouldRequest, nowMs) | queue.js | ->Promise<{state,handle,machineItemList,summary}> | buong larawan ng mga machine; hindi nagtatapon ng error (state 'error' kapag pumalya ang server, hindi '0 machine') | Dashboard (1D)

[v5.2] monitor.js (window.BMWW.monitor). Basa lang ang ginagawa sa Data source; walang isinusulat doon:
createSourceState()    | monitor.js | ->object | walang laman na state ng isang source {snapshot, recentNew, state, mode, startedMs, finishedMs, lastActivityMs, fileName, wafer, blk, layer, truncated, error} | start, pollOnce
isIgnoredName(name)    | monitor.js | string->bool | pansamantalang file (prefix ~$, extension .tmp .temp .part .crdownload; CONFIG.MONITOR) | scanSource
parseName(name)        | monitor.js | string->{wafer,blk,layer} | kapareho ng parseName ng lot-tracking.js (CONFIG.LOT.NAME_PATTERN); walang laman kung hindi tumama | evaluateSource
scanSource(handle)     | monitor.js | ->Promise<{entryMap,truncated}> | binabasa ang folder at subfolder (hanggang LOT.MAX_DEPTH, MAX_ENTRIES); entry: {kind, modifiedMs, size} | pollOnce
diffSnapshots(prev, cur) | monitor.js | Map,Map->{newFiles,newFolders,changed,removed} | ikinukumpara ang dalawang scan (changed = nagbago ang oras o laki ng file) | pollOnce
latestPath(list, map) / baseName(path) | monitor.js | helper | pinakabagong path sa listahan / pangalan ng file | evaluateSource
settleDiff(recentNew, diff, nowMs) | monitor.js | - | ang bagong file na kasusulat pa lang (lumalaki) ay hindi ituturing na bagong ongoing sa loob ng SETTLE_MS; inaalala ang mga bagong file | pollOnce
evaluateSource(key, prev, diff, map, nowMs, detectedMode) | monitor.js | ->state | source2/3: bagong file = DONE, ibang pagbabago = ONGOING; source1: anumang pagbabago = ONGOING (walang DONE); ang ONGOING na walang pagbabago lampas ONGOING_TIMEOUT_MS = idle | pollOnce
chooseOverall(stateMap) | monitor.js | ->object | pinipili ang ipapakita ng machine: pinakabagong ONGOING, kung wala ay pinakabagong DONE, kung wala ay idle | writeStatus
detectCalibMode(handle) | monitor.js | ->Promise<'master'|'calibration'> | binabasa (read-only) ang pinakabagong CSV ng Data source 1; 15 headers sa row 2 = master, kung hindi calibration | pollOnce
loadContext(shouldRequest) | monitor.js | ->Promise<{state,...}> | machine name/mode (localStorage), handle ng server at mga source na may permission; state: running/notApplicable (LEAD PC o walang name)/noSource/noServer/noPermission/unsupported | start
pollOnce(nowMs)        | monitor.js | ->Promise | isang ikot: scan ng bawat source, update ng state, sulat ng status | start, tick
writeStatus(nowMs)     | monitor.js | ->Promise | sulat sa queue kapag nagbago ang status o lampas HEARTBEAT_MS; binubura ang queue file ng lumang machine name; kapag pumalya, lastError='write' at subukan ulit sa susunod na ikot | pollOnce
tick()                 | monitor.js | ->Promise | ikot ng timer (kada POLL_MS); hindi nag-o-overlap; kapag nagbago ang settings sa localStorage, start(false) ulit | setInterval
start(shouldRequest)   | monitor.js | ->Promise<state> | simula ng monitor; hindi nagtatapon ng error; shouldRequest true lang kapag galing sa click (para sa permission) | app.js (initApp), Dashboard (1D, button na Payagan)
stop()                 | monitor.js | - | itinitigil ang timer | start
getState()             | monitor.js | ->{state,machineName,lastWriteMs,lastError,sources} | buod ng kalagayan (walang snapshot); sources[key] = {state,mode,fileName,wafer,blk,layer,entryCount,truncated,error} | Dashboard (1D), pag-debug

[v6] dashboard-machines.js (window.BMWW.dashboardMachines). Walang isinusulat sa server; basa lang:
createElementWith(tag,class,text) | dashboard-machines.js | ->Element | gumagawa ng elemento, textContent lang (ligtas sa XSS) | lahat ng build function
query(selector)       | dashboard-machines.js | ->Element|null | document.querySelector | lahat
getRole(settings)     | dashboard-machines.js | ->ROLE | lead-pc = LEAD PC; user-input na may machine name = SENDER; kung hindi = NOT SET | refresh, handleGrantClick
formatAgo(timeMs,nowMs) | dashboard-machines.js | ->string | "ngayon lang", "12s ago", "3m ago", "2h ago", "wala pa" | buildMachineTile, renderSender
buildRoleBadge(role)  | dashboard-machines.js | ->Element | badge na may icon + label + note (hindi kulay lang) | refresh, buildMachineTile, buildLeadTile, renderSender
buildChip / renderSummary(summary) | dashboard-machines.js | chips: Total, Active, Ongoing, Done, Stale, No status (galing sa queue.summarize) | renderLead
formatLot(wafer,blk,layer) | dashboard-machines.js | ->string | "Wafer X | Blk Y | Layer Z" (walang laman kung wala) | buildMachineTile, buildSourceRow
getRank(item) / sortItems(list) | dashboard-machines.js | ongoing, done, idle, stale, no status; sunod ay pangalan (natural sort) | renderLead
buildMachineTile(item,nowMs) | dashboard-machines.js | ->Element | tile ng isang machine: pangalan, SENDER badge, dot at presence, state, mode, lot, file, ago | renderLead
buildLeadTile(settings) | dashboard-machines.js | ->Element | naka-pin na tile ng LEAD PC (monitor lang, walang dot) | renderLead
setMessage(message,canGrant) | dashboard-machines.js | mensahe sa #dm-message at ipakita/itago ang #dm-grant | renderLead, renderSender, renderUnset
renderLead(settings,shouldRequest) | dashboard-machines.js | ->Promise | queue.loadSnapshot, tapos chips at tiles; friendly na mensahe kapag hindi ok ang koneksyon | refresh
getOwnOverallState(sourceMap) | dashboard-machines.js | ->state | ongoing, kung wala ay done, kung wala ay idle | renderSender
buildSourceRow(key,source) | dashboard-machines.js | ->Element | hilera ng Data source (state, mode, lot, file) | renderSender
renderSender(settings) | dashboard-machines.js | sariling status lang ng machine (monitor.getState) | refresh
renderUnset()         | dashboard-machines.js | gabay kapag walang naka-save na machine name | refresh
refresh(shouldRequest) | dashboard-machines.js | ->Promise | isang ikot; hindi nag-o-overlap; humihinto ang timer kapag wala na ang page; try/catch | init, timer, handleGrantClick
stopTimer()           | dashboard-machines.js | pinipigil ang interval | init, refresh
handleGrantClick()    | dashboard-machines.js | ->Promise | humihingi ng permission: LEAD PC = Server folder; machine = monitor.start(true) | click #dm-grant
init()                | dashboard-machines.js | simula ng view at timer | dashboard.js (init)

[v7] masterCompare.detectWorst(result) | master-compare.js | ->{barcode,index,actual,master,difference,level}|null | worst slider ng run; null kapag walang kumpletong pares o green ang level (mas mababa sa DETECT.MIN_LEVEL) | compareUi.refresh, processRun
[v7] masterCompare.compareRecords: dagdag sa bawat slider: currentActual, currentMaster, previousActual, previousMaster, masterChanged (magkaiba ang Master ng dalawang record), isAttention (hindi green ngayon o lumalala)
[v7] compare-sync.js (window.BMWW.compareSync). Sulat ng machine, basa ng LEAD PC:
toNumber / toText / toIso / pickFrom | compare-sync.js | helper | linis ng numero, text, petsa, at pili sa listahan | normalizeSlider, normalizeStatus
normalizeSlider(raw) | compare-sync.js | ->object|null | nililinis ang isang slider (barcode, level, trend, actual, master, diff, change) | normalizeStatus
normalizeStatus(raw) | compare-sync.js | ->object|null | nililinis ang buong status; null kung walang machine name; limit ng slider = SLIDER_MAX | buildPayload, writeCompareStatus, readCompareList
buildPayload(identity, run, detection, comparison, nowMs) | compare-sync.js | ->status | detection null = detected false (clear); comparison null = walang previous | compareUi.syncToServer
writeCompareStatus(serverHandle, status) | compare-sync.js | ->Promise<status> | sulat sa <Server path>\compare\<machine name>.json (gawa ng subfolder); itinatapon ang error kapag invalid | sendStatus
readCompareList(serverHandle) | compare-sync.js | ->Promise<[{status,fileName,modifiedMs}]> | basa ng lahat; walang folder = []; sira o masyadong malaki ay nilalaktawan | dashboard-machines.js (readCompareMap)
sendStatus(status, shouldRequest) | compare-sync.js | ->Promise<ok|noFolder|noPermission|unsupported|error> | server handle mula sa queue.findServerHandle, tapos sulat; hindi nagtatapon ng error | compareUi.syncToServer
[v7] master-compare-ui.js: BAGONG function: makeTableBody(rowList) | getSyncText(view) | buildSyncLine(view) | updateSyncLine() | buildBanner(view) | buildNoWorst(view) | buildWorstTable(view) [Actual, Master, Diff ng Previous at Today] | buildStats(comparison) | makeCompareTable(sliderList, worstSlider) [naka-group na Previous/Today] | buildTableSection(view) [filter, default: kailangang tingnan lang] | buildChart(comparison) | renderView() | syncToServer(view, shouldRequest) | finishSync(view, shouldRequest) | processRun(run, shouldRequest) [detect, compare, sync] | onCompare | refresh (kusang nagpoproseso ng bagong run) | init
[v7] [LUMA] master-compare-ui.js: renderComparison -> pinalitan ng renderView at mga build function; formatSlider (hindi na ginagamit); makeTable ay ginagamit pa sa buildWorstTable
[v7] dashboard-machines.js dagdag: formatReading(value) | formatSignedReading(value) | readCompareMap(serverHandle) | buildSliderTable(sliderList) | buildAlertBlock(compareItem, nowMs) | hasAlert(item) | getRank: alert muna | renderSummary(summary, alertCount)
[v7.1] master.js: [BINURA v7.1] formatWorstSlider(result) | inalis sa stat list ng Master Correl; ang Worst slider ay ipinapakita na ng Compare sliders (banner). Wala nang tumatawag; ang masterAnalysis.findWorstSlider ay ginagamit pa ng master-compare.js at correl-export.js
[v7.1] master-compare-ui.js: refresh() BINAGO | bukas ang Compare vs previous kapag may Master Correl run (hindi na kailangan ng worst slider, kaya kahit green lahat ay may sagot na "Walang worst slider"); ang kusang processRun ay tumatakbo lang kapag COMPARE.AUTO_RUN | tinatawag ng: master.js (updateExportButton), compareUi.init
[v7.2] correl-export.js: BAGONG writeBlob(folderHandle, fileName, blob) -> Promise<void> | isinusulat ang Blob bilang file; abort kapag pumalya | tinatawag ng: exportCorrel, copyToServer
[v7.2] correl-export.js: BAGONG getMachineFolderName(machineName) -> string | pinapalitan ng _ ang mga bawal na character sa pangalan ng folder (CORREL.SERVER.UNSAFE_NAME), tinatanggal ang espasyo at tuldok sa dulo; blangko = CORREL.SERVER.NO_MACHINE_FOLDER | tinatawag ng: copyToServer
[v7.2] correl-export.js: BAGONG copyToServer(serverHandle, saved, machineName) -> Promise<{folderName, fileName}> | kopya sa <Server path>\master-correl\<machine name>\<petsa>\ (ginagawa ang mga folder) | tinatawag ng: master.js (copyCorrelToServer) | error: ipinapasa ang error ng folder handle
[v7.2] correl-export.js: exportCorrel BINAGO | ibinibigay na rin ang blob at dateFolderName (dagdag lang; pareho pa ang folderName at fileName)
[v7.2] master.js: BAGONG findServerForCopy() -> Promise<{handle, state}> | root.queue.findServerHandle(true) (humihingi ng permission dahil galing sa click); hindi nagtatapon ng error | tinatawag ng: onExportCorrel
[v7.2] master.js: BAGONG copyCorrelToServer(serverFound, saved, paths) -> Promise<{ok, path} | {ok:false, message}> | kinokopya ang file sa Server path; hindi nagtatapon ng error | tinatawag ng: onExportCorrel | tumatawag ng: correlExport.copyToServer
[v7.2] master.js: onExportCorrel BINAGO | pagkatapos mag-save sa Saving path, kinokopya sa Server path; success (berde) kung pareho, error (pula) kung pumalya ang Server pero naka-save ang Saving path
[v7.3] correl-sync.js: BAGONG normalizeStatus(raw) -> object | null | nililinis; null kung walang machine name o hindi PASS / WARNING / FAIL ang status | tinatawag ng: buildPayload, writeCorrelStatus, readCorrelList
[v7.6] correl-excel-reader.js: BAGONG readLatestForMachine(correlFolderHandle, machineName) -> Promise<{status, fileName, modifiedMs} | null> | hinahanap ang pinakabagong master-correl_*.xlsx ng machine, binabasa ang Status, R Square, Record (column A/B), may cache kada file | tinatawag ng: dashboard-machines.js (applyLatestCorrelExcel) | tumatawag ng: correlSync.normalizeStatus | try/catch, null kapag pumalya
[v7.6] dashboard-machines.js: BAGONG applyLatestCorrelExcel(serverHandle, machineItemList) -> Promise<void> | pinapalitan ang item.correl ng galing sa Excel kapag mas bago | tinatawag ng: renderLead
[v7.6] dashboard-machines.js: BAGONG rereadOwnCorrel() -> Promise<void> | machine lang: analyzeLatest ng ngayon sa Data source 1 at correlSync.publishStatus (walang popup) | tinatawag ng: init
[v7.3] correl-sync.js: BAGONG buildPayload(identity, result, nowMs) -> status | gumagawa ng status mula sa resulta ng analyzeLatest (status, regression.rSquared, recordDate, fileName) | tinatawag ng: publishStatus
[v7.3] correl-sync.js: BAGONG writeCorrelStatus(serverHandle, status) -> Promise<status> | sulat sa <Server path>\correl\<machine name>.json (gawa ng subfolder) | tinatawag ng: publishStatus
[v7.3] correl-sync.js: BAGONG readCorrelList(serverHandle) -> Promise<[{status, fileName, modifiedMs}]> | basa ng lahat ng machine; walang folder = []; sirang o masyadong malaking file ay nilalaktawan | tinatawag ng: dashboard-machines.js (readCorrelMap)
[v7.3] correl-sync.js: BAGONG publishStatus(result, settings, shouldRequest) -> Promise<'ok'|'skippedLead'|'noName'|'noFolder'|'noPermission'|'unsupported'|'error'> | hindi nagtatapon ng error; LEAD PC ay hindi sumusulat | tinatawag ng: master.js (sendCorrelToLead) | tumatawag ng: queue.findServerHandle, writeCorrelStatus
[v7.3] master.js: BAGONG sendCorrelToLead(result) -> Promise<void> | pagkatapos ng Master Correl, ipinapadala ang status at ipinapakita ang resulta sa status line | tinatawag ng: onRunLatest | tumatawag ng: correlSync.publishStatus
[v7.3] dashboard-machines.js: BAGONG hasCorrelFail(item) | readCorrelMap(serverHandle) | buildCorrelBlock(correlItem, nowMs) [badge, R Square, petsa, kailan naipadala, LUMA] | BINAGO: renderSummary(summary, alertCount, correlFailCount), getRank (alert o Correl FAIL = RANK.alert), buildMachineTile, renderLead

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
CONFIG.LOT (config.js, v2.5): PAGE, [BINURA v14: SOURCE_KEYS, lumipat sa lotConfig.SOURCE.KEYS], SOURCE_LABEL, REFRESH_MS (3000), START_TOLERANCE_MS (1000), MAX_DEPTH (5), MAX_ROWS (30), BARCODE_MAX, OPERATOR_MIN, OPERATOR_MAX, IGNORED_PREFIX, NAME_PATTERN, TYPE, [BINURA v14: PATH_COLUMN], EMPTY_CELL, SELECTOR, TEXT; PAGE_LIST ay may 'lot-tracking'
lote, pendingBarcode, sourceList, timerId, isScanning (lot-tracking.js, let, nasa loob ng IIFE) | [v2.5] kasalukuyang lote, barcode na hinihintay ang operator, mga source handle, timer, guard
[v2.10] exportConfig (master-export-config.js, frozen): SUBFOLDER 'master-repeatability', FILE_PREFIX, FILE_EXTENSION, PATH_SEPARATOR, SELECTOR{exportButton '#range-export', defaultLegend '.chart-legend'}, COLOR{header,green,yellow,red}, SHEET, COLUMN_WIDTH, ERROR_BY_NAME, LABEL, TEXT{exporting, saved, chartAria, dateLegendAria, dateLegendTitle, error{...}}
[v2.13] exportConfig.CHART: PALETTE (8 kulay), MASTER_COLOR, LINE_WIDTH, MASTER_LINE_WIDTH, MARKER_SIZE, MASTER_MARKER_SIZE, GAP_COLUMNS, COLUMN_SPAN, ROW_SPAN, X_TITLE, Y_TITLE; LABEL.chartRecords
[v2.12] shiftConfig (master-shift-config.js, frozen): MODE{all,shift}, DEFAULT_MODE, SHIFT{morning{startMinute 450,endMinute 1110}, night{startMinute 1170,endMinute 390}}, FILE_SUFFIX, SELECTOR.checkedMode, TEXT{modeLabel, modeName, shiftColumn, error.noRecordInShift}
[v2.10] lastRangeResult (let, master.js, nasa IIFE) | huling resulta ng Master Repeatability para sa Export
[v2.10] STYLE (xlsx-writer.js) | normal, header, bold, number, green, yellow, red

[v3] CONFIG.EVENTS (config.js): STORAGE_KEY 'bmww.events', FILE_NAME 'events.json', FILE_VERSION, ID_PREFIX, LOCALE 'en-PH', WEEK_START (0=Linggo), CELL_COUNT 42, CLOCK_MS 1000, TITLE_MAX 60, NOTE_MAX 300, ID_MAX, MAX_EVENTS 500, DATE_PATTERN, TIME_PATTERN, ATTR, ACTION, CLASS, FILE_STATE{ok,noFolder,noPermission,unsupported,error}
[v3] CONFIG.SELECTOR.events (lahat ng id ng seksyon), CONFIG.SELECTOR.eventDay / eventAction, CONFIG.TEXT.events (lahat ng mensahe)
[v3] elements, state (let), clockTimerId (let) sa dashboard-events.js, nasa loob ng IIFE | mga elemento ng seksyon; state {eventList, fileState, todayKey, selectedDate, viewYear, viewMonth, editingId, isBusy}; timer ng orasan
[v3] currentFileState, currentRootHandle (let) sa events-store.js, nasa loob ng IIFE | huling state ng file at hawak ng BMWW folder
[v3] Event: {id, title, date 'YYYY-MM-DD', time 'HH:MM' o '', note}; pending (true) ay sa localStorage lang

[v4] EFFECTS (effects.js, const frozen, nasa loob ng IIFE) | CARD, SPOT_X/SPOT_Y, BUTTON, RIPPLE_CLASS, SIDEBAR_LIST, LINK, ACTIVE_CLASS, INDICATOR_CLASS, READY_CLASS. [Paalala: nasa effects.js at hindi sa config.js para hindi galawin ang config.js; puwedeng ilipat sa susunod.]
[v4] frameId, indicatorFrameId (let) sa effects.js | id ng requestAnimationFrame
[v4] CSS VARIABLES sa css/theme.css: --glow, --spot (liwanag ng background at spotlight), --ease; pinalitan ang --color-*, --radius, --radius-sm, --shadow, --shadow-hover, --ring, --transition, --font-main. Dark mode: itim, charcoal at puti.

[v5] CONFIG.SERVER_KEY 'server' (key ng Server path sa handleMap) | CONFIG.MACHINE_FILE {EXTENSION '.json', LEGACY_NAME 'settings.json', RESERVED_FILES ['settings.json','events.json'], INVALID_CHARS, TRAILING_CHARS, RESERVED_PATTERN, PREFIX '_', FALLBACK_NAME 'machine'} | CONFIG.MACHINE_FILE_FIELD 'machineFile' (field sa settings na may pangalan ng file ng machine) | js/core/config.js | storage.js, settings.js
[v5] CONFIG.TEXT: savedBoth, savedRootOnly, serverNotSet, serverFailed | js/core/config.js | mensahe ng save | settings.js (onSave). [LUMA v5] CONFIG.TEXT.saved: hindi na ginagamit sa onSave
[v5.1] CONFIG.QUEUE (config.js): SUBFOLDER 'queue', FILE_VERSION 1, HEARTBEAT_MS 30000 (gaano kadalas magsulat ang monitor), STALE_MS 120000 (lampas dito = stale), TEXT_MAX 60, FILE_NAME_MAX 120, FILE_MAX_BYTES 65536, MAX_FILES 200, MODE{idle,calibration,master,online,offline}, STATE{idle,ongoing,done}, SOURCE{'',source1,source2,source3}, PRESENCE{active,stale,noStatus}, CONNECTION{ok,noFolder,noPermission,unsupported,error}
[v5.2] CONFIG.MONITOR (config.js): POLL_MS 5000, SETTLE_MS 30000, MAX_ENTRIES 5000, SOURCE_KEYS, SOURCE_MODE {source1 'auto' (master/calibration), source2 'online', source3 'offline'}, ONGOING_TIMEOUT_MS {source1 300000, source2 1800000, source3 1800000}, IGNORED_PREFIXES ['~$'], IGNORED_EXTENSIONS ['.tmp','.temp','.part','.crdownload'], STATE {stopped, running, notApplicable, noSource, noServer, noPermission, unsupported, error}
[v5.2] Variables sa monitor.js (let, nasa loob ng IIFE): context (machine at mga handle), timerId, isPolling, monitorState, lastWriteMs, lastWrittenKey (huling isinulat na status, para malaman kung nagbago), lastWrittenName (para mabura ang lumang queue file), lastError, settingsKey (para malaman kung nagbago ang settings), sourceMap (state ng bawat source)

[v6] window.BMWW.dashboardMachinesConfig (js/core/dashboard-machines-config.js): POLL_MS 5000 | ROLE {lead: LEAD PC / MONITOR ONLY, sender: MACHINE / SENDER, unset} | RANK {ongoing 0, done 1, idle 2, stale 3, noStatus 4} (pagkakasunod ng tile) | LABEL {presence, state, mode, source} | CLASS | SELECTOR (lahat ng #dm-*) | TEXT (lahat ng mensahe)
[v6] Variables sa dashboard-machines.js (let, nasa loob ng IIFE): timerId (interval ng refresh), isBusy (iwas overlap)

[v7] CompareConfig (master-compare-config.js) dagdag: DETECT {MIN_LEVEL 'level-yellow'}, LEVEL_TEXT, SYNC {SUBFOLDER 'compare', FILE_VERSION 1, SLIDER_MAX 200, TEXT_MAX 60, FILE_MAX_BYTES 262144, MAX_FILES 200}, CLASS {banner, sync, filter, tableBox, worstRow, masterChanged, groupStart, ok}, LABEL (columnActual, columnMaster, columnDiff, groupPrevious, groupToday, previousActual, previousMaster, previousDiff, todayActual, todayMaster, todayDiff, worstSlider, rowActual, rowMaster, rowDiff), TEXT (banner, bannerLine, bannerNoPrevious, noWorstTitle, noWorstNote, stat*, showAll, attentionNote, allNote, masterChangedNote, noPreviousNote, sync{pending, ok, cleared, skippedLead, noName, noFolder, noPermission, unsupported, error})
[v7] DashboardMachinesConfig dagdag: RANK.alert (-1), COMPARE {STALE_MS 86400000, DIGITS 3, LEVEL_CLASS, LEVEL_TEXT}, TEXT.summary.worstSlider, TEXT.compare
[v7] Variables sa master-compare-ui.js (let, nasa loob ng IIFE): hooks, view ({run, detection, comparison, noPrevious, showAll, sync}) [LUMA: lastCompare, pinalitan ng view], autoRun (run na naproseso na nang kusa)
[v7.1] CompareConfig (master-compare-config.js) dagdag: AUTO_RUN (boolean, false = hindi kusang tumatakbo ang compare pagkatapos ng Master Correl; true = ibalik ang dating kusa) | ginagamit sa: master-compare-ui.js (refresh)
[v7.2] CorrelConfig (correl-export-config.js) dagdag: SERVER {SUBFOLDER 'master-correl', NO_MACHINE_FOLDER 'no-machine-name', UNSAFE_NAME (regex), TRIM_NAME (regex)}; TEXT dagdag: serverSaved, serverFailed, serverState {noFolder, noPermission, unsupported, error}
[v7.3] CorrelSyncConfig (correl-sync-config.js): SUBFOLDER 'correl', FILE_VERSION 1, TEXT_MAX 60, FILE_MAX_BYTES 65536, MAX_FILES 200, STALE_MS 86400000 (24 oras), R_SQUARED_DIGITS 4, STATUS_CLASS {PASS: dm-correl-pass, WARNING: dm-correl-warning, FAIL: dm-correl-fail}, MESSAGE_KIND, TEXT {ok, skippedLead, noName, noFolder, noPermission, unsupported, error}
[v7.3] DashboardMachinesConfig dagdag: TEXT.summary.correlFail 'Correl fail'; TEXT.correl {label, none, rSquared, record, sent, stale, icon {PASS, WARNING, FAIL}}

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
change      | input[name=range-mode] | [v2.12] binabasa lang sa pag-click ng Master Repeatability (walang listener)
click       | #range-export | master.js | [v2.10] onExport

click       | #cal-prev, #cal-next, #cal-today, #ev-add, #ev-cancel, #ev-grant | dashboard-events.js | lipat ng buwan, ngayon, bagong event, cancel, payagan ang folder
click       | #cal-grid (delegation sa [data-date]) | dashboard-events.js | handleGridClick -> selectDate
click       | #ev-list (delegation sa [data-action]) | dashboard-events.js | handleListClick (Edit / Delete may confirm)
submit      | #ev-form | dashboard-events.js | handleSubmit
setInterval | window | dashboard-events.js | updateClock kada 1 segundo; humihinto kapag wala na ang #dash-clock-time sa pahina

setInterval | window | monitor.js | tick kada POLL_MS (5 segundo); nagsisimula sa app.js (monitor.start)
pointermove | document | effects.js | spotlight ng card
pointerdown | document | effects.js | ripple ng button
resize      | window | effects.js | scheduleIndicator
MutationObserver | #sidebar (childList, subtree, class) | effects.js | scheduleIndicator kapag nagbago ang active link

[v6] click | #dm-grant | dashboard-machines.js | handleGrantClick
[v6] setInterval (POLL_MS 5000) | window | dashboard-machines.js | refresh (huminto kapag wala na ang #dm-section)

[v7] change | .compare-filter input (checkbox na Ipakita lahat ng slider) | master-compare-ui.js | draw (loob ng buildTableSection)
[v7.1] click | #compare-run, #compare-export | master-compare-ui.js | onCompare, onExport | walang bagong event; lumipat lang ang mga button sa card na Compare sliders (pareho ang id)

E. STORAGE / API
localStorage "bmww.settings" | settings.js, dashboard.js | {machineMode, machineName, [BINURA v2.4: machineNameLocked], [v2.4] folderPaths{server,root,source1,source2,source3}, rootFolderName, sourceFolderName (para sa Dashboard), folderNames{server,root,source1,source2,source3}, savedAt} | cache
IndexedDB "bmww-db" / store "handles" (keys rootFolder, serverFolder, sourceFolder, sourceFolder2, sourceFolder3) | storage.js | folder handles | iwas pili ulit
File: <BMWW>\settings\settings.json | storage.js | parehong object | pangunahing tala (C:\desktop\BMWW\settings) [LUMA v5: hindi na sinusulat; binabasa pa rin bilang huling opsyon ng readMachineSettings]
[v5] File: <Saving path>\settings\<machine name>.json | storage.js (writeMachineSettings) | parehong object ng settings + field machineFile | tala ng machine sa sariling PC; nababasa sa loadState
[v5] File: <Server path>\settings\<machine name>.json | storage.js (writeMachineSettings) | parehong object | kopya sa server; dito babasahin ng LEAD PC ang listahan ng machine (susunod na task). Isang file kada machine kaya walang nagpapatungan maliban kung pareho ang machine name.
[v5] settings.machineFile (localStorage 'bmww.settings' at sa file) | settings.js | pangalan ng file ng machine | para mabura ang lumang file kapag nagpalit ng machine name
[v5.1] File: <Server path>\queue\<machine name>.json | queue.js (writeQueueStatus) | {version, machineName, machineMode, mode, state, source, fileName, wafer, blk, layer, barcode, startedAt, finishedAt, updatedAt} | status ng machine; isang file kada machine (sulat ng sarili niya lang); basa ng LEAD PC at ng ibang machine
[v5.2] Ang monitor.js ang nagsusulat ng queue file (sa pamamagitan ng queue.writeQueueStatus). Binabasa lang (hindi sinusulatan) ang Data source 1, 2, 3.
[v5.1] Dalawang pinagmumulan ng listahan: <Server path>\settings (sino ang naka-register) at <Server path>\queue (ano ang ginagawa). Ang machine na walang queue file ay noStatus, hindi nawawala.
Walang backend/API sa v1 (api/ ay walang laman).
[v2.5] LOT Tracking: binabasa ang machineName mula sa localStorage "bmww.settings" at ang handle ng source1..3 mula sa IndexedDB (key sa CONFIG.HANDLE_KEY). Walang sinusulat; basa lang sa mga folder.
[v2.10] File: <BMWW>\master-repeatability\<yyyy-mm-dd ng export>\master-repeatability_<start>_to_<end>_<yyyymmdd-hhmmss>.xlsx | master-export.js | Sheet 'Repeatability' at 'Readings' | Export ng Master Repeatability (IndexedDB key rootFolder ang handle ng Saving path)

[v3] localStorage "bmww.events" | events-store.js | array ng event (may pending mark) | cache at pang-offline
[v3] File: <BMWW>\settings\events.json | events-store.js | {version, savedAt, events[]} | pangunahing tala; ang file ang nananaig kapag nabasa; ang pending na event ay isinasama pabalik sa file kapag nabuksan ulit
[v3] Gumagamit ng parehong BMWW folder handle (IndexedDB key rootFolder) at SETTINGS_SUBFOLDER ng Settings. Walang network/API.

[v3.5] COMPARE VS PREVIOUS (Master Correl)
  FUNCTIONS:
  masterCompare.findPrevious(directoryHandle, selectedDate, onProgress) -> Promise<result ng analyzeLatest> | file: master-compare.js | hinahanap ang pinakabagong master record BAGO ang napiling Date sa loob ng LOOKBACK_DAYS; isang scan lang (analyzeLatest na may saklaw start = petsa - lookback, end = petsa - 1) | tinatawag ng: compareUi.onCompare | error: 'noPreviousRecord' (galing sa noRecordToday / noMasterFile)
  masterCompare.compareRecords(current, previous) -> { current, previous, sliderList[], summary } | pinagtutugma ang slider ayon sa pangalan ng barcode; diff = |actual - master| ng bawat record laban sa sarili nitong master | summary: worseCount, betterCount, sameCount, unknownCount, biggestIncrease, currentWorst, previousWorst, rSquaredChange
  masterCompare.getTrend(change, currentLevel, previousLevel) -> 'worse' | 'better' | 'same' | 'unknown' | worse kapag change >= WORSEN_MIN o bumaba ang level; better kapag change <= -WORSEN_MIN o tumaas ang level; unknown kapag kulang ang data
  (loob ng master-compare.js: roundValue, getDifference, addDays)
  compareExport.exportCompare(comparison, rootHandle, sourceText, machineName) -> { folderName, fileName } | sine-save ang .xlsx sa <Saving path>\master-compare\<yyyy-mm-dd>\master-compare_<petsa today>_vs_<petsa previous>_<yyyymmdd-hhmmss>.xlsx (bagong file kada export) | compareExport.buildBlob, buildFileName
  (loob ng master-compare-export.js: padTwo, formatDay, formatDayTime, numberCell, getLevelStyle, getChangeStyle, getSliderText, buildCompareSheet [sheet Compare: buod + table], buildChartSheet [sheet Chart: line chart ng diff])
  compareUi.init(hooks) | compareUi.refresh() | file: master-compare-ui.js | tinatawag ng master.js: init pagkatapos ng restoreSaved; refresh sa updateExportButton
  hooks (galing sa master.js): getLatestRun, isBusy, setBusy, getReadyHandle, getReadErrorMessage, getMachineName
  (loob ng master-compare-ui.js: query, makeElement, setStatus, getReadMessage, getExportMessage, formatNumber, formatSigned, formatSlider, makeStatList, makeTable, getDayGap, renderComparison, refresh, onCompare, onExport, init)
  CONSTANTS (window.BMWW.compareConfig, master-compare-config.js): LOOKBACK_DAYS 7, WORSEN_MIN 0.3, ROUND_DIGITS 6, DISPLAY_DIGITS 3, LEVEL_RANK, TREND, TREND_CLASS, TREND_SYMBOL, TREND_TEXT, SUBFOLDER 'master-compare', FILE_PREFIX, FILE_EXTENSION, SELECTOR {runButton, exportButton, status, result}, SHEET, CHART (kulay, laki, Y_PAD_RATIO), LABEL, TEXT (lahat ng mensahe at error)
  VARIABLES: hooks (let, loob ng IIFE ng master-compare-ui.js) | mga function ng master.js | lastCompare (let, { run, comparison }) | huling compare; nananatili habang bukas ang website; nililinis kapag nagbago ang Master Correl run
  EVENTS: click | #compare-run | master-compare-ui.js | onCompare | click | #compare-export | master-compare-ui.js | onExport
  FILE: <Saving path>\master-compare\<yyyy-mm-dd>\*.xlsx (bagong subfolder) | walang localStorage / API na bago
  CSS: css/pages/master-compare.css (naka-scope sa .page-master): .compare-actions, .compare-title, td.trend-worse / trend-better / trend-same / trend-unknown; gumagamit ng --level-green, --level-red mula sa master.css

[v6] Walang bagong localStorage key o API. Binabasa lang ng dashboard-machines.js ang "bmww.settings", ang <Server path>\queue at \settings (basa lang), at ang monitor.getState.

[v7] FILE: <Server path>\compare\<machine name>.json | compare-sync.js (writeCompareStatus; sulat ng machine, basa ng LEAD PC) | {version, machineName, machineMode, updatedAt, detected, recordDate, previousDate, todayFile, previousFile, hasPrevious, worst{barcode, level, trend, currentActual, currentMaster, currentDifference, previousActual, previousMaster, previousDifference, change}, summary{worseCount, betterCount, sameCount, unknownCount, rSquaredToday, rSquaredPrevious}, sliderList[hanggang SLIDER_MAX (200); mga slider na hindi green o lumalala]} | detected false = walang worst slider (clear)
[v7] Walang bagong localStorage key. Binago ang Excel ng Compare: table ay may Prev Actual, Prev Master, Prev Diff, Today Actual, Today Master, Today Diff, Change, Trend.
[v7.2] FILE: <Server path>\master-correl\<machine name>\<yyyy-mm-dd>\master-correl_<petsa ng record>_<yyyymmdd-hhmmss>.xlsx (kopya ng nasa Saving path; bagong file kada export, walang napapalitan) | walang bagong localStorage / API
[v7.3] FILE: <Server path>\correl\<machine name>.json | laman: version, machineName, machineMode, updatedAt, recordDate, status (PASS / WARNING / FAIL), rSquared, fileName | sinusulat ng machine pagkatapos ng Master Correl (hindi ng LEAD PC), binabasa ng Dashboard ng LEAD PC kada 5 segundo | walang bagong localStorage / API

F. CSS VARIABLES [v2.7: css/pages/master.css --level-green, --level-yellow, --level-red, --level-yellow-text, --master-warning, --chart-1..8] (css/base.css): --color-primary, --color-primary-dark, --color-primary-soft, --color-on-primary, --color-bg, --color-surface, --color-text, --color-muted, --color-border,
  --color-cta, --color-cta-dark, --color-on-cta (green, para sa Save/Buy/Purchase), --color-focus, --color-success, --color-danger, --color-overlay,
  --space-1/2/3/4/6/8, --radius, --radius-sm, --shadow, --shadow-hover, --ring, --transition, --sidebar-width, --content-max, --touch-size, --font-size-label, --font-main
  Dark mode: prefers-color-scheme block sa base.css, variables lang ang pinapalitan.

[v2.10] master.js -> master-export.js -> xlsx-writer.js, master-export-config.js (ang apat ay naka-link sa pages/master.html at template; walang binago sa index.html)

[v6] css/pages/dashboard-machines.css (naka-scope sa .page-dashboard): --dm-warning (amber ng STALE) | class: dm-role-badge/-lead/-sender/-unset, dm-tile, dm-tile-lead, dm-tile-sender, dm-presence-*, dm-state-*, dm-dot, dm-chip*, dm-grid

[v7] css/pages/master-compare.css (.page-master): .compare-banner (level-red/yellow), .compare-ok, .compare-sync, .compare-filter, .compare-table, .group-start, tr.is-worst, td.master-changed | css/pages/dashboard-machines.css: .dm-alert (+ .dm-alert-red/.dm-alert-yellow), .dm-tile-alert, .dm-chip-alert, .dm-details, .dm-table
[v7.3] css/pages/dashboard-machines.css (.page-dashboard): .dm-correl (+ dm-correl-pass / dm-correl-warning / dm-correl-fail / dm-correl-none), .dm-correl-row, .dm-correl-label, .dm-correl-badge, .dm-correl-icon, .dm-correl-empty, .dm-correl-meta, .dm-chip-correl-fail

G. DEPENDENCY MAP (v2: classic scripts, ayos ng <script defer> sa index.html ang mahalaga)
index.html -> config.js -> registry.js -> security.js -> storage.js -> router.js -> js/templates/*.js -> app.js
app.js -> security.js, router.js, registry.js (sidebar)
router.js -> registry.js (template) -> ensureScript -> js/pages/*.js (nagre-register sa registry)
master.js -> config, storage, csv-reader, master-analysis, chart-draw | master-analysis.js -> csv-reader | csv-reader.js, chart-draw.js -> config (v2.6; ayos sa index.html: storage, csv-reader, master-analysis, chart-draw, router)
settings.js -> config, security, storage | dashboard.js -> config, storage (lahat sa window.BMWW)

[v3] events-store.js -> config, security, storage | dashboard-events.js -> config, security, events-store | dashboard.js -> dashboardEvents.init | ayos sa index.html: ... storage.js, events-store.js ... (dashboard-events.js ay nilo-load ng router mula sa template)

[v4] index.html -> css/theme.css (huling CSS) at js/core/effects.js (pagkatapos ng router.js, bago ang templates at app.js) | effects.js -> config (REDUCED_MOTION_QUERY, SELECTOR.sidebar)
[v5.1] queue.js -> config, security, storage (toMachineFileName, loadHandle, hasPermission, isFolderAccessSupported) | ayos sa index.html: ... events-store.js, queue.js ... | walang tumatawag pa (1C monitor, 1D Dashboard)
[v5.2] monitor.js -> config, security, storage, queue, csv | app.js -> monitor.start(false) | ayos sa index.html: ... queue.js, csv-reader.js, master-analysis.js, chart-draw.js, monitor.js, router.js ... app.js
[v6] dashboard-machines.js -> dashboard-machines-config, config, storage, queue, monitor | dashboard.js -> dashboardMachines.init | dashboard.template.js at pages/dashboard.html ang naglo-load ng dashboard-machines-config.js at dashboard-machines.js (kaya walang binago sa index.html)
[v7] compare-sync.js -> config, compareConfig, security, storage, queue (findServerHandle) | master-compare-ui.js -> compareSync, masterCompare.detectWorst | dashboard-machines.js -> compareSync.readCompareList | ayos: master-compare-config.js, compare-sync.js ay dapat bago ang master-compare-ui.js (Master page) at bago ang dashboard-machines-config.js (Dashboard); hindi nagbago ang index.html
[v3.5] master.js -> compareUi (init, refresh) | master-compare-ui.js -> config, storage, csv-reader, chart-draw, master-compare, master-compare-export, master-compare-config, master-export-config | master-compare.js -> csv-reader, master-analysis (analyzeLatest, classifyDeviation, findWorstSlider), master-compare-config | master-compare-export.js -> config, master-export-config, master-compare-config, xlsx-writer, csv-reader | ayos sa pages/master.html at template: ... correl-export.js, master-compare-config.js, master-compare.js, master-compare-export.js, master-compare-ui.js, pages/master.js (walang binago sa index.html)
[v7.3] correl-sync.js -> config (MASTER.STATUS, MACHINE_MODE, QUEUE), correlSyncConfig, security (sanitizeInput), storage (toMachineFileName), queue (findServerHandle) | master.js -> correlSync.publishStatus, correlSyncConfig | dashboard-machines.js -> correlSync.readCorrelList, correlSyncConfig | ayos: correl-sync-config.js at correl-sync.js ay dapat bago ang master.js (Master page) at bago ang dashboard-machines-config.js (Dashboard); hindi nagbago ang index.html

PAGE CONTRACTS
PAGE: dashboard | INPUT: localStorage "bmww.settings" | OUTPUT: pangalan, folder, huling save
[v6] PAGE: dashboard (machine view) | INPUT: localStorage "bmww.settings" (machineMode, machineName); LEAD PC: <Server path>\queue at \settings via queue.loadSnapshot; machine: monitor.getState | OUTPUT: role badge (#dm-role), tile ng LEAD PC at mga machine (#dm-pinned, #dm-grid), chips (#dm-summary), mensahe (#dm-message) | HTML ID: dm-section, dm-title, dm-updated, dm-summary, dm-pinned, dm-grid, dm-message, dm-grant, dm-role | DEPENDS: dashboardMachinesConfig, storage.readLocalSettings, queue.loadSnapshot, monitor.getState, monitor.start
[v7] PAGE: dashboard dagdag (worst slider ng machine) | INPUT: <Server path>\compare\*.json via compareSync.readCompareList | OUTPUT: .dm-alert sa tile (WORST SLIDER, actual at master previous/today, listahan ng slider), chip Worst slider, alert tile ang nauuna | DEPENDS: compareSync.readCompareList, compareConfig (TREND_SYMBOL, TREND_TEXT)
  HTML ID: dash-machine, dash-mode, dash-root, dash-source, dash-saved | DEPENDS: readLocalSettings
PAGE: calibration | INPUT: wala pa | OUTPUT: placeholder (wala pang laman) | HTML ID: wala | DEPENDS: registry.registerPage [v2.3] [LUMA v9.0: tingnan ang PAGE: calibration [v9.0] sa dulo]
PAGE: master [v2.6, v2.10: #range-export; Range Master = Master Repeatability] | INPUT: Data source 1 (folder handle sa IndexedDB, full path sa localStorage 'bmww.settings'), CSV sa folder, #range-start, #range-end | OUTPUT: status, stats, table, chart (hindi sine-save)
  HTML ID: [v2.10] range-export, [v2.12] range-mode (radio: all / shift), master-source, latest-start, latest-end, latest-run, latest-status, latest-result, range-start, range-end, range-run, range-status, range-result | DEPENDS: storage.loadHandle, hasPermission, readLocalSettings, csv.*, masterAnalysis.*, chart.*, masterExport.* [v2.10: OUTPUT din: .xlsx sa <Saving path>\master-repeatability]
  [v3.5] PAGE: master dagdag (Compare vs previous) | INPUT: huling resulta ng Master Correl (lastLatestRun) at Data source 1 | OUTPUT: table at chart ng previous vs today, .xlsx sa <Saving path>\master-compare | HTML ID: compare-run, compare-export, compare-status, compare-result | DEPENDS: masterCompare.*, compareExport.*, compareUi.*, storage.loadHandle, hasPermission
  [v7] PAGE: master dagdag | INPUT: lastLatestRun (kusa), worst slider (masterCompare.detectWorst) | OUTPUT: banner, table ng worst slider, buod, table na may filter, chart, linya ng sync, .xlsx, at <Server path>\compare\<machine name>.json | HTML ID: (walang bago) compare-run, compare-export, compare-status, compare-result | DEPENDS: masterCompare.*, compareSync.buildPayload/sendStatus, compareExport.*, storage.readLocalSettings
  [v7.1] PAGE: master | Compare sliders ay hiwalay na card | INPUT: lastLatestRun (kapag pinindot lang ang Compare vs previous) | OUTPUT: banner ng worst slider, table, chart, .xlsx | HTML ID: compare-run, compare-export, compare-status, compare-result (wala na sa loob ng Latest Master card; latest-result ay para sa Master Correl lang)
  [v7.3] PAGE: master dagdag | INPUT: resulta ng Master Correl (status, R Square) | OUTPUT: <Server path>\correl\<machine name>.json at mensahe sa #latest-status (LEAD PC: na-update ang Master Correl ...) | DEPENDS: correlSync.publishStatus
  [v7.3] PAGE: dashboard dagdag (LEAD PC) | INPUT: <Server path>\correl\*.json | OUTPUT: badge ng MASTER CORREL (PASS / WARNING / FAIL) sa bawat tile, chip na Correl fail | HTML ID: walang bago (#dm-grid, #dm-summary) | DEPENDS: correlSync.readCorrelList
PAGE: settings | INPUT: radio, #machine-name, folder picker, full path input (type/paste, [v2.4]), settings.json | OUTPUT: settings.json sa BMWW\settings, localStorage [v5 dagdag] OUTPUT: <Saving path>\settings\<machine name>.json at <Server path>\settings\<machine name>.json | DEPENDS dagdag: storage.toMachineFileName, writeMachineSettings, removeMachineSettings, readMachineSettings
  HTML ID: machine-note, machine-name, path-list, save-settings, settings-status (ang row ng bawat path ay gawa ng JS mula sa CONFIG.PATH_LIST)
  DEPENDS: sanitizeInput, pickFolder, hasPermission, saveHandle, loadHandle, writeSettingsFile, readSettingsFile
PAGE: lot-tracking [v2.5] | INPUT: Barcode, Operator, machineName (Settings), folder handle ng Data source 1-3 | OUTPUT: Start/End Date at Time, badge, talaan ng bagong file/folder (walang sine-save)
  HTML ID: lot-badge, lot-machine, lot-barcode, lot-operator, lot-start-date, lot-start-time, lot-end-date, lot-end-time, lot-new, lot-status, lot-result-note, lot-result-body (nasa CONFIG.LOT.SELECTOR)
  DEPENDS: sanitizeInput, readLocalSettings, isFolderAccessSupported, loadHandle, hasPermission

PAGE: dashboard [v3 dagdag] | INPUT: localStorage "bmww.events", <BMWW>\settings\events.json, oras ng PC, form (title, petsa, oras, note) | OUTPUT: orasan, kalendaryo, listahan ng events, sine-save sa localStorage at events.json
  HTML ID: dash-clock-time, dash-clock-date, cal-prev, cal-next, cal-today, cal-title, cal-weekdays, cal-grid, ev-selected-label, ev-list, ev-add, ev-form, ev-form-title, ev-title, ev-date, ev-time, ev-note, ev-save, ev-cancel, ev-form-status, ev-message, ev-status, ev-grant | DEPENDS: eventsStore.loadEvents, saveEvents, sortEvents, createId, isValidDateText, isValidTimeText, security.sanitizeInput

=== KNOWN ISSUES / TODO ===
[v3.5] COMPARE VS PREVIOUS: previous = pinakabagong master record BAGO ang napiling Date sa loob ng 7 araw (CompareConfig.LOOKBACK_DAYS). Kapag walang record kahapon (weekend, holiday), ang naunang araw na may record ang gagamitin at may paalala sa screen.
  KNOWN ISSUE: lumalala = tumaas ang diff nang 0.3 o higit, o bumaba ang level (green, yellow, red). Dahil sa level, puwedeng lumabas na lumalala kahit maliit ang pagbabago (hal. 1.49 -> 1.51). Nasa WORSEN_MIN ang 0.3; puwedeng palitan.
  KNOWN ISSUE: pinagtutugma ang slider ayon sa pangalan ng barcode. Kapag nagbago ang barcode ng slider, lalabas na 'Walang previous'. Ang diff ay laban sa master ng bawat record (puwedeng iba ang master ng dalawang araw).
  KNOWN ISSUE: gumagamit ng analyzeLatest: sinusuri lang ang pinakabagong 60 file (MAX_FILES) at ang unang file na may record sa saklaw ang gagamitin. Hindi inuulit ang pagbasa kapag pinindot ulit ang Compare.
  KNOWN ISSUE: ang resulta ng Compare ay naaalala lang habang bukas ang website (hindi na-save sa file maliban kung Export). Walang Open latest compare file na button pa.
  KNOWN ISSUE: hindi pa nasubukan sa totoong browser at totoong CSV; jsdom test lang (gawa-gawang CSV, 24 check) at LibreOffice (nabuksan ang .xlsx at lumabas ang chart). Hindi pa nasubukan sa tunay na Microsoft Excel.
2026-11-21 | [v2.13] Chart sa Excel: nasa sheet na Readings, sa kanan ng table (lampas ng huling barcode column). Huling 150 na record lang ang linya (kapareho ng screen); kumpleto ang table. Ang kulay ng linya ay umiikot kada record (8 kulay), hindi kada file.
2026-11-21 | [v2.13] Chart sa Excel: nasubukan sa LibreOffice at openpyxl lang (nabasa ang chart); hindi pa nasubukan sa tunay na Microsoft Excel. Sabihin kung hindi lumabas ang chart o may babala sa pagbukas.
2026-11-21 | [v2.12] Shift: ang record na labas sa Morning (7:30 AM-6:30 PM) at Night (7:30 PM-6:30 AM), hal. 6:31-7:29 AM at 6:31-7:29 PM, ay hindi isinasama sa Latest per shift. Ang record na 12:00 AM-6:30 AM ay kabilang sa Night ng nakaraang petsa.
2026-11-21 | [v2.12] Latest per shift: ang buod, table, chart at Excel ay gumagamit lang ng napiling record. Ang MASTER ay ang pinakabagong master record ng buong range. Hindi nag-uupdate ang resulta kapag pinalitan ang radio; pindutin ulit ang Master Repeatability.
2026-11-21 | [v2.12] Hindi pa nasubukan sa tunay na browser at CSV; jsdom at unit test lang (7:29, 7:30, 18:30, 18:31, 19:29, 19:30, 6:30, 6:31).
2026-11-20 | [v2.8] Hindi pa nasubukan sa tunay na browser at tunay na CSV; jsdom test lang (3 gawa-gawang file: uncheck/re-check, kulay, Run ulit).
2026-11-20 | [v2.8] Kada FILE ang checkbox (maraming linya/record ang isang file; sabay silang nawawala). Kung gusto mo kada record (petsa) ang checkbox, sabihin.
2026-11-20 | [v2.8] Mahigit 8 file: umuulit ang kulay (8 ang PALETTE_SIZE). Kapag may na-uncheck, nagre-rescale ang y-axis ayon sa natitirang linya. Ang MASTER ay laging nakikita (walang checkbox).
2026-11-20 | [v2.10] Hindi pa nasubukan sa tunay na browser; jsdom at LibreOffice/openpyxl test lang (valid ang .xlsx). Unang test ay sa device ng user (Chrome/Edge).
2026-11-20 | [v2.10] Export: kailangang naka-set ang Saving path (BMWW) sa Settings at payagan ang access. [v2.11] Isang subfolder lang ('master-repeatability'); sa loob nito ay folder na petsa ng export (yyyy-mm-dd). Bagong file kada export (may oras sa pangalan, walang overwrite).
2026-11-20 | [v2.10] Legend ng petsa (sa ilalim ng chart, may scroll) ay petsa ng mga napiling file; kulay kada FILE (8 lang ang umiikot), kaya ang mga petsa ng iisang file ay iisa ang kulay. Chart ay huling 150 na record lang; ang Excel (sheet Readings) ay kumpleto.
2026-11-20 | [v2.10] Para hindi galawin ang config.js, chart-draw.js, index.html: constants ay nasa master-export-config.js at ang legend ay nasa master.js. Puwedeng ilipat kapag pinayagan.
2026-11-20 | [v2.7] Ang kulay ay para sa bawat reading (point sa scatter, dot sa line chart, cell sa table). Ang 1.6 hanggang 2.5 ay yellow; ang pagitan ng 1.5 at 1.6 (hal. 1.55) ay yellow rin. Nasa CONFIG.MASTER.DEVIATION ang limitasyon.
2026-11-20 | [v2.7] Hindi pa nakita sa tunay na screen ang laki ng chart (jsdom lang); sabihin kung kulang pa ang zoom out.
2026-11-20 | [v2.6] Hindi pa nasubukan sa tunay na CSV at browser; jsdom test lang gamit ang gawa-gawang CSV. Ang column ay galing sa Excel macro (F:T actual, DA:DO master, U at DQ average, row 4 barcode, row 2 header = 15).
2026-11-20 | [v2.6] Date filter ay last modified ng file (hindi created date ng Excel); hindi nababasa ng browser ang created date.
2026-11-20 | [v2.6] Latest Master: sinusuri mula pinakabago hanggang MAX_FILES (60) na file; ang unang master file na may record ngayong araw ang gagamitin (ang Excel ay isang file lang, ang pinakabago).
2026-11-20 | [v2.6] Binabasa lang ang CSV sa mismong Data source 1 folder (walang subfolder). Comma ang delimiter.
2026-11-20 | [v2.6] Range Master: table ay buod kada barcode (hindi buong matrix ng Excel); ang chart ay huling 150 na record lang.
2026-11-20 | [v2.6] Latest Calibration at Range Calibration (Calibration page) ay hindi pa ginagawa. [AYOS v9.0: Calibration correl (Latest) ay ginawa na; ang Range Calibration ay hindi pa]
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
2026-11-20 | Calibration at Master ay placeholder lang; hinihintay ang laman na gusto ng user. [AYOS v9.0: may laman na ang Calibration (Calibration correl)]
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
2026-11-20 | [v5] Dalawang PC na pareho ang machine name ay magpapatungan ng file sa server (isang file kada pangalan). Kailangang magkaiba ang machine name.
2026-11-20 | [v5] Kapag nagpalit ng machine name, binubura ang lumang <pangalan>.json sa Saving path at Server path. Hindi binubura ang lumang settings.json at events.json.
2026-11-20 | [v5] Kapag pumalya ang Server path (sarado ang server o walang permission), naka-save pa rin sa Saving path; error ang ipinapakita at kailangang i-save ulit.
2026-11-20 | [v5] Ang LEAD PC view, queue folder at monitor ng Data source 1, 2, 3 ay hindi pa ginagawa (Task 1B, 1C, 1D). [AYOS v6: 1D tapos, may LEAD PC view sa Dashboard]
2026-11-20 | [v5] Hindi pa nasubukan sa totoong Chrome/Edge at totoong server ng gumawa; jsdom at fake folder handle lang (26 test). Ang unang test ay sa device mo.
2026-11-20 | [v5] Ang settings ng lumang bersyon (settings.json) ay nababasa pa; sa unang Save ay gagawa na ng <machine name>.json.
2026-11-21 | [v5.1] Ang queue ay data lang; wala pang monitor na nagsusulat at wala pang Dashboard na nagpapakita (1C at 1D). [AYOS v6: nagpapakita na ang Dashboard]
2026-11-21 | [v5.1] Ang stale/active ay batay sa oras ng file sa server kumpara sa orasan ng nagbabasang PC. Kapag may malaking pagkakaiba ang orasan ng PC at server, maaaring mali ang stale. Itama ang oras ng mga PC.
2026-11-21 | [v5.1] Kapag pumalya ang server, state 'error' ang ibinibigay (hindi '0 machine'), para hindi mapagkamalang walang machine.
2026-11-21 | [v5.1] Ang queue file ng machine na binura ang settings (o nagpalit ng pangalan) ay mananatili hanggang burahin; lalabas itong registered: false. Maaaring burahin gamit ang removeQueueStatus (UI sa 1D).
2026-11-21 | [v5.1] Hindi pa nasubukan sa totoong Chrome/Edge at totoong server; jsdom at fake folder handle lang (42 test sa queue, 26 sa settings). Ang unang test ay sa device mo.
2026-11-21 | [v5.2] ASSUMPTION: Data source 2 = Online, Data source 3 = Offline (CONFIG.MONITOR.SOURCE_MODE; palitan doon kung baligtad). Data source 1 = Calibration/Master ayon sa header count ng pinakabagong CSV (15 = Master, tulad ng Master page).
2026-11-21 | [v5.2] ASSUMPTION: ONGOING = may nagbago sa folder (oras o laki ng file, bagong folder, may nabura); DONE = may bagong file (source 2 at 3 lang). Ang source 1 ay walang DONE, babalik sa idle pagkatapos ng 5 minutong walang pagbabago.
2026-11-21 | [v5.2] Hindi mababasa ng browser ang 'date modified' ng mismong folder; ang oras at laki ng mga file sa loob (hanggang 5 antas) ang tinitingnan. Kapag ang instrument ay nagbabago lang ng date modified ng folder nang walang nabago sa loob, hindi ito makikita.
2026-11-21 | [v5.2] ASSUMPTION: ang timeout ng ONGOING (5 min sa source 1, 30 min sa source 2 at 3) ay tantiya ko lang; hindi mo pa nakumpirma. Kapag ang pagsukat ay mas matagal na walang pagbabago sa folder, magiging idle ito nang maaga.
2026-11-21 | [v5.2] Ang bagong file na kasusulat pa lang ay binabalewala ang pagbabago sa loob ng 30 segundo (SETTLE_MS) para hindi bumalik sa ONGOING.
2026-11-21 | [v5.2] Blangko pa ang Barcode sa queue: ang Barcode ng LOT Tracking ay nasa memory ng lot-tracking.js lang. Kailangan ng permission para galawin ang lot-tracking.js at ilabas ito.
2026-11-21 | [v5.2] Kailangang nakabukas ang BMWW page sa not-LEAD PC para gumana ang monitor; kapag nakasara, walang update (magiging stale sa LEAD PC). Ang mga pagbabago habang nakasara ay hindi na makikita pagbukas ulit (baseline ang unang scan).
2026-11-21 | [v5.2] Pagkatapos magsara ng browser, maaaring humingi ulit ng permission ang Chrome/Edge; walang kusang prompt. Pindutin ang Save sa Settings para ma-allow ulit (ang button na Payagan ay sa 1D).
2026-11-21 | [v5.2] Ang DONE ay nananatili hanggang may susunod na pagbabago (o hanggang mag-restart ang page). Ang scan ng malalaking folder kada 5 segundo sa network drive ay maaaring mabigat; hanggang 5000 entry lang ang binabasa kada source.
2026-11-21 | [v5.2] Hindi pa nasubukan sa totoong Chrome/Edge, totoong instrument at totoong server; jsdom at fake folder handle lang (30 test sa monitor). Ang unang test ay sa device mo.
2026-11-21 | [v6] Hindi pa nasubukan sa totoong Chrome/Edge, totoong server at maraming machine; jsdom at fake queue/monitor lang. Ang unang test ay sa device mo.
2026-11-21 | [v6] ASSUMPTION: ang LEAD PC ay ang machineMode "lead-pc" sa Settings; ang SENDER ay "user-input" na may machine name. Kung iba ang gusto mong tawag o kulay ng badge, nasa js/core/dashboard-machines-config.js (ROLE, LABEL).
2026-11-21 | [v6] Ang tile ng machine na naka-register pero walang queue file ay NO STATUS (hindi pa nagpapadala); ang lampas 2 minutong walang update (CONFIG.QUEUE.STALE_MS) ay STALE.
2026-11-21 | [v6] Hindi pa ginagamit ng UI ang removeQueueStatus (button na burahin ang lumang machine na HINDI NAKA-REGISTER). TODO kung kailangan.
2026-11-21 | [v6] Ang Barcode ay wala pa sa tile (blangko pa sa queue; tingnan ang v5.2 issue).
2026-11-21 | [v7] ASSUMPTION: "na-detect ang worst slider" = ang slider na may pinakamalaking |actual - master| ay yellow o red (diff higit sa 1.5). Kapag green lahat, walang compare. Palitan sa CompareConfig.DETECT.MIN_LEVEL (js/core/master-compare-config.js).
2026-11-21 | [LUMA v7.1: hindi na kusa; pindutin ang Compare vs previous sa card na Compare sliders] [v7] Kusang tumatakbo ang Compare pagkatapos ng Run Latest Master (Correl). Kapag Run Range lang ang pinindot, walang compare. Ang button na Compare vs previous ay bukas lang kapag may worst slider.
2026-11-21 | [v7] Ang file sa <Server path>\compare\<machine name>.json ay sinusulat lang ng machine (hindi ng LEAD PC). Kapag nag-Run Latest Master ulit at green na lahat, sinusulat ang detected: false para mabura ang alert sa LEAD PC.
2026-11-21 | [v7] Ang alert sa LEAD PC ay mananatili hanggang mag-Run Latest Master ulit ang machine. Pagkalipas ng 24 oras (DashboardMachinesConfig.COMPARE.STALE_MS) may tag na LUMA.
2026-11-21 | [LUMA v7.1: hindi na awtomatiko] [v7] Awtomatikong sulat ay walang hinihinging permission (walang click). Kung walang permission sa Server folder, lalabas ang "LEAD PC: hindi na-update" at pindutin ang Compare vs previous para makahingi ng permission.
2026-11-21 | [v7] Ang table ay default na "kailangang tingnan" lang (hindi green o lumalala). Ang lahat ng slider ay nasa checkbox at sa Excel. Ang chart ay lahat ng slider.
2026-11-21 | [v7] Hindi pa nasubukan sa totoong Chrome/Edge at totoong server; jsdom at fake folder handle lang (5 scenario sa Master, 1 sa Dashboard). Ang unang test ay sa device mo.
2026-11-21 | [v7] Hindi pa ginawa: slider na NEW o MISSING (nasa previous pero wala na ngayon), signed diff (direksyon), at compare vs ilang naunang record.
2026-11-21 | [v7.1] ASSUMPTION: "i-separate sa Master Correl" = hiwalay na card na Compare sliders at walang kusang compare. Ang Worst slider ay inalis sa stat list ng Master Correl screen; nasa Excel ng Correl pa rin (correl-export.js, hindi ginalaw).
2026-11-21 | [v7.1] BAGONG LIMITASYON: dahil hindi na kusa ang compare, ang sulat ng <Server path>\compare\<machine name>.json (alert sa LEAD PC) ay nangyayari na lang kapag pinindot ang Compare vs previous. Kapag hindi pinindot pagkatapos ng Master Correl, walang bagong alert sa LEAD PC. Ibalik ang dating kusa: CompareConfig.AUTO_RUN = true (js/core/master-compare-config.js).
2026-11-21 | [v7.1] Ang Compare vs previous ay bukas na kapag may Master Correl run (dati ay kapag may worst slider lang). Kapag green lahat: lalabas ang "Walang worst slider na na-detect".
2026-11-21 | [v7.1] Nasubukan sa jsdom (17 check: card, walang kusang compare, click, green lahat, bagong run). Hindi pa sa totoong Chrome/Edge at totoong folder. Ang unang test ay sa device mo.
2026-11-21 | [v7.2] ASSUMPTION: "idagdag ang server path" = kopya ng Excel ng Master Correl sa Server path, sa subfolder master-correl at sa loob ng folder ng machine (para hindi magbanggaan ang maraming machine). Hindi ko ginalaw ang Export compare to Excel (master-compare) at ang Export ng Master Repeatability; Saving path pa rin ang mga iyon.
2026-11-21 | [v7.2] Kapag pumalya ang Server (walang Server path sa Settings, walang permission, o sarado ang server), naka-save pa rin sa Saving path; pula ang mensahe at nakasulat kung bakit. Walang awtomatikong ulit; mag-export ulit para subukan ang Server.
2026-11-21 | [v7.2] Humihingi ng permission sa Server folder ang browser sa pindot ng Export to Excel (kapag hindi pa naka-allow). Ang LEAD PC ay kumokopya rin sa Server path kung may machine name; kapag walang machine name, ang folder ay no-machine-name.
2026-11-21 | [v7.2] Ang Open latest correl file ay nagbubukas pa rin ng folder sa Saving path (hindi sa Server). Ang bawal na character sa machine name (< > : " / \ | ? *) ay pinapalitan ng _ sa pangalan ng folder.
2026-11-21 | [v7.2] Nasubukan sa jsdom na may gawa-gawang folder handle (4 scenario: OK, walang Server path, pumalya ang Server, machine name na may bawal na character). Hindi pa sa totoong Chrome/Edge at totoong network drive. Ang unang test ay sa device mo.
2026-11-21 | [v7.3] ASSUMPTION: "pass or fail" sa LEAD PC = ang status ng Master Correl (R Square: PASS >= 0.99, FAIL < 0.97, WARNING sa pagitan; MASTER.LATEST sa config.js). May tatlong status, hindi dalawa; ipinapakita ang WARNING nang hiwalay (amber).
2026-11-21 | [v7.3] Kusang ipinapadala ang status pagkatapos ng Master Correl (walang pindot na dagdag; ang pindot sa Master Correl ang nagbibigay ng permission sa Server folder). Ang Export to Excel ay hindi kailangan.
2026-11-21 | [v7.3] Ang status ay mananatili hanggang mag-Master Correl ulit ang machine. Pagkalipas ng 24 oras (CorrelSyncConfig.STALE_MS) may tag na LUMA. Ang FAIL na luma ay bilang pa rin sa chip na Correl fail.
2026-11-21 | [v7.3] Ang LEAD PC ay hindi sumusulat ng sariling status. Ang tile ng machine na walang file sa correl ay "Wala pang resulta". Ang pagpapadala ng worst slider (compare) ay hiwalay pa rin at nangyayari lang kapag pinindot ang Compare vs previous (v7.1).
2026-11-21 | [v7.3] Nasubukan sa jsdom na may gawa-gawang folder (machine: FAIL, PASS, LEAD PC, walang name, walang Server path, pumalyang Server; LEAD PC Dashboard: 4 tile, FAIL nauuna, badge, LUMA, chip). Hindi pa sa totoong Chrome/Edge at totoong server. Ang unang test ay sa device mo.

=== [v2.8] SEARCH FILES ===
FILES: pages/file-search.html (+ kopya js/templates/file-search.template.js) | css/pages/file-search.css | js/pages/file-search.js | js/core/file-scanner.js | js/core/file-sender.js
SOURCE: CLO1A = Data source 2, CLO1A1 = Data source 3 ng Settings (CONFIG.FILE_SEARCH.SOURCE_LIST). Basa lang; subfolder hanggang MAX_DEPTH (6).
SEARCH: SEARCH FILE NAME (naglalaman ng salita, o wildcard * ?) | SEARCH DATE (Start/End, lastModified) | GET LATEST FILES (ngayon at kahapon; kasama ang bagong folder)
RESULT: FILES FOUND : n, table na may scroll (sticky header), checkbox kada file, Status (PENDING/SENT/EXISTS/FAILED). Limit: MAX_RESULTS 5000, MAX_SCANNED 200000.
SEND TO: (1) Path = Server path ng Settings (2) User manual input = i-type ang path at Choose folder. Kopya lang. [v2.9] Kung may kapangalan na sa destination: tanong (OK = REPLACED, Cancel = EXISTS, hindi pinalitan). Dalawang napiling file na magkapareho ang pangalan: ang una lang ang kokopyahin. Hindi puwedeng ipadala sa loob ng CLO1A/CLO1A1.
FUNCTIONS: fileScanner.createControl/getLatestStartMs/getRangeMs/buildNameMatcher/scanSources | fileSender.isInsideSource/ensureWriteAccess/sendItems | file-search.js: buildSourceRows, prepareSources, runSearch, onSearchName/onSearchDate/onGetLatest/onStop/onClear, renderResults, onSend, onPickManual, validateManual, init
CONFIG: CONFIG.FILE_SEARCH (SOURCE_LIST, SERVER_KEY, MAX_DEPTH, MAX_RESULTS, MAX_SCANNED, LATEST_DAYS, RANGE_DEFAULT_DAYS, STATUS, SELECTOR, TEXT) | PAGE_LIST may 'file-search'
KNOWN ISSUES [v2.8]:
- Hindi nababasa ng browser ang created date; lastModified ang gamit. Ang folder ay may petsa ng pinakabagong file sa loob.
- Ang manual path na tina-type ay hindi nagagamit ng browser para magsulat; ang Choose folder ang tunay na destination. Sinusuri lang kung tugma ang dulo ng path.
- Ang Send ay kopya sa mismong destination folder (walang subfolder structure).
- Unang test sa tunay na Chrome/Edge ng user; ang automated test ay gumamit ng gawa-gawang folder (OPFS).

[v2.9] SEND LOG: <Saving path>\logs\send-log.txt, dagdag lang sa dulo (UTF-8, CRLF). Linya: [yyyy-mm-dd hh:mm:ss] | machine | status | file | galing | destination. Kasama ang SENT, REPLACED, EXISTS, FAILED; ang hindi naproseso (PENDING, kapag Stop) ay hindi nilalagay. Kapag walang Saving path o permission, tuloy pa rin ang pagpapadala at may mensaheng hindi na-log.
[v2.9] ALAALA NG MANUAL DESTINATION: path text sa localStorage 'bmww.fileSearch' (manualPath); folder handle sa IndexedDB key 'fileSearchManualFolder'. Kailangang payagan ulit ang folder (Allow) sa unang Send pagkabukas ng browser.
[v2.9] FUNCTIONS: fileSender.countExisting, sendItems(items, dest, control, overwrite, onItem) | sendLog.appendLog(rootHandle, machine, items, destination), getLogLocation | file-search.js: rememberManual, restoreManual, getDestinationLabel, prepareLogHandle, writeSendLog
[v2.9] KNOWN ISSUE: ang log ay nasa Saving path ng PC na iyon (hindi sa Server). Ang Cancel sa tanong ay laktawan lang ang kapangalan, hindi ihihinto ang pagpapadala ng iba.

[v3.0] PREVIEW: may Preview button kada file sa Result (hindi sa folder). Bubukas ang dialog; basa lang ang file.
  - CSV: table ng unang 200 row at 40 column (CONFIG.FILE_SEARCH.PREVIEW.MAX_ROWS / MAX_COLUMNS)
  - TEXT (txt, log, json, xml, ini, cfg, md, bat, js, html, css): unang 256 KB (MAX_BYTES)
  - LARAWAN (png, jpg, gif, bmp, webp, hanggang 20 MB) at PDF (hanggang 30 MB): ipinapakita nang buo
  - Iba pang uri (hal. .xlsx, .dat, .zip): "Walang preview para sa ganitong uri"; may NUL byte ang text: "hindi text file"
  FUNCTIONS: file-search.js: getExtension, getPreviewKind, resetPreviewBody, showPreviewMessage, setPreviewMeta, readPreviewText, buildCsvTable, openPreview, closePreview
  KNOWN ISSUE: ang unang 256 KB lang ng malaking CSV ang nababasa; ang putol na huling row ay hindi ipinapakita. Ang PDF preview ay depende sa PDF viewer ng Chrome/Edge.

[v3.1] TOOLS/FILE-WATCHER (hiwalay sa website; PowerShell sa Windows): watch-new-files.ps1, watcher-config.txt, install-watcher.bat/.ps1, uninstall-watcher.bat/.ps1, run-watcher-visible.bat, README-WATCHER.txt. Basahin ang README-WATCHER.txt.
  KNOWN ISSUE: hindi pa nasubukan sa Windows. Kailangan pa ring pindutin ang Allow sa folder pagkabukas ng website.

[v3.2] SETTINGS > INSTALL FILE WATCHER: bukas lang ang card kapag may Saving path (BMWW) na. Pindutin ang Install File Watcher > lalabas ang babala > i-tick ang Naiintindihan ko > lalabas ang path ng tools\file-watcher (hango sa kinabuksan ng index.html) at ang hakbang. Walang pinapatakbo ang website. Binago: settings.js (2 tawag), settings.template.js at pages/settings.html (card, css, script).
  KNOWN ISSUE: kapag hindi file:// ang pagbukas ng website (http/server), hindi mahuhulaan ang path; relative na path lang ang ipapakita. Hindi pa nasubukan sa totoong Chrome/Edge (jsdom lang, 20 test).

[v3.3] PAANO I-UNINSTALL (Settings > File Watcher > Paano i-uninstall): ipinapakita ang path ng tools\file-watcher, i-double-click ang uninstall-watcher.bat, dapat lumabas ang "Natanggal ang shortcut sa Startup." at "TAPOS."; pagsusuri: Win + R > shell:startup (dapat wala na ang "BMWW File Watcher"). Manual: burahin ang shortcut sa shell:startup; titigil ang tumatakbo pagka-restart o sign out. Hindi binubura ang mga folder o file mo.
  KNOWN ISSUE: hindi pa nasubukan sa totoong Chrome/Edge at Windows (jsdom lang, 26 test). Ang uninstall-watcher.bat ay hindi pa napapatakbo sa Windows.

[v3.4] FILE WATCHER + DATA SOURCE 1: sa watcher-config.txt, ilagay ang full path ng Data source 1 sa ModifiedWatchPaths (blangko = hindi ginagamit), tapos patakbuhin ulit ang install-watcher.bat. Ang folder na ito ay binabantayan na parang CLO1A, pero kasama ang file na na-modify (na-save ulit): isang beses lang kada DebounceSeconds (5). Ang bagong file ay nagpapatahimik din sa kasunod na Changed. Bubukas pa rin ang website sa Page ng config (#file-search); cooldown at SkipIfOpen ay pareho.
  KNOWN ISSUE: nasubukan ang logic ng watcher sa PowerShell 7 sa Linux (bago, na-modify, debounce, temp/lock file, folder na hindi sakop). Hindi pa nasubukan sa Windows PowerShell 5.1 at totoong Data source 1, at sa network drive minsan hindi agad naipapadala ng Windows ang pagbabago ng file.

[v8.1] KNOWN ISSUES / TODO (2026-11-21): (a) Hindi pa nasubukan sa totoong Chrome/Edge (syntax check lang). (b) Ang kulay ng worst slider (Task 3) ay hindi pa nababago: hinihintay ang paliwanag kung alin ang hindi tugma. (c) Ang getExportMessage at compareExport sa master-compare-ui.js ay hindi na ginagamit; naiwan para hindi magalaw ang ibang bahagi. (d) Kung walang file sa Saving path\\master-correl\\<petsa ngayon>, walang ipinapadala ang Sender sa LEAD PC.
[v8.1] OVERVIEW: readLatestInSavingPath(rootHandle, machineName, dayName) | js/core/correl-excel-reader.js | ->Promise<{status,fileName,modifiedMs}|null> | Tinatawag ng rereadOwnCorrel (dashboard-machines.js) | Tumatawag ng readStatusFromFile
[v8.1] OVERVIEW: CORREL.AUTO.SKIP_SAME | js/core/correl-export-config.js | const boolean (false) | ginagamit ng autoExportCorrel (master.js)
[v8.1] [BINURA v8.1] onExport (master-compare-ui.js), button #compare-export
[v8.2] OVERVIEW: ownCorrel (let, dashboard-machines.js) | huling nabasang { status, fileName, modifiedMs } ng sariling machine o null | ginagamit ng renderSender; isOwnReading (let boolean) | iwas dobleng basa
[v8.5] OVERVIEW: autoExportCompare(current, shouldRequest) | master-compare-ui.js | ->Promise | tinatawag ng processRun | tumatawag ng compareExport.exportCompare, copyToServer
[v8.5] OVERVIEW: copyToServer(serverHandle, saved, machineName) | master-compare-export.js | ->Promise<{folderName,fileName}>
[v8.5] KNOWN ISSUES: walang Excel kapag green lahat (walang worst slider) o walang naunang record; hindi pa nasubukan sa browser (2026-11-21).
[v8.6] OVERVIEW: readLatestCompareInSavingPath(rootHandle, machineName, dayName) | correl-excel-reader.js | ->Promise<{status,fileName,modifiedMs}|null> | tinatawag ng readOwnCorrel; ownCompare (let) | dashboard-machines.js | huling nabasang compare ng sariling machine o null
[v8.6] KNOWN ISSUES: ang level (kulay) ng worst slider ay kinukuwenta ulit sa Dashboard mula sa Actual at Master sa Excel (classifyDeviation); kung walang Excel ng Compare ngayong araw, walang alert sa tile. Hindi pa nasubukan sa browser (2026-11-21).
[v8.7] OVERVIEW: handlePreviewClick(machineName) | dashboard-machines.js | binubuksan ang panel; closePreviewPanel() | isinasara ito; events: click (Isara, overlay), keydown Escape, hashchange | sa panel lang; previewOverlay, previewKeyHandler (let) | dashboard-machines.js
[v8.7] KNOWN ISSUES: ang setPreviewStatus at #dm-preview-status ay hindi na ginagamit ng Preview (naiwan); wala pang chart sa panel (table lang); hindi pa nasubukan sa browser (2026-11-21).
[v8.8] OVERVIEW FILES: js/core/preview-panel.js | iisang panel (popout) ng lahat ng Preview ng Dashboard | js/core/preview-chart.js | chart ng Preview (scatter ng Master Correl, line ng Compare) | css/pages/preview-panel.css | laki ng panel at style ng chart (naka-scope sa .dm-preview-panel)
[v8.8] OVERVIEW: previewPanel.open({ title, load, fill, explorer }) | js/core/preview-panel.js | ->Promise<void> | binubuksan ang panel, tinatawag ang load (async, { details } o { message }) at fill(body, details) | tinatawag ng handlePreviewClick, handleComparePreviewClick | tumatawag ng close
[v8.8] OVERVIEW: previewPanel.close() | js/core/preview-panel.js | isinasara ang panel at inaalis ang keydown at hashchange listener | tinatawag ng open, init (dashboard-machines.js), hashchange
[v8.8] OVERVIEW: previewPanel.buildStats(pairList) / buildTable(columnList, rowList, chartBox) | js/core/preview-panel.js | dl na buod / table; ang pagpindot o Enter sa row ay naghi-highlight sa point ng chart (chart.highlight) | tinatawag ng fillPreviewBody, fillCompareBody
[v8.8] OVERVIEW: computeTrend(xList, yList) | js/core/preview-chart.js | ->{ slope, intercept, rSquared } o null | trendline ng scatter | tinatawag ng buildCorrelChart
[v8.8] OVERVIEW: previewChart.buildCorrelChart(details, machineName) / buildCompareChart(details, machineName) | js/core/preview-chart.js | ->div.chart-box o null kung kulang ang point | tumatawag ng chart.drawScatter / chart.drawLines | tinatawag ng fillPreviewBody, fillCompareBody; createChartBox(), datePart(text) ay private
[v8.8] OVERVIEW: readCompareDetailsFromFile(file), readLatestCompareDetailsInSavingPath(rootHandle, machineName, dayName) | js/core/correl-excel-reader.js | ->{ fileName, modifiedMs, todayDate, previousDate, todayFile, previousFile, rSquaredToday, rSquaredPrevious, worst, sliderList } o null | binabasa ang Master Compare Excel sa <Saving path>\master-compare\<petsa ngayon> | tinatawag ng loadCompareDetails
[v8.8] OVERVIEW (dashboard-machines.js): buildCorrelTable(sliderList, chartBox) | fillPreviewBody(body, details, machineName) [binago: may chart] | handlePreviewClick(machineName) [binago: gumagamit ng previewPanel.open] | loadCompareDetails(machineName) | buildCompareTable(sliderList, chartBox) | fillCompareBody(body, details, machineName) | handleComparePreviewClick(machineName) | buildComparePreviewButton(machineName) | buildAlertBlock(compareItem, nowMs, previewMachineName) [dagdag na parameter; may Preview button kapag may machine name, Sender lang]
[v8.8] OVERVIEW: [BINURA v8.8] closePreviewPanel, buildPreviewTable, previewOverlay, previewKeyHandler (dashboard-machines.js; inilipat sa preview-panel.js)
[v8.8] OVERVIEW CONSTANTS: DM.PREVIEW_PANEL { CLOSE_KEY, SELECT_KEYS, SELECTED_CLASS, MIN_POINTS } | DM.TEXT.preview.panel { correlChartTitle, correlChartX, correlChartY, rowHint, compare { title, dateLength, seriesPrevious, seriesToday, chartTitle, stats, columns, noFileSender, noRoot } } | DM.TEXT.compare { preview, previewAria } (dashboard-machines-config.js)
[v8.8] OVERVIEW EVENTS: click / Enter / Space sa .dm-preview-row | preview-panel.js | highlight ng point sa chart; click sa Preview ng worst slider | dashboard-machines.js | handleComparePreviewClick
[v8.8] OVERVIEW DEPENDENCY MAP: dashboard.template.js -> preview-chart.js, preview-panel.js -> chart-draw.js (galing sa index.html); dashboard-machines.js -> previewPanel, previewChart, correlExcelReader
[v8.8] PAGE: dashboard | INPUT: Master Correl Excel (Saving path o Server path) at Master Compare Excel (Saving path, Sender lang) | OUTPUT: malaking Preview panel na may buod, chart at table (hindi sine-save) | HTML ID: #dm-preview-status (hindi na ginagamit) | DEPENDS: previewPanel, previewChart, correlExcelReader
[v8.8] KNOWN ISSUES / TODO (2026-11-21): (a) Hindi pa nasubukan sa totoong Chrome/Edge (jsdom at node test lang: chart, panel, highlight, at basa ng Compare Excel). (b) Preview ng worst slider ay sa sariling machine (Sender) lang; ang worst slider sa tile ng LEAD PC ay wala pang Preview (walang Compare Excel na binabasa sa Server path). (c) Ang level (kulay) sa Preview ng Compare ay kinukuwenta mula sa Actual at Master (masterAnalysis.classifyDeviation). (d) Ang setPreviewStatus at #dm-preview-status ay naiwan pa rin (hindi ginagamit). (e) Ang dashboard.html at dashboard.template.js ay kailangang magkapareho (naka-sync sa v8.8).
[v8.9] PAGE: dashboard | Preview (Master Correl at Worst slider) ay BAGONG TAB na ngayon, hindi na popup. INPUT: Master Correl Excel (Saving path o Server path) at Master Compare Excel (Saving path, Sender lang) | OUTPUT: bagong tab na may buod, chart (iginuhit mula sa data ng Excel) at laman ng sheet (grid na may letra ng column at numero ng row); hindi sine-save | DEPENDS: previewTab, previewChart, correlExcelReader
[v8.9] OVERVIEW FILES: js/core/preview-tab.js | Preview sa bagong tab (window.open sa click, Blob URL) | js/core/preview-tab-style.js | CSS ng pahina ng tab (string, root.previewTabStyle) | [BINURA v8.9] js/core/preview-panel.js at css/pages/preview-panel.css (popup)
[v8.9] OVERVIEW: previewTab.open({ title, load, buildPage, onBlocked }) | js/core/preview-tab.js | ->Promise<void> | binubuksan ang tab BAGO ang await (iwas popup blocker), loading message, tapos load -> buildDocument -> Blob URL -> tab.location.replace; revoke pagkalipas ng PREVIEW_TAB.REVOKE_MS | tinatawag ng handlePreviewClick, handleComparePreviewClick | tumatawag ng buildDocument, showMessage
[v8.9] OVERVIEW: previewTab.buildDocument(spec) | js/core/preview-tab.js | ->string (buong HTML) | ginagamit ang detached na dokumento (createHTMLDocument) at textContent, walang innerHTML o document.write | private: createElementIn, buildCard, buildSheet(doc, grid), showMessage(tab, title, message)
[v8.9] OVERVIEW: buildGrid(cellMap) | js/core/correl-excel-reader.js | ->{ columnList, rowList } | lahat ng cell ng sheet; nasa details.grid ng readDetailsFromFile at readCompareDetailsFromFile
[v8.9] OVERVIEW (dashboard-machines.js): buildCorrelPage(details, machineName), buildComparePage(details, machineName) -> spec ng tab | handlePreviewClick, handleComparePreviewClick [binago: previewTab.open] | [BINURA v8.9] fillPreviewBody, fillCompareBody, buildCorrelTable, buildCompareTable, handleExplorerClick, isPreviewBusy; ang setPreviewStatus ay ginagamit ulit (mensahe kapag hinarang ang tab)
[v8.9] OVERVIEW CONSTANTS: DM.PREVIEW_TAB { TARGET '_blank', BLANK_URL, REVOKE_MS 60000, MIN_POINTS 2, NUMBER_CLASS, LEVEL_BADGE } | DM.TEXT.preview.tab { loading, blocked, readAt, chartHeading, sheetHeading, sheetNote, rowHeader, noSheet, lang } | [BINURA v8.9] DM.PREVIEW_PANEL, panel.close/closeAria/loading/openExplorer/columns/digits/rowHint
[v8.9] OVERVIEW EVENTS: click sa Preview (Master Correl at worst slider) | dashboard-machines.js | binubuksan ang tab; ang pagpindot sa row at ang Esc ng popup ay [BINURA v8.9]
[v8.9] OVERVIEW DEPENDENCY MAP: dashboard.template.js -> preview-chart.js, preview-tab-style.js, preview-tab.js -> chart-draw.js (galing sa index.html); dashboard-machines.js -> previewTab, previewChart, correlExcelReader
[v8.9] KNOWN ISSUES / TODO (2026-11-21): (a) Hindi pa nasubukan sa totoong Chrome/Edge (jsdom at node test lang). Kailangang i-allow ang pop-ups para sa site; kung hinarang, may mensahe sa Dashboard. (b) Ang tab ay Blob URL; hindi nito nakikita ang mga susunod na pagbabago ng Excel (pindutin ulit ang Preview para sa bago). Ang tab ay hindi dapat i-bookmark. (c) Ang chart ay iginuhit ulit ng website, hindi ang mismong chart object ng Excel. (d) Hanggang 400 row lang ang binabasa ng reader (CELL_ROW_LIMIT). (e) Naiwan ang mga lumang .dm-preview-* na rule sa css/pages/dashboard-machines.css (hindi na ginagamit; hindi ginalaw). (f) Ang Preview ng worst slider ay Sender lang; wala pa sa tile ng LEAD PC. (g) Nawala na ang button na Buksan sa File Explorer sa Preview; ang correl-preview.js ay naiwan at hindi na tinatawag ng Dashboard.
[v8.10] OVERVIEW: readLatestCompareDetailsForMachine(compareFolderHandle, machineName) | js/core/correl-excel-reader.js | ->Promise<details|null> | LEAD PC: pinakabagong Master Compare Excel ng machine sa <Server path>\master-compare\<machine>\<petsa> (case-insensitive ang pangalan ng folder) | tinatawag ng loadCompareDetails | tumatawag ng findMachineFolder, findLatestFileByPrefix, readCompareDetailsFromFile; findLatestFileByPrefix(machineHandle, prefix, extension) ay private
[v8.10] OVERVIEW (dashboard-machines.js): loadCompareDetails(machineName) [binago: LEAD PC branch, Server path] | buildAlertBlock(compareItem, nowMs, previewMachineName) ay ipinapasa na rin ang machineName ng tile sa LEAD PC (buildMachineTile)
[v8.10] OVERVIEW CONSTANTS: DM.TEXT.preview.panel.compare.noFileLead (dashboard-machines-config.js)
[v8.10] KNOWN ISSUES / TODO (2026-11-21): (a) Hindi pa nasubukan sa totoong Chrome/Edge at Server path. (b) Kailangang may file sa <Server path>\master-compare\<machine>\<petsa>\master-compare_latest.xlsx (kusang nagagawa kapag pinindot ang Compare vs previous ng machine at may Server path); kung wala, mensahe ang lalabas sa tab. (c) Ang Excel ng Compare ay galing sa huling Compare ng machine, kaya maaaring mas luma kaysa sa worst slider na nasa compare\<machine>.json. (d) Ang dating KNOWN ISSUE ng v8.9 (f) na walang Preview ang LEAD PC ay [AYOS v8.10].
[v8.11] OVERVIEW A. FILES: js/core/repeatability-sync-config.js | constants ng kusang export ng Repeatability at kopya sa Server (window.BMWW.repeatabilitySyncConfig) ; js/core/repeatability-sync.js | export sa Saving path + kopya sa Server path (window.BMWW.repeatabilitySync)
[v8.11] OVERVIEW B. FUNCTIONS (js/core/repeatability-sync.js): writeBlob(folderHandle, fileName, blob) | ->Promise | sulat ng Blob sa file, abort kapag pumalya | copyToServer ; findServer() | ->Promise<{handle,state}> | queue.findServerHandle(true), hindi nagtatapon | exportBoth ; copyToServer(serverFound, paths, result, sourceText, machineName) | ->Promise<{ok,path}|{ok:false,message}> | gumagawa ng <Server path>\master-repeatability\<machine>\<yyyy-mm-dd ngayon>\master-repeatability_latest.xlsx (overwrite); hindi nagtatapon | exportBoth ; exportBoth(result, machineName) | ->Promise<{message,kind}> | export sa Saving path (masterExport.exportRepeatability, may timestamp) tapos kopya sa Server; nagtatapon ng error na may code (unsupported, noRoot, noPermission, ...) kapag pumalya ang Saving path | onExport, autoExportRange (master.js)
[v8.11] OVERVIEW B. FUNCTIONS (js/pages/master.js): BAGONG getTodayDate() | ->Date (00:00 ngayon) | tinatawag sa init, onRunLatest, restoreSaved ; BAGONG autoExportRange() | ->Promise | kusang export pagkatapos ng onRunRange; hindi nawawala ang resulta kapag pumalya | onRunRange ; BINAGO onExport() | ngayon ay repeatabilitySync.exportBoth (Saving path + Server) ; BINAGO restoreSaved() | ang resulta ng Latest Master ay ibinabalik lang kung ngayon pa ang petsa, hindi na binabago ang laman ng #latest-date ; BINAGO init() | today ang Date ng Latest Master
[v8.11] [BINURA v8.11] master.js: onExportCorrel(), onOpenLatestCorrel(), getCorrelOpenButton(), getCorrelExportButton() | inalis kasama ang button na #latest-open at #latest-export. [LUMA] CORREL.SELECTOR (exportButton, openLatestButton) sa correl-export-config.js at CORREL.TEXT.openingLatest / openedLatest / error.noLatestCorrelFile / error.noResult ay hindi na ginagamit (iniwan; hindi ginalaw ang config). [LUMA] css/pages/master.css: ang rule na #latest-open ay wala nang tinatamaan.
[v8.11] OVERVIEW C. CONSTANTS: repeatabilitySyncConfig.AUTO.ENABLED (true; false = manual Export na lang) | repeatabilitySyncConfig.SERVER { SUBFOLDER 'master-repeatability', FILE_NAME 'master-repeatability_latest.xlsx' } | repeatabilitySyncConfig.TEXT { serverSaved, serverFailed, serverState{noFolder,noPermission,unsupported,error} } | REPEAT_SYNC (master.js, const) | shortcut sa root.repeatabilitySyncConfig
[v8.11] OVERVIEW D. EVENTS: [BINURA v8.11] click #latest-export, #latest-open (master.js) | click #range-export -> onExport (Saving path at Server) | walang bagong event
[v8.11] OVERVIEW E. STORAGE / API: <Server path>\master-repeatability\<machine name>\<yyyy-mm-dd ngayon>\master-repeatability_latest.xlsx | repeatability-sync.js | parehong laman ng Export ng Repeatability (sheet 'Repeatability' at 'Readings') | isang file kada petsa, ino-overwrite. Walang bagong localStorage key.
[v8.11] OVERVIEW G. DEPENDENCY MAP: master.js -> repeatabilitySync (exportBoth) ; repeatability-sync.js -> storage, queue.findServerHandle, csv-reader, masterExport (buildBlob, exportRepeatability), correlExport.getMachineFolderName, exportConfig, repeatabilitySyncConfig ; ayos sa pages/master.html at template: ... correl-export.js, repeatability-sync-config.js, repeatability-sync.js, ... (walang binago sa index.html)
[v8.11] PAGE CONTRACT: master | Latest Master: INPUT: Data source 1; Date = laging today (readonly, #latest-date) | OUTPUT: status, stats, table, chart; kusang Excel (Saving path at Server) | HTML ID: latest-date (readonly), latest-run, latest-status, latest-result (inalis: latest-open, latest-export) | Master Repeatability: OUTPUT dagdag: kusang Excel sa Saving path at kopya sa <Server path>\master-repeatability\<machine>\<petsa ngayon>\ | HTML ID: (walang bago) | DEPENDS: repeatabilitySync.exportBoth
[v8.11] KNOWN ISSUES / TODO (2026-11-21): (a) Hindi pa nasubukan sa totoong Chrome/Edge at totoong Server path (jsdom test lang: 5 page check at 6 export check, gawa-gawang folder handle). (b) Ang kusang export ay humihingi ng permission sa Saving path at Server path pagkatapos ng mahabang pagbasa ng CSV; kung hindi pinayagan ng browser (nawala na ang click), may pulang mensahe at nandiyan pa rin ang resulta sa screen. Pindutin ang Export to Excel para subukan ulit. (c) Ang Excel sa Saving path at sa Server ay magkahiwalay na ginawa, kaya puwedeng magkaiba ng ilang segundo ang 'Exported' na oras. (d) Isang file kada petsa sa Server: kapag nag-Run ng All data points tapos Latest per shift sa parehong araw, ang huli ang matitira. (e) Hindi pa binabasa ng Dashboard ng LEAD PC ang master-repeatability (Task 3 #3 at #4). (f) Ang #latest-date ay readonly lang sa HTML at ibinabalik sa today sa bawat click; walang bagong style para ipakitang readonly (kailangan ng permission sa css/pages/master.css). (g) Kapag bukas ang website lampas hatinggabi, ang resulta ng Latest Master ng nakaraang araw ay mabubura sa pagbalik sa Master page; today pa rin ang gagamitin sa susunod na Master Correl.
[v8.12] OVERVIEW A. FILES: js/core/repeatability-tile-config.js | constants ng tile at Preview ng Repeatability (window.BMWW.repeatabilityTileConfig) ; js/core/repeatability-reader.js | binabasa ang Repeatability Excel sa Server o Saving path (window.BMWW.repeatabilityReader) ; js/core/repeatability-tile.js | tile at Preview ng Repeatability sa Dashboard (window.BMWW.repeatabilityTile)
[v8.12] OVERVIEW B. FUNCTIONS (js/core/repeatability-reader.js): readZipEntries(view), readEntryText(view, entryMap, name), parseSharedStrings(xml), parseAllCells(xml, sharedList), buildGrid(cellMap) | kopya ng pamamaraan ng correl-excel-reader (hindi na-export doon) | readDetailsFromFile ; findValue(cellMap, label) | halaga sa column B sa tabi ng label sa column A | readDetailsFromFile ; toNumber(text) | ->number|null ; readDetailsFromFile(file) | ->Promise<details|null> | Status, Repeatability (%), Avg diff, Max diff, Worst slider, Records, Range, Data points, Exported, grid; null kung walang Status | readCached ; readCached(file) | cache kada pangalan+last modified+laki | readForMachine, readInSavingPath ; findLatestInFolder(dayHandle) | ->Promise<File|null> | pinakabagong file na master-repeatability*.xlsx ; normalizeName(name), getMachineFolderName(machineName) | kapareho ng export (correlConfig.SERVER) ; readForMachine(serverHandle, machineName) | ->Promise<details|null> | LEAD PC: <Server path>\master-repeatability\<machine>\<petsa>\, mula pinakabagong folder ng petsa | repeatabilityTile.attachToItems ; readInSavingPath(rootHandle, dayName) | ->Promise<details|null> | Sender: <Saving path>\master-repeatability\<dayName>\ | dashboard-machines.js (readOwnCorrel)
[v8.12] OVERVIEW B. FUNCTIONS (js/core/repeatability-tile.js): createElementWith(tag, class, text) ; showBlocked() | mensahe kapag hinarang ang bagong tab (#dm-preview-status) ; loadPreviewDetails(machineName, isSender) | ->Promise<{details}|{message}> | Sender = Saving path ngayong araw, LEAD PC = Server path | openPreview ; buildPage(details, machineName) | spec ng Preview tab (status, buod, grid, walang chart) | openPreview ; openPreview(machineName, isSender) | previewTab.open ; buildPreviewButton(machineName, isSender) ; buildBlock(details, nowMs, machineName, isSender) | ->HTMLElement | tile block (reuse ng class na dm-correl-*, walang bagong CSS) | dashboard-machines.js (buildMachineTile, renderSender) ; attachToItems(serverHandle, machineItemList) | ->Promise<void> | item.repeatability = details|null | dashboard-machines.js (renderLead)
[v8.12] OVERVIEW B. FUNCTIONS (js/pages/dashboard-machines.js): BINAGO renderLead (attachToItems), buildMachineTile (dagdag na block), renderSender (dagdag na block), readOwnCorrel (ownRepeatability)
[v8.12] OVERVIEW C. VARIABLES: ownRepeatability (let, dashboard-machines.js) | huling nabasang Repeatability ng sariling machine (Sender) | renderSender, readOwnCorrel ; item.repeatability (LEAD PC, sa bawat machine item) | details o null | buildMachineTile ; repeatabilityTileConfig { FILE_MAX_BYTES, LABEL_ROW_LIMIT, CELL_ROW_LIMIT, SCORE_DIGITS, CLASS, TEXT } | detailsCache (Map, repeatability-reader.js) | cache ng nabasang Excel
[v8.12] OVERVIEW D. EVENTS: click .dm-preview-button (sa block ng Repeatability) | repeatability-tile.js | openPreview
[v8.12] OVERVIEW E. STORAGE / API: BASA LANG: <Server path>\master-repeatability\<machine name>\<petsa>\master-repeatability*.xlsx (LEAD PC) at <Saving path>\master-repeatability\<petsa ngayon>\master-repeatability*.xlsx (Sender). Walang sinusulat at walang bagong localStorage key o .json.
[v8.12] OVERVIEW G. DEPENDENCY MAP: dashboard-machines.js -> repeatabilityTile (buildBlock, attachToItems) ; repeatability-tile.js -> repeatabilityReader, previewTab, dashboardMachinesConfig, correlSyncConfig (STATUS_CLASS, STALE_MS), repeatabilityTileConfig, storage, queue, csv-reader ; repeatability-reader.js -> exportConfig (LABEL, SUBFOLDER, FILE_PREFIX), CONFIG.TEXT.master, shiftConfig, correlConfig.SERVER, repeatabilitySyncConfig, repeatabilityTileConfig ; ayos ng script sa pages/dashboard.html at template: ... preview-tab.js, master-shift-config.js, repeatability-sync-config.js, repeatability-tile-config.js, repeatability-reader.js, repeatability-tile.js, dashboard-machines.js (walang binago sa index.html)
[v8.12] PAGE CONTRACT: dashboard dagdag (Master Repeatability) | INPUT: Excel ng Repeatability (Server path para sa LEAD PC, Saving path para sa Sender) | OUTPUT: block sa tile (status, Repeatability %, Worst slider, Range, Updated, Preview) at Preview tab | HTML ID: dm-preview-status (para sa mensahe ng blocked tab) | DEPENDS: repeatabilityReader.*, repeatabilityTile.*, previewTab.open
[v8.12] KNOWN ISSUES / TODO (2026-11-21): (a) Hindi pa nasubukan sa totoong Chrome/Edge at totoong Server path (jsdom test lang: 14 check, kasama ang pagbasa ng totoong na-export na Excel). (b) Ang tile ay nagpapakita lang; ang FAIL ng Repeatability ay hindi nagpapasiklab ng alert ng tile (dm-tile-alert) at hindi binibilang sa chip ng Correl fail sa buod. (c) Walang chart ang Preview ng Repeatability; buod at laman ng sheet 'Repeatability' lang (hindi ang sheet na Readings). (d) Ang Sender ay bumabasa ng <Saving path> (ngayong araw lang); ang LEAD PC ay bumabasa ng pinakabagong folder ng petsa sa Server, kaya puwedeng lumabas na LUMA kung lampas 24 oras. (e) Isang Excel kada petsa sa Server: ang huling Run (All o Latest per shift) ang ipinapakita. (f) Kailangang ang Excel ay galing sa bersyong v8.11 pataas (may labels na Status, Repeatability (%), Worst slider, Range); ang mas lumang file na walang Status ay hindi mababasa at lalabas na 'Wala pang resulta'. (g) Ang Excel ay binabasa kada refresh ng Dashboard pero may cache kada file, kaya isang beses lang binubuksan ang parehong file.
[v8.13] OVERVIEW B. FUNCTIONS (js/pages/dashboard-machines.js): BAGONG hasRepeatabilityFail(item) | ->boolean | FAIL ang item.repeatability.status | getRank, buildMachineTile, renderLead ; BINAGO renderSummary(summary, alertCount, correlFailCount, repeatabilityFailCount) | dagdag na chip ; BINAGO getRank, buildMachineTile (alert din sa Repeatability FAIL)
[v8.13] OVERVIEW C. CONSTANTS: DM.TEXT.summary.repeatabilityFail = 'Repeatability fail' (dashboard-machines-config.js) | gumagamit ng class na dm-chip-correl-fail (walang bagong CSS)
[v8.13] KNOWN ISSUES: [AYOS v8.13] (b) ng v8.12: FAIL ng Repeatability ay may alert na ng tile at chip sa buod. Ang tile ng Sender (sariling machine) ay wala pa ring highlight, tulad ng Master Correl.
[v8.14] OVERVIEW B. FUNCTIONS (js/core/repeatability-reader.js): BAGONG columnNumberOf(letters) | ->number | A=1, Z=26, AA=27 | toRowMap ; BAGONG toRowMap(cellMap) | ->Map(row -> Map(column -> halaga)) | parseReadings ; BAGONG parseReadings(cellMap) | ->{ barcodeList, masterList, recordList:[{key, values}] } o null | binabasa ang sheet na Readings (row 1 header, row 2 MASTER, row 3 pataas ang mga record; may column na Shift sa ikalawang column kapag mode na shift) | readDetailsFromFile ; BAGONG setIssue(key, code, detail) | tala ng dahilan | readForMachine, readInSavingPath ; BAGONG isNotFound(error) | ->boolean | NotFoundError ba ; BAGONG getIssue(machineName, isSender) | ->{ code, detail } o null | dahilan kung bakit null ang huling basa; code: noBaseFolder, noFolder (detail = mga folder na nakita), noDayFolder (Sender lang), noFile, unreadable (detail = pangalan ng file), error (detail = pangalan ng error) | tinatawag ng: repeatability-tile.js (getIssueText) | exported ; BINAGO parseAllCells(xml, sharedList, rowLimit) | may optional na rowLimit (default CELL_ROW_LIMIT) ; BINAGO readDetailsFromFile(file) | may details.readings (null kung walang sheet na Readings o hindi mabasa; buod at grid ay tuloy pa rin) ; BINAGO readForMachine(serverHandle, machineName), readInSavingPath(rootHandle, dayName) | nagtatala ng dahilan kapag null; nabubura ang dahilan sa bawat bagong basa
[v8.14] OVERVIEW B. FUNCTIONS (js/core/repeatability-tile.js): BAGONG getIssueText(machineName, isSender) | ->string | text ng dahilan mula sa getIssue; walang laman kung wala | buildBlock, loadPreviewDetails ; BAGONG getLevel(value, masterValue) | ->string | level (green / yellow / red) ng reading, walang laman kung walang halaga | buildChart ; BAGONG buildChart(details, machineName) | ->div.chart-box o null | line chart ng Preview: huling MAX_LINES (150) na record, kulay umiikot kada 4 (style ng tab), MASTER at level ng dot; pamagat = <machine name> Master Repeatability | buildPage ; BINAGO buildPage (chartBox ay may chart na), buildBlock (may linya ng dahilan kapag walang nabasa), loadPreviewDetails (dahilan ang mensahe kapag walang file)
[v8.14] OVERVIEW B. FUNCTIONS (js/core/master-export.js): BINAGO buildSummarySheet(result, exportedAt, sourceText, machineName), buildReadingsChart(result, leadCount, machineName), buildReadingsSheet(result, machineName), buildBlob(result, exportedAt, sourceText, machineName), exportRepeatability(result, rootHandle, sourceText, machineName) | dagdag na optional na huling parameter na machineName (blangko = '-' sa buod at walang prefix sa pamagat ng chart); row na Machine ay nasa ilalim ng pamagat ng buod | tinatawag ng: repeatability-sync.js (copyToServer, exportBoth)
[v8.14] OVERVIEW B. FUNCTIONS (js/core/repeatability-sync.js): BINAGO copyToServer at exportBoth | ipinapasa ang machineName sa masterExport.buildBlob at masterExport.exportRepeatability
[v8.14] OVERVIEW C. CONSTANTS: repeatabilityTileConfig.READINGS { SHEET_PATH 'xl/worksheets/sheet2.xml', HEADER_ROW 1, MASTER_ROW 2, FIRST_RECORD_ROW 3, ROW_LIMIT 2000 } | ginagamit ng repeatability-reader.js ; repeatabilityTileConfig.CHART { COLOR_CYCLE 4, MIN_BARCODES 1 } | ginagamit ng repeatability-tile.js (buildChart) ; repeatabilityTileConfig.ISSUE { FOLDER_LIST_LIMIT 5, SENDER_KEY '@sender' } | ginagamit ng repeatability-reader.js ; repeatabilityTileConfig.TEXT.issue { noBaseFolder, noBaseFolderSender, noFolder, noDayFolderSender, noFile, unreadable, error, none } | ginagamit ng repeatability-tile.js (getIssueText); ang may dulong Sender ay para sa Sender ; exportConfig.LABEL.machine = 'Machine' (master-export-config.js) | ginagamit ng master-export.js (buildSummarySheet) ; issueMap (const Map, loob ng IIFE ng repeatability-reader.js) | key = machine name na pinaikli (o '@sender') -> { code, detail } | setIssue, getIssue
[v8.14] OVERVIEW E. STORAGE / API: walang bago. Ang Excel ay may dagdag na row na Machine sa buod (column A = label, column B = machine name); binabasa pa rin ang mga label ayon sa pangalan, kaya gumagana pa rin sa mga lumang file na walang row na ito. Ang chart ng Preview ay binabasa mula sa ikalawang sheet (xl/worksheets/sheet2.xml = Readings).
[v8.14] OVERVIEW G. DEPENDENCY MAP: repeatability-tile.js -> repeatabilityReader.getIssue, chart.drawLines, masterAnalysis.classifyDeviation (dagdag; nasa index.html na ang chart-draw at master-analysis) ; repeatability-reader.js -> repeatabilityTileConfig (READINGS, ISSUE), shiftConfig (TEXT.shiftColumn) ; walang bagong script sa index.html at pages/dashboard.html
[v8.14] PAGE CONTRACT: dashboard dagdag | INPUT: sheet na Readings ng Repeatability Excel | OUTPUT: line chart sa Preview tab; linya ng dahilan sa tile at sa Preview kapag walang nabasa (hindi sine-save) | HTML ID: walang bago | DEPENDS: repeatabilityReader (readForMachine, readInSavingPath, getIssue), chart.drawLines, masterAnalysis.classifyDeviation
[v8.14] KNOWN ISSUES / TODO (2026-11-22): (a) Hindi pa nasubukan sa totoong Chrome/Edge at totoong Server path (jsdom test lang: Excel na gawa ng sarili nating export ang binasa, pareho sa mode na all at shift; pekeng folder ang ginamit sa mga dahilan). (b) Ang Preview chart ay iginuhit ulit ng website (hindi ang chart object ng Excel) at ang mga linya ay may 4 na kulay lang na umiikot dahil iyon lang ang nasa style ng Preview tab (preview-tab-style.js); ang MASTER ay kulay ng text at manipis dahil walang style ang chart-master sa tab. (c) Ang mga lumang Repeatability Excel (bago ang v8.14) ay walang row na Machine at walang machine name sa pamagat ng chart sa loob ng Excel; ang Preview chart ay gumagana pa rin dahil ang machine name ay galing sa Dashboard. (d) Hanggang 2000 row ng sheet na Readings ang binabasa (ROW_LIMIT). (e) Sender: kapag walang permission sa Saving path, hindi tinatawag ang readInSavingPath, kaya ang dahilan na ipinapakita ay maaaring luma pa mula sa naunang basa. (f) buildGrid sa repeatability-reader.js: ang letra ng column ng grid ay A-Z lang (umuulit pagkatapos ng 26 na column); luma na ito at hindi ginalaw. (g) Hindi ginawa (hindi pinili): kulay ng bawat point sa chart sa loob ng Excel, Compare vs previous, at status JSON para sa LEAD PC.
[v8.15] OVERVIEW B. FUNCTIONS (js/pages/master.js): [BINURA v8.15] getExportButton(), getOpenLatestButton(), onExport(), onOpenLatestFile() | wala nang tumatawag ; [LUMA v8.15] updateExportButton() -> naging refreshCompare() | ->void | nire-refresh ang Compare sliders (root.compareUi.refresh) | tinatawag ng: setBusy, onRunLatest, onRunRange, init ; BINAGO setBusy(nextBusy) | hindi na nagdi-disable ng Open latest button ; BINAGO init() | walang listener ng Export at Open latest ; autoExportRange() | ito na lang ang nag-e-export ng Master Repeatability (tinatawag ng onRunRange) | tumatawag ng repeatabilitySync.exportBoth
[v8.15] OVERVIEW D. EVENTS: [BINURA v8.15] click #range-export (onExport) at click #range-open-latest (onOpenLatestFile)
[v8.15] OVERVIEW C. CONSTANTS: exportConfig.SELECTOR { exportButton '#range-export', openLatestButton '#range-open-latest' } (master-export-config.js) | hindi na ginagamit (walang ganitong button sa Master page); naiwan, hindi ginalaw ; EXPORT.TEXT.openingLatest, openedLatest, openedHint at error.noRootPath, noLatestFile, openFail | hindi na ginagamit ng master.js; naiwan ; EXPORT.TEXT.error.noResult | hindi na ginagamit (wala nang manual na Export)
[v8.15] OVERVIEW G. DEPENDENCY MAP: master.js -> HINDI na tumatawag sa masterOpenLatest; pages/master.html at master.template.js ay walang script ng master-open-latest.js (ang Dashboard ay mayroon pa: correl-preview.js -> masterOpenLatest.openLatest)
[v8.15] PAGE CONTRACT: master | HTML ID: [BINURA v8.15] range-export, range-open-latest | ang Master Repeatability ay may natitirang range-start, range-end, range-mode, range-run, range-status, range-result
[v8.15] KNOWN ISSUES / TODO (2026-11-22): (a) Wala nang manual na Export to Excel: kung pumalya ang kusang export (halimbawa walang permission sa Saving path), ulitin ang Master Repeatability para mag-export ulit; ang mensahe ng pagpalya ay nasa #range-status. (b) Kapag REPEAT_SYNC.AUTO.ENABLED = false (repeatability-sync-config.js), walang export na mangyayari sa Master Repeatability. (c) Ang pagbalik sa Master page ay nagpapakita ng naalalang resulta pero hindi nag-e-export ulit. (d) Ang Open in Excel ng Repeatability file ay wala na sa Master page; Preview sa Dashboard na lang ang tingin sa laman (hindi Excel mismo). (e) Hindi pa nasubukan sa totoong Chrome/Edge (jsdom smoke test lang: init ng page, walang error sa setBusy at Compare).


[v9.0] CALIBRATION CORREL (Calibration page; kopya ng Master Correl)
  FILES: js/core/calibration-config.js | js/core/calibration-analysis.js | js/core/calibration-export.js | pages/calibration.html (+ kopya js/templates/calibration.template.js) | css/pages/calibration.css | js/pages/calibration.js
  SOURCE: Data source 1 ng Settings (hal. C:\BM-Logging\Calib). Basa lang. CSV na ang unang cell ay "Calibration Status List". Ayos ng CSV (0 = row 1 / column A): row 2 = group (Before, Daily Check, After, Range, CV, Stdev, Master, Correlation coefficient), row 3 = header ng barcode, data mula row 4, Date sa column B. Ang After (Actual) ay nagsisimula sa column pagkatapos ng group cell na "After"; ang Master ay pagkatapos ng group cell na "Master" (nahahanap ayon sa pangalan ng group, hindi nakapirming column; sa sample na may 29 barcode: After = index 45 (AT), Master = index 174 (FS)). Ang bilang ng barcode ay hanggang AVG / Max / Std. Phase / Slice.
  FUNCTIONS:
  calibrationAnalysis.isCalibrationFile(rowList) -> bool | calibration-analysis.js | unang cell ng row 1 ay nagsisimula sa CALIBRATION.TITLE_PREFIX | tinatawag ng: locateLayout
  calibrationAnalysis.locateLayout(rowList) -> {afterStart, masterStart, barcodeList, afterAverageColumn, masterAverageColumn} | null | hinahanap ang After at Master ayon sa group; null kung hindi calibration file o hindi pareho ang bilang ng barcode ng After at Master | tinatawag ng: analyzeLatest
  calibrationAnalysis.analyzeLatest(directoryHandle, referenceDate, onProgress) -> Promise<{kind, fileName, recordDate, barcodeList, actualList, masterList, regression, status, actualAverage, masterAverage, checkedFiles, unreadableCount}> | sinusuri mula pinakabagong file hanggang MAX_FILES (60); ang unang calibration file na may record sa araw ng referenceDate; pinakabagong row ng araw | tumatawag ng: csv.listCsvFiles, readCsvRows, parseAnyDate, masterAnalysis.computeRegression, classifyLatest | error code: emptyFolder, noCalibrationFile, noRecordToday, noRegression | tinatawag ng: calibration.js (onRun)
  (loob ng calibration-analysis.js: yieldToBrowser, startOfDay, normalizeText, averageOf, findGroupColumn, readBarcodeList, findAverageColumn, readPoints)
  calibrationExport.exportCalibration(result, range, rootHandle, sourceText, machineName) -> Promise<{folderName, fileName, blob, dateFolderName}> | sine-save ang .xlsx sa <Saving path>\calibration-correl\<yyyy-mm-dd>\calibration-correl_<petsa ng record>_<yyyymmdd-hhmmss>.xlsx (bagong file kada export) | tinatawag ng: calibration.js (exportFiles)
  calibrationExport.copyToServer(serverHandle, saved, machineName) -> Promise<{folderName, fileName}> | kopya (overwrite) sa <Server path>\calibration-correl\<machine name>\<yyyy-mm-dd>\calibration-correl_latest.xlsx | tinatawag ng: calibration.js (copyToServer)
  calibrationExport.buildBlob / buildFileName / getMachineFolderName | helper ng export
  (loob ng calibration-export.js: padTwo, formatDay, formatDayTime, numberCell, getLevel, getLevelStyle, getLevelColor, getPaddedLimits, buildChart, getWorstSliderText, buildSheet, writeBlob)
  (loob ng calibration.js: getMachineName, getTodayDate, buildChartTitle, query, makeElement, setStatus, getErrorMessage, getExportErrorMessage, setBusy, getReadyHandle, getSourceText, renderSource, clearResult, makeStatusBadge, makeStatList, makeTable, bindBarcodeSelect, levelOf, makeLevelLegend, formatNumber, renderResult, findServerForCopy, copyToServer, exportFiles, autoExport, onRun, restoreSaved, init)
  CONSTANTS (window.BMWW.calibrationConfig, calibration-config.js, frozen): SOURCE_KEY 'source1', TITLE_PREFIX 'calibration status', ROW {title 0, group 2, barcode 3, dataStart 4}, DATE_COLUMN 1, GROUP {after 'after', master 'master'}, END_MARKER_LIST, AVERAGE_SCAN_COLUMNS 3, LATEST {MAX_FILES 60, DATE_READONLY true (false = puwedeng pumili ng petsa)}, SELECTOR {source, date, runButton, status, result}, EXPORT {SUBFOLDER 'calibration-correl', FILE_PREFIX, FILE_EXTENSION, SERVER {FILE_NAME 'calibration-correl_latest.xlsx', SUBFOLDER, NO_MACHINE_FOLDER, UNSAFE_NAME, TRIM_NAME}, AUTO {ENABLED true}, SHEET 'Calibration Correl', COLUMN, CHART, LABEL}, TEXT (lahat ng mensahe at error)
  VARIABLES: sourceHandle, isBusy, lastRun ({result, range}) (let, loob ng IIFE ng calibration.js) | saved.latest (const object; alaala ng huling resulta habang bukas ang website; ibinabalik lang kung ngayong araw pa)
  EVENTS: click | #calibration-run | calibration.js | onRun | click (table barcode / point sa chart) | calibration.js | bindBarcodeSelect
  STORAGE / API: walang bagong localStorage key o API. Binabasa ang "bmww.settings" (machineName, folderPaths), folder handle ng Data source 1 at Saving path (IndexedDB, galing sa Settings), Server handle (queue.findServerHandle).
  FILE: <Saving path>\calibration-correl\<yyyy-mm-dd>\*.xlsx | <Server path>\calibration-correl\<machine name>\<yyyy-mm-dd>\calibration-correl_latest.xlsx
  STATUS: R Square galing sa regression ng Master (x) vs Actual / After (y): PASS >= 0.99, FAIL < 0.97, WARNING sa pagitan (CONFIG.MASTER.LATEST). Kulay ng reading: green <= 1.5, yellow <= 2.5, red higit pa (CONFIG.MASTER.DEVIATION).
  CSS: css/pages/calibration.css (naka-scope sa .page-calibration; kopya ng master.css na walang range / file panel)
  CSS VARIABLES: --calibration-warning, --level-green, --level-yellow, --level-red, --chart-1..8 (nasa .page-calibration)
  DEPENDENCY MAP: calibration.template.js -> (script) master-export-config.js, xlsx-writer.js, calibration-config.js, calibration-analysis.js, calibration-export.js, calibration.js | calibration.js -> calibration-analysis.js -> csv-reader.js, master-analysis.js | calibration.js -> calibration-export.js -> xlsx-writer.js, master-export-config.js | calibration.js -> chart-draw.js, storage.js, queue.js
  PAGE: calibration [v9.0] | INPUT: Data source 1 (folder handle sa IndexedDB, full path sa localStorage 'bmww.settings'), CSV sa folder, #calibration-date (readonly = today) | OUTPUT: status badge, stats (R Square, Date, Actual AVG, Master AVG, File), table (Barcode, Actual (After), Master), scatter chart, bar chart; sine-save ang Excel sa Saving path at Server path | HTML ID: calibration-source, calibration-date, calibration-run, calibration-status, calibration-result | DEPENDS: storage.loadHandle, hasPermission, readLocalSettings, csv.*, masterAnalysis.computeRegression / classifyLatest / classifyDeviation, chart.drawScatter / drawBars / highlight, calibrationAnalysis.analyzeLatest, calibrationExport.exportCalibration / copyToServer, queue.findServerHandle
  KNOWN ISSUES / TODO:
  2026-11-22 | [v9.0] Hindi kasama sa Calibration correl ang: Compare vs previous, pagpapadala ng status (PASS/WARNING/FAIL) sa Dashboard ng LEAD PC, at Preview sa Dashboard. Hindi pa hiniling.
  2026-11-22 | [v9.0] ASSUMPTION: ang Actual = After at ang Master = Master group ng calibration CSV (sa tinukoy ni user). Ang Before, Daily Check, Range, CV, Stdev at ang R2 sa CSV ay hindi ginagamit; ang R Square ay kinakalkula (pareho ng nasa CSV sa sample: 0.9901).
  2026-11-22 | [v9.0] ASSUMPTION: Date ay laging today at readonly (parang Master Correl). Ang CSV sa Calib na hindi ngayong araw ang record ay "Walang calibration record sa napiling petsa". CALIBRATION.LATEST.DATE_READONLY = false para puwedeng pumili ng petsa.
  2026-11-22 | [v9.0] Hindi pa nasubukan sa totoong Chrome/Edge at totoong Server path; nasubukan sa Node at jsdom gamit ang sample na CalibSts_261114085817.csv (gawa-gawang folder handle).

[v9.1] CALIBRATION COMPARE SLIDERS (Calibration page; kopya ng Compare sliders ng Master)
  FILES: js/core/calibration-compare-config.js | js/core/calibration-compare.js | js/core/calibration-compare-export.js | js/core/calibration-compare-ui.js | css/pages/calibration-compare.css | (binago) pages/calibration.html + js/templates/calibration.template.js + js/pages/calibration.js
  REUSED (hindi kinopya): masterCompare.compareRecords / detectWorst, compareConfig (LOOKBACK_DAYS, WORSEN_MIN, TREND, LABEL, TEXT) galing sa master-compare.js at master-compare-config.js; kaya nilo-load ang dalawang script na ito sa Calibration page.
  FUNCTIONS:
  calibrationCompare.findPrevious(directoryHandle, selectedDate, onProgress) -> Promise<result> | calibration-compare.js | isang scan ng CSV; pinakabagong row BAGO ang selectedDate sa loob ng LOOKBACK_DAYS; parehong hugis ng resulta ng Calibration Correl; error 'noPreviousRecord' kung wala | tinatawag ng: calibrationCompareUi.processRun
  (loob ng calibration-compare.js: yieldToBrowser, addDays, averageOf, readPoints)
  calibrationCompareExport.exportCompare(comparison, rootHandle, sourceText, machineName) -> Promise<{folderName, fileName, blob, dateFolderName}> | sine-save ang .xlsx (sheet Compare at Chart) sa <Saving path>\calibration-compare\<petsa> | tinatawag ng: autoExportCompare
  calibrationCompareExport.copyToServer(serverHandle, saved, machineName) -> Promise<{folderName, fileName}> | kopya (overwrite) sa <Server path>\calibration-compare\<machine name>\<petsa>\calibration-compare_latest.xlsx
  calibrationCompareExport.buildBlob / buildFileName | helper ng export
  (loob ng calibration-compare-export.js: padTwo, formatDay, formatDayTime, numberCell, getLevelStyle, getChangeStyle, getSliderText, buildCompareSheet, buildChartSheet, writeBlob)
  calibrationCompareUi.init(hooks) / refresh() | calibration-compare-ui.js | init: nilalagay ang click ng #calibration-compare-run at ina-draw ang huling view; refresh: ina-update ang button | tinatawag ng: calibration.js (init, setBusy, onRun)
  (loob ng calibration-compare-ui.js: query, makeElement, setStatus, getReadMessage, getExportMessage, formatNumber, formatSigned, makeStatList, makeTableBody, makeTable, getDayGap, buildBanner, buildNoWorst, buildWorstTable, buildStats, makeCompareTable, buildTableSection, buildChart, renderView, autoExportCompare, processRun, onCompare)
  (bago sa calibration.js: refreshCompare; hooks na ipinapasa sa init ng compare: getLatestRun, isBusy, setBusy, getReadyHandle, getReadErrorMessage, getMachineName, getSourceText)
  CONSTANTS (window.BMWW.calibrationCompareConfig, frozen): AUTO_RUN false, AUTO_EXPORT true, SUBFOLDER 'calibration-compare', FILE_PREFIX, FILE_EXTENSION, SERVER {SUBFOLDER, FILE_NAME}, SELECTOR {runButton, status, result}, SHEET {compare, chart}, LABEL.title, TEXT {chartTitle, exporting, error}
  VARIABLES: hooks, view ({run, detection, comparison, noPrevious, showAll}), autoRun (let, loob ng IIFE ng calibration-compare-ui.js; nananatili habang bukas ang website)
  EVENTS: click | #calibration-compare-run | calibration-compare-ui.js | onCompare | change | checkbox na "Ipakita lahat ng slider" | calibration-compare-ui.js | draw
  STORAGE / API: walang bagong localStorage key o API. Binabasa ang "bmww.settings", folder handle ng Data source 1 at Saving path, at Server path (queue.findServerHandle).
  FILE: <Saving path>\calibration-compare\<yyyy-mm-dd>\calibration-compare_<today>_vs_<previous>_<stamp>.xlsx | <Server path>\calibration-compare\<machine name>\<yyyy-mm-dd>\calibration-compare_latest.xlsx
  CSS: css/pages/calibration-compare.css (naka-scope sa .page-calibration); CSS VARIABLES: gumagamit ng --level-green, --level-yellow, --level-red galing sa calibration.css
  DEPENDENCY MAP: calibration.html -> master-compare-config.js, master-compare.js, calibration-compare-config.js, calibration-compare.js, calibration-compare-export.js, calibration-compare-ui.js | calibration.js -> calibration-compare-ui.js (init, refresh) | calibration-compare-ui.js -> calibration-compare.js, calibration-compare-export.js, masterCompare
  PAGE: calibration [v9.1] DAGDAG | INPUT: resulta ng huling Calibration Correl (lastRun), CSV ng Data source 1 para sa previous | OUTPUT: banner ng worst slider, table ng Previous at Today, chart, Excel sa Saving path at Server path | HTML ID: #calibration-compare-run, #calibration-compare-status, #calibration-compare-result | DEPENDS: calibrationCompare, calibrationCompareExport, masterCompare, chart, queue.findServerHandle
  KNOWN ISSUES / TODO:
  2026-11-22 | [v9.1] Walang pagpapadala ng Compare sa LEAD PC (compare\<machine>.json) para hindi mapalitan ang status ng Master Compare; sabihin kung gusto rin.
  2026-11-22 | [v9.1] Previous = pinakabagong calibration row BAGO ang Date sa loob ng 7 araw; pinagtutugma ang slider ayon sa pangalan ng barcode. Lumalala = tumaas ang diff nang 0.3 o higit o bumaba ang level (kapareho ng Master).
  2026-11-22 | [v9.1] Sinusuri lang ang pinakabagong 60 file (CALIBRATION.LATEST.MAX_FILES), kapareho ng Calibration Correl.
  2026-11-22 | [v9.1] Hindi pa nasubukan sa totoong Chrome/Edge at totoong Server path; nasubukan sa Node at jsdom (gawa-gawang folder handle) gamit ang CalibSts_261114085817.csv na binago ang petsa (today at yesterday); nabuksan ang .xlsx sa openpyxl (sheet Compare at Chart, 1 chart).

[v9.2] CALIBRATION REPEATABILITY (Calibration page; kopya ng Master Repeatability)
  FILES: js/core/calibration-repeatability-config.js | js/core/calibration-repeatability.js | js/core/calibration-repeatability-export.js | js/core/calibration-repeatability-ui.js | css/pages/calibration-repeatability.css | (binago) pages/calibration.html + js/templates/calibration.template.js + js/pages/calibration.js
  REUSED (hindi kinopya): masterAnalysis.computeRepeatability / classifyDeviation, masterShift.applyMode (master-shift-config.js, master-shift.js; nilo-load na sa Calibration page), calibrationAnalysis.locateLayout, chart.drawLines / highlight, exportConfig (kulay, autofit, text), xlsx-writer.
  FUNCTIONS:
  calibrationRepeatability.analyzeRange(directoryHandle, startDate, endDate, onProgress) -> Promise<{kind:'range', barcodeList, columnList, masterList, masterDate, stats, startDate, endDate, fileCount, calibrationFileCount, recordCount, unreadableCount}> | calibration-repeatability.js | binabasa ang calibration CSV sa saklaw (last modified); actual = After, master = Master; ang master ay mula sa pinakabagong record; pinagtutugma ang barcode ayon sa pangalan; error: emptyFolder, noFileInRange, noCalibrationFile, noRecordInRange | tinatawag ng: calibrationRepeatabilityUi.onRun
  (loob ng calibration-repeatability.js: yieldToBrowser, startOfDay, readPoints)
  calibrationRepeatabilityExport.exportRepeatability(result, rootHandle, sourceText, machineName) -> Promise<{folderName, fileName}> | sine-save ang .xlsx (sheet Repeatability at Readings na may line chart) sa <Saving path>\calibration-repeatability\<petsa>
  calibrationRepeatabilityExport.copyToServer(serverHandle, result, sourceText, machineName) -> Promise<{folderName, fileName}> | kopya (overwrite) sa <Server path>\calibration-repeatability\<machine name>\<petsa ngayon>\calibration-repeatability_latest.xlsx
  calibrationRepeatabilityExport.buildBlob / buildFileName | helper ng export
  (loob ng calibration-repeatability-export.js: padTwo, computeColumnWidths, numberCell, getLevelStyle, formatDay, buildSummarySheet, getChartColumnList, buildReadingsChart, buildReadingsSheet, writeBlob)
  calibrationRepeatabilityUi.init(hooks) / refresh() | calibration-repeatability-ui.js | init: default na petsa, ibinabalik ang huling resulta, nilalagay ang click ng #calibration-range-run; refresh: disabled habang busy | tinatawag ng: calibration.js (init, refreshCompare)
  (loob ng calibration-repeatability-ui.js: query, makeElement, setStatus, getReadMessage, getExportMessage, formatNumber, levelOf, makeStatusBadge, makeStatList, makeTable, bindBarcodeSelect, makeLevelLegend, makeDateLegend, buildChartTitle, groupByFile, drawRangeLines, makeFilePanel, renderResult, findServerForCopy, exportBoth, autoExport, getSelectedMode, onRun)
  (calibration.js: dagdag na init ng calibrationRepeatabilityUi at refresh sa refreshCompare; hooks: isBusy, setBusy, getReadyHandle, getReadErrorMessage, getMachineName, getSourceText, getTodayDate)
  CONSTANTS (window.BMWW.calibrationRepeatabilityConfig, frozen): SUBFOLDER 'calibration-repeatability', FILE_PREFIX, FILE_EXTENSION, SERVER {SUBFOLDER, FILE_NAME}, AUTO {ENABLED true}, SELECTOR {start, end, runButton, status, result, checkedMode, modeRadio}, LABEL.title, TEXT {lineTitle, calibrationFiles, exporting, chartAria, error.noResult}
  VARIABLES: hooks, saved ({result, dates, selectedNameSet}; nananatili habang bukas ang website), lastResult (let, loob ng IIFE ng calibration-repeatability-ui.js)
  EVENTS: click | #calibration-range-run | calibration-repeatability-ui.js | onRun | change | .file-checkbox | calibration-repeatability-ui.js | redraw ng chart | click (table barcode / point sa chart) | calibration-repeatability-ui.js | bindBarcodeSelect
  STORAGE / API: walang bagong localStorage key o API. Binabasa ang "bmww.settings", folder handle ng Data source 1 at Saving path, at Server path (queue.findServerHandle).
  FILE: <Saving path>\calibration-repeatability\<yyyy-mm-dd>\calibration-repeatability_<all|shift>_<start>_to_<end>_<stamp>.xlsx | <Server path>\calibration-repeatability\<machine name>\<yyyy-mm-dd ngayon>\calibration-repeatability_latest.xlsx
  CSS: css/pages/calibration-repeatability.css (naka-scope sa .page-calibration: mode-group, file panel, chart-scroll, date-legend)
  DEPENDENCY MAP: calibration.html -> master-shift-config.js, master-shift.js, calibration-repeatability-config.js, calibration-repeatability.js, calibration-repeatability-export.js, calibration-repeatability-ui.js | calibration.js -> calibration-repeatability-ui.js (init, refresh) | calibration-repeatability-ui.js -> calibration-repeatability.js, calibration-repeatability-export.js, masterShift, masterAnalysis, chart
  PAGE: calibration [v9.2] DAGDAG | INPUT: Start date, End date, mode (all / shift), CSV ng Data source 1 | OUTPUT: badge, buod, table kada barcode, line chart na may file panel, Excel sa Saving path at Server path | HTML ID: #calibration-range-start, #calibration-range-end, #calibration-range-run, #calibration-range-status, #calibration-range-result, name="calibration-range-mode" | DEPENDS: calibrationRepeatability, calibrationRepeatabilityExport, masterShift, masterAnalysis, chart, queue.findServerHandle
  KNOWN ISSUES / TODO:
  2026-11-22 | [v9.2] Walang pagpapadala ng Calibration Repeatability sa Dashboard ng LEAD PC (walang tile); Excel lang sa Saving path at Server path. Sabihin kung gusto rin.
  2026-11-22 | [v9.2] Ang petsa ay last modified ng file (kapareho ng Master Repeatability); lahat ng row sa loob ng file ay kasama kahit iba ang petsa ng row. Ang Master ay mula sa pinakabagong record sa saklaw.
  2026-11-22 | [v9.2] Pinagtutugma ang barcode ayon sa pangalan sa unang calibration file; ang barcode na wala sa ibang file ay blangko (null) sa file na iyon.
  2026-11-22 | [v9.2] Ang dalawang sample na CalibSts_261114085817.csv at CalibSts_261114085817_1.csv ay magkapareho ang laman (cmp), kaya iisa lang ang nagamit sa test; dalawang magkaibang file ang ginawa mula rito (petsa today at yesterday).
  2026-11-22 | [v9.2] Hindi pa nasubukan sa totoong Chrome/Edge at totoong Server path; nasubukan sa Node at jsdom (gawa-gawang folder handle); nabuksan ang .xlsx sa openpyxl (sheet Repeatability at Readings, 1 chart).

=== [v9.3] TREND (OVERVIEW) ===
A. FILES
js/core/trend-config.js     | window.BMWW.trendConfig: column ng master CSV, METRIC_LIST, LIMIT_FIELD_LIST, STORAGE, RANGE, SHIFT_DISPLAY, CHART, SELECTOR, TEXT
js/core/trend-limits.js     | window.BMWW.trendLimits: UCL / CL / LCL (linis, basa ng text, tsek ng ayos, labas ba sa limit)
js/core/trend-overrides.js  | window.BMWW.trendOverrides: mga Set ng user (localStorage)
js/core/trend-reader.js     | window.BMWW.trendReader: basa ng master CSV, pili ng point kada shift, listahan ng record ng araw, pagpalit ng cantilever
js/core/trend-chart.js      | window.BMWW.trendChart: SVG line chart ng isang value (limit lines, pulang point, marker ng cantilever)
js/core/trend-settings.js   | window.BMWW.trendSettings: card na Trend limits sa Settings (init, read)
js/pages/trend.js           | Trend page (nagre-register sa registry bilang 'trend')
pages/trend.html, js/templates/trend.template.js | markup ng page at kopya nito bilang string; css/pages/trend.css | style (naka-scope sa .page-trend); css/pages/trend-settings.css | style ng card sa Settings (naka-scope sa .page-settings)
B. FUNCTIONS (File | Input->Output | Ginagawa | Tinatawag ng)
toLimitNumber(value) | trend-limits.js | any->number|null | numero lang ang tinatanggap | normalizeAll
normalizeAll(raw) | trend-limits.js | object->{<key>:{ucl,cl,lcl}} | linis ng limits ng 6 na value | getLimits, trendSettings.read
getLimits(settings) | trend-limits.js | object->limits | limits mula sa settings[trendLimits] | trend.js (renderAll, renderDay), trendSettings.init
parseText(text) | trend-limits.js | string->{ok,value} | blangko = ok na null; hindi numero = ok false (CONFIG NUMBER_PATTERN) | trendSettings.read
isOrdered(limit) | trend-limits.js | ->bool | UCL >= CL >= LCL (ang naka-set lang) | trendSettings.read
hasAny(limit) / hasAnyInAll(limitMap) | trend-limits.js | ->bool | may naka-set bang limit | trend.js (renderSummary, renderCharts)
classify(value, limit) | trend-limits.js | ->'above'|'below'|'ok'|'' | lampas sa UCL, mababa sa LCL | trend-chart.js, trend.js (renderDay)
clean(raw) / readAll() / writeAll(map) | trend-overrides.js | - | text lang ang key at value, hanggang OVERRIDE_MAX; try/catch | lahat ng function ng overrides
setChoice(slotKey, recordId) / clearChoice(slotKey) / clearAll() | trend-overrides.js | ->map | Set, Reset, Reset lahat | trend.js (onDayClick, onResetAll)
yieldToBrowser() / startOfDay(date) / addDays(date, count) | trend-reader.js | helper ng petsa | readRecords, trend.js
locateColumns(rowList) | trend-reader.js | ->{<key>:column} | hinahanap ang header (Mean Offset, Stdev, CV, Slope, Intercept, R2) sa row 4; kung wala, column Y hanggang AD | readRecords
readFileRecords(rowList, item, columnMap, windowStart, windowEnd, recordMap) | trend-reader.js | - | kinukuha ang Date, Cantilever no. at 6 na value; laktaw ang walang petsa o walang value; dobleng record (oras + cantilever) isang beses | readRecords
readRecords(handle, startDate, endDate, onProgress) | trend-reader.js | ->Promise<{recordList,startDate,endDate,fileCount,masterFileCount,unreadableCount}> | basa lang; file na modified mula Start date hanggang End date + 1 + 2 araw; master = 15 headers; error: emptyFolder, noFileInRange, tooManyFiles (MAX_FILES 300), noMasterFile, noRecordInRange | trend.js (onRun)
getSlotKey(record) / getShiftOrder(name) | trend-reader.js | ->string / number | susi ng shift "<petsa>|<Morning|Night>"; Day bago Night | pickPoints
pickPoints(recordList, overrideMap, startDate, endDate) | trend-reader.js | ->[{slotKey,shift,shiftDay,record,isOverride}] | pinakahuling record ng bawat shift kada petsa, o ang Set ng user | trend.js (getPointList)
listRecordsOfDay(recordList, dayKey) | trend-reader.js | ->array | mga record na ang petsa ay ang napiling araw | trend.js (renderDay)
findCantileverChanges(pointList) | trend-reader.js | ->[{index,from,to,label}] | kung saan nagbago ang cantilever | trend.js (renderAll)
getShiftDisplay(name) / formatPointLabel(point) | trend-reader.js | ->string | Day o Night; "MM/DD Day" | chart, trend.js
svgElement / formatTick / buildTicks / getValueRange / shorten / buildTooltip | trend-chart.js | helper ng chart | draw
countOut(pointList, metric, limit) | trend-chart.js | ->number | bilang ng point na labas sa UCL o LCL | trend.js
draw(container, {metric,pointList,limit,changeList}) | trend-chart.js | - | iginuguhit ang chart (may horizontal scroll kapag maraming point; POINT_GAP) | trend.js (renderCharts)
makeElement / buildInput(metric, field, onChange) | trend-settings.js | - | input ng isang limit | init
init(settings, onChange) / read() | trend-settings.js | ->{limits,error} | gawa ng card; tsek ng numero at ayos, highlight ng maling input | settings.js (init, onSave)
query / makeElement / setStatusOf / getErrorMessage / getReadyHandle / renderSource / getTodayDate / setDefaultDates / readDateInputs | trend.js | helper ng page (kapareho ng Calibration page) | lahat
getPointList() / makeStat / renderSummary / renderChanges / makeLegend / renderCharts / formatValue / makeActionButton / renderDay / renderAll / pickDayDate / setBusy | trend.js | ayon sa pangalan | onRun, onDayClick, onResetAll, init
onRun() / onDayClick(event) / onResetAll() / init() | trend.js | - | Run Trend; Set at Reset sa listahan ng araw; Reset lahat; simula ng page | click, router
settings.js (BINAGO): init() tumatawag ng trendSettings.init(settings, setDirty); onSave() tumatawag ng trendSettings.read() at isinasama ang limits sa settings[trendLimits] (machine json sa Saving path at Server path, at localStorage)
C. VARIABLES / CONSTANTS
sourceHandle (let, trend.js) | handle ng Data source 1 | isBusy (let) | busy ng Run Trend | saved {run, dayKey} (const object, trend.js) | huling resulta at huling napiling araw habang bukas ang website | inputMap (let, trend-settings.js) | mga input ng limits
trendConfig: SOURCE_KEY, ROW, COLUMN, METRIC_LIST, LIMIT_FIELD_LIST, LIMIT_MAX_LENGTH, NUMBER_PATTERN, STORAGE, RANGE (DEFAULT_DAYS 14, MAX_DAYS 62, MAX_FILES 300, FILE_LOOKAHEAD_DAYS 2), SHIFT_DISPLAY, POINT_STATE, CHART, SELECTOR, TEXT
D. EVENTS
click | #trend-run | trend.js | onRun | click | #trend-reset-all | trend.js | onResetAll | change | #trend-day-date | trend.js | renderDay | click | #trend-day-result button[data-action] (set | reset) | trend.js | onDayClick | input | .trend-limit-input | trend-settings.js | setDirty(true) ng Settings
E. STORAGE / API
settings[trendLimits] = {meanOffset,stdev,cv,slope,intercept,r2: {ucl,cl,lcl}} | sa <machine>.json (Saving path at Server path) at localStorage bmww.settings (CONFIG.STORAGE_KEY) | UCL, CL, LCL ng Trend
localStorage bmww.trendOverrides = {"<petsa>|<Morning|Night>": "<oras ms>|<cantilever>"} | Set ng user (kada browser)
Data source 1: basa lang. Walang sinusulat sa Data source, Saving path o Server path maliban sa settings ng Settings.
F. CSS VARIABLES (page-trend): --trend-ucl, --trend-lcl, --trend-cl, --trend-line, --trend-out, --trend-set, --trend-change (may dark mode)
G. DEPENDENCY MAP
index.html -> trend.template.js (registry) -> router -> pages/trend.html scripts: master-shift-config -> master-shift -> trend-config -> trend-limits -> trend-overrides -> trend-reader -> trend-chart -> js/pages/trend.js
Settings page: trend-config -> trend-limits -> trend-settings -> js/pages/settings.js
PAGE: trend [v9.3] | INPUT: CSV ng Data source 1 (master, 15 headers), Start date, End date, napiling petsa, trendLimits (Settings), bmww.trendOverrides | OUTPUT: 6 chart, buod, listahan ng pagpalit ng cantilever, table ng record ng araw; naka-save ang Set sa localStorage
  HTML ID: trend-source, trend-start, trend-end, trend-run, trend-reset-all, trend-status, trend-summary, trend-changes, trend-charts, trend-day-date, trend-day-status, trend-day-result, trend-limits-card (nasa trendConfig.SELECTOR)
  DEPENDS: storage.loadHandle, hasPermission, csv.*, masterShift.getShiftOf, trendReader, trendChart, trendLimits, trendOverrides

=== [v9.3] KNOWN ISSUES / TODO ===
  2026-11-22 | [v9.3] Master file = CSV na 15 ang header sa row 2 (kapareho ng monitor.js at Master). Ang record ay kinukuha sa row 5 pataas; ang petsa ay column B, Cantilever no. column C.
  2026-11-22 | [v9.3] Ang file na ang last modified ay mula Start date hanggang 3 araw pagkatapos ng End date ang binabasa (may record ng nakaraang araw ang mas bagong file, hal. CalibSts_261114081240.csv na may 11/13 at 11/14). Ang dobleng record (parehong oras at cantilever) ay isang beses lang.
  2026-11-22 | [v9.3] Ang record na labas sa Day (7:30 AM-6:30 PM) at Night (7:30 PM-6:30 AM), hal. 6:31-7:29, ay hindi isinasama sa chart; makikita sa listahan ng araw na may markang 'Labas sa shift' at walang Set.
  2026-11-22 | [v9.3] Ang Set ay naka-save sa localStorage ng browser na ito (hindi kasama sa <machine>.json). Hanggang MAX_DAYS 62 araw ang saklaw at MAX_FILES 300 ang file.
  2026-11-22 | [v9.3] Ang UCL, CL, LCL ay iisa para sa lahat ng cantilever; ang pagpalit ng cantilever ay marker lang. Kapag walang naka-set na limit, walang limit line at may paalala sa Trend page.
  2026-11-22 | [AYOS v9.4] [v9.3] Walang Excel export o Dashboard tile ng Trend (hindi hiningi). Hindi pa nasubukan sa totoong Chrome/Edge; nasubukan sa Node at jsdom (CSV mo + gawa-gawang pangalawang file) at na-render ang chart sa PNG.

=== [v9.4] TREND EXPORT (OVERVIEW) ===
A. FILES
js/core/trend-export-config.js | window.BMWW.trendExportConfig: lugar ng file, meta, SEEN, XLSX, IMAGE, CLASS, SELECTOR, TEXT
js/core/trend-image.js         | window.BMWW.trendImage: PNG ng 6 chart sa canvas (walang library)
js/core/trend-sync.js          | window.BMWW.trendSync: sulat (Saving path, Server path) at basa ng picture at meta
js/core/trend-export.js        | window.BMWW.trendExport: Excel at ang buong Export to Excel
js/core/trend-tile.js          | window.BMWW.trendTile: Trend block sa tile ng Dashboard, UPDATED, Preview
css/pages/trend-tile.css       | style ng Trend block (naka-scope sa .page-dashboard)

B. FUNCTIONS
trend-image.js:
formatTick(value) / shorten(text) / buildTicks(min, max) / getValueRange(valueList, limit) | helper ng chart (kapareho ng trend-chart.js) | drawChart
makeFont(size, isBold) / drawText(context, text, x, y, options) / drawLine(...) / drawCircle(...) | helper ng canvas | drawChart, drawHeader
drawXLabels(context, area, pointList, xAt) | ->void | label ng X axis (bawat MAX_X_LABELS lang kapag marami) | drawChart
drawChart(context, area, metric, pointList, limit, changeList) | ->void | isang chart: axis, limit line, marker ng cantilever, linya, pulang point, ring ng Set | buildBlob
drawHeader(context, width, options) | ->void | pangalan ng machine, range, bilang ng point at labas sa limit, legend | buildBlob
countOutAll(pointList, limitMap) | ->number | bilang ng point na labas sa limit sa lahat ng value | drawHeader, trend-export.js (buildSummarySheet, buildMeta)
toBlob(canvas) | ->Promise<Blob> | error 'imageFail' kapag pumalya | buildBlob
buildBlob({machineName, run, pointList, limitMap, changeList}) | ->Promise<Blob> (image/png) | ulo at 6 na chart, COLUMNS kada row | trend-export.js (exportAll)

trend-sync.js:
getMachineFolderName(machineName) | ->string | bawal na character ay _, walang pangalan = no-machine-name | sendToServer, findOnServer
writeFile(folderHandle, fileName, content) | ->Promise | sulat ng Blob o text; abort kapag pumalya | saveToSavingPath, sendToServer
openFolders(startHandle, nameList) | ->Promise<handle> | ginagawa ang sunud-sunod na folder | saveToSavingPath, sendToServer
saveToSavingPath(rootHandle, {dateFolderName, excelFileName, excelBlob, imageBlob, metaText}) | ->Promise<string> | Excel sa trend\<petsa>\; picture at meta sa trend\ (meta ang huling sinusulat) | trendExport.exportAll
sendToServer(serverFound, machineName, {imageBlob, metaText}, basePath) | ->Promise<{ok,path}|{ok:false,message}> | picture at meta lang sa <Server path>\trend\<machine>\; hindi nagtatapon ng error | trendExport.exportAll
cleanText(value) / cleanCount(value) / normalizeMeta(raw) | linis ng nabasang meta; null kung walang tamang updatedAt | readLatest
readLatest(folderHandle) | ->Promise<{meta, modifiedMs, imageHandle}|null> | basa ng trend_latest.json (limit META.FILE_MAX_BYTES) at hawak ng PNG | findInSavingPath, findOnServer
findInSavingPath(rootHandle) / findOnServer(serverHandle, machineName) | ->Promise<latest|null> | sariling Dashboard / LEAD PC | trendTile.readOwn, trendTile.attachToItems

trend-export.js:
padTwo / formatDateTime(date) / numberCell(value, style) / computeColumnWidths(rows) / isOutOfLimit(value, limit) | helper | sheet builders
[BINURA v9.5] buildSummarySheet(context, exportedAt, sourceText) | trend-export.js | pumalit ang buildDataSheet
buildDataSheet(context) [v9.5, pumalit sa buildPointsSheet] | ->{ sheet, metricColumn, limitColumn, outColumn } | sheet 'Data': pababa ang talaan (isang point kada row); 6 na value, Labas sa limit, at UCL/CL/LCL column ng naka-set; pula ang labas sa limit | buildBlob
getAxisRange(valueList) | ->{yMin,yMax}|null | saklaw ng y-axis ng chart ng Excel | buildMetricChart
[BINURA v9.5] buildMetricSheet(context, metric) | pumalit ang buildMetricChart
buildMetricChart(context, dataInfo, metric, chartIndex) [v9.5] | ->chart spec o null | line chart ng isang value; data ay galing sa sheet 'Data' (byColumn, dataSheet); anchor.row = chartIndex * CHART.ROWS_PER_CHART | buildChartsSheet
buildChartsSheet(context, dataInfo) [v9.5] | ->sheet | sheet 'Charts': walang cell, puti (walang gridlines), 6 chart sa chartList, isang column pababa | buildBlob
buildBlob(context) [BINAGO v9.5: wala nang exportedAt at sourceText] | ->Blob | sheet 'Data' at sheet 'Charts' | exportAll
xlsx-writer.js [v9.5]: getSheetCharts(sheet) | ->array | sheet.chartList o [sheet.chart] | buildPackageEntries ; buildAnchorXml(anchor, index) | isang anchor ng drawing | buildDrawingXml ; BINAGO buildDrawingXml(anchorList), buildRelsXml(type, targetList), buildSeriesXml (chart.byColumn)
CONSTANTS [v9.5]: trendExportConfig.XLSX.SHEET { data, charts } [LUMA: summary, points] | XLSX.CHART.ROWS_PER_CHART 26 [pumalit sa ANCHOR_ROW] | IMAGE.COLUMNS 1 [LUMA: 2]
buildFileName(run, exportedAt) | ->string | trend_<start>_to_<end>_<yyyymmdd-hhmmss>.xlsx (hindi nao-overwrite) | exportAll
buildMeta(context, exportedAt, excelFileName) | ->object | laman ng trend_latest.json | exportAll
findServer() | ->Promise<{handle,state}> | queue.findServerHandle(true); hindi nagtatapon ng error | exportAll
exportAll(context) | ->Promise<{message,kind}> | permission muna (Saving path, Server path) habang sariwa ang click, saka Excel at picture, saka sulat | trend.js (onExport)
getErrorMessage(error) | ->string | friendly na mensahe | trend.js (onExport)

trend-tile.js:
createElementWith(tagName, className, text) | ->element | textContent lang | lahat ng builder
getKey(machineName, isSender) | ->string | '@own' para sa Sender, pangalan ng machine (maliit na letra) para sa LEAD PC | readOwn, attachToItems, buildInfo
readSeenMap() / markSeen(key, updatedAt) | localStorage bmww.trendSeen; hanggang SEEN.MAX | buildInfo, openPreview
loadImageUrl(key, latest) | ->Promise<string> | binabasa ang PNG isang beses kada updatedAt (imageCache); binubura ang lumang URL | buildInfo
buildInfo(latest, key) | ->Promise<{meta, modifiedMs, imageUrl, key, isUpdated}|null> | isUpdated = ibang updatedAt sa huling nakita | readOwn, attachToItems
readOwn(rootHandle) | ->Promise<info|null> | Sender: <Saving path>\trend\ | dashboard-machines.js (readOwnCorrel)
attachToItems(serverHandle, machineItemList) | ->Promise<void> | LEAD PC: item.trend ng bawat machine (null kung wala) | dashboard-machines.js (renderLead)
showMessage(message) | mensahe sa #dm-preview-status (nawawala sa DM.TEXT.preview.clearMs) | openPreview
openPreview(info, box) | itinatala ang nakita (nawawala ang UPDATED), window.open ng picture; mensahe kung hinarang o hindi mabasa | click ng Preview at thumbnail
buildPreviewButton / buildThumbnail | ->element | button na may aria-label | buildBlock
buildBlock(info, machineName) | ->element | TREND, UPDATED (icon at text), Preview, thumbnail, Range, Mga point, Labas sa limit, Exported; walang export = "Wala pang Trend export" | dashboard-machines.js (buildTrendBlock)

BINAGO:
trend.js: onExport() | click ng #trend-export; setExportDisabled(isDisabled) | disabled habang walang run o abala; tinatawag ng renderAll, setBusy, init
dashboard-machines.js: buildTrendBlock(trendInfo, machineName) | tinatawag ng buildMachineTile (item.trend) at renderSender (ownTrend); let ownTrend (module) = huling nabasa sa Saving path, null kapag walang permission o machine name

C. VARIABLES / CONSTANTS
trendExportConfig: SUBFOLDER 'trend', FILE_PREFIX, FILE_EXTENSION, IMAGE_NAME 'trend_latest.png', META_NAME 'trend_latest.json', PATH_SEPARATOR, NO_MACHINE_FOLDER, UNSAFE_NAME, TRIM_NAME, ERROR_BY_NAME, META (VERSION, FILE_MAX_BYTES 262144, IMAGE_MAX_BYTES 31457280, TEXT_MAX), SEEN (KEY 'bmww.trendSeen', MAX 200, OWN_KEY '@own'), SELECTOR (exportButton, exportStatus), XLSX (COLOR, AUTOFIT, SHEET, CHART, LABEL), IMAGE (COLUMNS 2, CHART_WIDTH 760, CHART_HEIGHT 310, MAX_X_LABELS 12, COLOR, LEGEND ...), CLASS, TEXT
imageCache (const Map, trend-tile.js) | key -> {updatedAt, url} | previewClearId (let, trend-tile.js) | timer ng mensahe

D. EVENTS (listener)
click | #trend-export | trend.js | onExport
click | .dm-preview-button (Trend block) at .dm-trend-thumb | trend-tile.js | openPreview

E. STORAGE / API
<Saving path>\trend\<yyyy-mm-dd>\trend_<start>_to_<end>_<stamp>.xlsx | trend-export.js | Excel (Saving path LANG) | para sa user
<Saving path>\trend\trend_latest.png at trend_latest.json | trend-sync.js | huling picture at meta | sariling Dashboard (Sender)
<Server path>\trend\<machine name>\trend_latest.png at trend_latest.json | trend-sync.js | kopya ng picture at meta (walang Excel) | Dashboard ng LEAD PC
trend_latest.json = {version, machineName, updatedAt (ISO), startDate, endDate, pointCount, recordCount, outCount, excelFileName} | ang updatedAt ang tanda ng bagong update
localStorage bmww.trendSeen = {"<@own | machine name>": "<updatedAt>"} | trend-tile.js | huling nakita ng browser na ito

F. CSS VARIABLES: walang bago (ginagamit ang --color-primary, --color-border, --space-*, --radius-sm)

G. DEPENDENCY MAP
pages/trend.html scripts: ... trend-chart -> xlsx-writer -> trend-export-config -> trend-sync -> trend-image -> trend-export -> js/pages/trend.js
trend.js (onExport) -> trendExport.exportAll -> storage.loadHandle, queue.findServerHandle, trendImage.buildBlob, trendExport.buildBlob, trendSync.saveToSavingPath, trendSync.sendToServer
pages/dashboard.html scripts: ... repeatability-tile -> trend-export-config -> trend-sync -> trend-tile -> dashboard-machines.js
dashboard-machines.js -> trendTile.readOwn (Sender) / trendTile.attachToItems (LEAD PC) / trendTile.buildBlock

PAGE: trend [v9.4 dagdag] | INPUT: resulta ng Run Trend (saved.run), mga Set ng user, trendLimits, machineName, Saving path at Server path (Settings) | OUTPUT: Excel sa Saving path; picture at meta sa Saving path at Server path; mensahe sa #trend-export-status
  HTML ID dagdag: trend-export, trend-export-status (nasa trendExportConfig.SELECTOR)
  DEPENDS dagdag: trendExport.exportAll, getErrorMessage
PAGE: dashboard [v9.4 dagdag] | INPUT: <Saving path>\trend\ (Sender) o <Server path>\trend\<machine>\ (LEAD PC), localStorage bmww.trendSeen | OUTPUT: TREND block sa tile (thumbnail, UPDATED, Preview) | DEPENDS: trendTile, trendSync, trendExportConfig

=== [v9.4] KNOWN ISSUES / TODO ===
  2026-11-22 | [v9.4] Mangyayari lang ang update ng Dashboard kapag nag-click ng Export to Excel; hindi awtomatiko ang pagpapadala ng Trend.
  2026-11-22 | [v9.4] Hindi nasubukan sa totoong Chrome/Edge at totoong Server path; nasubukan sa Node at jsdom (gawa-gawang folder handle, canvas ng node-canvas); nabuksan ang .xlsx sa openpyxl at LibreOffice (8 sheet, 6 chart).
  2026-11-22 | [v9.4] Ang UPDATED ay batay sa huling nakita ng BAWAT browser (localStorage); ibang browser o nilinis na site data = lalabas ulit ang UPDATED.
  2026-11-22 | [v9.4] Ang Preview ay picture lang sa bagong tab (walang buod o table). Kailangan i-allow ang pop-ups kapag hinarang.
  2026-11-22 | [v9.4] Iisang picture lang ang itinatabi sa Server (trend_latest.png, ino-overwrite); ang Excel ay nasa Saving path lang.
  2026-11-22 | [v9.4] Isang chart lang kada sheet ang kaya ng xlsx-writer.js, kaya may sheet ang bawat value (Mean Offset, Stdev, CV, Slope, Intercept, R2). [AYOS v9.5]
  2026-11-22 | [v9.5] Hindi nasubukan sa totoong Chrome/Edge; nasubukan sa Node (buildBlob ng trend-export.js), openpyxl (2 sheet, 6 chart sa Charts) at LibreOffice (puti, isang column). Ang picture na 1 col per row ay hindi nare-render sa Node (canvas); ang unang test ay sa device mo.
  2026-11-22 | [v9.5] Wala nang Summary sa Excel (machine, saklaw, bilang ng point); nasa picture na lang ang ulo. May tick label ng y-axis ng chart ng Excel na mahahabang decimal (hal. 5.178014...), dating ugali ito ng Excel export.
  2026-11-22 | [v9.5] Hindi pa ginagawa: Task 2 (clickable na petsa at point) at ibang Task 3; hindi kasama sa 'eto nalang pala'.
=== [v9.6] TREND: CLICKABLE NA PETSA AT POINT (OVERVIEW) ===
A. FILES: js/core/trend-day-config.js | window.BMWW.trendDayConfig: ATTRIBUTE 'data-day', DATASET_KEY, SELECTOR, CLASS (clickable, selected, hit), ACTIVATE_KEYS, HIT_RADIUS, SCROLL, TEXT | js/core/trend-day-search.js | window.BMWW.trendDaySearch: paghahanap ng petsa sa Data source 1
B. FUNCTIONS:
readDay(directoryHandle, dayKey, onProgress) | trend-day-search.js | ->Promise<{recordList, fileCount, masterFileCount, unreadableCount}> | basa lang; file na modified 00:00 ng petsa hanggang +1+FILE_LOOKAHEAD_DAYS araw; master = 15 headers; record na ang oras ay nasa petsa; error: emptyFolder, tooManyFiles | trend.js (loadDay)
collectRecords(rowList, item, columnMap, windowStart, windowEnd, recordMap) | trend-day-search.js | kopya ng paraan ng readFileRecords (private sa trend-reader.js, hindi ginalaw) | readDay ; yieldToBrowser() | readDay
makeClickable(attributeMap, dayKey, ariaLabel) | trend-chart.js | nilalagay ang data-day, class is-clickable, tabindex, role, aria-label | draw
markSelectedDay() | trend.js | is-selected sa point at label ng napiling petsa | renderCharts, loadDay
loadDay(dayKey, shouldScroll) | trend.js | ->Promise | inilalagay ang petsa sa picker, hinahanap sa Data source 1, saka renderDay; dayToken iwas lumang resulta | onChartActivate, onDayDateChange
onChartActivate(event) | trend.js | click o Enter / Space sa [data-day] ng #trend-charts | event delegation
onDayDateChange() | trend.js | change ng #trend-day-date | loadDay
BINAGO: renderDay (gumagamit ng saved.day kung hinanap na ang petsa; may linyang 'Hinanap sa Data source 1: ...'), renderCharts (markSelectedDay), pickDayDate (walang min/max), onRun (nire-reset ang saved.day), init (listener ng change, click, keydown)
C. VARIABLES: saved.day {key, recordList, fileCount, masterFileCount} (trend.js) | dayToken (let, trend.js) | DAY (const, shortcut sa trendDayConfig; sa trend-chart.js ay opsyonal: kung wala, hindi clickable)
D. EVENTS: click, keydown | #trend-charts | trend.js | onChartActivate ; change | #trend-day-date | trend.js | onDayDateChange (pumalit sa renderDay)
E. STORAGE / API: walang bagong localStorage key; basa lang sa Data source 1 (folder handle ng Run Trend)
G. DEPENDENCY MAP: trend.html scripts: ... trend-reader -> trend-day-config -> trend-chart -> trend-day-search -> ... -> js/pages/trend.js ; trend.js -> trendDaySearch.readDay, trendDayConfig ; trend-day-search.js -> csv, masterShift, trendReader (startOfDay, addDays, locateColumns), trendConfig
  2026-11-22 | [v9.6] Hindi nasubukan sa totoong Chrome/Edge; nasubukan sa jsdom at Node (gawa-gawang folder handle): click sa point, Enter sa label, pagpalit ng petsa (kasama ang labas sa saklaw), walang record, at walang permission.
  2026-11-22 | [v9.6] Ang pagpalit ng petsa sa picker ay maaaring hindi bilang 'click' para sa browser; kung kailangan pa ng permission sa Data source 1, may pulang mensahe at ipinapakita ang mga record ng huling Run Trend. Pindutin ang point o petsa sa chart (click) para makahingi ulit ng permission.
  2026-11-22 | [v9.6] Ang petsa ng point ay ang petsa ng simula ng shift (hal. 11/20 Night); ang listahan ay ayon sa petsa sa kalendaryo, kaya ang record ng Night shift na lampas hatinggabi ay nasa susunod na petsa.
  2026-11-22 | [v9.6] Ang Set ay para lang sa petsang nasa saklaw ng chart; ang mga petsang labas sa saklaw ay tingin lang.

=== [v10] SETTINGS RESTORE (OVERVIEW) ===
A. FILES
js/core/settings-restore-config.js | window.BMWW.settingsRestoreConfig: STATE, RESULT, IGNORED_FILES, FILE_EXTENSION, SELECTOR (banner), TEXT
js/core/settings-restore.js | window.BMWW.settingsRestore: checkSettingsFolder, restoreFromFolder, isFormBlank (walang sinusulat)
css/pages/settings-restore.css | style ng banner (.restore-banner) sa .page-settings
B. FUNCTIONS
Pangalan : checkSettingsFolder(rootHandle) | File: js/core/settings-restore.js | Input: FileSystemDirectoryHandle (BMWW) -> Output: Promise<{state, fileList}> | Ginagawa: tinitingnan ang <BMWW>\settings; missing (walang folder), empty (walang .json maliban sa events.json), hasFiles | Tinatawag ng: restoreFromFolder | Error handling: ang NotFoundError ay missing; ang iba ay ibinabato
Pangalan : restoreFromFolder(rootHandle, preferredFileName) | File: js/core/settings-restore.js | Output: Promise<{result, settings}> | Ginagawa: checkSettingsFolder, tapos storage.readMachineSettings (preferredFileName muna, tapos pinakabagong <machine>.json, tapos lumang settings.json); result = restored | missing | empty | unreadable | Tinatawag ng: settings.js (restoreAfterPick, onRestoreClick)
Pangalan : isFormBlank({mode, name, fullPathMap}) | File: js/core/settings-restore.js | Output: boolean | Ginagawa: true kung walang mode, pangalan at full path | Tinatawag ng: settings.js (restoreAfterPick)
Pangalan : queryRestore(key) | File: js/pages/settings.js | Ginagawa: hinahanap ang elemento ng banner ayon sa RESTORE.SELECTOR
Pangalan : getFormValues() | File: js/pages/settings.js | Ginagawa: kinukuha ang mode, pangalan at full path ng form
Pangalan : applyRestoredSettings(restored) | File: js/pages/settings.js | Ginagawa: settings = restored, writeLocalSettings, pinupunan ang radio, pangalan, full path, trendSettings.init, renderMachine, renderPaths (walang sinusulat sa file) | Tinatawag ng: restoreAfterPick, onRestoreClick
Pangalan : getRestoredMessage() | File: js/pages/settings.js | Ginagawa: mensahe; sinasabi kung may folder pang kailangang piliin ulit
Pangalan : restoreAfterPick(rootHandle) | File: js/pages/settings.js | Output: Promise<boolean> | Ginagawa: pagkapili ng BMWW, kung blangko ang form, ibinabalik ang settings mula sa folder | Tinatawag ng: onPickFolder | Error handling: try/catch, false kapag pumalya
Pangalan : hideRestoreBanner() | File: js/pages/settings.js | Ginagawa: itinatago ang banner
Pangalan : onRestoreClick() | File: js/pages/settings.js | Ginagawa: hasPermission(rootHandle, true), restoreFromFolder, applyRestoredSettings (hindi kung isDirty) | Tinatawag ng: click sa #settings-restore-button | Error handling: try/catch, friendly na mensahe
Pangalan : initRestoreBanner() | File: js/pages/settings.js | Ginagawa: ipinapakita ang banner kung may BMWW handle pero walang permission | Tinatawag ng: init
C. VARIABLES / CONSTANTS
RESTORE (const, settings.js) = window.BMWW.settingsRestoreConfig (opsyonal: kung wala ang script, walang restore) | settingsRestoreConfig.STATE, RESULT, IGNORED_FILES ['events.json'], FILE_EXTENSION '.json', SELECTOR {banner, bannerText, bannerButton}, TEXT
D. EVENTS (listener)
click | #settings-restore-button | js/pages/settings.js | onRestoreClick
E. STORAGE / API
Binabasa: <BMWW>\settings\<machine>.json (lumang settings.json huli). Sinusulat: localStorage bmww.settings lang (sa applyRestoredSettings, sa pamamagitan ng storage.writeLocalSettings). Walang sinusulat sa file at walang network.
F. CSS VARIABLES: walang bago (ginagamit ang --color-primary, --color-primary-soft, --color-text, --space-*, --radius)
G. DEPENDENCY MAP
settings.template.js / pages/settings.html scripts: settings-restore-config.js -> settings-restore.js -> js/pages/settings.js ; settings.js -> settingsRestore (restoreFromFolder, isFormBlank), settingsRestoreConfig ; settings-restore.js -> storage.readMachineSettings, CONFIG.SETTINGS_SUBFOLDER
PAGE: settings (dagdag) | INPUT: <BMWW>\settings\<machine>.json | OUTPUT: napupunan na form at localStorage | HTML ID: #settings-restore, #settings-restore-text, #settings-restore-button | DEPENDS: settingsRestore, storage.hasPermission, trendSettings.init

=== [v10] KNOWN ISSUES / TODO ===
  2026-11-22 | [v10] Hindi nasubukan sa totoong Chrome/Edge; syntax check at Node test lang (gawa-gawang folder handle: missing, empty, hasFiles, unreadable).
  2026-11-22 | [v10] Ang folder handle ng Server path at Data source 1 hanggang 3 ay hindi maibabalik mula sa file; kailangang pindutin ang Piliin ulit sa bawat browser (nakasulat na ang pangalan at full path).
  2026-11-22 | [v10] Sa pagkapili ng BMWW, ibinabalik lang ang settings kapag blangko ang form. Kung may laman na, walang pagbabago.
  2026-11-22 | [v10] Sa banner na Ibalik ang settings, ang file ang pangunahin; hindi ito papalit kung may binago ka nang hindi pa na-save (isDirty).
  2026-11-22 | [v10] Ang ibang page (Master, Calibration, Trend) ay humihingi pa rin ng permission sa sarili nilang pindot; ang banner ay nasa Settings lang.

=== [v10.1] SETTINGS LAYOUT: MACHINES\SENDER AT MONITORING (OVERVIEW) ===
A. FILES: walang bagong file. Binago: js/core/storage.js (path ng settings ng machine), js/core/queue.js (readMachineList), js/pages/settings.js (remove at mensahe), js/core/config.js (3 constant), js/core/settings-restore.js (checker)
B. FUNCTIONS
Pangalan : getRoleFolderName(machineMode) | File: js/core/storage.js | Output: string | Ginagawa: 'monitoring' kung lead-pc, 'sender' kung hindi | Tinatawag ng: writeMachineSettings, removeMachineSettings, settings.js (getFileLocation)
Pangalan : getRoleFolder(parentHandle, roleName, shouldCreate) | File: js/core/storage.js | Output: Promise<FileSystemDirectoryHandle> | Ginagawa: <parent>\settings\machines\<roleName>; ginagawa ang mga folder kung shouldCreate, kung hindi ay NotFoundError | Tinatawag ng: writeMachineSettings, listReadFolders, queue.js (openMachineFolders), settings-restore.js (checkSettingsFolder)
Pangalan : writeMachineSettings(parentHandle, fileName, settings) | File: js/core/storage.js | [BINAGO v10.1] Ginagawa: sinusulat sa machines\sender o machines\monitoring ayon sa settings.machineMode (dating <path>\settings\<file>) | Tinatawag ng: settings.js (onSave, writeToServer)
Pangalan : listReadFolders(parentHandle) (private) | File: js/core/storage.js | Output: {roleList [{roleName, handle}], flatFolder} | Ginagawa: mga umiiral na folder na babasahin: sender, monitoring at lumang settings
Pangalan : removeMachineSettings(parentHandle, fileName, keep) | File: js/core/storage.js | [BINAGO v10.1] Input dagdag: keep {mode, fileName} = ang bagong sulat na file na hindi buburahin | Ginagawa: binubura ang fileName sa sender, monitoring at lumang settings (hindi settings.json at events.json) | Tinatawag ng: settings.js
Pangalan : readNewestMachine(folder) (private) | File: js/core/storage.js | Ginagawa: pinakabagong <machine>.json na may machineName sa folder
Pangalan : readMachineSettings(rootHandle, preferredFileName) | File: js/core/storage.js | [BINAGO v10.1] Ginagawa: preferred file sa sender, monitoring, lumang settings; tapos ang pinakabago sa bawat isa; huli ang lumang settings.json | Tinatawag ng: settings.js (loadState), settings-restore.js
Pangalan : openMachineFolders(serverHandle) (private) | File: js/core/queue.js | Ginagawa: ibinibigay ang <Server>\settings\machines\sender at ang lumang <Server>\settings (ang wala ay hindi isinasama; pumalyang server ay nagtatapon ng error)
Pangalan : readMachineList(serverHandle) | File: js/core/queue.js | [BINAGO v10.1] Ginagawa: binabasa ang sender muna, tapos ang lumang settings; walang doble (sender ang masusunod); hindi isinasama ang LEAD PC | Tinatawag ng: loadSnapshot
Pangalan : getFileLocation(fullPath, fileName, machineMode) | File: js/pages/settings.js | [BINAGO v10.1] Ginagawa: <path>\settings\machines\<sender|monitoring>\<file> para sa mensahe
Pangalan : isSameFileName(first, second) | File: js/pages/settings.js | [LUMA v10.1: hindi na tinatawag; naiwan]
Pangalan : listMachineFileNames(folder) (private), checkSettingsFolder(rootHandle) | File: js/core/settings-restore.js | [BINAGO v10.1] hinahanap din sa machines\sender at machines\monitoring
C. VARIABLES / CONSTANTS
MACHINES_SUBFOLDER 'machines' | SENDER_SUBFOLDER 'sender' | MONITORING_SUBFOLDER 'monitoring' | js/core/config.js | const string | Ginagamit sa: storage.js, queue.js, settings.js, settings-restore.js
D. EVENTS: walang bago
E. STORAGE / API
<Saving path>\settings\machines\sender\<machine>.json at <Server path>\settings\machines\sender\<machine>.json (User input) | <path>\settings\machines\monitoring\LEAD PC.json (LEAD PC) | <path>\settings\events.json (hindi nagbago) | Lumang <path>\settings\<machine>.json: binabasa pa rin (fallback), buburahin kapag nag-Save ulit ang machine.
G. DEPENDENCY MAP: settings.js -> storage.writeMachineSettings / removeMachineSettings / getRoleFolderName ; queue.js -> storage.getRoleFolder ; settings-restore.js -> storage.getRoleFolder, readMachineSettings

=== [v10.1] KNOWN ISSUES / TODO ===
  2026-11-22 | [v10.1] Hindi nasubukan sa totoong Chrome/Edge; nasubukan sa Node gamit ang gawa-gawang folder handle (20 check: layout, LEAD PC basa, fallback, migration, palit ng mode at pangalan, restore checker).
  2026-11-22 | [v10.1] Ang machine na hindi pa nag-Save ng bagong layout ay lumalabas pa rin sa LEAD PC (galing sa lumang <Server>\settings) hanggang mag-Save ito. Ang lumang file nito ay buburahin pagkatapos.
  2026-11-22 | [v10.1] Ang lumang file ng machine na ibang browser/PC ang may hawak (hindi na-Save ulit) ay hindi nabubura; manu-mano na lang kung ayaw na.
  2026-11-22 | [v10.1] Wala pa sa Dashboard ang pangalan ng Server folder at bilang ng nakitang file (diagnostic card); hinihintay ang utos.

=== [v11] OVERVIEW ===
A. FILES
js/core/shift-freshness-config.js | window.BMWW.shiftFreshnessConfig: SHIFT (day 7:30 AM = 450, night 7:30 PM = 1170), WATCH_MS 10000, CLASS (block, badge), TEXT
js/core/shift-freshness.js | window.BMWW.shiftFreshness: getShiftAt, isOutdated, describeShift, mark, watch
css/pages/shift-freshness.css | style ng .sf-badge at .sf-block-outdated (naka-scope sa .page-dashboard)
B. FUNCTIONS
Pangalan : getShiftAt(timeMs) | File: js/core/shift-freshness.js | Output: { name, startMs } | Ginagawa: shift ng oras at simula nito (Night na 12:00 AM-7:29 AM ay nagsimula noong nakaraang gabi) | Tinatawag ng: isOutdated, describeShift, watch
Pangalan : isOutdated(dataMs, nowMs) | Output: boolean | Ginagawa: true kapag dataMs ay mas maaga kaysa simula ng kasalukuyang shift; walang oras = false | Tinatawag ng: mark
Pangalan : describeShift(dataMs) | Output: { shift, date } | Ginagawa: shift at petsa ng data para sa note | Tinatawag ng: mark
Pangalan : mark(block, dataMs, nowMs) | Output: block | Ginagawa: naglalagay ng .sf-block-outdated at OUTDATED badge (textContent lang) sa unahan ng block | Tinatawag ng: dashboard-machines.js (withFreshness)
Pangalan : watch(onChange) | Output: function na pangtigil | Ginagawa: kada WATCH_MS at sa visibilitychange, tinitingnan kung nagbago ang simula ng shift; tinatawag ang onChange | Tinatawag ng: dashboard-machines.js (init); itinitigil ng stopTimer
Pangalan : withFreshness(block, dataMs, nowMs) | File: js/pages/dashboard-machines.js | Ginagawa: tawag sa shiftFreshness.mark kung naka-load | Tinatawag ng: buildCorrelBlock, buildAlertBlock, buildMachineTile, renderSender
Pangalan : readWithYesterday(reader) | File: js/pages/dashboard-machines.js | Ginagawa: reader(petsa ngayon); kung null, reader(petsa ng kahapon) | Tinatawag ng: readOwnCorrel, loadPreviewDetails, loadCompareDetails
Pangalan : getYesterdayName() | File: js/pages/dashboard-machines.js | Output: yyyy-mm-dd ng kahapon | Tinatawag ng: readWithYesterday
C. VARIABLES / CONSTANTS
stopShiftWatch | js/pages/dashboard-machines.js | let function/null (nasa loob ng module) | pangtigil ng shift watcher | init, stopTimer
shiftFreshnessConfig.SHIFT / WATCH_MS / CLASS / TEXT | js/core/shift-freshness-config.js | const | oras ng shift, interval, class at text ng badge | shift-freshness.js
calibrationConfig.LATEST.DATE_READONLY | js/core/calibration-config.js | const boolean | [BINAGO v11] true -> false: editable ang Date ng Calibration Correl | js/pages/calibration.js (init, onRun)
D. EVENTS
visibilitychange | document | shift-freshness.js (watch) | tinitingnan agad ang shift pagbalik sa tab
E. STORAGE / API: walang bagong localStorage key o endpoint (basa lang ng modifiedMs ng mga file na binabasa na ng Dashboard)
F. CSS VARIABLES: walang bago (kulay ng badge ay nasa shift-freshness.css, may dark mode)
G. DEPENDENCY MAP: dashboard.html scripts: ... trend-tile -> shift-freshness-config -> shift-freshness -> dashboard-machines.js ; dashboard-machines.js -> shiftFreshness.mark / watch
PAGE CONTRACT (Dashboard, dagdag): INPUT modifiedMs ng correl, repeatability, trend, compare item | OUTPUT .sf-badge sa loob ng block | HTML ID: wala bago | DEPENDS: shiftFreshness.mark, shiftFreshness.watch

=== [v11] KNOWN ISSUES / TODO ===
  2026-11-22 | [v11] Hindi nasubukan sa totoong Chrome/Edge; nasubukan sa Node at jsdom ang shift logic (8 kaso) at ang badge.
  2026-11-22 | [AYOS v11.1] Ang Preview ng Master Repeatability ay tumitingin na rin sa folder ng kahapon (Sender).
  2026-11-22 | [v11] Kung walang file sa folder ng ngayon at ng kahapon (hal. mahigit isang araw na), walang ipapakita ang Sender (walang OUTDATED badge dahil walang data).
  2026-11-22 | [v11] Ang OUTDATED ay batay sa oras ng file (modifiedMs), hindi sa petsa ng record sa loob ng CSV.
  2026-11-22 | [v11] Calibration Correl: ang Excel export ay napupunta sa folder ng petsa ng export (ngayon), kahit lumang petsa ang pinili; hindi ibinabalik ang resulta sa pagbalik sa page kung ang petsa ay hindi ngayon.

=== [v11.2] OVERVIEW ===
B. FUNCTIONS (js/core/calibration-analysis.js, window.BMWW.calibrationAnalysis)
getActualSource(rowList, rowIndex, layout) -> 'after' | 'before' | null | After kung may laman; kung blangko, Before (Daily Check); null kung blangko ang pareho | Tinatawag ng: analyzeLatest, calibration-repeatability.js (analyzeRange), calibration-compare.js (findPrevious)
readActualPoints(rowList, rowIndex, layout, source) -> { actualList, masterList } | Actual ay galing sa source | Tinatawag ng: analyzeLatest, findPrevious
getActualAverageColumn(layout, source) -> column ng AVG ng After o Before (-1 kung wala) | Tinatawag ng: analyzeLatest, findPrevious
getTypeSuffix(source) -> '' (after) | ' (Daily Check)' (before) | Tinatawag ng: analyzeLatest, analyzeRange, findPrevious
hasValues(rowList, rowIndex, startColumn, count) (panloob) | may kahit isang numero ba ang group
locateLayout: may bago nang beforeStart at beforeAverageColumn ; [LUMA v11.2] readPoints ng calibration-analysis.js at calibration-compare.js (pinalitan ng readActualPoints)
C. VARIABLES / CONSTANTS: calibrationConfig.GROUP.before = 'before' | calibrationConfig.TEXT.typeSuffix = { after: '', before: ' (Daily Check)' }
D. EVENTS: walang bago | E. STORAGE / API: walang bago (basa lang ng CSV)
G. DEPENDENCY MAP: calibration-repeatability.js, calibration-compare.js -> calibrationAnalysis.getActualSource / readActualPoints / getTypeSuffix

=== [v11.2] KNOWN ISSUES / TODO ===
  2026-11-22 | [v11.2] Hindi nasubukan sa totoong Chrome/Edge; nasubukan sa Node at jsdom gamit ang CalibSts.csv (Daily Check) at CalibSts_261114085817.csv (buong calibration).
  2026-11-22 | [v11.2] Sa Calibration Repeatability, pinaghahalo ang Calibration at Daily Check sa iisang chart (may ' (Daily Check)' sa legend). Kung gusto ng hiwalay o filter, kailangan ng bagong option.
  2026-11-22 | [v11.2] Ang Daily Check ay gumagamit ng Before bilang Actual; ang Master at barcode ay sa iisang file. Kung magkaiba ang barcode ng mga file sa saklaw (hal. 447 at 459), ang unang file ang batayan ng barcode; ang iba ay may blangkong punto.
  2026-11-22 | [v11.2] Ang Dashboard ay wala pa ring tile para sa Calibration Correl at Calibration Repeatability.

=== [v11.3] OVERVIEW ===
B. FUNCTIONS: computeOwnMasterStats(columnList, masterList, barcodeList) | js/core/calibration-repeatability.js (panloob) | parehong hugis ng masterAnalysis.computeRepeatability; ang bawat column.masterValues[index] ang Master ng record | Tinatawag ng: analyzeRange
C. VARIABLES: column.masterValues (array, Master ng record na iyon) | result.masterList (Master ng pinakabagong record, display lang)
G. DEPENDENCY MAP: calibration-repeatability.js -> masterAnalysis.classifyRange, CONFIG.MASTER.RANGE

=== [v11.3] KNOWN ISSUES / TODO ===
  2026-11-22 | [v11.3] Hindi nasubukan sa totoong Chrome/Edge; nasubukan sa Node at jsdom (pareho ang resulta kapag pareho ang Master; iba kapag magkaiba ang Master ng mga record).
  2026-11-22 | [v11.3] Ang kulay ng dot ng bawat record sa chart at ng Actual avg sa table (calibration-repeatability-ui.js) at ang Excel (calibration-repeatability-export.js) ay gumagamit pa rin ng Master ng pinakabagong record; kapag nagbago ang Master sa pagitan ng mga record, maaaring hindi tugma ang kulay sa Avg diff. Kailangan ng permission sa dalawang file na iyon.

=== [v12] OVERVIEW ===
A. FILES
js/core/calibration-tile-config.js | window.BMWW.calibrationTileConfig: KIND (correl, repeatability: SUBFOLDER, FILE_PREFIX, FILE_EXTENSION), OPTION (STORAGE_KEY, DEFAULT, FIELD_LIST), SELECTOR.options, CLASS, TEXT
js/core/calibration-tile.js | window.BMWW.calibrationTile: block, basa ng Excel at Preview ng Calibration Correl at Calibration Repeatability (Sender at LEAD PC)
js/core/dashboard-options.js | window.BMWW.dashboardOptions: opsyon ng Dashboard (checkbox ng opsyonal na Repeatability)
css/pages/dashboard-options.css | style ng #dm-options (naka-scope sa .page-dashboard)
B. FUNCTIONS
Pangalan : readInSavingPath(rootHandle, machineName, dayName, kind) | File: js/core/calibration-tile.js | Output: Promise<details|null> | Ginagawa: pinakabagong Excel sa <Saving path>\<subfolder>\<dayName>\ (o \<machine>\<dayName>\) | Tinatawag ng: dashboard-machines.js (readOwnCorrel), loadPreviewDetails | Error: try/catch, may dahilan sa issueMap
Pangalan : readForMachine(serverHandle, machineName, kind) | Ginagawa: pinakabagong Excel ng machine sa <Server path>\<subfolder>\<machine>\<petsa>\ (pinakabagong petsa muna) | Tinatawag ng: attachToItems, loadPreviewDetails
Pangalan : attachToItems(serverHandle, machineItemList, includeRepeatability) | Ginagawa: LEAD PC: nilalagay sa item.calibrationCorrel at item.calibrationRepeatability (null kung wala o kung hindi hiningi) | Tinatawag ng: dashboard-machines.js (renderLead)
Pangalan : buildBlock(kind, details, nowMs, machineName, isSender) | Output: elemento | Ginagawa: status (icon at text), buod, Preview; kahon na may dahilan kung walang nabasa | Tinatawag ng: dashboard-machines.js (buildCalibrationBlock)
Pangalan : openPreview(kind, machineName, isSender) | Ginagawa: bagong tab (previewTab.open) na may buod, chart at sheet | Tinatawag ng: Preview button
Panloob: readCached, readCorrelFields (R Square, Date, AVG, table ng slider mula sa grid), findLatestInFolder, findMachineFolder, getIssueText, buildCorrelChart, buildRepeatabilityChart, computeTrend, buildPage, loadPreviewDetails, showBlocked
Pangalan : get() / mount(container, onChange) | File: js/core/dashboard-options.js | Ginagawa: basa ng opsyon (default OFF) / paglalagay ng checkbox sa #dm-options | Tinatawag ng: dashboard-machines.js (isOptionShown, mountOptions)
Pangalan : buildTileBlocks(data, nowMs, machineName, isSender) | File: js/pages/dashboard-machines.js | Ginagawa: iisang pagkakasunod ng block ng tile (Sender at LEAD PC) | Tinatawag ng: buildMachineTile, renderSender
Pangalan : buildCalibrationBlock, isOptionShown(field), mountOptions() | File: js/pages/dashboard-machines.js | Ginagawa: block na may OUTDATED badge / tanong kung ipapakita ang opsyonal na block / checkbox at refresh kapag may binago
[BINAGO v12] hasRepeatabilityFail: false kapag nakatago ang Master Repeatability | renderLead: dagdag na attachToItems ng calibrationTile | readOwnCorrel: dagdag na ownCalibrationCorrel at ownCalibrationRepeatability
C. VARIABLES / CONSTANTS
ownCalibrationCorrel, ownCalibrationRepeatability | js/pages/dashboard-machines.js | let (nasa loob ng module) | huling nabasa ng Sender | readOwnCorrel, renderSender
calibrationTileConfig.OPTION.STORAGE_KEY = 'bmww.dashboardOptions' | DEFAULT = { masterRepeatability: false, calibrationRepeatability: false }
detailsCache, issueMap | js/core/calibration-tile.js | const Map (panloob) | cache kada file at dahilan kung walang nabasa
D. EVENTS: change | checkbox sa #dm-options | dashboard-options.js | isine-save ang opsyon at nire-refresh ang Dashboard | click | Preview button | calibration-tile.js | openPreview
E. STORAGE / API: localStorage bmww.dashboardOptions (JSON ng dalawang boolean) | Basa lang ng <Saving path>\calibration-correl, \calibration-repeatability at <Server path> (mga Excel na ginagawa na ng Calibration page)
F. CSS VARIABLES: walang bago (gumagamit ng --space-*, --color-* at ng mga class ng Master Correl tile)
G. DEPENDENCY MAP: dashboard.html scripts: ... repeatability-tile -> calibration-tile-config -> calibration-tile -> dashboard-options -> ... dashboard-machines.js ; dashboard-machines.js -> calibrationTile, dashboardOptions ; calibration-tile.js -> repeatabilityReader.readDetailsFromFile (parehong layout ng Excel), correlSyncConfig, previewTab, chart
PAGE CONTRACT (Dashboard, dagdag): INPUT Excel sa calibration-correl at calibration-repeatability (Saving path / Server path), localStorage bmww.dashboardOptions | OUTPUT block ng Calibration Correl at opsyonal na Repeatability sa tile | HTML ID: #dm-options | DEPENDS: calibrationTile, dashboardOptions

=== [v12] KNOWN ISSUES / TODO ===
  2026-11-22 | [v12] Hindi nasubukan sa totoong Chrome/Edge at totoong Server path; nasubukan sa Node at jsdom (Excel na gawa ng sarili nating export ng Calibration Correl at Calibration Repeatability ang binasa; pekeng folder ang ginamit; pagbasa ng Sender at LEAD PC, dahilan kung walang nabasa, block at checkbox).
  2026-11-22 | [v12] Ang pagkakasunod ng tile ay hindi pa nakita sa totoong browser (buildTileBlocks); suriin ang Worst slider sa itaas ng Trend.
  2026-11-22 | [v12] Ang Worst slider ay ang Master Compare (lumalabas lang kapag may na-detect). Wala pang worst slider ng Calibration Compare sa Dashboard.
  2026-11-22 | [v12] Master Unit Correl: slot lang (komento sa buildTileBlocks); wala pang laman (future upgrade).
  2026-11-22 | [v12] Ang Calibration Correl at Calibration Repeatability ay kailangang may Excel na galing sa v9.0 / v9.2 pataas (may Status sa buod); ang Calibration Repeatability na walang folder ng petsa ngayon o kahapon ay 'Wala pang resulta'.
  2026-11-22 | [v12] Ang Sender ay bumabasa ng folder ng petsa ngayon at kahapon lang; ang LEAD PC ay bumabasa ng pinakabagong folder ng petsa sa Server (puwedeng lumabas na LUMA).
  2026-11-22 | [v12] Ang chip na 'Correl fail' sa buod ay Master Correl pa rin; walang FAIL alert para sa Calibration Correl.


=== [v13] LOT TRACKING YUGTO 1 (OVERVIEW) ===
A. FILES
js/core/lot-config.js | window.BMWW.lotConfig: UNIT (TIME_PATTERN, SHOW_UNMATCHED), RESULT (PATH_COLUMN), ACTIVE_STORE (KEY, VERSION, MAX_FIRST_SEEN)
js/core/lot-unit-collector.js | window.BMWW.lotUnitCollector: pagsasama ng file/folder sa isang LOT Unit at unang nakita
js/core/lot-active-store.js | window.BMWW.lotActiveStore: save, load, clear ng aktibong lote sa localStorage
[BINAGO v13] pages/lot-tracking.html at js/templates/lot-tracking.template.js: dagdag na column na LOT Unit at Unang nakita (Source, LOT Unit, Date Modified, Unang nakita, Type, Path, Wafer, Blk, Layer No., File Name) at 3 <script> ng mga bagong core file bago ang js/pages/lot-tracking.js
B. FUNCTIONS
Pangalan : collectUnits(itemList, firstSeenMap, nowMs) | File: js/core/lot-unit-collector.js | Input: itemList (mula sa scanDirectory), firstSeenMap (object), nowMs | Output: { rowList, isFirstSeenChanged } | Ginagawa: isang row kada LOT Unit (Wafer + Layer No. + Blk, hal. 4A25C20A); End moment ng row = pinakabagong modifiedMs ng mga file ng unit; ang file/folder na hindi tumama sa pangalan ay row na walang LOT Unit kung UNIT.SHOW_UNMATCHED; pinakabago ang nasa unahan; binabago mismo ang firstSeenMap | Tinatawag ng: lot-tracking.js (refreshResults)
Pangalan : isTimeItem(item), buildUnitName(item), pickPrimary(itemList), resolveFirstSeen(map,key,nowMs,state), buildRow(...) (panloob) | File: js/core/lot-unit-collector.js | Ginagawa: tukoy ng _Time, pangalan ng unit, pangunahing file (hindi _Time; kung pareho ang uri, pinakaluma), unang nakita (key 'unit|<LOT Unit>' o 'item|<source>|<path>'), at hugis ng row | Tinatawag ng: collectUnits
Pangalan : save(state) | File: js/core/lot-active-store.js | Input: { machine, lote, firstSeen } | Ginagawa: isinusulat ang bmww.activeLote (try/catch, tahimik kung pumalya) | Tinatawag ng: lot-tracking.js (saveActive)
Pangalan : load(machine) | Output: { lote, firstSeen } | null | Ginagawa: binabasa at bina-validate (version, machine, barcode, operator 2-30, startMs); null kung wala, sira, o ibang machine | Tinatawag ng: lot-tracking.js (restoreActiveLote)
Pangalan : clear() | Ginagawa: binubura ang bmww.activeLote | Tinatawag ng: lot-tracking.js (endLote, onNewLote)
Pangalan : cleanFirstSeen(rawMap), isPositiveInteger(value) (panloob) | File: js/core/lot-active-store.js | Ginagawa: numero lang ang halaga; pinakabagong MAX_FIRST_SEEN (500) lang ang itinatabi | Tinatawag ng: save, load
Pangalan : saveActive() | File: js/pages/lot-tracking.js | Ginagawa: tawag sa lotActiveStore.save gamit ang currentMachine, lote at firstSeenMap | Tinatawag ng: startLote, refreshResults (kapag may bagong unang nakita at ONGOING)
Pangalan : restoreActiveLote() | File: js/pages/lot-tracking.js | Ginagawa: ibinabalik ang naka-save na lote at firstSeenMap; hindi ginagalaw kung may lote na sa memory | Tinatawag ng: init
[BINAGO v13] renderResults(rowList, warnings): isang row kada LOT Unit, 10 cell | refreshResults: collectUnits bago mag-render (wala nang sariling sort) | startLote: firstSeenMap = {} at saveActive | endLote: activeStore.clear | onNewLote: firstSeenMap = {} at activeStore.clear | init: currentMachine at restoreActiveLote bago ang renderLote
C. VARIABLES / CONSTANTS
firstSeenMap | js/pages/lot-tracking.js | let object (nasa loob ng IIFE) | { key: ms } ng unang nakita ng bawat unit | refreshResults, saveActive, startLote, onNewLote, restoreActiveLote
currentMachine | js/pages/lot-tracking.js | let string | Machine name na ginagamit sa pag-save at pag-restore | init, saveActive, restoreActiveLote
lotConfig.UNIT.TIME_PATTERN = /_time(\.[^.\\/]*)?$/i | lotConfig.UNIT.SHOW_UNMATCHED = true [LUMA v14: ngayon ay false] | lotConfig.RESULT.PATH_COLUMN = 5 (posisyon ng Path column, 0-based) | lotConfig.ACTIVE_STORE = { KEY: 'bmww.activeLote', VERSION: 1, MAX_FIRST_SEEN: 500 }
[LUMA v13] CONFIG.LOT.PATH_COLUMN (config.js, = 3): hindi na ginagamit ng lot-tracking.js (pinalitan ng lotConfig.RESULT.PATH_COLUMN); hindi binura dahil hindi ginalaw ang config.js [BINURA v14]
D. EVENTS: walang bago
E. STORAGE / API: localStorage bmww.activeLote = JSON { version, machine, barcode, operator, startMs, firstSeen: { key: ms } } | isinusulat sa simula ng lote at kapag may bagong unang nakita | binubura sa END at NEW LOTE | walang bagong endpoint; basa lang sa mga folder ng machine gaya ng dati
F. CSS VARIABLES: walang bago (walang ginalaw na CSS; ang table ay may horizontal scroll na)
G. DEPENDENCY MAP: lot-tracking.html/template scripts: lot-config -> lot-unit-collector -> lot-active-store -> js/pages/lot-tracking.js ; lot-tracking.js -> lotUnitCollector.collectUnits, lotActiveStore.save/load/clear, lotConfig.RESULT ; lot-unit-collector.js -> lotConfig.UNIT ; lot-active-store.js -> lotConfig.ACTIVE_STORE, CONFIG.LOT, security.sanitizeInput
PAGE CONTRACT (lot-tracking, dagdag): INPUT Barcode, Operator, machineName (Settings), folder handle ng Data source 1-3, localStorage bmww.activeLote | OUTPUT Start/End Date at Time, badge, RESULT (isang row kada LOT Unit), naka-save na aktibong lote | HTML ID: walang bagong id (column lang ang bago) | DEPENDS: lotUnitCollector.collectUnits, lotActiveStore.save/load/clear, lotConfig

=== [v13] KNOWN ISSUES / TODO ===
  2026-11-22 | [v13] Hindi nasubukan sa totoong Chrome/Edge; ang lot-unit-collector at lot-active-store ay nasubukan sa Node (13 kaso). Ang lot-tracking.js, html at template ay syntax check lang; unang test ay sa device ng user.
  2026-11-22 | [v13] Date Modified ang gamit (hindi mababasa ng browser ang Date Created). Ang Unang nakita ay oras ng scanner, hindi oras ng paggawa ng file: kapag sarado ang page, ang file na dati nang nandoon ay makukuhanan ng oras ng muling pagbukas.
  2026-11-22 | [v13] Pagkatapos mag-refresh, maaaring humingi ulit ng permission ang browser sa mga folder; lalabas ang babalang 'walang permission' sa RESULT hanggang payagan (ang Enter sa Barcode ang humihingi ng permission).
  2026-11-22 | [v13] UNIT.SHOW_UNMATCHED = true: ang file/folder na hindi tumama sa pangalan ng LOT Unit ay nakikita pa rin sa RESULT (spec 3.2 ay nagsasabing nilalaktawan). Gawing false para sundin ang spec. [AYOS v14]
  2026-11-22 | [v13] Hindi pa nai-DONE ang mga unit ng naunang lote (walang monitoring pa): End lang ng lote ang nalalagyan. Yugto 2 ang monitoring, shift, monitoring day at Lot Duration.
  2026-11-22 | [v13] Ang RESULT ay isang row kada LOT Unit kahit magkaiba ang source o folder ng mga file (pangalan lang ang batayan).
  2026-11-22 | [v13] Hindi pa kasama: Remarks, On hold (Yugto 3), Send sa Server (Yugto 4, walang Send PC), LEAD PC view (pagkatapos ng Yugto 4), bantay kapag walang aktibong lote (Yugto 6).


=== [v14] LOT TRACKING YUGTO 1 NATITIRA (OVERVIEW) ===
A. FILES
js/core/lot-validation.js | window.BMWW.lotValidation: normalizeBarcode, normalizeOperator, isValidOperator
js/core/lot-beep.js | window.BMWW.lotBeep: playBeep (maikling beep gamit ang Web Audio)
[BINAGO v14] js/core/lot-config.js (v2): dagdag na SOURCE, VALIDATION, BEEP; SHOW_UNMATCHED = false
[BINAGO v14] js/core/config.js (v10.2): tinanggal ang LOT.SOURCE_KEYS at LOT.PATH_COLUMN; binago ang TEXT.operatorInvalid at TEXT.enterOperator; bago ang TEXT.operatorCancelled
[BINAGO v14] js/pages/lot-tracking.js (v2.7) | pages/lot-tracking.html at js/templates/lot-tracking.template.js (v2.7, magkapareho): 2 bagong <script> (lot-validation, lot-beep) bago ang js/pages/lot-tracking.js
B. FUNCTIONS
Pangalan : normalizeBarcode(rawValue) | File: js/core/lot-validation.js | Input: string | Output: string | Ginagawa: sanitizeInput (trim, walang control character, limit CONFIG.LOT.BARCODE_MAX) tapos uppercase | Tinatawag ng: lot-tracking.js (handleBarcode) | Tumatawag ng: security.sanitizeInput
Pangalan : normalizeOperator(rawValue) | File: js/core/lot-validation.js | Input: string | Output: string | Ginagawa: sanitizeInput na may limit CONFIG.LOT.OPERATOR_MAX | Tinatawag ng: lot-tracking.js (handleOperator)
Pangalan : isValidOperator(operatorValue) | File: js/core/lot-validation.js | Input: string | Output: boolean | Ginagawa: true kung 2 hanggang 30 na character (CONFIG.LOT.OPERATOR_MIN/MAX) at tumama sa lotConfig.VALIDATION.OPERATOR_PATTERN | Tinatawag ng: lot-tracking.js (handleOperator)
Pangalan : getAudioContext() (panloob) | File: js/core/lot-beep.js | Output: AudioContext | null | Ginagawa: gumagawa ng isang AudioContext lang at ginagamit ulit; null kung walang suporta | Tinatawag ng: playBeep
Pangalan : playBeep() | File: js/core/lot-beep.js | Output: wala | Ginagawa: isang beep (lotConfig.BEEP); tahimik kung ENABLED = false, walang audio, o hinarang ng browser | Tinatawag ng: lot-tracking.js (handleBarcode, kapag END) | Error handling: try/catch, hindi tumitigil ang page
Pangalan : cancelOperator() | File: js/pages/lot-tracking.js | Ginagawa: kapag may hinihintay na Operator, nililinis ang Barcode, Operator, RESULT, firstSeenMap at ang naka-save na lote (activeStore.clear); iniiwan ang End ng naunang lote; mensaheng 'Kinansela' at balik ang cursor sa Barcode | Tinatawag ng: keydown Escape sa Operator | Tumatawag ng: stopTimer, activeStore.clear, renderLote, clearResults, setStatus
[BINAGO v14] handleBarcode: normalizeBarcode; ang parehong barcode ay END at beep | handleOperator: normalizeOperator at isValidOperator | loadSources: lotConfig.SOURCE.KEYS (dati CONFIG.LOT.SOURCE_KEYS) | init: keydown Escape sa Operator
C. VARIABLES / CONSTANTS
audioContext | js/core/lot-beep.js | let (nasa loob ng IIFE) | Isang AudioContext lang na ginagamit ulit | getAudioContext
validation, beep | js/pages/lot-tracking.js | const (root.lotValidation, root.lotBeep) | Mga helper ng input at tunog | handleBarcode, handleOperator
lotConfig.SOURCE.KEYS = ['source2', 'source3'] | lotConfig.VALIDATION.OPERATOR_PATTERN = /^[\p{L}\p{N} ._-]+$/u | lotConfig.BEEP = { ENABLED: true, WAVE: 'sine', FREQUENCY_HZ: 880, DURATION_MS: 200, VOLUME: 0.2 } | lotConfig.UNIT.SHOW_UNMATCHED = false
CONFIG.LOT.TEXT.operatorCancelled (bago) | operatorInvalid at enterOperator (binago ang text)
[BINURA v14] CONFIG.LOT.SOURCE_KEYS, CONFIG.LOT.PATH_COLUMN
D. EVENTS (listener)
keydown (Escape, hindi isComposing) | #operator (SEL.operator) | js/pages/lot-tracking.js | tatawag ng cancelOperator
E. STORAGE / API: walang bago; binubura ng cancelOperator ang bmww.activeLote (activeStore.clear)
F. CSS VARIABLES: walang bago (walang ginalaw na CSS)
G. DEPENDENCY MAP: lot-tracking.html/template scripts: lot-config -> lot-unit-collector -> lot-active-store -> lot-validation -> lot-beep -> js/pages/lot-tracking.js ; lot-validation.js -> lotConfig.VALIDATION, CONFIG.LOT, security.sanitizeInput ; lot-beep.js -> lotConfig.BEEP ; lot-tracking.js -> lotValidation, lotBeep, lotConfig.SOURCE
PAGE CONTRACT (lot-tracking, dagdag v14): INPUT: Esc sa Operator; folder handle ng Data source 2 at 3 lang | OUTPUT: beep at mensahe sa END, mensaheng 'Kinansela' | HTML ID: walang bago | DEPENDS: lotValidation, lotBeep, lotConfig.SOURCE

=== [v14] KNOWN ISSUES / TODO ===
  2026-11-22 | [v14] Nasubukan sa Node at jsdom (29 kaso). HINDI nasubukan sa totoong Chrome/Edge, sa totoong tunog, at sa totoong Data source; unang test ay sa device ng user.
  2026-11-22 | [v14] Ang beep ay maaaring hindi marinig kung hinarang ng browser ang audio o naka-mute ang tab; tahimik na lang ang nangyayari. Patayin sa lotConfig.BEEP.ENABLED.
  2026-11-22 | [v14] Ang Operator ay tumatanggap ng titik na may tuldik (Unicode). Kung A-Z lang ang gusto, palitan ang lotConfig.VALIDATION.OPERATOR_PATTERN.
  2026-11-22 | [v14] Kapag Esc sa Operator, ang naunang lote ay tapos na (na-END na bago itanong ang Operator, gaya ng dati); ang Esc ay hindi nagbabalik nito.
  2026-11-22 | [v14] Ang naka-save na lote bago ang v14 ay maaaring may lowercase na Barcode; case-insensitive pa rin ang paghahambing kaya tumutugma pa rin ang END.
  2026-11-22 | [v14] Hindi na binabantayan ng LOT ang Data source 1 (Calibration/Master). Ang ibang page ay hindi apektado.
  2026-11-22 | [v14] Hindi pa kasama: Yugto 0 (global na shift sa Settings; kailangan munang kumpirmahin ang gawi ng Master sa 6:30 PM hanggang 7:30 PM), Yugto 2 (monitoring JSON at Excel, shift, monitoring day, Duration, auto-DONE), Remarks at On hold (Yugto 3), Send sa Server (Yugto 4), LEAD PC view (Yugto 5), bantay kapag walang lote (Yugto 6).


=== [v15] YUGTO 0: GLOBAL NA SHIFT SA SETTINGS (OVERVIEW) ===
A. FILES
js/core/shift-times.js | window.BMWW.shiftTimes: global na oras ng shift (default, check, pagbasa mula sa localStorage ng Settings); naka-load sa index.html
js/core/shift-settings-config.js | window.BMWW.shiftSettingsConfig: selector, label ng apat na oras, text ng card
js/core/shift-settings.js | window.BMWW.shiftSettings: card na Shift sa Settings (init, read)
css/pages/shift-settings.css | style ng card (grid ng apat na oras), naka-scope sa .page-settings
[BINAGO v15] index.html (1 script: shift-times.js pagkatapos ng storage.js) | js/core/master-shift-config.js at js/core/shift-freshness-config.js (getter, FALLBACK_MINUTES) | js/pages/settings.js (3 hook) | pages/settings.html at js/templates/settings.template.js (magkapareho: link ng css, #shift-settings-card, 2 script)
B. FUNCTIONS
Pangalan : parseTime(text) | File: js/core/shift-times.js | Input: 'HH:MM' | Output: minuto ng araw o null | Ginagawa: 07:30 = 450; null kung mali ang anyo (hal. 7:30, 24:00) | Tinatawag ng: validateTimes
Pangalan : formatTime(minutes) | File: js/core/shift-times.js | Output: 'HH:MM' | Tinatawag ng: validateTimes
Pangalan : validateTimes(timeMap) | File: js/core/shift-times.js | Input: { dayStart, dayEnd, nightStart, nightEnd } ('HH:MM') | Output: { ok, minutes, times } o { ok: false, reason: 'format' | 'order', keyList } | Ginagawa: Day simula < Day wakas < Night simula, at Night wakas < Day simula | Tinatawag ng: shift-settings.js (read, init), resolveState
Pangalan : buildDefaultState(), resolveState(rawText) (panloob) | File: js/core/shift-times.js | Ginagawa: default na estado; estado mula sa naka-save na JSON (default kung wala, sira o hindi tama) | Tinatawag ng: getState
Pangalan : getState() (panloob) | File: js/core/shift-times.js | Ginagawa: binabasa ang localStorage (CONFIG.STORAGE_KEY) at ginagamit ulit ang resulta hangga't pareho ang laman | Tinatawag ng: getMinutes, getTimes
Pangalan : getMinutes() | File: js/core/shift-times.js | Output: { dayStart, dayEnd, nightStart, nightEnd } sa minuto | Tinatawag ng: master-shift-config.js at shift-freshness-config.js (getter ng startMinute at endMinute)
Pangalan : getTimes(), getDefaultTimes() | File: js/core/shift-times.js | Output: 'HH:MM' ng kasalukuyan o default | Tinatawag ng: shift-settings.js
Pangalan : getMinutes() (panloob, isa sa bawat config) | File: js/core/master-shift-config.js, js/core/shift-freshness-config.js | Ginagawa: root.shiftTimes.getMinutes(), o FALLBACK_MINUTES kung hindi na-load ang shift-times.js
Pangalan : makeElement, buildField (panloob) | File: js/core/shift-settings.js | Ginagawa: gumagawa ng element at ng field ng oras (label at input type time)
Pangalan : init(settings, onChange) | File: js/core/shift-settings.js | Ginagawa: ginagawa ang card sa #shift-settings-card; naka-save o default ang laman | Tinatawag ng: js/pages/settings.js (init, applyRestoredSettings)
Pangalan : read() | File: js/core/shift-settings.js | Output: { times, error } | Ginagawa: binabasa at sinusuri ang apat na input; minamarkahan ang may mali | Tinatawag ng: js/pages/settings.js (onSave)
C. VARIABLES / CONSTANTS
SHIFT_TIMES_CONFIG (shift-times.js, exposed bilang shiftTimes.CONFIG) = { FIELD: 'shiftTimes', KEY_LIST, DEFAULT_TIMES: { dayStart: '07:30', dayEnd: '18:30', nightStart: '19:30', nightEnd: '06:30' }, TIME_PATTERN, ERROR: { format, order } }
lastRawText, cachedState, isLoaded | shift-times.js | let (nasa loob ng IIFE) | cache ng estado ayon sa laman ng localStorage
FALLBACK_MINUTES | master-shift-config.js { dayStart: 450, dayEnd: 1110, nightStart: 1170, nightEnd: 390 } | shift-freshness-config.js { dayStart: 450, nightStart: 1170 } | panlaban lang
shiftSettingsConfig = { SELECTOR.card '#shift-settings-card', INPUT_ID_PREFIX 'shift-time-', FIELD_LIST, TEXT }
inputMap | shift-settings.js | let object | { key: input element } ng card
[LUMA v15] ang hardcoded na 450, 1110, 1170, 390 sa master-shift-config.js at shift-freshness-config.js; ngayon ay galing sa Settings (FALLBACK lang ang natira) | binago ang TEXT.error.noRecordInShift ng master-shift-config.js (wala nang nakasulat na oras)
D. EVENTS (listener)
input | bawat input ng oras (.shift-time-input) | shift-settings.js | aalisin ang error class at tatawag ng onChange (setDirty sa Settings)
click | .shift-time-reset | shift-settings.js | ibabalik ang default sa apat na input
E. STORAGE / API: field shiftTimes = { dayStart, dayEnd, nightStart, nightEnd } ('HH:MM') sa localStorage bmww.settings at sa settings ng machine (<Saving path> at <Server path>\settings\machines\sender o monitoring\<machine>.json); isinusulat ng Save settings; ibinabalik ng Ibalik ang settings; walang bagong endpoint
F. CSS VARIABLES: walang bago (gumagamit ng --space-3, --color-danger)
G. DEPENDENCY MAP: index.html -> shift-times.js (global) ; master-shift-config.js, shift-freshness-config.js -> shiftTimes.getMinutes ; settings.html/template -> shift-settings-config.js -> shift-settings.js -> shiftTimes ; settings.js -> shiftSettings.init/read
PAGE CONTRACT (settings, dagdag v15): INPUT: apat na oras sa card ng Shift | OUTPUT: field shiftTimes sa settings na isinasave | HTML ID: #shift-settings-card, #shift-time-dayStart, #shift-time-dayEnd, #shift-time-nightStart, #shift-time-nightEnd | DEPENDS: shiftSettings (optional), shiftTimes

=== [v15] KNOWN ISSUES / TODO ===
  2026-11-22 | [v15] Nasubukan sa Node at jsdom (27 kaso sa shift-times, Master, OUTDATED, fallback at card; kasama ang 1440 minuto na kapareho ng dating lohika; at ang pag-init ng Settings). HINDI nasubukan sa totoong Chrome/Edge, sa totoong Save sa folder, at sa pagbalik ng settings.
  2026-11-22 | [v15] Nasa settings ng BAWAT PC ang oras ng shift; gawing pareho sa Sender at LEAD PC. Kapag pinalitan sa Settings, ang ibang page na bukas na ay kukuha ng bago sa susunod na gamit; kung may nakalkula na (hal. tile ng Dashboard), i-refresh ang page.
  2026-11-22 | [v15] Ang pangalan ng shift ay hindi nagbago: Morning sa Master, Day sa OUTDATED at LOT. Ang trend-reader.js ay nagko-compare ng pangalang 'Morning'.
  2026-11-22 | [v15] Ang wakas ng Day at Night ay ginagamit ng Master Repeatability lang (may puwang na hindi isinasama). Ang OUTDATED at LOT ay gumagamit ng simula lang (tuloy-tuloy).
  2026-11-22 | [v15] Ang mga lumang settings na walang shiftTimes ay gagamit ng default (07:30, 18:30, 19:30, 06:30), kaya walang magbabago hanggang may i-save.
  2026-11-22 | [v15] Hindi pa ginagamit ng LOT Tracking ang shift (Yugto 2: Shift column at monitoring day = simula ng Day).

=== [v16] LOT TRACKING YUGTO 2: MONITORING (OVERVIEW) ===
Ang mga linya ng LOT Tracking sa itaas (v2.5) ay luma na sa ilang bahagi; ang nasa ibaba ang tama. Dagdag lang ang pagbabago.

A. FILES
js/core/lot-shift.js | Shift (Day/Night), monitoring day, 'ddmmyyyy' ng file, format ng petsa at oras
js/core/lot-monitoring-store.js | monitoring ng araw sa memorya: row kada LOT Unit, auto-DONE, sulat ng JSON at Excel sa Saving path at Server path
js/core/lot-monitoring-export.js | ginagawang Excel (.xlsx, 16 na column, kulay ng Status) ang monitoring doc
js/core/lot-config.js (v3) | dagdag na SHIFT at MONITORING
js/pages/lot-tracking.js (v2.8) | tumatawag sa lotMonitoringStore

B. FUNCTIONS
lotShift.getShift(ms) | ms -> 'Day' | 'Night' | Day kung minuto ng araw >= dayStart at < nightStart (shiftTimes.getMinutes()); Night ang iba | Tinatawag ng: lot-monitoring-store.createRow
lotShift.getMonitoringDay(ms) | ms -> { iso: 'yyyy-mm-dd', key: 'ddmmyyyy' } | kung bago mag-dayStart ang oras, kahapon ang araw | Tinatawag ng: lot-monitoring-store (buildDocKey, createEmptyDoc, readFromTarget)
lotShift.toFileKey(isoDay) | 'yyyy-mm-dd' -> 'ddmmyyyy' | Tinatawag ng: lot-monitoring-store.writeTarget
lotShift.formatDateTime(ms) | ms -> 'yyyy-mm-dd hh:mm:ss' (walang laman kung 0) | Tinatawag ng: lot-monitoring-export.buildCell
lotShift.pad(n), getMinuteOfDay(date) (panloob) | lot-shift.js
lotMonitoringStore.prepare(machine, startMs) | -> Promise<bool> | binabasa ang JSON ng araw (Saving path muna, tapos Server path) at itinatago sa memorya; false kung may folder na naka-set pero walang permission (hindi itinatago para hindi mapatungan ang file; susubukan ulit) | Tinatawag ng: lot-tracking.js (startLote, endLote, refreshResults, init)
lotMonitoringStore.requestAccess() | -> Promise | humihingi ng permission sa Saving path at Server path (kilos ng user) | Tinatawag ng: lot-tracking.requestAccess
lotMonitoringStore.startBlock(lote) | -> bool | gumagawa ng row na walang LOT Unit kung wala pang block | Tinatawag ng: startLote
lotMonitoringStore.recordUnit(lote, unitRow) | -> bool | itinatala ang LOT Unit nang isang beses (puno sa row na walang unit, o bagong row sa dulo ng block) | Tinatawag ng: lot-tracking.recordNewUnits
lotMonitoringStore.finishBlock(lote, endMs) | -> bool | ONGOING -> DONE, End-Time, Lot Duration (min) | Tinatawag ng: endLote, onNewLote
lotMonitoringStore.save(lote) | -> Promise<string[]> | pinipila ang sulat ng JSON at Excel; hindi nagtatapon ng error; ibinabalik ang listahan ng babala | Tinatawag ng: persistMonitoring, onNewLote
lot-monitoring-store.js (panloob) | buildDocKey, createEmptyDoc, normalizeRow, normalizeDoc, loadHandles, getMachineFolderName, getTargetFolder, readFromTarget, getDoc, getBlockIndexList, createRow, ensureBlock, writeFile, writeTarget, writeAll, runWriteLoop
lotMonitoringExport.buildBlob(doc) | doc -> Blob (.xlsx) | Tinatawag ng: lot-monitoring-store.writeAll
lot-monitoring-export.js (panloob) | getStatusStyle, isBlockStart, buildCell, buildSheet
lot-tracking.js (bago o binago) | waitForScan() | persistMonitoring(startMs) | recordNewUnits(rowList) | cancelOperator() [v2.7] | endLote() [LUMA v2.5: ngayon ay huling hanap muna habang aktibo, saka End at I-DONE] | startLote(operator) [dagdag: prepare, startBlock, persistMonitoring] | handleBarcode() [dagdag: requestAccess sa Enter] | onNewLote() [dagdag: finishBlock at save kapag aktibo] | refreshResults() [dagdag: prepare at recordNewUnits] | renderResults() [dagdag: babala ng monitoring] | init() [dagdag: prepare ng naibalik na lote]

C. VARIABLES / CONSTANTS
lotConfig.SHIFT = { DAY: 'Day', NIGHT: 'Night' } | lot-config.js
lotConfig.MONITORING = { VERSION 1, FOLDER 'monitoring', JSON_SUFFIX '_MONITORING.json', XLSX_SUFFIX '_MONITORING.xlsx', JSON_INDENT, SHEET_NAME 'LOT_TRACKING', TEXT_MAX 300, ROWS_MAX 20000, MS_PER_MINUTE, DURATION_DECIMALS 2, FINISH_WAIT_MS, FINISH_WAIT_MAX_MS, STATUS { ongoing, done }, SENT { notSent, sent }, COLUMN_LIST (16: field, header, type), TARGET { saving { handleKey 'root' }, server { handleKey 'server' } }, COLOR, AUTOFIT, TEXT }
docMap, writeStateMap, handleMap, isHandleLoaded, machineName | lot-monitoring-store.js | let/const (loob ng IIFE) | doc ng bawat araw ng machine, pila ng sulat, handle ng Saving path at Server path
monitorWarningList, lastScan | lot-tracking.js | let (loob ng IIFE) | mga babala ng monitoring at huling resulta ng hanap (para sa tala ng RESULT)
monitor, MONITORING | lot-tracking.js | const | shortcut sa lotMonitoringStore at lotConfig.MONITORING

D. EVENTS (listener): walang bago. Ang Enter sa Barcode ay tumatawag na ng requestAccess (permission ng Saving path, Server path at Data source).

E. STORAGE / API
JSON | <Saving path>\monitoring\ddmmyyyy_MONITORING.json at <Server path>\monitoring\<machine>\ddmmyyyy_MONITORING.json | { version 1, machine, monitoringDay 'yyyy-mm-dd', updatedMs, rows[] } | source of truth; row = 16 field: wafer, barcode, lotUnit, blk, layerNo, startMs, endMs, operator, machine, filePath, status, sentStatus, shift, remarks, sentMs, lotDurationMin
Excel | katabi ng bawat JSON, .xlsx | para sa pagtingin at pag-print (Barcode at Wafer isang beses kada block; kulay ng Status)
localStorage bmww.activeLote | walang pagbabago (v13)
IndexedDB handle | CONFIG.HANDLE_KEY.root (Saving path) at .server (Server path) | binabasa lang ng store; hindi sinusulat
Ang folder na monitoring sa Server path ay hiwalay sa settings\machines\monitoring ng Settings.

F. CSS VARIABLES: walang bago.

G. DEPENDENCY MAP
pages/lot-tracking.html -> xlsx-writer.js, lot-shift.js, lot-monitoring-export.js, lot-monitoring-store.js -> lot-tracking.js
lot-tracking.js -> lotMonitoringStore (prepare, startBlock, recordUnit, finishBlock, save, requestAccess)
lot-monitoring-store.js -> lotShift, lotMonitoringExport, storage (loadHandle, hasPermission, toMachineFileName), shiftTimes (sa pamamagitan ng lotShift)
lot-monitoring-export.js -> xlsx (buildWorkbook, computeColumnWidths, STYLE), lotShift.formatDateTime

PAGE CONTRACT (lot-tracking, dagdag v16): INPUT: Barcode, Operator, mga file sa Data source 2 at 3, Saving path at Server path (handle), oras ng shift (Settings) | OUTPUT: monitoring JSON at Excel (Saving path at Server path), mga babala sa tala ng RESULT | HTML ID: walang bago | DEPENDS: lotMonitoringStore, lotShift

=== [v16] KNOWN ISSUES / TODO ===
  2026-11-23 | [v16] Nasubukan sa Node (mga kaso: shift, monitoring day, 30 segundo = 0.5 min, unit nang isang beses, bagong row, JSON sa Saving at Server, Excel na nabubuksan sa openpyxl). HINDI nasubukan sa totoong Chrome/Edge: ang pag-click, permission, at pagsulat sa totoong folder.
  2026-11-23 | [v16] Ang File Path sa monitoring ay ang relative na path na nakikita ng browser (pangalan ng source folder/subfolder/file), hindi buong path ng drive; hindi ito kayang basahin ng browser.
  2026-11-23 | [v16] Ang Barcode at Wafer sa Excel ay isang beses kada block (hindi tunay na merge; hindi kaya ng xlsx-writer.js, na hindi ginalaw). Ang Lot Duration ay numero (0.5 ang nakikita para sa 0.50).
  2026-11-23 | [v16] Kapag bukas ang Excel file ng monitoring sa Excel, hindi ito maisusulat (may babala); ang JSON ay naisusulat pa rin. Isang machine = isang file, walang lock.
  2026-11-23 | [v16] Kapag may Saving path o Server path na walang permission pagkatapos mag-refresh, hindi pa nababasa ang file ng araw hangga't walang Enter sa Barcode (para hindi mapatungan); may babala sa tala ng RESULT.
  2026-11-23 | [v16] Ang lote na tumawid sa 7:30 AM ay nananatili sa file ng araw ng Start nito. Ang End-Time ng bawat unit ay End ng lote (hindi ang pinakabagong file ng unit).
  2026-11-23 | [v16] Shift: Day mula sa simula ng Day hanggang bago ang simula ng Night (kaya ang 18:30 hanggang 19:30 ay Day); hindi ginagamit ang dayEnd at nightEnd (kapareho ng OUTDATED).
  2026-11-23 | [v16] Wala pa: Remarks at On hold (Yugto 3), Send (Yugto 4), LEAD PC view (Yugto 5), pagbabantay kapag walang lote (Yugto 6). Ang NEW LOTE ay window.confirm pa rin.

=== [v17] LOT TRACKING YUGTO 3: REMARKS AT ON HOLD (OVERVIEW) ===
A. FILES
js/core/lot-remarks.js | Remarks dialog (9 opsyon), check ng Manual input, talaan ng mga unit na natanong na (localStorage)
js/core/lot-onhold.js | hold file sa onhold\ ng Server path at Saving path; tanggal ng hold ayon sa barcode
js/core/lot-config.js (v4) | dagdag na REMARKS at ONHOLD
js/core/lot-monitoring-store.js (v2) | dagdag na getUnitList, setRemarks, hasFinalMeas
js/pages/lot-tracking.js (v2.9) | dagdag na askPendingRemarks, applyRemark, getLoteKey; tumatawag sa lotRemarks at lotOnhold
pages/lot-tracking.html, js/templates/lot-tracking.template.js (v2.9) | dagdag na <dialog id="lot-remarks-dialog"> at script ng lot-remarks.js at lot-onhold.js
css/pages/lot-tracking.css (v2.9) | style ng .lot-remarks-dialog
B. FUNCTIONS
lotRemarks.ask(unitName) | lot-remarks.js | -> Promise<{isCancelled,key,type,text}> | binubuksan ang dialog at hinihintay ang OK, Cancel o Esc | Tinatawag ng: lot-tracking.js askPendingRemarks | Tumatawag ng: query, renderOptions, validateManual
lotRemarks.validateManual(text) | lot-remarks.js | -> {isValid,value,error} | sanitize, hanggang 100 letra, bawal ang walang laman at ang unang letra na = + - @ | Tinatawag ng: ask (onOk) | Tumatawag ng: security.sanitizeInput
lotRemarks.isAsked(loteKey, unitName), lotRemarks.markAsked(loteKey, unitName) | lot-remarks.js | -> bool / wala | talaan ng natanong na unit sa localStorage | Tinatawag ng: askPendingRemarks | Tumatawag ng: loadAsked
lot-remarks.js (panloob) | query(key), renderOptions(container), loadAsked(loteKey) | ask: getChosenOption, onChange, onOk, onCancel, onClose
lotOnhold.write(info) | lot-onhold.js | info {barcode,lotUnit,wafer,operator,machine,pcName,timeMs} -> Promise<string[]> | isinusulat ang hold file sa Server path at Saving path; ibinabalik ang babala ng pumalya | Tinatawag ng: lot-tracking.js applyRemark | Tumatawag ng: buildFileName, buildContent, writeTarget
lotOnhold.removeByBarcode(barcode) | lot-onhold.js | -> Promise<string[]> | tinatanggal ang lahat ng <Barcode>__* sa onhold\ ng dalawang folder | Tinatawag ng: lot-tracking.js startLote | Tumatawag ng: buildPrefix, removeTarget
lotOnhold.buildFileName(info) | lot-onhold.js | -> text | <Barcode>__<LOT Unit>.txt (ligtas na pangalan) | Tinatawag ng: write
lot-onhold.js (panloob) | toSafeName, buildPrefix, pad, formatTime, buildContent, getHandle, writeTarget, removeTarget
lotMonitoringStore.getUnitList(lote) | lot-monitoring-store.js | -> [{lotUnit,wafer,remarks}] | mga unit ng block ng lote | Tinatawag ng: askPendingRemarks | Tumatawag ng: getDoc, getBlockIndexList
lotMonitoringStore.setRemarks(lote, unitName, text) | lot-monitoring-store.js | -> bool | isinusulat ang Remarks sa row ng unit (hindi pa nagse-save sa file) | Tinatawag ng: applyRemark | Tumatawag ng: getDoc, getBlockIndexList
lotMonitoringStore.hasFinalMeas(lote, wafer, unitName) | lot-monitoring-store.js | -> bool | may Final Meas. na ba ang wafer sa ibang unit ng araw | Tinatawag ng: applyRemark | Tumatawag ng: getDoc
getLoteKey(lote) | lot-tracking.js | -> text | Barcode|Start | Tinatawag ng: askPendingRemarks
applyRemark(loteSnapshot, unit, answer) | lot-tracking.js | -> Promise<void> | Final Meas. na babala, setRemarks, hold file kung On hold, persistMonitoring, status | Tinatawag ng: askPendingRemarks | Tumatawag ng: monitor.hasFinalMeas, monitor.setRemarks, onhold.write, persistMonitoring, setStatus
askPendingRemarks() | lot-tracking.js | -> Promise<void> | itinatanong ang bawat unit na walang Remarks at hindi pa natatanong; isa lang ang sabay | Tinatawag ng: refreshResults | Tumatawag ng: monitor.getUnitList, remarks.isAsked, remarks.markAsked, remarks.ask, applyRemark
[v17 dagdag sa dati] refreshResults (lot-tracking.js) ay tumatawag na rin sa askPendingRemarks; startLote ay tumatawag na rin sa onhold.removeByBarcode (hindi hinihintay).
C. VARIABLES / CONSTANTS
lotConfig.REMARKS | lot-config.js | const | OPTION_LIST (9: key, label, type text|manual|hold), FINAL_KEY 'final', MANUAL_MAX 100, FORBIDDEN_FIRST [= + - @], ASKED_STORE {KEY 'bmww.lotRemarksAsked', VERSION 1, MAX_UNITS 500}, SELECTOR (dialog, unit, options, manual, error, ok, cancel), RADIO_NAME, TEXT | Ginagamit sa: lot-remarks.js, lot-tracking.js, lot-monitoring-store.js
lotConfig.ONHOLD | lot-config.js | const | FOLDER 'onhold', SEPARATOR '__', EXTENSION '.txt', LINE_END, UNSAFE_PATTERN, TARGET (server, saving), FIELD, TEXT | Ginagamit sa: lot-onhold.js, lot-tracking.js
isAskingRemarks | lot-tracking.js | let boolean (loob ng IIFE) | iwas dalawang dialog nang sabay | askPendingRemarks
REMARKS, remarks, onhold | lot-tracking.js | const | shortcut sa lotConfig.REMARKS, lotRemarks, lotOnhold
D. EVENTS (listener)
change | #lot-remarks-options | lot-remarks.js ask (onChange) | binubuksan ang Manual input kapag Manual input ang pinili
click | #lot-remarks-ok | lot-remarks.js ask (onOk) | sinusuri at isinasara ang dialog
click | #lot-remarks-cancel | lot-remarks.js ask (onCancel) | isinasara ang dialog na walang Remarks
close | #lot-remarks-dialog | lot-remarks.js ask (onClose) | tinatapos ang tanong (kasama ang Esc = Cancel); tinatanggal ang mga listener
E. STORAGE / API
localStorage "bmww.lotRemarksAsked" | lot-remarks.js | {version, loteKey, unitList[]} | mga unit ng aktibong lote na natanong na (isang lote lang; napapalitan kapag ibang lote)
<Server path>\onhold\<Barcode>__<LOT Unit>.txt at <Saving path>\onhold\<Barcode>__<LOT Unit>.txt | lot-onhold.js | Barcode, LOT Unit, Wafer, Operator, Machine, Time, PC name (isang linya bawat isa, CRLF) | hold file; tinatanggal kapag nagsimula ulit ang lote ng barcode
Monitoring JSON/Excel | lot-monitoring-store.js | column Remarks (ika-14) ay sinusulatan na ng Remarks | tingnan ang [v16]
F. CSS VARIABLES: walang bago (ginagamit ang --color-border, --color-primary, --color-primary-soft, --space-*, --radius, --radius-sm, --shadow-hover, --transition)
G. DEPENDENCY MAP
pages/lot-tracking.html -> lot-config.js -> lot-remarks.js, lot-onhold.js -> lot-monitoring-store.js -> lot-tracking.js
lot-tracking.js -> lotRemarks (ask, isAsked, markAsked), lotOnhold (write, removeByBarcode), lotMonitoringStore (getUnitList, setRemarks, hasFinalMeas)
lot-remarks.js -> security.sanitizeInput, lotConfig.REMARKS
lot-onhold.js -> storage (isFolderAccessSupported, loadHandle, hasPermission), CONFIG.HANDLE_KEY, lotConfig.ONHOLD
lot-monitoring-store.js -> lotConfig.REMARKS (FINAL_KEY, OPTION_LIST)
PAGE CONTRACT (lot-tracking, dagdag v17): INPUT: sagot sa Remarks dialog; mga LOT Unit na itinala sa monitoring | OUTPUT: Remarks sa monitoring (JSON at Excel), hold file sa onhold\ ng Server path at Saving path | HTML ID: lot-remarks-dialog, lot-remarks-title, lot-remarks-unit, lot-remarks-options, lot-remarks-manual, lot-remarks-error, lot-remarks-ok, lot-remarks-cancel (nasa lotConfig.REMARKS.SELECTOR) | DEPENDS: lotRemarks, lotOnhold, lotMonitoringStore, persistMonitoring
=== [v17] KNOWN ISSUES / TODO ===
  2026-11-23 | [v17] Nasubukan sa Node (fake folder handles) at jsdom (dialog). HINDI nasubukan sa totoong Chrome/Edge: ang <dialog>, pagsulat sa totoong Server path at Saving path, at ang pagtanggal ng hold file.
  2026-11-23 | [v17] Ang PC name sa hold file ay ang Machine name ng Settings; wala pang hiwalay na PC name. Sabihin kung iba ang gusto.
  2026-11-23 | [v17] Ang talaan ng natanong na unit ay iisang lote lang (localStorage). Kapag nagsimula ang ibang lote, napapalitan ito; kung ibalik ang lumang lote (hindi nangyayari sa daloy), itatanong ulit ang mga unit na walang Remarks.
  2026-11-23 | [v17] Ang Final Meas. na babala ay tumitingin lang sa monitoring ng araw ng lote (monitoring day); hindi tinitingnan ang ibang araw at ang file ng ibang machine.
  2026-11-23 | [v17] Ang Remarks ay nasa memorya hanggang matapos ang sulat ng monitoring; kung pumalya ang Saving path at Server path, may babala at susubukan ulit sa susunod na pagbabago.
  2026-11-23 | [v17] Ang hold file ay tinatanggal ayon sa barcode (lahat ng <Barcode>__*) kapag nagsimula ulit ang lote; hindi tinatanggal kapag ibang barcode ang na-scan. Ang monitoring row na On hold ay nananatili bilang tala.
  2026-11-23 | [v17] Ang mga lumang function sa lot-tracking.js at lot-monitoring-store.js ay may isang-linyang comment pa lang (hindi pa buong PARA SAAN/GINAGAWA/INPUT/OUTPUT/TINATAWAG NG/TUMATAWAG SA ng Rule 6); ang mga bagong function ay buo na. Kailangan ng permission mo para dagdagan ang mga luma.
  2026-11-23 | [v17] Wala pa: Send (Yugto 4), LEAD PC view (Yugto 5), pagbabantay kapag walang lote (Yugto 6).
