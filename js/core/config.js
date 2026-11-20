/*
 * FILE    : js/core/config.js
 * PURPOSE : Lahat ng constants, selectors at text
 * DEPENDS : wala
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v3 | 2026-11-20 | EVENTS (constants ng Dashboard events), SELECTOR.events, TEXT.events
 * VERSION : v2 | 2026-11-20 | naka-IIFE na (walang module); window.BMWW namespace; dagdag SIDEBAR_TEMPLATE
 * VERSION : v2.5 | 2026-11-20 | PAGE_LIST (lot-tracking) at CONFIG.LOT (constants, selector, text ng LOT Tracking)
 * VERSION : v2.3 | 2026-11-20 | PAGE_LIST (calibration, master), required/gated sa PATH_LIST, ROW_CLASS, bagong text
 * VERSION : v2.8 | 2026-11-20 | TEXT.master: filePanelTitle, filePanelNote, fileRecords, fileSelected, fileNoneSelected
 * VERSION : v2.7 | 2026-11-20 | MASTER.DEVIATION (green/yellow/red), CHART.PAD_RATIO, TEXT.master legend
 * VERSION : v2.6 | 2026-11-20 | MASTER (column, threshold), CHART, SELECTOR.master, TEXT.master
 * VERSION : v2.4 | 2026-11-20 | walang lock ang machine name; full path (FULL_PATH_*), bagong text
 * VERSION : v2.2 | 2026-11-20 | PATH_LIST (server, saving, 3 data source), ROOT_KEY, BADGE, LEGACY_NAME_FIELD, bagong selector at text
 * VERSION : v5 | 2026-11-20 | SERVER_KEY, MACHINE_FILE, MACHINE_FILE_FIELD at text para sa save ng settings kada machine sa Saving path at Server path
 * VERSION : v5.1 | 2026-11-21 | QUEUE (constants ng <Server path>\queue: subfolder, mode, state, source, presence, oras at limit)
 * VERSION : v5.2 | 2026-11-21 | MONITOR (constants ng monitor ng Data source 1, 2, 3 sa not-LEAD PC)
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
    PAGE_LIST: ['dashboard', 'lot-tracking', 'settings', 'calibration', 'master'],
    OPEN_CLASS: 'sidebar-open',
    ACTIVE_CLASS: 'is-active',
    STORAGE_KEY: 'bmww.settings',
    DB_NAME: 'bmww-db',
    DB_STORE: 'handles',
    // Listahan ng mga path sa Settings. required: kailangan bago mag-save. gated: nakasara hanggang may Saving path (ROOT_KEY).
    PATH_LIST: [
      { key: 'server', gated: true, label: 'Server path', note: 'Folder sa server o shared drive. Mas maayos kung naka-map ito bilang drive letter (hal. Z:). Dito rin sine-save ang settings ng machine (subfolder settings).' },
      { key: 'root', required: true, label: 'Saving path (BMWW)', note: 'Dito sine-save ang settings ng machine (settings\\<machine name>.json). Dapat BMWW ang pangalan ng folder.' },
      { key: 'source1', gated: true, label: 'Data source 1', note: 'Unang folder na pagkukunan ng data.' },
      { key: 'source2', gated: true, label: 'Data source 2', note: 'Pangalawang folder na pagkukunan ng data.' },
      { key: 'source3', gated: true, label: 'Data source 3', note: 'Pangatlong folder na pagkukunan ng data.' }
    ],
    ROOT_KEY: 'root',
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
      WIDTH: 640, HEIGHT: 360, PADDING: { top: 40, right: 24, bottom: 64, left: 64 },
      TICK_COUNT: 5, PALETTE_SIZE: 8, LEGEND_MAX: 12, PAD_RATIO: 0.15
    },
    ROOT_FOLDER_NAME: 'BMWW',
    SETTINGS_SUBFOLDER: 'settings',
    SETTINGS_FILE: 'settings.json',
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
      SOURCE_KEYS: ['source1', 'source2', 'source3'],
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
      PATH_COLUMN: 3,
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
        enterOperator: 'Ilagay ang Operator, tapos Enter.',
        barcodeFirst: 'I-scan muna ang Barcode.',
        operatorInvalid: 'Operator: 2 hanggang 30 characters.',
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
        saveButton: '#save-settings', status: '#settings-status'
      },
      master: {
        source: '#master-source', latestStart: '#latest-start', latestEnd: '#latest-end', latestButton: '#latest-run',
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
        repeatability: 'Repeatability', averageDifference: 'Avg diff', worstBarcode: 'Worst barcode', maxDifference: 'Max diff',
        difference: 'Difference', records: 'Records', csvFiles: 'CSV files', range: 'Range', masterFiles: 'Master files',
        barcode: 'Barcode', actual: 'Actual', master: 'Master', actualAverageShort: 'Actual avg',
        scatterTitle: 'Actual Reading vs Master Reading', scatterX: 'Master Reading', scatterY: 'Actual Reading',
        barTitle: 'Actual AVG vs Master AVG', lineTitle: 'MASTER REPEATABILITY', masterSeries: 'MASTER',
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
          noRecordToday: 'Walang master record ngayong araw.',
          noFileInRange: 'Walang file sa napiling petsa.',
          noRecordInRange: 'Walang record sa napiling petsa.',
          badDates: 'Maglagay ng valid na Start date at End date.',
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
      noPermission: 'Hindi pinayagan ang access sa folder.', folderPicked: 'Napili ang folder. I-save ang settings.',
      folderError: 'Hindi mapili ang folder.', saveError: 'Hindi na-save ang settings. Subukan ulit.',
      saved: 'Na-save sa ', loadError: 'Hindi mabasa ang naunang settings.',
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
      fullPathHint: 'Hindi ito makukuha ng browser. I-type o i-paste ang buong path.', fullPathEmpty: 'Wala pang full path',
      fullPathInvalid: 'Hindi tama ang full path. Dapat nagsisimula sa drive (C:\\) o network (\\\\server).',
      fullPathMismatch: 'Hindi tugma ang dulo ng full path sa napiling folder: ', folderLabel: 'Folder: ',
      pathsUnlocked: 'Bukas na ang ibang path. Piliin ang mga ito, tapos i-save.'
    }
  });

})();
