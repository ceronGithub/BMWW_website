/*
 * FILE    : js/core/config.js
 * PURPOSE : Lahat ng constants, selectors at text
 * DEPENDS : wala
 * VERSION : v1 | 2026-11-19 | unang bersyon
 */
export const CONFIG = Object.freeze({
  PAGE_FOLDER: 'pages/',
  COMPONENT_FOLDER: 'components/',
  DEFAULT_PAGE: 'dashboard',
  NOT_FOUND_PAGE: '404',
  PAGE_LIST: ['dashboard', 'settings'],
  OPEN_CLASS: 'sidebar-open',
  ACTIVE_CLASS: 'is-active',
  STORAGE_KEY: 'bmww.settings',
  DB_NAME: 'bmww-db',
  DB_STORE: 'handles',
  HANDLE_KEY: { root: 'rootFolder', source: 'sourceFolder' },
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
      pickRoot: '#pick-root', rootLabel: '#root-label', pickSource: '#pick-source', sourceLabel: '#source-label',
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
    rootMissing: 'Piliin muna ang BMWW folder.', wrongRoot: 'Ang piliing folder ay dapat na may pangalang BMWW.',
    noPermission: 'Hindi pinayagan ang access sa folder.', folderPicked: 'Napili ang folder. I-save ang settings.',
    folderError: 'Hindi mapili ang folder.', saveError: 'Hindi na-save ang settings. Subukan ulit.',
    saved: 'Na-save sa ', loadError: 'Hindi mabasa ang naunang settings.',
    unsupported: 'Gamitin ang Chrome o Edge sa laptop para makapili ng folder.'
  }
});
