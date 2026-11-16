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
 */

export const CONFIG = Object.freeze({

  /* ===== STORAGE KEYS (Rule 13: iisang storage file lang ang gagamit nito) ===== */
  STORAGE_KEYS: Object.freeze({
    pcRegistry: "bmww.pcRegistry",
    folderHandlesDatabase: "bmww.folderHandles",
    folderHandlesStore: "handles"
  }),

  /* ===== MGA PC (default) =====
     existingIpInputId = ang IP input na nasa index.html na ngayon.
     Ang mga bagong PC na idadagdag ay gagawa ng sariling IP row. */
  PC_TYPES: Object.freeze({
    mww:  Object.freeze({ label: "MWW",     namePrefix: "MWW ",    ipLabelSuffix: " IP", startNumber: 1 }),
    lead: Object.freeze({ label: "LEAD PC", namePrefix: "LEAD PC", ipLabelSuffix: " IP", startNumber: 1 })
  }),
  DEFAULT_PCS: Object.freeze([
    Object.freeze({ id: "mww1",  type: "mww",  name: "MWW 1",    existingIpInputId: "mww1IpInput" }),
    Object.freeze({ id: "mww2",  type: "mww",  name: "MWW 2",    existingIpInputId: "mww2IpInput" }),
    Object.freeze({ id: "lead1", type: "lead", name: "LEAD PC1", existingIpInputId: "leadPc1IpInput" }),
    Object.freeze({ id: "lead2", type: "lead", name: "LEAD PC2", existingIpInputId: "leadPc2IpInput" })
  ]),
  MAX_PC_PER_TYPE: 20,

  /* ===== MGA PATH NA SISILIPIN SA RESULT (Task 2) ===== */
  WATCH_PATHS: Object.freeze([
    Object.freeze({ key: "calib",  label: "Calib",  fieldName: "filePath3", defaultPath: "C:\\BM-Logging\\Calib" }),
    Object.freeze({ key: "clo1a",  label: "CLO1A",  fieldName: "filePath1", defaultPath: "C:\\BM-Logging\\CLO1A" }),
    Object.freeze({ key: "clo1a1", label: "CLO1A1", fieldName: "filePath2", defaultPath: "C:\\BM-Logging\\CLO1A1" })
  ]),
  SCAN_INTERVAL_MS: 5000,
  MAX_SCAN_DEPTH: 5,
  IGNORED_FILE_NAMES: Object.freeze(["Thumbs.db", ".DS_Store", "desktop.ini"]),
  IGNORED_FILE_PREFIXES: Object.freeze(["~$"]),

  /* ===== PAG-PARSE NG PANGALAN NG FILE (Wafer / Blk / Layer No.) =====
     GALING SA SAMPLE sa js/mwwView.js (hal. 4A25C_A_L12.csv).
     Kapag iba ang tunay na format, ito lang ang babaguhin. */
  FILE_NAME_PATTERN: /^([A-Za-z0-9]+)_([A-Za-z0-9]+)_L(\d+)/,

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
    roleSwitch: ".roleSwitch",
    roleButton: ".roleButton",
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
    mwwPanelTemplate: "#mwwPanelTemplate"
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
    field: "data-field"
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
    unexpectedError: "May nangyaring problema. Subukan ulit."
  })
});
