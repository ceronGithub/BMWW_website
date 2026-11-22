/*
 * FILE    : js/core/lot-lead-config.js
 * PURPOSE : Lahat ng constant ng LEAD PC view ng LOT Tracking (refresh, filter, column, selector, text)
 * DEPENDS : js/core/lot-config.js (window.BMWW.lotConfig)
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 5)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const STATUS = root.lotConfig.MONITORING.STATUS;

  root.lotLeadConfig = Object.freeze({
    PAGE: 'lot-tracking-lead',
    // Kada ilang milliseconds binabasa ulit ang monitoring ng lahat ng machine.
    REFRESH_MS: 10000,
    // Pinakamaraming row na ipinapakita sa table (para hindi bumagal ang page).
    MAX_ROWS: 500,
    // Halaga ng "Lahat" sa filter ng Machine at Status.
    ALL_VALUE: '',
    EMPTY_CELL: '-',
    DAY_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
    STATUS_OPTION_LIST: Object.freeze([
      Object.freeze({ value: '', label: 'Lahat' }),
      Object.freeze({ value: STATUS.ongoing, label: STATUS.ongoing }),
      Object.freeze({ value: STATUS.done, label: STATUS.done })
    ]),
    // Ayos ng mga column ng table (ayon sa seksyon 6 ng spec). Dapat tugma sa <th> ng pages/lot-tracking-lead.html.
    COLUMN_FIELD_LIST: Object.freeze([
      'barcode', 'lotUnit', 'wafer', 'blk', 'layerNo', 'startMs', 'endMs',
      'lotDurationMin', 'operator', 'machine', 'status', 'filePath'
    ]),
    // Resulta ng pagbasa sa Server path.
    STATE: Object.freeze({ ok: 'ok', unsupported: 'unsupported', noServer: 'noServer', noPermission: 'noPermission', noMonitoring: 'noMonitoring', readError: 'readError' }),
    // Problema sa file ng isang machine (walang laman = maayos).
    PROBLEM: Object.freeze({ none: '', noFile: 'noFile', invalid: 'invalid', unreadable: 'unreadable' }),
    BADGE: Object.freeze({ ongoing: 'badge-info', done: 'badge-success' }),
    SELECTOR: Object.freeze({
      day: '#lot-lead-day', machine: '#lot-lead-machine', statusFilter: '#lot-lead-status-filter',
      refresh: '#lot-lead-refresh', message: '#lot-lead-status', machineList: '#lot-lead-machines',
      resultNote: '#lot-lead-note', resultBody: '#lot-lead-body'
    }),
    TEXT: Object.freeze({
      allMachines: 'Lahat ng machine',
      ongoingCount: ' ONGOING na lote',
      noOngoing: 'walang ONGOING na lote',
      updated: 'huling update ',
      noFile: 'walang monitoring file para sa araw na ito',
      invalid: 'hindi mabasa ang monitoring file (sira o ibang version); susubukan ulit',
      unreadable: 'hindi mabuksan ang monitoring file; susubukan ulit',
      noMachines: 'Walang machine na nakita sa <Server path>\\monitoring.',
      noRows: 'Walang lote na tumutugma sa napiling filter.',
      showingLimit: 'Ipinapakita ang unang {n} na row.',
      loaded: 'Na-update noong ',
      dayInvalid: 'Pumili ng tamang petsa.',
      unsupported: 'Hindi suportado ng browser na ito ang pag-access sa folder. Gamitin ang Chrome o Edge.',
      noServer: 'Walang Server path na naka-set sa Settings.',
      noPermission: 'Walang permission sa Server path. Pindutin ang Refresh para humingi ng permission.',
      noMonitoring: 'Wala pang folder na monitoring sa Server path (wala pang machine na nagtala).',
      readError: 'May error sa pagbasa ng monitoring. Subukan ulit.'
    })
  });
})();
