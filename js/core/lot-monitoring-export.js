/*
 * FILE    : js/core/lot-monitoring-export.js
 * PURPOSE : Ginagawang Excel (.xlsx) ang monitoring ng araw: 16 na column, kulay ng Status, Barcode at Wafer na isang beses kada block
 * DEPENDS : js/core/lot-config.js, js/core/lot-shift.js, js/core/xlsx-writer.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 2)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const MON = root.lotConfig.MONITORING;
  const lotShift = root.lotShift;
  const xlsx = root.xlsx;
  const STYLE = xlsx.STYLE;

  // Style ng Status: DONE = berde, ONGOING = kahel; ang iba ay normal.
  function getStatusStyle(status) {
    if (status === MON.STATUS.done) return STYLE.green;
    if (status === MON.STATUS.ongoing) return STYLE.yellow;
    return STYLE.normal;
  }

  // Row ba ito ang simula ng block (ibang barcode o ibang Start kaysa sa nauna).
  function isBlockStart(rowList, index) {
    if (index === 0) return true;
    const previous = rowList[index - 1];
    const current = rowList[index];
    return previous.barcode !== current.barcode || previous.startMs !== current.startMs;
  }

  // Cell ng isang column. Ang Barcode at Wafer ay isang beses lang kada block (kapalit ng merge, na hindi kaya ng xlsx-writer).
  function buildCell(column, row, rowList, index) {
    const isStart = isBlockStart(rowList, index);
    if (column.field === 'barcode') return isStart ? row.barcode : '';
    if (column.field === 'wafer') return isStart || rowList[index - 1].wafer !== row.wafer ? row.wafer : '';
    if (column.field === 'status') return { v: row.status, s: getStatusStyle(row.status) };
    if (column.type === 'time') return lotShift.formatDateTime(row[column.field]);
    if (column.field === 'lotDurationMin') return row.endMs > 0 ? row.lotDurationMin : '';
    return row[column.field];
  }

  // Ang worksheet ng monitoring.
  function buildSheet(doc) {
    const header = MON.COLUMN_LIST.map((column) => ({ v: column.header, s: STYLE.header }));
    const rows = [header];
    doc.rows.forEach((row, index) => {
      rows.push(MON.COLUMN_LIST.map((column) => buildCell(column, row, doc.rows, index)));
    });
    return { name: MON.SHEET_NAME, rows, columnWidths: xlsx.computeColumnWidths(rows, MON.AUTOFIT), showGridLines: false, freeze: { rows: 1, columns: 0 } };
  }

  // Ang Excel bilang Blob mula sa monitoring doc.
  function buildBlob(doc) {
    return xlsx.buildWorkbook([buildSheet(doc)], MON.COLOR);
  }

  root.lotMonitoringExport = Object.freeze({ buildBlob });
})();
