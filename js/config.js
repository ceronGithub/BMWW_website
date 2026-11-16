/**
 * FILE: js/config.js
 * ANO ITO: Ang nag-iisang lugar ng lahat ng config (selector, text, limit, path,
 *          storage key, patterns). Walang ibang ginagawa ang file na ito.
 * INPUT:   wala (data lang).
 * OUTPUT:  export const CONFIG (read-only). Ini-import ng ibang module.
 * PARA SA: Task 1 (dynamic PC tabs) at Task 2 (lote start + folder scan).
 * TANDAAN: Kapag may gustong baguhin sa layout, text, o limit, DITO lang.
 * BINAGO (micro 6b, may permission ni Ceron):
 *   - Ang mga field ng bawat MWW panel ay [data-field="..."] na, hindi na id
 *     (kopya ng template ang MWW 2, 3, ... kaya hindi puwedeng magkapareho ang id).
 *   - Dagdag: selector, class name, at data attribute para sa tabs at Add PC.
 * BINAGO (task 1 at 2):
 *   - defaultIp na ang nasa DEFAULT_PCS (ang mga IP row ay ginagawa na ng JS mula sa registry).
 *   - FILE_NAME_PATTERN ay kapareho na ng resultNamePattern sa Excel macro.
 *   - SCAN_INTERVAL_MS = 3000 (kapareho ng resultRefreshSeconds ng macro).
 *   - Dagdag: activePcId key, default server/database path, limit ng scan, mga message.
 */

export const CONFIG = Object.freeze({

  /* ===== STORAGE KEYS (Rule 13: iisang storage file lang ang gagamit nito) ===== */
  STORAGE_KEYS: Object.freeze({
    pcRegistry: "bmww.pcRegistry",
    activePcId: "bmww.activePcId",
    folderHandlesDatabase: "bmww.folderHandles",
    folderHandlesStore: "handles"
  }),

  /* ===== MGA PC (default) =====
     defaultIp = IP na galing sa LOT_TRACKING sheet ng Excel.
     Ang bawat PC (default man o bago) ay may sariling tab, dropdown option, at IP row. */
  PC_TYPES: Object.freeze({
    mww:  Object.freeze({ label: "MWW",     namePrefix: "MWW ",    ipLabelSuffix: " IP", startNumber: 1 }),
    lead: Object.freeze({ label: "LEAD PC", namePrefix: "LEAD PC", ipLabelSuffix: " IP", startNumber: 1 })
  }),
  DEFAULT_PCS: Object.freeze([
    Object.freeze({ id: "mww1",  type: "mww",  name: "MWW 1",    defaultIp: "\\\\192.168.212.23" }),
    Object.freeze({ id: "mww2",  type: "mww",  name: "MWW 2",    defaultIp: "\\\\192.168.212.21" }),
    Object.freeze({ id: "lead1", type: "lead", name: "LEAD PC1", defaultIp: "\\\\10.120.8.46" }),
    Object.freeze({ id: "lead2", type: "lead", name: "LEAD PC2", defaultIp: "\\\\10.120.8.55" })
  ]),
  MAX_PC_PER_TYPE: 20,

  /* ===== MGA PATH NA SISILIPIN SA RESULT (Task 2) ===== */
  WATCH_PATHS: Object.freeze([
    Object.freeze({ key: "calib",  label: "Calib",  fieldName: "filePath3", defaultPath: "C:\\BM-Logging\\Calib" }),
    Object.freeze({ key: "clo1a",  label: "CLO1A",  fieldName: "filePath1", defaultPath: "C:\\BM-Logging\\CLO1A" }),
    Object.freeze({ key: "clo1a1", label: "CLO1A1", fieldName: "filePath2", defaultPath: "C:\\BM-Logging\\CLO1A1" })
  ]),
  DEFAULT_SERVER_PATH: "\\\\PHLSVR215\\Slider MRPC MAT On-Hold\\Documentation\\MWW-FILES",
  DEFAULT_DATABASE_PATH: "C:\\Users\\Ceron Calsena\\OneDrive\\Desktop\\BM_ANALYZER_Files\\Tracking_lot",
  SCAN_INTERVAL_MS: 3000,
  MAX_SCAN_DEPTH: 5,
  MAX_SCAN_ENTRIES: 20000,
  MAX_RESULT_ROWS: 100,
  IGNORED_FILE_NAMES: Object.freeze(["Thumbs.db", ".DS_Store", "desktop.ini"]),
  IGNORED_FILE_PREFIXES: Object.freeze(["~$"]),

  /* ===== PAG-PARSE NG PANGALAN NG FILE/FOLDER (Wafer / Layer / Blk) =====
     GALING SA resultNamePattern ng Excel macro, hal. 4A25C20A -> Wafer 4A25C, Layer 20, Blk A.
     Ang pagkakasunod ng group: 1 = Wafer, 2 = Layer No., 3 = Blk. */
  FILE_NAME_PATTERN: /^([A-Z0-9]{5})([0-9]{1,3})([A-Z])/i,

  /* ===== ID AT SELECTOR (Rule 5: nakalista dito lahat ng ginagamit ng JS) =====
     Ang may tatak na BAGO ay wala pa sa index.html; idadagdag sa HTML micro task. */
  SELECTORS: Object.freeze({
    /* --- Nasa loob ng bawat MWW panel: hanapin gamit ang panel.querySelector(...) --- */
    barcodeInput: '[data-field="barcode"]',
    operatorInput: '[data-field="operator"]',
    startDateInput: '[data-field="startDate"]',
    endDateInput: '[data-field="endDate"]',
    startTimeInput: '[data-field="startTime"]',
    endTimeInput: '[data-field="endTime"]',
    machineNameInput: '[data-field="machineName"]',
    newLoteButton: '[data-field="newLoteButton"]',
    resultBody: '[data-field="resultBody"]',
    resultEmptyState: '[data-field="resultEmptyState"]',
    filePath3Input: '[data-field="filePath3"]',
    pickFolderButton: ".pickFolderButton",
    /* --- Isang beses lang sa page (shared) --- */
    toastStack: "#toastStack",
    mwwView: "#mwwView",
    leadView: "#leadView",
    pcRoleSelect: "#pcRoleSelect",
    addPcButton: "#addPcButton",
    addPcDialog: "#addPcDialog",
    addPcTypeSelect: "#addPcTypeSelect",
    addPcIpInput: "#addPcIpInput",
    addPcConfirmButton: "#addPcConfirmButton",
    addPcCancelButton: "#addPcCancelButton",
    pcIpList: "#pcIpList",
    /* --- BAGO (micro 6b) --- */
    pcTabsStrip: "#pcTabsStrip",
    addPcError: "#addPcError",
    pcPanelHost: "#pcPanelHost",
    mwwPanelTemplate: "#mwwPanelTemplate",
    /* --- BAGO (task 1 at 2) --- */
    filePath1Input: '[data-field="filePath1"]',
    filePath2Input: '[data-field="filePath2"]',
    serverPathInput: '[data-field="serverPath"]',
    databasePathInput: '[data-field="databasePath"]',
    scanStatus: '[data-field="scanStatus"]',
    loadSampleButton: "#loadSampleButton",
    clearSampleButton: "#clearSampleButton"
  }),
  CSS_CLASSES: Object.freeze({
    hidden: "isHidden",
    active: "isActive",
    /* BAGO (micro 6b): galing sa css/pcTabs.css at css/main.css */
    tab: "pc-tabs__tab",
    tabActive: "pc-tabs__tab--active",
    tabNew: "pc-tabs__tab--new",
    ipRow: "fieldRow",
    ipRowNew: "pc-ip-row--new",
    ipInput: "pathInput"
  }),
  /* BAGO (micro 6b): pangalan ng attribute. Dapat kapareho ng ginamit sa SELECTORS sa itaas. */
  DATA_ATTRIBUTES: Object.freeze({
    pcId: "data-pc-id",
    field: "data-field",
    pickKey: "data-pick-key",
    pickStatus: "data-pick-status"
  }),

  /* ===== TOAST ===== */
  TOAST_VISIBLE_MS: 2000,
  TOAST_LEAVE_AT_MS: 1700,

  /* ===== RIGHT-CLICK (Rule 18) =====
     Naka-block ngayon sa lahat (ayon sa kasalukuyang js/main.js).
     Lagyan ng "input", "textarea" kung papayagan sa paste. */
  RIGHT_CLICK_BLOCKED: true,
  RIGHT_CLICK_ALLOWED_SELECTORS: Object.freeze([]),

  /* ===== SQL INJECTION TRAPPER (Rule 19) =====
     Tinatamaan ang text na NA-NORMALIZE na (trim, URL-decode, lowercase, isang space lang). */
  SQL_INJECTION_PATTERNS: Object.freeze([
    /['"]\s*(or|and)\s/i,
    /['"]\s*or\s*['"]/i,
    /\bor\s+1\s*=\s*1\b/i,
    /--/,
    /\/\*/,
    /\*\//,
    /;/,
    /union\s+select/i,
    /\bdrop\b/i,
    /\binsert\b/i,
    /\bdelete\b/i,
    /\bupdate\b/i,
    /\bexec\b/i,
    /xp_/i,
    /sleep\s*\(/i,
    /benchmark\s*\(/i,
    /information_schema/i,
    /waitfor\s+delay/i
  ]),

  /* Whitelist ng pinapayagang characters kada uri ng field. */
  FIELD_WHITELISTS: Object.freeze({
    barcode:     /^[A-Za-z0-9]*$/,
    operator:    /^[A-Za-z0-9 ._-]*$/,
    machineName: /^[A-Za-z0-9 ._-]*$/,
    pcName:      /^[A-Za-z0-9 ]*$/,
    networkPath: /^[A-Za-z0-9 :\\._$()-]*$/
  }),

  /* ===== MGA MESSAGE SA USER ===== */
  MESSAGES: Object.freeze({
    machineRequired: "Lagyan muna ng Machine Name.",
    barcodeRequired: "I-scan o i-type muna ang Barcode.",
    operatorRequired: "Lagyan muna ng Operator.",
    inputNotAllowed: "May hindi pinapayagang character o salita sa input na ito.",
    pcAdded: "Naidagdag na ang bagong PC.",
    pcLimitReached: "Naabot na ang pinakamaraming PC sa ganitong uri.",
    folderNotPicked: "Pumili muna ng folder para ma-scan ang path na ito.",
    browserNotSupported: "Hindi sinusuportahan ng browser na ito ang folder access. Gamitin ang Chrome o Edge.",
    unexpectedError: "May nangyaring problema. Subukan ulit.",
    loteStarted: "Nagsimula na ang lote",
    loteReady: "Handa na para sa susunod na lote.",
    folderPicked: "Naka-link na ang folder:",
    foldersNotLinked: "Hindi pa naka-link ang folder:",
    folderPermissionDenied: "Walang pahintulot sa folder:"
  })
});
