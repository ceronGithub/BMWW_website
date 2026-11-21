/*
 * FILE    : js/core/calibration-export.js
 * PURPOSE : Ginagawang Excel (.xlsx) ang resulta ng Calibration correl at sine-save sa <Saving path>\calibration-correl\<petsa ng export>\ (may kopya sa <Server path>\calibration-correl\<machine name>\<petsa ng export>\)
 * DEPENDS : js/core/config.js, master-export-config.js, calibration-config.js, xlsx-writer.js, csv-reader.js, master-analysis.js
 * VERSION : v9.0 | 2026-11-22 | bagong file (kopya ng correl-export.js ng Master Correl, para sa Calibration)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.exportConfig;
  const CALIBRATION = root.calibrationConfig;
  const SETTING = CALIBRATION.EXPORT;
  const TEXT = CALIBRATION.TEXT;
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
    if (level === levelMap.green) return EXPORT.COLOR.green;
    if (level === levelMap.yellow) return EXPORT.COLOR.yellow;
    if (level === levelMap.red) return EXPORT.COLOR.red;
    return SETTING.CHART.POINT_COLOR;
  }

  // Saklaw ng axis ayon sa data na may espasyo (kapareho ng zoom out sa screen).
  function getPaddedLimits(valueList) {
    const list = valueList.filter((value) => typeof value === 'number' && Number.isFinite(value));
    const low = Math.min(...list);
    const high = Math.max(...list);
    const pad = (high - low || 1) * CONFIG.CHART.PAD_RATIO;
    return { min: Math.floor(low - pad), max: Math.ceil(high + pad) };
  }

  // Scatter chart: x = master, y = actual (After), may trendline (linear) at R squared. Ang mga point na may blangkong halaga ay hindi isinasama.
  function buildChart(result, headerRow, firstDataRow, columnCount, machineName) {
    const setting = SETTING.CHART;
    const columns = SETTING.COLUMN;
    const pairList = result.masterList.map((masterValue, index) => ({ x: masterValue, y: result.actualList[index], level: getLevel(result.actualList[index], masterValue) }));
    const usable = pairList.filter((pair) => pair.x !== null && pair.y !== null);
    const xLimits = getPaddedLimits(usable.map((pair) => pair.x));
    const yLimits = getPaddedLimits(usable.map((pair) => pair.y));
    const lastDataRow = firstDataRow + pairList.length - 1;
    return {
      kind: 'scatter', title: (machineName ? machineName + ' ' : '') + TEXT.scatterTitle, xTitle: TEXT.scatterX, yTitle: TEXT.scatterY,
      nameRef: { column: columns.actual, row: headerRow, text: TEXT.actual }, pointSeriesList: null, hideLegend: true,
      xRange: { column: columns.master, firstRow: firstDataRow, lastRow: lastDataRow }, yRange: { column: columns.actual, firstRow: firstDataRow, lastRow: lastDataRow },
      xValues: pairList.map((pair) => pair.x), yValues: pairList.map((pair) => pair.y),
      pointColorList: pairList.map((pair) => getLevelColor(pair.level)), pointColor: setting.POINT_COLOR, markerSize: setting.MARKER_SIZE,
      trendColor: setting.TREND_COLOR, trendWidth: setting.TREND_WIDTH,
      xMin: xLimits.min, xMax: xLimits.max, yMin: yLimits.min, yMax: yLimits.max,
      anchor: { column: columnCount + setting.GAP_COLUMNS, row: 0, widthPixels: setting.WIDTH_PIXELS, heightPixels: setting.HEIGHT_PIXELS }
    };
  }

  // Text ng Worst slider: <barcode> (<diff>) o '-' kung wala.
  function getWorstSliderText(result) {
    const worst = masterAnalysis.findWorstSlider(result.barcodeList, result.actualList, result.masterList);
    return worst ? worst.barcode + ' (' + worst.difference.toFixed(SETTING.CHART.DIGITS) + ')' : '-';
  }

  // Sheet: buod sa taas, table ng barcode / actual / master sa ibaba, chart sa kanan.
  function buildSheet(result, range, exportedAt, sourceText, machineName) {
    const label = (text) => ({ v: text, s: STYLE.bold });
    const rows = [
      [label(SETTING.LABEL.title)],
      [label(SETTING.LABEL.machine), machineName || '-'],
      [label(SETTING.LABEL.status), result.status],
      [label(TEXT.rSquared), numberCell(result.regression.rSquared, STYLE.precise)],
      [label(SETTING.LABEL.slope), numberCell(result.regression.slope, STYLE.precise)],
      [label(SETTING.LABEL.intercept), numberCell(result.regression.intercept, STYLE.precise)],
      [label(TEXT.recordDate), formatDayTime(result.recordDate)],
      [label(TEXT.fileName), result.fileName],
      [label(TEXT.actualAverage), numberCell(result.actualAverage)],
      [label(TEXT.masterAverage), numberCell(result.masterAverage)],
      [label(TEXT.worstBarcode), getWorstSliderText(result)],
      [label(SETTING.LABEL.dateRange), formatDay(range.startDate) + ' - ' + formatDay(range.endDate)],
      [label(SETTING.LABEL.dataSource), sourceText],
      [label(SETTING.LABEL.exportedAt), formatDayTime(exportedAt)],
      []
    ];
    const headerRow = rows.length;
    rows.push([TEXT.barcode, TEXT.actual, TEXT.master].map((header) => ({ v: header, s: STYLE.header })));
    const firstDataRow = rows.length;
    result.barcodeList.forEach((barcode, index) => {
      const level = getLevel(result.actualList[index], result.masterList[index]);
      rows.push([barcode, numberCell(result.actualList[index], getLevelStyle(level)), numberCell(result.masterList[index])]);
    });
    return { name: SETTING.SHEET, rows, columnWidths: xlsx.computeColumnWidths(rows, EXPORT.AUTOFIT), showGridLines: false, chart: buildChart(result, headerRow, firstDataRow, 3, machineName) };
  }

  // Pangalan ng file: calibration-correl_<petsa ng record>_<yyyymmdd-hhmmss>.xlsx (hindi nao-overwrite ang luma).
  function buildFileName(result, exportedAt) {
    const stamp = formatDay(exportedAt).replace(/-/g, '') + '-' + padTwo(exportedAt.getHours()) + padTwo(exportedAt.getMinutes()) + padTwo(exportedAt.getSeconds());
    return SETTING.FILE_PREFIX + '_' + formatDay(result.recordDate) + '_' + stamp + SETTING.FILE_EXTENSION;
  }

  // Gumagawa ng Blob ng Excel file mula sa resulta ng analyzeLatest. range = { startDate, endDate }.
  function buildBlob(result, range, exportedAt, sourceText, machineName) {
    return xlsx.buildWorkbook([buildSheet(result, range, exportedAt, sourceText, machineName)], EXPORT.COLOR);
  }

  // Isinusulat ang Blob bilang file sa loob ng folder; kapag pumalya, inaabort ang sulat at ipinapasa ang error.
  async function writeBlob(folderHandle, fileName, blob) {
    const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(blob);
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { /* walang magagawa kung pumalya rin ang abort */ }
      throw error;
    }
    await writable.close();
  }

  // Sine-save ang Excel sa <Saving path>/<SUBFOLDER>/<yyyy-mm-dd>/ (ginagawa ang mga folder kung wala pa). Ibinibigay rin ang blob at dateFolderName para sa kopya sa Server path.
  async function exportCalibration(result, range, rootHandle, sourceText, machineName) {
    const exportedAt = new Date();
    const blob = buildBlob(result, range, exportedAt, sourceText, machineName);
    const subfolderHandle = await rootHandle.getDirectoryHandle(SETTING.SUBFOLDER, { create: true });
    const dateFolderName = formatDay(exportedAt);
    const folderHandle = await subfolderHandle.getDirectoryHandle(dateFolderName, { create: true });
    const fileName = buildFileName(result, exportedAt);
    await writeBlob(folderHandle, fileName, blob);
    return { folderName: SETTING.SUBFOLDER + EXPORT.PATH_SEPARATOR + dateFolderName, fileName, blob, dateFolderName };
  }

  // Pangalan ng folder ng machine sa Server path: pinapalitan ang mga bawal na character; kapag walang matira, ang NO_MACHINE_FOLDER.
  function getMachineFolderName(machineName) {
    const cleaned = String(machineName || '').replace(SETTING.SERVER.UNSAFE_NAME, '_').replace(SETTING.SERVER.TRIM_NAME, '');
    return cleaned || SETTING.SERVER.NO_MACHINE_FOLDER;
  }

  // Kopya sa <Server path>/<SERVER.SUBFOLDER>/<machine name>/<yyyy-mm-dd>/ (iisang file na ino-overwrite). saved = ibinalik ng exportCalibration.
  async function copyToServer(serverHandle, saved, machineName) {
    const subfolderHandle = await serverHandle.getDirectoryHandle(SETTING.SERVER.SUBFOLDER, { create: true });
    const machineFolderName = getMachineFolderName(machineName);
    const machineHandle = await subfolderHandle.getDirectoryHandle(machineFolderName, { create: true });
    const folderHandle = await machineHandle.getDirectoryHandle(saved.dateFolderName, { create: true });
    await writeBlob(folderHandle, SETTING.SERVER.FILE_NAME, saved.blob);
    return { folderName: [SETTING.SERVER.SUBFOLDER, machineFolderName, saved.dateFolderName].join(EXPORT.PATH_SEPARATOR), fileName: SETTING.SERVER.FILE_NAME };
  }

  root.calibrationExport = Object.freeze({ buildBlob, buildFileName, exportCalibration, copyToServer, getMachineFolderName });
})();
