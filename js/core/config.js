/*
 * FILE    : js/core/config.js
 * PURPOSE : Lahat ng constants, selectors at text
 * DEPENDS : wala
 * VERSION : v33 | 2026-11-24 | DB_OPEN_TIMEOUT_MS at TEXT.settings.dbTimeout (Settings sa Edge); FILE_SEARCH.MIN_SEARCH_MS at TEXT.doneFound, doneNone
 * VERSION : v9.3 | 2026-11-22 | PAGE_LIST at LEAD_BLOCKED_PAGES: dagdag na page na trend (Trend, binabasa ang Data source 1)
 * VERSION : v10.3 | 2026-11-23 | LOT Yugto 5: PAGE_LIST dagdag na lot-tracking-lead (LEAD PC view ng LOT Tracking)
 * VERSION : v10.2 | 2026-11-22 | LOT Yugto 1: tinanggal ang LOT.SOURCE_KEYS (lumipat sa lotConfig.SOURCE.KEYS) at LOT.PATH_COLUMN; text ng operatorInvalid at enterOperator; bagong operatorCancelled
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v3 | 2026-11-20 | EVENTS (constants ng Dashboard events), SELECTOR.events, TEXT.events
 * VERSION : v2 | 2026-11-20 | naka-IIFE na (walang module); window.BMWW namespace; dagdag SIDEBAR_TEMPLATE
 * VERSION : v3.0 | 2026-11-21 | FILE_SEARCH.PREVIEW (preview kada file sa Result: text, CSV, larawan, PDF)
 * VERSION : v2.9 | 2026-11-21 | FILE_SEARCH: overwrite (REPLACED), send log sa Saving path (LOG), alaala ng huling manual destination (MANUAL_*)
 * VERSION : v2.8 | 2026-11-20 | PAGE_LIST (file-search) at CONFIG.FILE_SEARCH (CLO1A/CLO1A1, search by name/date/latest, send to Path o manual input)
 * VERSION : v2.5 | 2026-11-20 | PAGE_LIST (lot-tracking) at CONFIG.LOT (constants, selector, text ng LOT Tracking)
 * VERSION : v2.3 | 2026-11-20 | PAGE_LIST (calibration, master), required/gated sa PATH_LIST, ROW_CLASS, bagong text
 * VERSION : v2.8 | 2026-11-20 | TEXT.master: filePanelTitle, filePanelNote, fileRecords, fileSelected, fileNoneSelected
 * VERSION : v2.22 | 2026-11-21 | TEXT.master.worstBarcode = 'Worst slider' (Repeatability at Correl, screen at Excel)
 * VERSION : v2.21 | 2026-11-21 | CHART.HIGHLIGHT_SCALE (laki ng napiling data point)
 * VERSION : v2.20 | 2026-11-21 | AUTO_PATH (hula ng full path kapag pumili ng folder); text na fullPathAutoFilled; bagong text ng folderPicked at fullPathHint
 * VERSION : v2.18 | 2026-11-21 | Settings: SELECTOR.settings.unsavedNote; TEXT: fullPathRequired, unsavedNote; text ng folderPicked, fullPathHint, pathsUnlocked
 * VERSION : v2.17c | 2026-11-21 | SELECTOR.master: latestDate (kapalit ng latestStart at latestEnd)
 * VERSION : v2.17b | 2026-11-21 | CHART.LABEL_CHAR_WIDTH / LABEL_SLANT / LABEL_MARGIN (dagdag na taas ng line chart para sa mahabang label)
 * VERSION : v2.17 | 2026-11-21 | TEXT.master: scatterTitle = 'Master Correl', lineTitle = 'Master Repeatability' (machine name ay idinadagdag ng master.js); CHART: mas malaking padding para sa mas malaking text
 * VERSION : v2.7 | 2026-11-20 | MASTER.DEVIATION (green/yellow/red), CHART.PAD_RATIO, TEXT.master legend
 * VERSION : v2.6 | 2026-11-20 | MASTER (column, threshold), CHART, SELECTOR.master, TEXT.master
 * VERSION : v2.4 | 2026-11-20 | walang lock ang machine name; full path (FULL_PATH_*), bagong text
 * VERSION : v2.2 | 2026-11-20 | PATH_LIST (server, saving, 3 data source), ROOT_KEY, BADGE, LEGACY_NAME_FIELD, bagong selector at text
 * VERSION : v10.1 | 2026-11-22 | MACHINES_SUBFOLDER, SENDER_SUBFOLDER, MONITORING_SUBFOLDER (settings\machines\sender at monitoring)
 * VERSION : v5 | 2026-11-20 | SERVER_KEY, MACHINE_FILE, MACHINE_FILE_FIELD at text para sa save ng settings kada machine sa Saving path at Server path
 * VERSION : v5.1 | 2026-11-21 | QUEUE (constants ng <Server path>\queue: subfolder, mode, state, source, presence, oras at limit)
 * VERSION : v5.2 | 2026-11-21 | MONITOR (constants ng monitor ng Data source 1, 2, 3 sa not-LEAD PC)
 * VERSION : v5.3 | 2026-11-21 | LEAD_BLOCKED_PAGES (Search Files, Calibration, Master ay hindi makikita ng LEAD PC), SETTINGS_CHANGED_EVENT
 */
(function () {
  'use strict';
  const root = (window.BMWW = window.BMWW || {});

  root.CONFIG = Object.freeze({
    PAGE_FOLDER: 'pages/',
    COMPONENT_FOLDER: 'components/',
    SIDEBAR_TEMPLATE: 'sidebar',
    DEFAULT_PAGE: 'dashboard',
    NOT_FOUND_PAGE: '404',
    PAGE_LIST: ['dashboard', 'lot-tracking', 'lot-tracking-lead', 'file-search', 'settings', 'calibration', 'master', 'trend'],
    OPEN_CLASS: 'sidebar-open',
    ACTIVE_CLASS: 'is-active',
    STORAGE_KEY: 'bmww.settings',
    DB_NAME: 'bmww-db',
    DB_STORE: 'handles',
    // Hanggang kailan hihintayin ang IndexedDB bago sumuko (ms). Iwas blangko ang Settings kapag hindi sumasagot ang browser.
    DB_OPEN_TIMEOUT_MS: 3000,
    // Listahan ng mga path sa Settings. required: kailangan bago mag-save. gated: nakasara hanggang may Saving path (ROOT_KEY).
    PATH_LIST: [
      { key: 'server', gated: true, label: 'Server path', note: 'Folder sa server o shared drive. Mas maayos kung naka-map ito bilang drive letter (hal. Z:). Dito rin sine-save ang settings ng machine (subfolder settings).' },
      { key: 'root', required: true, label: 'Saving path (BMWW)', note: 'Dito sine-save ang settings ng machine (settings\\<machine name>.json). Dapat BMWW ang pangalan ng folder.' },
      { key: 'source1', gated: true, label: 'Data source 1', note: 'Unang folder na pagkukunan ng data.' },
      { key: 'source2', gated: true, label: 'Data source 2', note: 'Pangalawang folder na pagkukunan ng data.' },
      { key: 'source3', gated: true, label: 'Data source 3', note: 'Pangatlong folder na pagkukunan ng data.' }
    ],
    ROOT_KEY: 'root',
    // Awtomatikong full path: hindi kayang basahin ng browser ang totoong path, kaya hinuhulaan ito = <parent> + <pangalan ng napiling folder>.
    // Ang parent ay kinukuha, ayon sa pagkakasunod: (1) parent ng full path na nasa field na (kapag nagpapalit ng folder),
    // (2) parent ng ibang path sa parehong GROUP na may laman na, (3) PARENT_BY_KEY dito. Walang parent = walang hula (type / paste).
    AUTO_PATH: {
      GROUP_LIST: [['source1', 'source2', 'source3']],
      PARENT_BY_KEY: { source1: 'C:\\BM-Logging', source2: 'C:\\BM-Logging', source3: 'C:\\BM-Logging' }
    },
    HANDLE_KEY: { root: 'rootFolder', server: 'serverFolder', source1: 'sourceFolder', source2: 'sourceFolder2', source3: 'sourceFolder3' },
    // Lumang field sa settings na binabasa pa ng Dashboard (v2.2: pinananatili).
    LEGACY_NAME_FIELD: { root: 'rootFolderName', source1: 'sourceFolderName' },
    ROW_CLASS: { attention: 'is-attention', locked: 'is-locked' },
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    SCROLL_BEHAVIOR: { normal: 'smooth', reduced: 'auto' },
    BADGE: { ok: 'badge-success', info: 'badge-info', empty: 'badge-neutral' },
    // Master: lahat ng index ay 0-based (row 4 ng Excel = 3; column F = 5; column DA = 104).
    MASTER: {
      SOURCE_KEY: 'source1',
      CSV_EXTENSION: '.csv',
      CSV_MAX_BYTES: 52428800,
      HEADER_COUNT: 15,
      HEADER_SCAN_COLUMNS: 300,
      HEADER_ROW: 1,
      BARCODE_ROW: 3,
      DATA_START_ROW: 4,
      DATE_COLUMN: 1,
      ACTUAL_START_COLUMN: 5,
      POINT_COUNT: 15,
      MASTER_START_COLUMN: 104,
      ACTUAL_AVG_COLUMN: 20,
      MASTER_AVG_COLUMN: 120,
      LATEST: { PASS_MIN: 0.99, FAIL_BELOW: 0.97, MAX_FILES: 60 },
      RANGE: { PASS_MAX: 1, WARNING_MAX: 3, DEFAULT_DAYS: 7, NO_PAIR_DIFFERENCE: 999, MAX_LINES: 150 },
      // Kulay ng bawat reading ayon sa |actual - master|: green <= GREEN_MAX, yellow <= YELLOW_MAX, red kapag higit pa.
      DEVIATION: { GREEN_MAX: 1.5, YELLOW_MAX: 2.5, ROUND_DIGITS: 6, LEVEL: { green: 'level-green', yellow: 'level-yellow', red: 'level-red' } },
      STATUS: { pass: 'PASS', warning: 'WARNING', fail: 'FAIL' },
      STATUS_CLASS: { PASS: 'is-pass', WARNING: 'is-warning', FAIL: 'is-fail' },
      ERROR_BY_NAME: { NotFoundError: 'folderMissing', NotAllowedError: 'noPermission', SecurityError: 'noPermission' }
    },
    CHART: {
      WIDTH: 640, HEIGHT: 380, PADDING: { top: 44, right: 24, bottom: 78, left: 80 },
      TICK_COUNT: 5, PALETTE_SIZE: 8, LEGEND_MAX: 12, PAD_RATIO: 0.15,
      // Pang-sukat ng nakahilig na label sa ilalim ng line chart (px bawat character, sin ng -40 degrees, margin)
      LABEL_CHAR_WIDTH: 10, LABEL_SLANT: 0.65, LABEL_MARGIN: 30,
      // Ilang beses lalaki ang point ng napiling barcode (pinindot sa table o sa chart)
      HIGHLIGHT_SCALE: 2.4
    },
    ROOT_FOLDER_NAME: 'BMWW',
    SETTINGS_SUBFOLDER: 'settings',
    SETTINGS_FILE: 'settings.json',
    // Layout ng settings (v10.1): <path>\settings\machines\sender\<machine>.json (User input) at <path>\settings\machines\monitoring\LEAD PC.json (LEAD PC). Saving path at Server path. Ang events.json ay nananatili sa <path>\settings.
    MACHINES_SUBFOLDER: 'machines',
    SENDER_SUBFOLDER: 'sender',
    MONITORING_SUBFOLDER: 'monitoring',
    // Settings kada machine: <path>\settings\<machine name>.json (Saving path at Server path).
    SERVER_KEY: 'server',
    MACHINE_FILE: {
      EXTENSION: '.json',
      LEGACY_NAME: 'settings.json',
      RESERVED_FILES: ['settings.json', 'events.json'],
      INVALID_CHARS: /[<>:"/\\|?*\u0000-\u001F]/g,
      TRAILING_CHARS: /[. ]+$/,
      RESERVED_PATTERN: /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
      PREFIX: '_',
      FALLBACK_NAME: 'machine'
    },
    MACHINE_FILE_FIELD: 'machineFile',
    // Queue ng mga machine: <Server path>\queue\<machine name>.json (sinusulat ng not-LEAD PC, binabasa ng lahat).
    // Monitor ng Data source ng sariling machine (not-LEAD PC). Ang source1 ay Calibration/Master (ayon sa header count ng pinakabagong CSV); ang source2 at source3 ay Online/Offline.
    MONITOR: {
      POLL_MS: 5000,
      SETTLE_MS: 30000,
      MAX_ENTRIES: 5000,
      SOURCE_KEYS: ['source1', 'source2', 'source3'],
      SOURCE_MODE: { source1: 'auto', source2: 'online', source3: 'offline' },
      ONGOING_TIMEOUT_MS: { source1: 300000, source2: 1800000, source3: 1800000 },
      IGNORED_PREFIXES: ['~$'],
      IGNORED_EXTENSIONS: ['.tmp', '.temp', '.part', '.crdownload'],
      STATE: { stopped: 'stopped', running: 'running', notApplicable: 'notApplicable', noSource: 'noSource', noServer: 'noServer', noPermission: 'noPermission', unsupported: 'unsupported', error: 'error' }
    },
    QUEUE: {
      SUBFOLDER: 'queue',
      FILE_VERSION: 1,
      HEARTBEAT_MS: 30000,
      STALE_MS: 120000,
      TEXT_MAX: 60,
      FILE_NAME_MAX: 120,
      FILE_MAX_BYTES: 65536,
      MAX_FILES: 200,
      MODE: { idle: 'idle', calibration: 'calibration', master: 'master', online: 'online', offline: 'offline' },
      STATE: { idle: 'idle', ongoing: 'ongoing', done: 'done' },
      SOURCE: { none: '', source1: 'source1', source2: 'source2', source3: 'source3' },
      PRESENCE: { active: 'active', stale: 'stale', noStatus: 'noStatus' },
      CONNECTION: { ok: 'ok', noFolder: 'noFolder', noPermission: 'noPermission', unsupported: 'unsupported', error: 'error' }
    },
    SETTINGS_PATH_LABEL: 'C:\\desktop\\BMWW\\settings',
    MACHINE_MODE: { USER_INPUT: 'user-input', LEAD_PC: 'lead-pc' },
    LEAD_PC_NAME: 'LEAD PC',
    // Mga page na hindi makikita ng LEAD PC (monitor lang ito): itinatago sa sidebar at hinaharang sa router.
    LEAD_BLOCKED_PAGES: ['file-search', 'calibration', 'master', 'trend'],
    // Event na ibinabato kapag nagbago ang settings sa localStorage (para ma-update ang sidebar nang hindi nire-reload ang page).
    SETTINGS_CHANGED_EVENT: 'bmww:settings-changed',
    MACHINE_NAME_MAX: 30,
    // Full path ng folder: hindi ito maibibigay ng browser, kaya tina-type/pine-paste ng user.
    FULL_PATH_MAX: 260,
    FULL_PATH_PATTERN: /^(?:[A-Za-z]:\\|\\\\)[^<>"|?*]*$/,
    PATH_SEPARATOR: '\\',
    FOLDER_PATHS_FIELD: 'folderPaths',
    ROW_INPUT_CLASS: { wrap: 'path-full', input: 'form-input path-full-input', error: 'is-error' },
    // Dashboard events: petsa 'YYYY-MM-DD', oras 'HH:MM' (opsyonal). Sine-save sa localStorage at sa <BMWW>\settings\events.json.
    EVENTS: {
      STORAGE_KEY: 'bmww.events',
      FILE_NAME: 'events.json',
      FILE_VERSION: 1,
      ID_PREFIX: 'ev-',
      LOCALE: 'en-PH',
      WEEK_START: 0,
      CELL_COUNT: 42,
      CLOCK_MS: 1000,
      TITLE_MAX: 60,
      NOTE_MAX: 300,
      ID_MAX: 64,
      MAX_EVENTS: 500,
      DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
      TIME_PATTERN: /^([01]\d|2[0-3]):[0-5]\d$/,
      ATTR: { date: 'data-date', id: 'data-id', action: 'data-action' },
      ACTION: { edit: 'edit', remove: 'delete' },
      CLASS: { today: 'is-today', selected: 'is-selected', hasEvent: 'has-event', outside: 'is-outside', error: 'is-error', success: 'is-success' },
      FILE_STATE: { ok: 'ok', noFolder: 'noFolder', noPermission: 'noPermission', unsupported: 'unsupported', error: 'error' }
    },
    LOT: {
      PAGE: 'lot-tracking',
      SOURCE_LABEL: { source1: 'Data source 1', source2: 'Data source 2', source3: 'Data source 3' },
      REFRESH_MS: 3000,
      START_TOLERANCE_MS: 1000,
      MAX_DEPTH: 5,
      MAX_ROWS: 30,
      BARCODE_MAX: 30,
      OPERATOR_MIN: 2,
      OPERATOR_MAX: 30,
      IGNORED_PREFIX: '~$',
      NAME_PATTERN: /^([A-Z0-9]{5})([0-9]{1,3})([A-Z])/i,
      TYPE: { file: 'File', folder: 'Folder' },
      EMPTY_CELL: '-',
      SELECTOR: {
        machine: '#lot-machine', barcode: '#lot-barcode', operator: '#lot-operator',
        startDate: '#lot-start-date', startTime: '#lot-start-time', endDate: '#lot-end-date', endTime: '#lot-end-time',
        newButton: '#lot-new', badge: '#lot-badge', status: '#lot-status',
        resultNote: '#lot-result-note', resultBody: '#lot-result-body'
      },
      TEXT: {
        stateOngoing: 'ONGOING', stateDone: 'DONE', stateIdle: 'Walang lote',
        machineMissing: 'Walang Machine name. Itakda muna ito sa Settings, tapos bumalik dito.',
        scanBarcode: 'I-scan o i-type ang Barcode, tapos Enter.',
        enterOperator: 'Ilagay ang Operator, tapos Enter (Esc para i-cancel).',
        barcodeFirst: 'I-scan muna ang Barcode.',
        operatorInvalid: 'Operator: 2 hanggang 30 na character; titik, numero, espasyo, ., - o _ lang.',
        operatorCancelled: 'Kinansela. Walang lote na sinimulan.',
        started: 'Nagsimula ang lote ', ended: 'Natapos ang lote ',
        confirmNew: 'I-clear ang lote? Hindi na ito mababawi.',
        newReady: 'Handa na para sa susunod na lote.',
        waiting: 'Naghihintay ng bagong file o folder simula ',
        found: ' bagong file/folder simula ',
        showing: 'Ipinapakita ang pinakabagong ',
        noSource: 'Walang naka-set na Data source sa Settings.',
        noPermission: ': walang permission. Payagan ulit sa Settings.',
        scanError: 'May error sa paghahanap ng file. Subukan ulit.'
      }
    },
    // Search Files (v2.8). Ang File Path 1 (CLO1A) at File Path 2 (CLO1A1) ng Excel ay Data source 2 at 3 ng Settings.
    // Basa lang sa mga source. Ang pagpapadala ay kopya; ang kapangalan sa destination ay papalitan lang kapag pumayag ang user.
    FILE_SEARCH: {
      PAGE: 'file-search',
      SOURCE_LIST: [
        { key: 'source2', label: 'CLO1A' },
        { key: 'source3', label: 'CLO1A1' }
      ],
      SERVER_KEY: 'server',
      // Send log: <Saving path>\logs\send-log.txt (dagdag lang sa dulo, UTF-8, CRLF)
      LOG: { FOLDER: 'logs', FILE: 'send-log.txt', SEPARATOR: ' | ', LINE_END: '\r\n' },
      // Huling manual destination: path text sa localStorage, folder handle sa IndexedDB
      MANUAL_STORAGE_KEY: 'bmww.fileSearch', MANUAL_PATH_FIELD: 'manualPath', MANUAL_HANDLE_KEY: 'fileSearchManualFolder',
      // Preview: basa lang; text/CSV ay unang MAX_BYTES lang ang binabasa.
      PREVIEW: {
        MAX_BYTES: 262144, MAX_ROWS: 200, MAX_COLUMNS: 40, IMAGE_MAX_BYTES: 20971520, PDF_MAX_BYTES: 31457280,
        TEXT_EXT: ['txt', 'log', 'json', 'xml', 'ini', 'cfg', 'md', 'bat', 'js', 'html', 'htm', 'css'],
        CSV_EXT: ['csv'],
        IMAGE_EXT: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'],
        PDF_EXT: ['pdf']
      },
      MAX_DEPTH: 6,
      // Pinakamaikling tagal ng search na makikita (ms), para hindi biglang mawala kapag sobrang bilis.
      MIN_SEARCH_MS: 700,
      MAX_RESULTS: 5000,
      MAX_SCANNED: 200000,
      YIELD_EVERY: 100,
      NAME_MAX: 100,
      LATEST_DAYS: 2,
      RANGE_DEFAULT_DAYS: 7,
      IGNORED_PREFIX: '~$',
      EMPTY_CELL: '-',
      MODE: { name: 'name', range: 'range', latest: 'latest' },
      SEND_MODE: { path: 'path', manual: 'manual' },
      TYPE: { file: 'File', folder: 'Folder' },
      STATUS: { pending: 'PENDING', sent: 'SENT', replaced: 'REPLACED', failed: 'FAILED', exists: 'EXISTS' },
      STATUS_CLASS: { PENDING: 'is-pending', SENT: 'is-sent', REPLACED: 'is-replaced', FAILED: 'is-failed', EXISTS: 'is-exists' },
      SIZE_UNIT_LIST: ['B', 'KB', 'MB', 'GB', 'TB'],
      SELECTOR: {
        sourceList: '#fs-source-list',
        nameInput: '#fs-name', nameButton: '#fs-name-run',
        rangeStart: '#fs-range-start', rangeEnd: '#fs-range-end', rangeButton: '#fs-range-run',
        latestButton: '#fs-latest-run', latestNote: '#fs-latest-note',
        stopButton: '#fs-stop', clearButton: '#fs-clear',
        status: '#fs-status',
        found: '#fs-found', resultNote: '#fs-result-note', resultBody: '#fs-result-body', selectAll: '#fs-select-all',
        sendModeRadio: 'input[name="fs-send-mode"]', sendPathText: '#fs-send-path-text',
        manualWrap: '#fs-send-manual', manualPath: '#fs-manual-path', manualPick: '#fs-manual-pick', manualFolder: '#fs-manual-folder',
        selectedCount: '#fs-selected', sendButton: '#fs-send-run', sendStatus: '#fs-send-status',
        previewDialog: '#fs-preview', previewTitle: '#fs-preview-title', previewMeta: '#fs-preview-meta', previewBody: '#fs-preview-body', previewClose: '#fs-preview-close'
      },
      TEXT: {
        found: 'FILES FOUND : ',
        sourceNotSet: 'Hindi pa naka-set sa Settings', sourceReselect: 'Piliin ulit sa Settings', sourceFolder: 'Folder: ',
        sourceBadgeSet: 'Naka-set', sourceBadgeEmpty: 'Hindi pa naka-set',
        working: 'Naghahanap...', progress: 'Naghahanap... nasuri na: ',
        unsupported: 'Gamitin ang Chrome o Edge sa laptop para mabasa ang folder.',
        noSourceChecked: 'Pumili ng kahit isang folder na hahanapin (CLO1A o CLO1A1).',
        noSourceReady: 'Walang mahahanap: hindi pa naka-set ang napiling folder sa Settings.',
        sourceNoPermission: ': walang permission. Subukan ulit at pindutin ang Allow.',
        sourceUnreadable: ': hindi mabuksan ang folder. Piliin ulit ito sa Settings.',
        nameEmpty: 'Maglagay ng file name na hahanapin.',
        badDates: 'Maglagay ng valid na Start date at End date.',
        startAfterEnd: 'Hindi puwedeng mas huli ang Start date kaysa sa End date.',
        stopped: 'Itinigil ang paghahanap. Ipinapakita ang mga nakita na.',
        none: 'Walang nakitang file.',
        doneFound: 'Tapos na ang paghahanap: may nakitang {n} file o folder.',
        doneNone: 'Tapos na ang paghahanap: walang nakitang file o folder.',
        resultLimited: 'Umabot sa limit na {n} ang resulta. Paliitin ang hanap (pangalan o petsa).',
        scanLimited: 'Umabot sa limit ng pag-scan ({n}). Paliitin ang hanap para kumpleto.',
        skipped: ' folder ang hindi nabasa at nilaktawan.',
        latestNote: 'Mga file at folder na bago ngayong araw at kahapon (hanggang {days} araw).',
        modeNote: { name: 'Hanap sa pangalan: ', range: 'Hanap sa petsa: ', latest: 'Pinakabago: ' },
        searchError: 'May problema sa paghahanap ng file. Subukan ulit.',
        selected: 'Napili: ',
        sendPathNone: 'Walang Server path na naka-set sa Settings.', sendPathLabel: 'Server path: ',
        manualPlaceholder: 'Hal. \\\\192.168.254.180\\BMWW o D:\\Backup', manualFolderNone: 'Wala pang napiling folder', manualFolderLabel: 'Napiling folder: ',
        manualInvalid: 'Hindi tama ang path. Dapat nagsisimula sa drive (C:\\) o network (\\\\server).',
        manualMismatch: 'Hindi tugma ang dulo ng path sa napiling folder: ',
        manualNeedFolder: 'Piliin muna ang destination folder (Choose folder).',
        pickError: 'Hindi mapili ang folder.',
        noneSelected: 'Pumili muna ng file na ipapadala.',
        destinationNoPermission: 'Hindi pinayagan ang access sa destination folder. Subukan ulit at pindutin ang Allow.',
        destinationIsSource: 'Hindi puwedeng ipadala sa mismong CLO1A o CLO1A1 (source folder).',
        sending: 'Nagpapadala: ', sendStopped: 'Itinigil ang pagpapadala. ',
        sendSummary: 'Tapos: {sent} SENT, {replaced} REPLACED, {exists} EXISTS (hindi pinalitan), {failed} FAILED.',
        confirmOverwrite: '{n} file ang nasa destination na (kapareho ang pangalan).\n\nOK = PALITAN ang mga ito.\nCancel = HUWAG palitan (EXISTS), ipadala lang ang iba.',
        logSaved: ' Na-log sa ', logNoRoot: ' Hindi na-log: wala pang Saving path sa Settings.', logNoPermission: ' Hindi na-log: walang permission sa Saving path.', logFailed: ' Hindi na-log: may problema sa pagsulat ng log.',
        manualRemembered: 'Naalala ang huling destination.', manualReselect: ' (pindutin ang Send para payagan ulit)',
        sendError: 'May problema sa pagpapadala. Subukan ulit.',
        previewButton: 'Preview', previewAria: 'Preview ng ', previewLoading: 'Binabasa ang file...',
        previewNone: 'Walang preview para sa ganitong uri ng file.', previewBinary: 'Mukhang hindi ito text file, kaya walang preview.',
        previewEmpty: 'Walang laman ang file.', previewTooBig: 'Masyadong malaki ang file para i-preview.',
        previewError: 'Hindi mabuksan ang file para sa preview. Maaaring wala nang permission o nailipat na ito.',
        previewPartial: 'Ipinapakita ang unang {shown} ng {total}.', previewRows: 'Ipinapakita ang unang {n} na row.', previewColumns: ' (unang {n} na column lang)',
        previewImageAlt: 'Preview ng larawan'
      }
    },
    SELECTOR: {
      content: '#content', sidebar: '#sidebar', overlay: '#overlay', menuButton: '#menu-button', navLink: '.sidebar-link',
      dashboard: { machine: '#dash-machine', mode: '#dash-mode', root: '#dash-root', source: '#dash-source', saved: '#dash-saved' },
      eventDay: '[data-date]',
      eventAction: '[data-action]',
      events: {
        clockTime: '#dash-clock-time', clockDate: '#dash-clock-date',
        calPrev: '#cal-prev', calNext: '#cal-next', calToday: '#cal-today', calTitle: '#cal-title', calWeekdays: '#cal-weekdays', calGrid: '#cal-grid',
        selectedLabel: '#ev-selected-label', list: '#ev-list', addButton: '#ev-add',
        form: '#ev-form', formTitle: '#ev-form-title', titleInput: '#ev-title', dateInput: '#ev-date', timeInput: '#ev-time', noteInput: '#ev-note',
        saveButton: '#ev-save', cancelButton: '#ev-cancel', formStatus: '#ev-form-status',
        message: '#ev-message', storageNote: '#ev-status', grantButton: '#ev-grant'
      },
      settings: {
        modeRadio: 'input[name="machine-mode"]', nameInput: '#machine-name', note: '#machine-note',
        pathList: '#path-list',
        saveButton: '#save-settings', status: '#settings-status', unsavedNote: '#settings-unsaved'
      },
      master: {
        source: '#master-source', latestDate: '#latest-date', latestButton: '#latest-run',
        latestStatus: '#latest-status', latestResult: '#latest-result',
        rangeStart: '#range-start', rangeEnd: '#range-end', rangeButton: '#range-run',
        rangeStatus: '#range-status', rangeResult: '#range-result'
      }
    },
    TEXT: {
      events: {
        addButton: '+ Add event', editButton: 'Edit', deleteButton: 'Delete',
        prevMonth: 'Nakaraang buwan', nextMonth: 'Susunod na buwan',
        selectedPrefix: 'Events sa ', noEvents: 'Walang event sa petsang ito.', allDay: 'Buong araw', eventCount: ' event',
        formAdd: 'Bagong event', formEdit: 'I-edit ang event', editAria: 'I-edit ang ', deleteAria: 'Burahin ang ',
        confirmDelete: 'Burahin ang event na ito?',
        titleRequired: 'Kailangan ng title.', dateInvalid: 'Maglagay ng valid na petsa.', timeInvalid: 'Hindi tama ang oras.',
        tooMany: 'Puno na ang listahan ng event.', saveError: 'Hindi na-save ang event. Subukan ulit.', loadError: 'Hindi mabuksan ang events.',
        saved: 'Na-save ang event.', deleted: 'Nabura ang event.',
        grantButton: 'Payagan ang folder',
        stateOk: 'Naka-save sa browser na ito at sa events.json sa BMWW folder.',
        stateNoFolder: 'Naka-save lang sa browser na ito. Piliin ang Saving path (BMWW) sa Settings para magkaroon ng file.',
        stateNoPermission: 'Naka-save lang sa browser na ito. Pindutin ang Payagan ang folder para ma-save din sa BMWW folder.',
        stateUnsupported: 'Hindi kayang pumili ng folder ng browser na ito (gamitin ang Chrome o Edge). Naka-save lang sa browser na ito.',
        stateError: 'Hindi mabasa o masulat ang events.json. Naka-save pa rin sa browser na ito.'
      },
      master: {
        working: 'Binabasa ang mga file...', progress: 'Binabasa: ',
        sourceNotSet: 'Hindi pa naka-set ang Data source 1. Pumunta sa Settings.',
        recordDate: 'Date', fileName: 'File', rSquared: 'R Square', actualAverage: 'Actual AVG', masterAverage: 'Master AVG',
        repeatability: 'Repeatability', averageDifference: 'Avg diff', worstBarcode: 'Worst slider', maxDifference: 'Max diff',
        difference: 'Difference', records: 'Records', csvFiles: 'CSV files', range: 'Range', masterFiles: 'Master files',
        barcode: 'Barcode', barcodeSelectAria: 'Laki-an ang point ng barcode na ', actual: 'Actual', master: 'Master', actualAverageShort: 'Actual avg',
        scatterTitle: 'Master Correl', scatterX: 'Master Reading', scatterY: 'Actual Reading',
        barTitle: 'Actual AVG vs Master AVG', lineTitle: 'Master Repeatability', masterSeries: 'MASTER',
        filePanelTitle: 'Files', filePanelNote: 'I-uncheck ang file para alisin ang linya nito sa chart.',
        fileRecords: ' record', fileSelected: 'Napili: {n} / {total} na file', fileNoneSelected: 'Walang napiling file. MASTER lang ang ipinapakita.',
        levelLegendTitle: 'Actual vs Master: ',
        levelGreen: 'Green: ±{low} pababa', levelYellow: 'Yellow: higit ±{low} hanggang ±{high}', levelRed: 'Red: higit ±{high}',
        unreadable: ' file ang hindi nabasa at nilaktawan.', linesLimited: 'Ipinapakita ang huling {n} na record sa chart; kumpleto ang kalkulasyon.',
        error: {
          unsupported: 'Gamitin ang Chrome o Edge sa laptop para mabasa ang folder.',
          noSource: 'Piliin muna ang Data source 1 sa Settings.',
          noPermission: 'Hindi pinayagan ang access sa Data source. Subukan ulit at pindutin ang Allow.',
          folderMissing: 'Hindi mahanap ang Data source folder. Piliin ulit ito sa Settings.',
          emptyFolder: 'Walang CSV file sa Data source folder.',
          noMasterFile: 'Walang master file na may 15 headers sa mga file na nabasa.',
          noRecordToday: 'Walang master record sa napiling petsa.',
          noFileInRange: 'Walang file sa napiling petsa.',
          noRecordInRange: 'Walang record sa napiling petsa.',
          badDates: 'Maglagay ng valid na Start date at End date.',
          badDate: 'Maglagay ng valid na Date.',
          startAfterEnd: 'Hindi puwedeng mas huli ang Start date kaysa sa End date.',
          noRegression: 'Hindi makalkula ang R Square (kulang o pare-pareho ang data).',
          readFail: 'May problema sa pagbabasa ng mga file. Subukan ulit.'
        }
      },
      loading: 'Nilo-load ang page...', pageError: 'Hindi mabuksan ang page. Subukan ulit.', sidebarError: 'Hindi mabuksan ang menu.',
      notSet: 'Hindi pa naka-set', needReselect: ' (piliin ulit para ma-access)',
      modeUser: 'Uri: User input', modeLead: 'Uri: Lead PC',
      machineNote: 'Puwede mong palitan ang machine name anumang oras. I-save para magamit.',
      machineMissing: 'Pumili ng uri at maglagay ng machine name.',
      rootMissing: 'Piliin muna ang Saving path (BMWW folder). Kailangan ito bago mag-save.', wrongRoot: 'Ang piliing folder ay dapat na may pangalang BMWW.',
      noPermission: 'Hindi pinayagan ang access sa folder.', folderPicked: 'Napili ang folder. Ilagay ang full path nito, tapos pindutin ang Save settings.',
      fullPathAutoFilled: 'Awtomatikong inilagay ang full path: ',
      fullPathAutoHint: ' | Hula ito mula sa napiling folder; tingnan kung tama (baguhin kung mali), tapos pindutin ang Save settings.',
      folderError: 'Hindi mapili ang folder.', saveError: 'Hindi na-save ang settings. Subukan ulit.',
      saved: 'Na-save sa ', loadError: 'Hindi mabasa ang naunang settings.',
      dbTimeout: 'Hindi sumasagot ang browser storage (IndexedDB), kaya hindi nabasa ang naka-save na folder. Isara ang ibang BMWW tab at i-refresh. Puwede mo pa ring piliin ulit ang mga folder.',
      savedBoth: 'Na-save sa Saving path at Server path: ',
      savedRootOnly: 'Na-save sa Saving path: ',
      serverNotSet: ' | Hindi pa naka-set ang Server path, kaya wala pang kopya sa server.',
      serverFailed: ' | HINDI na-save sa Server path. Tingnan kung bukas ang server at i-Allow ang permission, tapos i-save ulit.',
      unsupported: 'Gamitin ang Chrome o Edge sa laptop para makapili ng folder.',
      badgeSet: 'Naka-set', badgeEmpty: 'Hindi pa naka-set', badgeReselect: 'Piliin ulit',
      pickButton: 'Piliin', changeButton: 'Palitan',
      badgeRequired: 'Required', badgeClosed: 'Hindi pa bukas',
      lockedPathNote: 'Piliin muna ang Saving path (BMWW) para mabuksan ito.',
      fullPathLabel: 'Full path', fullPathPlaceholder: 'Hal. C:\\Users\\Name\\Desktop\\BMWW', fullPathAria: 'Full path ng ',
      fullPathHint: 'Kailangan ito kapag napili na ang folder. Awtomatikong nilalagay kapag pumili ng folder (hula lang, dahil hindi mababasa ng browser ang totoong path); baguhin kung mali.', fullPathEmpty: 'Wala pang full path',
      fullPathInvalid: 'Hindi tama ang full path. Dapat nagsisimula sa drive (C:\\) o network (\\\\server).',
      fullPathMismatch: 'Hindi tugma ang dulo ng full path sa napiling folder: ', folderLabel: 'Folder: ',
      fullPathRequired: 'Kailangan ng full path. I-type o i-paste ang buong path ng napiling folder (hal. C:\\BMWW).',
      unsavedNote: 'May pagbabago na hindi pa na-save. Pindutin ang Save settings para ma-save.',
      pathsUnlocked: 'Bukas na ang ibang path. Piliin ang mga ito, ilagay ang full path, tapos i-save.'
    }
  });

})();
