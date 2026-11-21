/*
 * FILE    : js/core/dashboard-machines-config.js
 * PURPOSE : Lahat ng constants, selector at text ng Dashboard machine view (LEAD PC monitor at SENDER machine)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v8.10 | 2026-11-21 | TEXT.preview.panel.compare.noFileLead (Preview ng worst slider sa LEAD PC)
 * VERSION : v8.9 | 2026-11-21 | Preview ay bagong tab (PREVIEW_TAB, TEXT.preview.tab); inalis ang text ng popup (close, loading, columns, openExplorer, rowHint)
 * VERSION : v8.8 | 2026-11-21 | PREVIEW_PANEL, TEXT.preview.panel.compare at text ng chart (Preview ng worst slider at chart ng Master Correl)
 * VERSION : v8.7 | 2026-11-21 | TEXT.preview.panel (maliit na panel ng Preview)
 * VERSION : v7.8 | 2026-11-21 | HIDE_ORPHANS (itinatago ang stale at hindi naka-register na machine, hal. lumang pangalan)
 * VERSION : v7.7 | 2026-11-21 | TEXT.excelIssue (dahilan kung bakit hindi nabasa ang Master Correl Excel)
 * VERSION : v7.4 | 2026-11-21 | TEXT.preview at SELECTOR.previewStatus (Preview button ng Master Correl sa tile ng machine)
 * VERSION : v7.3 | 2026-11-21 | TEXT.correl at TEXT.summary.correlFail (status ng Master Correl: PASS / WARNING / FAIL)
 * VERSION : v6 | 2026-11-21 | Task 1D: bagong file (hiwalay sa config.js para hindi magalaw ang existing)
 * VERSION : v7 | 2026-11-21 | COMPARE (worst slider mula sa <Server path>\compare), RANK.alert, text at class ng alert
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.dashboardMachinesConfig = Object.freeze({
    // Gaano kadalas mag-refresh ang view (ms).
    POLL_MS: 5000,
    // true = hindi ipinapakita (at hindi binibilang) ang machine na STALE at hindi naka-register (hal. naiwang entry ng lumang pangalan). Walang binubura sa Server.
    HIDE_ORPHANS: true,
    // Role ng PC: lead = nagbabasa lang; sender = nagpapadala ng status sa queue.
    ROLE: {
      lead: { key: 'lead', label: 'LEAD PC', note: 'MONITOR ONLY', icon: '\u25C9' },
      sender: { key: 'sender', label: 'MACHINE', note: 'SENDER', icon: '\u25B2' },
      unset: { key: 'unset', label: 'NOT SET', note: '', icon: '\u25CB' }
    },
    // Pagkakasunod ng tile: mas mababa ang numero, mas nauuna.
    RANK: { alert: -1, ongoing: 0, done: 1, idle: 2, stale: 3, noStatus: 4 },
    // Worst slider galing sa Master Correl ng machine: luma na kapag lampas dito ang edad ng file (ms).
    COMPARE: { STALE_MS: 86400000, DIGITS: 3, LEVEL_CLASS: { 'level-red': 'dm-alert-red', 'level-yellow': 'dm-alert-yellow' }, LEVEL_TEXT: { 'level-red': 'RED', 'level-yellow': 'YELLOW' } },
    // Preview tab: target ng window.open, gaano katagal bago i-revoke ang blob URL (ms), pinakakaunting point para magkaroon ng chart, class ng numero, at klase ng badge ayon sa level.
    PREVIEW_TAB: { TARGET: '_blank', BLANK_URL: 'about:blank', REVOKE_MS: 60000, MIN_POINTS: 2, NUMBER_CLASS: 'num', LEVEL_BADGE: { 'level-red': 'is-fail', 'level-yellow': 'is-warning', 'level-green': 'is-pass' } },
    LABEL: {
      presence: { active: 'ACTIVE', stale: 'STALE', noStatus: 'NO STATUS' },
      state: { ongoing: 'ONGOING', done: 'DONE', idle: 'IDLE' },
      mode: { calibration: 'Calibration', master: 'Master', online: 'Online', offline: 'Offline', idle: '' },
      source: { source1: 'Data source 1', source2: 'Data source 2', source3: 'Data source 3' }
    },
    CLASS: {
      tile: 'dm-tile',
      tileRole: { lead: 'dm-tile-lead', sender: 'dm-tile-sender' },
      presence: { active: 'dm-presence-active', stale: 'dm-presence-stale', noStatus: 'dm-presence-none' },
      state: { ongoing: 'dm-state-ongoing', done: 'dm-state-done', idle: 'dm-state-idle' }
    },
    SELECTOR: {
      section: '#dm-section',
      title: '#dm-title',
      updated: '#dm-updated',
      summary: '#dm-summary',
      pinned: '#dm-pinned',
      grid: '#dm-grid',
      message: '#dm-message',
      grant: '#dm-grant',
      role: '#dm-role',
      previewStatus: '#dm-preview-status'
    },
    TEXT: {
      titleLead: 'Mga machine na nagpapadala',
      titleSender: 'Status ng machine na ito',
      updatedPrefix: 'Huling refresh: ',
      justNow: 'ngayon lang',
      agoSecond: 's ago',
      agoMinute: 'm ago',
      agoHour: 'h ago',
      never: 'wala pa',
      leadTileNote: 'Nagbabasa lang. Hindi nagpapadala ng data.',
      senderTileNote: 'Nagpapadala ng status sa LEAD PC.',
      unsetNote: 'Pumunta sa Settings at i-save ang machine name.',
      notRegistered: 'HINDI NAKA-REGISTER',
      emptyGrid: 'Wala pang naka-register na machine.',
      noFile: 'Walang file pa',
      lastSent: 'Huling naipadala: ',
      excelIssue: {
        noFolder: '{machine}: walang folder sa master-correl na ganito ang pangalan. Mga folder na nakita: {detail}',
        noFile: '{machine}: walang master-correl Excel file sa folder ng machine.',
        unreadable: '{machine}: hindi mabasa ang Excel na {detail}.',
        error: '{machine}: pumalya ang pagbasa ng Excel ({detail}).',
        none: '(wala)'
      },
      summary: { total: 'Total', active: 'Active', ongoing: 'Ongoing', done: 'Done', stale: 'Stale', noStatus: 'No status', worstSlider: 'Worst slider', correlFail: 'Correl fail' },
      correl: { label: 'MASTER CORREL', none: 'Wala pang resulta', rSquared: 'R Square ', record: 'Record: ', sent: 'Sent: ', stale: 'LUMA', icon: { PASS: '\u2714', WARNING: '\u25B2', FAIL: '\u2716' } },
      compare: {
        preview: 'Preview',
        previewAria: 'Buksan ang Preview ng worst slider ng ',
        title: 'WORST SLIDER: {barcode}',
        today: 'Today: Actual {actual} | Master {master} | Diff {diff}',
        previous: 'Previous: Actual {actual} | Master {master} | Diff {diff} ({change})',
        noPrevious: 'Walang previous na mapaghahambing.',
        record: 'Record: ',
        sent: 'Compare: ',
        stale: 'LUMA',
        detailsSummary: 'Mga slider na kailangang tingnan ({n})',
        columns: ['Barcode', 'Actual (prev > today)', 'Master (prev > today)', 'Diff today', 'Trend'],
        arrow: ' > '
      },
      connection: {
        ok: '',
        noFolder: 'Wala pang Server path. Itakda sa Settings.',
        noPermission: 'Kailangan ng pahintulot sa Server folder.',
        unsupported: 'Hindi suportado ng browser na ito ang folder access (gamitin ang Chrome o Edge).',
        error: 'Hindi mabasa ang Server folder ngayon. Susubukan ulit.'
      },
      monitor: {
        running: '',
        stopped: 'Hindi pa tumatakbo ang monitor.',
        notApplicable: 'Walang machine name. I-save sa Settings.',
        noSource: 'Walang Data source folder. Itakda sa Settings.',
        noServer: 'Wala pang Server path. Itakda sa Settings.',
        noPermission: 'Kailangan ng pahintulot sa folder.',
        unsupported: 'Hindi suportado ng browser na ito ang folder access (gamitin ang Chrome o Edge).',
        error: 'May problema sa monitor. Susubukan ulit.'
      },
      grant: 'Payagan ang folder',
      // Preview button ng Master Correl: binubuksan ang File Explorer sa pinakabagong file ng machine sa Server path.
      preview: {
        button: 'Preview',
        aria: 'Buksan sa Windows ang pinakabagong Master Correl file ng ',
        opening: 'Hinahanap ang pinakabagong Master Correl file ng ',
        opened: 'Ipinadala ang utos na buksan ang folder: ',
        openedHint: ' | Kung walang bumukas: i-install muna ang tools\\open-handler\\install-open-handler.bat, at sa tanong ng browser piliin ang Open.',
        clearMs: 12000,
        // Preview: bagong tab na nagpapakita ng laman ng Excel file na nabasa (buod, chart at laman ng sheet).
        panel: {
          title: 'Master Correl: ',
          stats: { rSquared: 'R Square', record: 'Record', actualAverage: 'Actual AVG', masterAverage: 'Master AVG', worst: 'Worst slider', file: 'File' },
          noFileSender: 'Wala pang Master Correl file ngayong araw sa Saving path. Patakbuhin ang Master Correl sa Master page.',
          noFileLead: 'Wala pang nabasang Master Correl file ng machine na ito sa Server path.',
          noRoot: 'Kailangan ng pahintulot sa Saving path. Pindutin ulit ang Preview at i-Allow.',
          correlChartTitle: 'Master Correl ', correlChartX: 'Master', correlChartY: 'Actual',
          // Preview ng worst slider (Compare): Previous vs Today.
          compare: {
            title: 'Worst slider: ', dateLength: 10, seriesPrevious: 'Previous', seriesToday: 'Today', chartTitle: 'Compare diff: Previous vs Today',
            stats: { worst: 'Worst slider', today: 'Today record', previous: 'Previous record', rSquaredToday: 'R Square (today)', rSquaredPrevious: 'R Square (previous)', todayFile: 'Today file', previousFile: 'Previous file', file: 'File' },
            noFileSender: 'Wala pang Master Compare file ngayong araw sa Saving path. Pindutin ang Compare vs previous sa Master page.',
            noFileLead: 'Wala pang nabasang Master Compare file ng machine na ito sa Server path (master-compare). Kailangang mag-Compare vs previous muna ito sa Master page.',
            noRoot: 'Kailangan ng pahintulot sa Saving path. Pindutin ulit ang Preview at i-Allow.'
          }
        },
        // Teksto ng bagong tab.
        tab: {
          loading: 'Binabasa ang Excel file...',
          blocked: 'Hinarang ng browser ang bagong tab. I-allow ang pop-ups para sa site na ito, tapos pindutin ulit ang Preview.',
          readAt: 'Na-save ang file: ', chartHeading: 'Chart (iginuhit mula sa data ng Excel)', sheetHeading: 'Laman ng Excel file', sheetNote: 'Ito ang mga cell na nabasa sa sheet (basa lang; walang binabago sa file).', rowHeader: '#', noSheet: 'Walang laman ang sheet.', lang: 'fil'
        },
        error: {
          noFile: 'Wala pang na-export na Master Correl file ng machine na ito sa Server path. Kailangang mag-Export to Excel muna ito sa Master page.',
          noRootPath: 'Ilagay ang FULL PATH ng Server path sa Settings na may drive letter (hal. Z:\\BMWW). Hindi gumagana ang \\\\server na path.',
          noFolder: 'Wala pang Server path. Itakda sa Settings.',
          noPermission: 'Kailangan ng pahintulot sa Server folder. Pindutin ulit ang Preview at i-Allow.',
          unsupported: 'Hindi suportado ng browser na ito ang folder access (gamitin ang Chrome o Edge).',
          error: 'Hindi mabuksan ang Master Correl file. Subukan ulit.'
        }
      }
    }
  });
})();
