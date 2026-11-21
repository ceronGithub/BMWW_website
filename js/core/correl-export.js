/*
 * FILE    : js/core/correl-export.js
 * PURPOSE : Ginagawang Excel (.xlsx) ang resulta ng Master Correl (isang record) at sine-save sa <Saving path>\master-correl\<petsa ng export>\
 * DEPENDS : js/core/config.js, master-export-config.js, correl-export-config.js, xlsx-writer.js, csv-reader.js, master-analysis.js
 * VERSION : v2.19 | 2026-11-21 | table: Barcode, Actual, Master (dating Master, Actual, Barcode); legend ng chart: kulay + Actual / Master kada point; pamagat ng chart: <machine name> Master Correl
 * VERSION : v2.16 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.exportConfig;
  const CORREL = root.correlConfig;
  const TEXT = CONFIG.TEXT.master;
  const { csv, masterAnalysis, xlsx } = root;
  const STYLE = xlsx.STYLE;

  // Dalawang digit (hal. 7 -> 07).
  function padTwo(value) {
    return String(value).padStart(2, '0');
  }

  // Petsa na yyyy-mm-dd.
  function formatDay(date) {
    return csv.formatDateInput(date);
  }

  // Petsa at oras na yyyy-mm-dd hh:mm.
  function formatDayTime(date) {
    return formatDay(date) + ' ' + padTwo(date.getHours()) + ':' + padTwo(date.getMinutes());
  }

  // Cell ng numero; blangko kung walang halaga.
  function numberCell(value, styleIndex) {
    return value === null || value === undefined ? '' : { v: value, s: styleIndex === undefined ? STYLE.number : styleIndex };
  }

  // Level (green / yellow / red) ng actual vs master, kapareho ng screen.
  function getLevel(actualValue, masterValue) {
    return masterAnalysis.classifyDeviation(actualValue, masterValue);
  }

  // Style ng cell ayon sa level.
  function getLevelStyle(level) {
    const levelMap = CONFIG.MASTER.DEVIATION.LEVEL;
    if (level === levelMap.green) return STYLE.green;
    if (level === levelMap.yellow) return STYLE.yellow;
    if (level === levelMap.red) return STYLE.red;
    return STYLE.number;
  }

  // Kulay ng point sa chart ayon sa level (hex).
  function getLevelColor(level) {
    const levelMap = CONFIG.MASTER.DEVIATION.LEVEL;
    const colorMap = EXPORT.COLOR;
    if (level === levelMap.green) return colorMap.green;
    if (level === levelMap.yellow) return colorMap.yellow;
    if (level === levelMap.red) return colorMap.red;
    return CORREL.CHART.POINT_COLOR;
  }

  // Saklaw ng axis ayon sa data na may espasyo (kapareho ng zoom out sa screen).
  function getPaddedLimits(valueList) {
    const list = valueList.filter((value) => typeof value === 'number' && Number.isFinite(value));
    const low = Math.min(...list);
    const high = Math.max(...list);
    const pad = (high - low || 1) * CONFIG.CHART.PAD_RATIO;
    return { min: Math.floor(low - pad), max: Math.ceil(high + pad) };
  }

  // Scatter chart: x = master, y = actual, may trendline (linear) at R squared. Ang mga point na may blangkong halaga ay hindi isinasama.
  function buildChart(result, headerRow, firstDataRow, columnCount, machineName) {
    const setting = CORREL.CHART;
    const pairList = result.masterList.map((masterValue, index) => ({ x: masterValue, y: result.actualList[index], level: getLevel(result.actualList[index], masterValue) }));
    const usable = pairList.filter((pair) => pair.x !== null && pair.y !== null);
    const xLimits = getPaddedLimits(usable.map((pair) => pair.x));
    const yLimits = getPaddedLimits(usable.map((pair) => pair.y));
    const lastDataRow = firstDataRow + pairList.length - 1;
    const columns = CORREL.COLUMN;
    // Legend: isang entry kada point (kulay + Actual / Master), ayon sa ayos ng table.
    const pointSeriesList = [];
    pairList.forEach((pair, index) => {
      if (pair.x === null || pair.y === null) return;
      pointSeriesList.push({
        name: pair.y.toFixed(setting.LEGEND_DIGITS) + setting.LEGEND_SEPARATOR + pair.x.toFixed(setting.LEGEND_DIGITS),
        color: getLevelColor(pair.level), x: pair.x, y: pair.y, xColumn: columns.master, yColumn: columns.actual, row: firstDataRow + index
      });
    });
    return {
      kind: 'scatter', title: (machineName ? machineName + ' ' : '') + TEXT.scatterTitle, xTitle: TEXT.scatterX, yTitle: TEXT.scatterY,
      nameRef: { column: columns.actual, row: headerRow, text: TEXT.actual }, pointSeriesList,
      xRange: { column: columns.master, firstRow: firstDataRow, lastRow: lastDataRow }, yRange: { column: columns.actual, firstRow: firstDataRow, lastRow: lastDataRow },
      xValues: pairList.map((pair) => pair.x), yValues: pairList.map((pair) => pair.y),
      pointColorList: pairList.map((pair) => getLevelColor(pair.level)), pointColor: setting.POINT_COLOR, markerSize: setting.MARKER_SIZE,
      trendColor: setting.TREND_COLOR, trendWidth: setting.TREND_WIDTH,
      xMin: xLimits.min, xMax: xLimits.max, yMin: yLimits.min, yMax: yLimits.max,
      anchor: { column: columnCount + setting.GAP_COLUMNS, row: 0, widthPixels: setting.WIDTH_PIXELS, heightPixels: setting.HEIGHT_PIXELS }
    };
  }

  // Sheet: buod sa taas, table ng barcode / actual / master sa ibaba, chart sa kanan.
  function buildSheet(result, range, exportedAt, sourceText, machineName) {
    const label = (text) => ({ v: text, s: STYLE.bold });
    const rows = [
      [label(CORREL.LABEL.title)],
      [label(CORREL.LABEL.status), result.status],
      [label(TEXT.rSquared), numberCell(result.regression.rSquared, STYLE.precise)],
      [label(CORREL.LABEL.slope), numberCell(result.regression.slope, STYLE.precise)],
      [label(CORREL.LABEL.intercept), numberCell(result.regression.intercept, STYLE.precise)],
      [label(TEXT.recordDate), formatDayTime(result.recordDate)],
      [label(TEXT.fileName), result.fileName],
      [label(TEXT.actualAverage), numberCell(result.actualAverage)],
      [label(TEXT.masterAverage), numberCell(result.masterAverage)],
      [label(CORREL.LABEL.dateRange), formatDay(range.startDate) + ' - ' + formatDay(range.endDate)],
      [label(CORREL.LABEL.dataSource), sourceText],
      [label(CORREL.LABEL.exportedAt), formatDayTime(exportedAt)],
      []
    ];
    const headerRow = rows.length;
    rows.push([TEXT.barcode, TEXT.actual, TEXT.master].map((header) => ({ v: header, s: STYLE.header })));
    const firstDataRow = rows.length;
    result.barcodeList.forEach((barcode, index) => {
      const level = getLevel(result.actualList[index], result.masterList[index]);
      rows.push([barcode, numberCell(result.actualList[index], getLevelStyle(level)), numberCell(result.masterList[index])]);
    });
    return { name: CORREL.SHEET, rows, columnWidths: xlsx.computeColumnWidths(rows, EXPORT.AUTOFIT), showGridLines: false, chart: buildChart(result, headerRow, firstDataRow, 3, machineName) };
  }

  // Pangalan ng file: master-correl_<petsa ng record>_<yyyymmdd-hhmmss>.xlsx (hindi nao-overwrite ang luma).
  function buildFileName(result, exportedAt) {
    const stamp = formatDay(exportedAt).replace(/-/g, '') + '-' + padTwo(exportedAt.getHours()) + padTwo(exportedAt.getMinutes()) + padTwo(exportedAt.getSeconds());
    return CORREL.FILE_PREFIX + '_' + formatDay(result.recordDate) + '_' + stamp + CORREL.FILE_EXTENSION;
  }

  // Gumagawa ng Blob ng Excel file mula sa resulta ng analyzeLatest. range = { startDate, endDate } (mga petsang pinili sa screen).
  function buildBlob(result, range, exportedAt, sourceText, machineName) {
    return xlsx.buildWorkbook([buildSheet(result, range, exportedAt, sourceText, machineName)], EXPORT.COLOR);
  }

  // Sine-save ang Excel sa <Saving path>/<SUBFOLDER>/<yyyy-mm-dd>/ (ginagawa ang mga folder kung wala pa).
  async function exportCorrel(result, range, rootHandle, sourceText, machineName) {
    const exportedAt = new Date();
    const blob = buildBlob(result, range, exportedAt, sourceText, machineName);
    const subfolderHandle = await rootHandle.getDirectoryHandle(CORREL.SUBFOLDER, { create: true });
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
    return { folderName: CORREL.SUBFOLDER + EXPORT.PATH_SEPARATOR + dateFolderName, fileName };
  }

  root.correlExport = Object.freeze({ buildBlob, buildFileName, exportCorrel });
})();
