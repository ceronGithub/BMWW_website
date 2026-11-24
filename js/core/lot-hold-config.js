/*
 * FILE    : js/core/lot-hold-config.js
 * PURPOSE : Constants ng auto-hold ng LOT Tracking (nawalang file, walang Average, paglilinis ng hold pagkatapos ng re-measure)
 * DEPENDS : js/core/lot-config.js (window.BMWW)
 * VERSION : v1 | 2026-11-24 | bagong file (Task 1A: auto-hold)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.lotHoldConfig = Object.freeze({
    // Ilang magkasunod na scan na wala ang file bago ituring na binura (iwas sa saglit na pagkawala habang sinusulat ng machine).
    MISSING_SCANS: 2,
    // Ang file ay binabasa lang kapag hindi na ito nababago nang ganito katagal (tapos na ang sulat ng machine).
    QUIET_MS: 10000,
    // Pagkatapos ng re-measure na may Average, ganito katagal dapat hindi mabura ang file bago tanggalin ang hold.
    SETTLE_MS: 30000,
    // Pinakamalaking basahin na CSV (bytes).
    READ_MAX_BYTES: 4194304,
    CSV: Object.freeze({
      EXTENSION: '.csv',
      SUMMARY_TITLE: '[summary]',
      AVERAGE_LABEL: 'average'
    }),
    REASON: Object.freeze({
      deleted: 'FILE DELETED',
      noAverage: 'NO AVERAGE'
    }),
    // Isinusulat sa Remarks ng monitoring (hanggang LOT.MONITORING.TEXT_MAX).
    REMARKS: Object.freeze({
      holdPrefix: 'On hold',
      holdDeleted: 'On hold - File deleted',
      holdNoAverage: 'On hold - No Average',
      cleared: 'Re-measured OK'
    }),
    FILE: Object.freeze({
      FIELD: Object.freeze({
        barcode: 'Barcode', lotUnit: 'LOT Unit', wafer: 'Wafer', operator: 'Operator', machine: 'Machine',
        time: 'Time', pcName: 'PC name', reason: 'Reason', source: 'Source', fileName: 'File', timeMs: 'TimeMs'
      }),
      SOURCE_AUTO: 'AUTO',
      READ_MAX_FILES: 500,
      READ_MAX_BYTES: 65536
    }),
    TEXT: Object.freeze({
      held: 'Auto On hold: ',
      deleted: ' (nabura ang file)',
      noAverage: ' (walang Average, i-re-measure)',
      cleared: 'Natanggal sa On hold: ',
      holdWriteWarning: 'Auto On hold: hindi naisulat ang hold file sa '
    })
  });
})();
