/*
 * FILE    : js/core/config.js
 * PURPOSE : Lahat ng constants, selectors at text
 * DEPENDS : wala
 * VERSION : v1 | 2026-11-19 | unang bersyon
 * VERSION : v2 | 2026-11-20 | naka-IIFE na (walang module); window.BMWW namespace; dagdag SIDEBAR_TEMPLATE
 * VERSION : v2.3 | 2026-11-20 | PAGE_LIST (calibration, master), required/gated sa PATH_LIST, ROW_CLASS, bagong text
 * VERSION : v2.2 | 2026-11-20 | PATH_LIST (server, saving, 3 data source), ROOT_KEY, BADGE, LEGACY_NAME_FIELD, bagong selector at text
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
    PAGE_LIST: ['dashboard', 'settings', 'calibration', 'master'],
    OPEN_CLASS: 'sidebar-open',
    ACTIVE_CLASS: 'is-active',
    STORAGE_KEY: 'bmww.settings',
    DB_NAME: 'bmww-db',
    DB_STORE: 'handles',
    // Listahan ng mga path sa Settings. required: kailangan bago mag-save. gated: nakasara hanggang may Saving path (ROOT_KEY).
    PATH_LIST: [
      { key: 'server', gated: true, label: 'Server path', note: 'Folder sa server o shared drive. Mas maayos kung naka-map ito bilang drive letter (hal. Z:).' },
      { key: 'root', required: true, label: 'Saving path (BMWW)', note: 'Dito sine-save ang settings.json. Dapat BMWW ang pangalan ng folder.' },
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
    ROOT_FOLDER_NAME: 'BMWW',
    SETTINGS_SUBFOLDER: 'settings',
    SETTINGS_FILE: 'settings.json',
    SETTINGS_PATH_LABEL: 'C:\\desktop\\BMWW\\settings',
    MACHINE_MODE: { USER_INPUT: 'user-input', LEAD_PC: 'lead-pc' },
    LEAD_PC_NAME: 'LEAD PC',
    MACHINE_NAME_MAX: 30,
    SELECTOR: {
      content: '#content', sidebar: '#sidebar', overlay: '#overlay', menuButton: '#menu-button', navLink: '.sidebar-link',
      dashboard: { machine: '#dash-machine', mode: '#dash-mode', root: '#dash-root', source: '#dash-source', saved: '#dash-saved' },
      settings: {
        modeRadio: 'input[name="machine-mode"]', nameInput: '#machine-name', note: '#machine-note',
        pathList: '#path-list', lockBadge: '#machine-lock',
        saveButton: '#save-settings', status: '#settings-status'
      }
    },
    TEXT: {
      loading: 'Nilo-load ang page...', pageError: 'Hindi mabuksan ang page. Subukan ulit.', sidebarError: 'Hindi mabuksan ang menu.',
      notSet: 'Hindi pa naka-set', needReselect: ' (piliin ulit para ma-access)',
      modeUser: 'Uri: User input', modeLead: 'Uri: Lead PC',
      machineWarn: 'Isang beses lang itong ma-set. Pagkatapos ma-save, hindi na mababago.',
      machineLocked: 'Naka-lock na ang machine name. Hindi na ito mababago.',
      confirmLock: 'Isang beses lang ito ma-set at hindi na mababago. Ituloy?',
      machineMissing: 'Pumili ng uri at maglagay ng machine name.',
      rootMissing: 'Piliin muna ang Saving path (BMWW folder). Kailangan ito bago mag-save.', wrongRoot: 'Ang piliing folder ay dapat na may pangalang BMWW.',
      noPermission: 'Hindi pinayagan ang access sa folder.', folderPicked: 'Napili ang folder. I-save ang settings.',
      folderError: 'Hindi mapili ang folder.', saveError: 'Hindi na-save ang settings. Subukan ulit.',
      saved: 'Na-save sa ', loadError: 'Hindi mabasa ang naunang settings.',
      unsupported: 'Gamitin ang Chrome o Edge sa laptop para makapili ng folder.',
      badgeSet: 'Naka-set', badgeEmpty: 'Hindi pa naka-set', badgeReselect: 'Piliin ulit',
      badgeLocked: 'Naka-lock', badgeOpen: 'Hindi pa naka-lock',
      pickButton: 'Piliin', changeButton: 'Palitan',
      badgeRequired: 'Required', badgeClosed: 'Hindi pa bukas',
      lockedPathNote: 'Piliin muna ang Saving path (BMWW) para mabuksan ito.',
      pathsUnlocked: 'Bukas na ang ibang path. Piliin ang mga ito, tapos i-save.'
    }
  });

})();
