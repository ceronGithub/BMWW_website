/*
 * FILE    : js/core/master-export.js
 * PURPOSE : Ginagawang Excel (.xlsx) ang resulta ng Master Repeatability at sine-save sa subfolder ng Saving path (BMWW)
 * DEPENDS : js/core/config.js, master-export-config.js, xlsx-writer.js, csv-reader.js, master-analysis.js
 * VERSION : v2.8 | 2026-11-20 | bagong file
 * VERSION : v8.14 | 2026-11-22 | machineName (optional, huling parameter): row na Machine sa buod at <machine name> sa pamagat ng chart sa Excel, kapareho ng Master Correl at ng screen
 * VERSION : v2.13 | 2026-11-21 | chart (line chart ng Readings) sa loob ng Excel, sa kanan ng table
 * VERSION : v2.16 | 2026-11-21 | ang autofit ay galing na sa xlsx.computeColumnWidths (xlsx-writer)
 * VERSION : v2.14 | 2026-11-21 | autofit ng lahat ng column (Repeatability at Readings), walang gridlines, mas malaki at fixed na chart
 * VERSION : v2.12 | 2026-11-21 | mode (All / Shift) sa summary, column na Shift sa Readings, suffix sa pangalan ng file
 * VERSION : v2.11 | 2026-11-21 | isang subfolder (master-repeatability) at sa loob nito ay folder na petsa ng export (yyyy-mm-dd)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.exportConfig;
  const TEXT = CONFIG.TEXT.master;
  const { csv, masterAnalysis, xlsx } = root;
  const STYLE = xlsx.STYLE;
  const SHIFT = root.shiftConfig;

  // Dalawang digit (hal. 7 -> 07).
  function padTwo(value) {
    return String(value).padStart(2, '0');
  }

  // Autofit ng column (nasa xlsx-writer, para magamit din ng ibang export).
  function computeColumnWidths(rows) {
    return xlsx.computeColumnWidths(rows, EXPORT.AUTOFIT);
  }

  // Cell ng numero; blangko kung walang halaga.
  function numberCell(value, styleIndex) {
    return value === null || value === undefined ? '' : { v: value, s: styleIndex === undefined ? STYLE.number : styleIndex };
  }

  // Style ng cell ayon sa actual vs master (green / yellow / red, kapareho ng screen).
  function getLevelStyle(actualValue, masterValue) {
    const level = masterAnalysis.classifyDeviation(actualValue, masterValue);
    const levelMap = CONFIG.MASTER.DEVIATION.LEVEL;
    if (level === levelMap.green) return STYLE.green;
    if (level === levelMap.yellow) return STYLE.yellow;
    if (level === levelMap.red) return STYLE.red;
    return STYLE.number;
  }

  // Petsa na yyyy-mm-dd.
  function formatDay(date) {
    return csv.formatDateInput(date);
  }

  // Sheet 1: buod at talaan kada barcode.
  function buildSummarySheet(result, exportedAt, sourceText, machineName) {
    const stats = result.stats;
    const label = (text) => ({ v: text, s: STYLE.bold });
    const rangeText = formatDay(result.startDate) + ' - ' + formatDay(result.endDate);
    const rows = [
      [label(EXPORT.LABEL.title)],
      [label(EXPORT.LABEL.machine), machineName || '-'],
      [label(EXPORT.LABEL.status), stats.status],
      [label(TEXT.repeatability + ' (%)'), numberCell(stats.score)],
      [label(TEXT.averageDifference), numberCell(stats.averageDifference)],
      [label(TEXT.worstBarcode), stats.worstBarcode || '-'],
      [label(TEXT.maxDifference), numberCell(stats.maxDifference)],
      [label(TEXT.actualAverage), numberCell(stats.actualAverage)],
      [label(TEXT.masterAverage), numberCell(stats.masterAverage)],
      [label(TEXT.difference), numberCell(stats.difference)],
      [label(TEXT.records), result.recordCount],
      [label(EXPORT.LABEL.chartRecords), getChartColumnList(result).length + ' / ' + result.columnList.length],
      [label(TEXT.csvFiles), result.fileCount],
      [label(TEXT.masterFiles), result.masterFileCount],
      [label(TEXT.range), rangeText],
      [label(SHIFT.TEXT.modeLabel), SHIFT.TEXT.modeName[result.mode] || SHIFT.TEXT.modeName.all],
      [label(EXPORT.LABEL.dataSource), sourceText],
      [label(EXPORT.LABEL.exportedAt), formatDay(exportedAt) + ' ' + padTwo(exportedAt.getHours()) + ':' + padTwo(exportedAt.getMinutes())],
      [],
      [TEXT.barcode, TEXT.master, TEXT.actualAverageShort, TEXT.averageDifference, TEXT.maxDifference].map((header) => ({ v: header, s: STYLE.header }))
    ];
    stats.perBarcodeList.forEach((entry) => {
      rows.push([
        entry.barcode, numberCell(entry.master),
        numberCell(entry.actualAverage, getLevelStyle(entry.actualAverage, entry.master)),
        numberCell(entry.averageDifference),
        numberCell(entry.maxDifference, entry.maxDifference === null ? STYLE.number : getLevelStyle(entry.maxDifference, 0))
      ]);
    });
    return { name: EXPORT.SHEET.summary, rows, columnWidths: computeColumnWidths(rows), showGridLines: false };
  }

  // Mga record na nasa chart: huling MAX_LINES (kapareho ng chart sa screen). Kumpleto pa rin ang table.
  function getChartColumnList(result) {
    return result.columnList.slice(-CONFIG.MASTER.RANGE.MAX_LINES);
  }

  // Line chart ng Readings: bawat record ay isang linya (pangalan = petsa), x = barcode, kasama ang MASTER.
  function buildReadingsChart(result, leadCount, machineName) {
    const setting = EXPORT.CHART;
    const firstRecordRow = 2;
    const skipCount = result.columnList.length - getChartColumnList(result).length;
    const seriesList = getChartColumnList(result).map((column, index) => ({
      name: column.key, row: firstRecordRow + skipCount + index, values: column.values,
      color: setting.PALETTE[index % setting.PALETTE.length], width: setting.LINE_WIDTH, markerSize: setting.MARKER_SIZE
    }));
    seriesList.push({ name: TEXT.masterSeries, row: 1, values: result.masterList, color: setting.MASTER_COLOR, width: setting.MASTER_LINE_WIDTH, markerSize: setting.MASTER_MARKER_SIZE });
    const lastColumn = leadCount + result.barcodeList.length - 1;
    // Saklaw ng y-axis ayon sa data na may espasyo (kapareho ng zoom out sa screen), para hindi flat ang linya.
    const valueList = [];
    seriesList.forEach((series) => series.values.forEach((value) => { if (typeof value === 'number' && Number.isFinite(value)) valueList.push(value); }));
    const low = Math.min(...valueList);
    const high = Math.max(...valueList);
    const pad = (high - low || 1) * CONFIG.CHART.PAD_RATIO;
    return {
      yMin: Math.floor(low - pad), yMax: Math.ceil(high + pad),
      title: (machineName ? machineName + ' ' : '') + TEXT.lineTitle, xTitle: setting.X_TITLE, yTitle: setting.Y_TITLE, nameColumn: 0, categoryRow: 0,
      firstColumn: leadCount, lastColumn, categoryList: result.barcodeList, seriesList,
      anchor: { column: lastColumn + 1 + setting.GAP_COLUMNS, row: 0, widthPixels: setting.WIDTH_PIXELS, heightPixels: setting.HEIGHT_PIXELS }
    };
  }

  // Sheet 2: lahat ng record (petsa sa row, barcode sa column), may MASTER row sa taas.
  function buildReadingsSheet(result, machineName) {
    const hasShift = result.mode === SHIFT.MODE.shift;
    const header = [{ v: TEXT.recordDate, s: STYLE.header }].concat(hasShift ? [{ v: SHIFT.TEXT.shiftColumn, s: STYLE.header }] : [], result.barcodeList.map((barcode) => ({ v: barcode, s: STYLE.header })));
    const masterRow = [{ v: TEXT.masterSeries, s: STYLE.bold }].concat(hasShift ? [''] : [], result.masterList.map((value) => numberCell(value)));
    const rows = [header, masterRow];
    result.columnList.forEach((column) => {
      rows.push([column.key].concat(hasShift ? [column.shift || ''] : [], column.values.map((value, index) => numberCell(value, getLevelStyle(value, result.masterList[index])))));
    });
    const leadCount = hasShift ? 2 : 1;
    return { name: EXPORT.SHEET.readings, rows, columnWidths: computeColumnWidths(rows), showGridLines: false, freeze: { rows: 2, columns: leadCount }, chart: buildReadingsChart(result, leadCount, machineName) };
  }

  // Pangalan ng file: prefix_start_to_end_yyyymmdd-hhmmss.xlsx (hindi nao-overwrite ang luma).
  function buildFileName(result, exportedAt) {
    const stamp = formatDay(exportedAt).replace(/-/g, '') + '-' + padTwo(exportedAt.getHours()) + padTwo(exportedAt.getMinutes()) + padTwo(exportedAt.getSeconds());
    const modeSuffix = SHIFT.FILE_SUFFIX[result.mode] || SHIFT.FILE_SUFFIX.all;
    return EXPORT.FILE_PREFIX + '_' + modeSuffix + '_' + formatDay(result.startDate) + '_to_' + formatDay(result.endDate) + '_' + stamp + EXPORT.FILE_EXTENSION;
  }

  // Gumagawa ng Blob ng Excel file mula sa resulta ng analyzeRange.
  function buildBlob(result, exportedAt, sourceText, machineName) {
    return xlsx.buildWorkbook([buildSummarySheet(result, exportedAt, sourceText, machineName), buildReadingsSheet(result, machineName)], EXPORT.COLOR);
  }

  // Sine-save ang Excel sa <Saving path>/<SUBFOLDER>/<yyyy-mm-dd>/ (ginagawa ang mga folder kung wala pa).
  async function exportRepeatability(result, rootHandle, sourceText, machineName) {
    const exportedAt = new Date();
    const blob = buildBlob(result, exportedAt, sourceText, machineName);
    const subfolderHandle = await rootHandle.getDirectoryHandle(EXPORT.SUBFOLDER, { create: true });
    const dateFolderName = formatDay(exportedAt);
    const folderHandle = await subfolderHandle.getDirectoryHandle(dateFolderName, { create: true });
    const fileName = buildFileName(result, exportedAt);
    const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(blob);
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { /* walang magagawa kung pumalya rin ang abort */ }
      throw error;
    }
    await writable.close();
    return { folderName: EXPORT.SUBFOLDER + EXPORT.PATH_SEPARATOR + dateFolderName, fileName };
  }

  root.masterExport = Object.freeze({ buildBlob, buildFileName, exportRepeatability });
})();
