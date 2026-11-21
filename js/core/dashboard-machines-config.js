/*
 * FILE    : js/core/dashboard-machines-config.js
 * PURPOSE : Lahat ng constants, selector at text ng Dashboard machine view (LEAD PC monitor at SENDER machine)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * VERSION : v6 | 2026-11-21 | Task 1D: bagong file (hiwalay sa config.js para hindi magalaw ang existing)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.dashboardMachinesConfig = Object.freeze({
    // Gaano kadalas mag-refresh ang view (ms).
    POLL_MS: 5000,
    // Role ng PC: lead = nagbabasa lang; sender = nagpapadala ng status sa queue.
    ROLE: {
      lead: { key: 'lead', label: 'LEAD PC', note: 'MONITOR ONLY', icon: '\u25C9' },
      sender: { key: 'sender', label: 'MACHINE', note: 'SENDER', icon: '\u25B2' },
      unset: { key: 'unset', label: 'NOT SET', note: '', icon: '\u25CB' }
    },
    // Pagkakasunod ng tile: mas mababa ang numero, mas nauuna.
    RANK: { ongoing: 0, done: 1, idle: 2, stale: 3, noStatus: 4 },
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
      role: '#dm-role'
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
      summary: { total: 'Total', active: 'Active', ongoing: 'Ongoing', done: 'Done', stale: 'Stale', noStatus: 'No status' },
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
      grant: 'Payagan ang folder'
    }
  });
})();
