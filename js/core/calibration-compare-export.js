/*
 * FILE    : js/core/calibration-compare-export.js
 * PURPOSE : Ginagawang Excel (.xlsx) ang Calibration Compare at sine-save sa <Saving path>\calibration-compare\<petsa ng export>\ (may kopya sa <Server path>\calibration-compare\<machine name>\<petsa>\)
 * DEPENDS : js/core/config.js, master-export-config.js, master-compare-config.js, calibration-compare-config.js, xlsx-writer.js, csv-reader.js, calibration-export.js
 * VERSION : v9.1 | 2026-11-22 | bagong file (kopya ng master-compare-export.js, para sa Calibration)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.exportConfig;
  const COMPARE = root.compareConfig;
  const SETTING = root.calibrationCompareConfig;
  const { csv, xlsx } = root;
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

  // Style ng cell ayon sa level (green / yellow / red).
  function getLevelStyle(level) {
    const levelMap = CONFIG.MASTER.DEVIATION.LEVEL;
    if (level === levelMap.green) return STYLE.green;
    if (level === levelMap.yellow) return STYLE.yellow;
    if (level === levelMap.red) return STYLE.red;
    return STYLE.number;
  }

  // Style ng Change: pula kapag lumalala, berde kapag gumaganda.
  function getChangeStyle(trend) {
    if (trend === COMPARE.TREND.worse) return STYLE.red;
    if (trend === COMPARE.TREND.better) return STYLE.green;
    return STYLE.number;
  }

  // Text ng slider: <barcode> (<diff>) o '-'.
  function getSliderText(slider) {
    return slider ? slider.barcode + ' (' + slider.difference.toFixed(COMPARE.DISPLAY_DIGITS) + ')' : '-';
  }

  // Sheet 1: buod sa taas at table kada slider.
  function buildCompareSheet(comparison, exportedAt, sourceText, machineName) {
    const { current, previous, sliderList, summary } = comparison;
    const label = (text) => ({ v: text, s: STYLE.bold });
    const text = COMPARE.LABEL;
    const biggest = summary.biggestIncrease;
    const rows = [
      [label(SETTING.LABEL.title)],
      [label(root.calibrationConfig.EXPORT.LABEL.machine), machineName || '-'],
      [label(text.todayDate), formatDayTime(current.recordDate)],
      [label(text.previousDate), formatDayTime(previous.recordDate)],
      [label(text.todayFile), current.fileName],
      [label(text.previousFile), previous.fileName],
      [label(text.rSquaredToday), numberCell(current.regression.rSquared, STYLE.precise)],
      [label(text.rSquaredPrevious), numberCell(previous.regression.rSquared, STYLE.precise)],
      [label(text.rSquaredChange), numberCell(summary.rSquaredChange, STYLE.precise)],
      [label(text.statusToday), current.status],
      [label(text.statusPrevious), previous.status],
      [label(text.worstToday), getSliderText(summary.currentWorst)],
      [label(text.worstPrevious), getSliderText(summary.previousWorst)],
      [label(text.biggestIncrease), biggest ? biggest.barcode + ' (+' + biggest.change.toFixed(COMPARE.DISPLAY_DIGITS) + ')' : COMPARE.TEXT.noBiggest],
      [label(text.worseCount), summary.worseCount],
      [label(text.betterCount), summary.betterCount],
      [label(text.sameCount), summary.sameCount],
      [label(text.unknownCount), summary.unknownCount],
      [label(text.rule), COMPARE.TEXT.ruleNote.replace('{min}', String(COMPARE.WORSEN_MIN))],
      [label(text.dataSource), sourceText],
      [label(text.exportedAt), formatDayTime(exportedAt)],
      []
    ];
    rows.push([text.columnBarcode, text.previousActual, text.previousMaster, text.previousDiff, text.todayActual, text.todayMaster, text.todayDiff, text.columnChange, text.columnTrend].map((header) => ({ v: header, s: STYLE.header })));
    sliderList.forEach((slider) => {
      rows.push([
        slider.barcode,
        numberCell(slider.previousActual), numberCell(slider.previousMaster), numberCell(slider.previousDifference, getLevelStyle(slider.previousLevel)),
        numberCell(slider.currentActual), numberCell(slider.currentMaster), numberCell(slider.currentDifference, getLevelStyle(slider.currentLevel)),
        numberCell(slider.change, getChangeStyle(slider.trend)),
        COMPARE.TREND_TEXT[slider.trend]
      ]);
    });
    return { name: SETTING.SHEET.compare, rows, columnWidths: xlsx.computeColumnWidths(rows, EXPORT.AUTOFIT), showGridLines: false };
  }

  // Sheet 2: barcode sa column; row ng Previous at Today; line chart sa kanan.
  function buildChartSheet(comparison, machineName) {
    const setting = COMPARE.CHART;
    const sliderList = comparison.sliderList;
    const barcodeList = sliderList.map((slider) => slider.barcode);
    const previousList = sliderList.map((slider) => slider.previousDifference);
    const todayList = sliderList.map((slider) => slider.currentDifference);
    const rows = [
      [{ v: COMPARE.LABEL.columnBarcode, s: STYLE.header }].concat(barcodeList.map((barcode) => ({ v: barcode, s: STYLE.header }))),
      [COMPARE.TEXT.seriesPrevious].concat(previousList.map((value) => numberCell(value))),
      [COMPARE.TEXT.seriesToday].concat(todayList.map((value) => numberCell(value)))
    ];
    const valueList = previousList.concat(todayList).filter((value) => typeof value === 'number' && Number.isFinite(value));
    const highest = valueList.length ? Math.max(...valueList) : 0;
    const lastColumn = barcodeList.length;
    const chart = {
      yMin: 0, yMax: Math.max(setting.Y_MIN_MAX, Math.ceil(highest * setting.Y_PAD_RATIO * 10) / 10),
      title: (machineName ? machineName + ' ' : '') + SETTING.TEXT.chartTitle, xTitle: COMPARE.LABEL.columnBarcode, yTitle: 'Diff',
      nameColumn: 0, categoryRow: 0, firstColumn: 1, lastColumn, categoryList: barcodeList,
      seriesList: [
        { name: COMPARE.TEXT.seriesPrevious, row: 1, values: previousList, color: setting.PREVIOUS_COLOR, width: setting.LINE_WIDTH, markerSize: setting.MARKER_SIZE },
        { name: COMPARE.TEXT.seriesToday, row: 2, values: todayList, color: setting.TODAY_COLOR, width: setting.LINE_WIDTH, markerSize: setting.MARKER_SIZE }
      ],
      anchor: { column: lastColumn + 1 + setting.GAP_COLUMNS, row: 0, widthPixels: setting.WIDTH_PIXELS, heightPixels: setting.HEIGHT_PIXELS }
    };
    return { name: SETTING.SHEET.chart, rows, columnWidths: xlsx.computeColumnWidths(rows, EXPORT.AUTOFIT), showGridLines: false, chart };
  }

  // Pangalan ng file: calibration-compare_<petsa today>_vs_<petsa previous>_<yyyymmdd-hhmmss>.xlsx
  function buildFileName(comparison, exportedAt) {
    const stamp = formatDay(exportedAt).replace(/-/g, '') + '-' + padTwo(exportedAt.getHours()) + padTwo(exportedAt.getMinutes()) + padTwo(exportedAt.getSeconds());
    return SETTING.FILE_PREFIX + '_' + formatDay(comparison.current.recordDate) + '_vs_' + formatDay(comparison.previous.recordDate) + '_' + stamp + SETTING.FILE_EXTENSION;
  }

  // Gumagawa ng Blob ng Excel file mula sa resulta ng compareRecords.
  function buildBlob(comparison, exportedAt, sourceText, machineName) {
    return xlsx.buildWorkbook([buildCompareSheet(comparison, exportedAt, sourceText, machineName), buildChartSheet(comparison, machineName)], EXPORT.COLOR);
  }

  // Isinusulat ang Blob bilang file sa folder; kapag pumalya, inaabort ang sulat at ipinapasa ang error.
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

  // Kopya sa <Server path>/<SERVER.SUBFOLDER>/<machine name>/<yyyy-mm-dd>/<SERVER.FILE_NAME> (ino-overwrite).
  async function copyToServer(serverHandle, saved, machineName) {
    const subfolderHandle = await serverHandle.getDirectoryHandle(SETTING.SERVER.SUBFOLDER, { create: true });
    const machineFolderName = root.calibrationExport.getMachineFolderName(machineName);
    const machineHandle = await subfolderHandle.getDirectoryHandle(machineFolderName, { create: true });
    const folderHandle = await machineHandle.getDirectoryHandle(saved.dateFolderName, { create: true });
    await writeBlob(folderHandle, SETTING.SERVER.FILE_NAME, saved.blob);
    return { folderName: [SETTING.SERVER.SUBFOLDER, machineFolderName, saved.dateFolderName].join(EXPORT.PATH_SEPARATOR), fileName: SETTING.SERVER.FILE_NAME };
  }

  // Sine-save ang Excel sa <Saving path>/<SUBFOLDER>/<yyyy-mm-dd>/. Ibinibigay rin ang blob at dateFolderName para sa kopya sa Server.
  async function exportCompare(comparison, rootHandle, sourceText, machineName) {
    const exportedAt = new Date();
    const blob = buildBlob(comparison, exportedAt, sourceText, machineName);
    const subfolderHandle = await rootHandle.getDirectoryHandle(SETTING.SUBFOLDER, { create: true });
    const dateFolderName = formatDay(exportedAt);
    const folderHandle = await subfolderHandle.getDirectoryHandle(dateFolderName, { create: true });
    const fileName = buildFileName(comparison, exportedAt);
    await writeBlob(folderHandle, fileName, blob);
    return { folderName: SETTING.SUBFOLDER + EXPORT.PATH_SEPARATOR + dateFolderName, fileName, blob, dateFolderName };
  }

  root.calibrationCompareExport = Object.freeze({ buildBlob, buildFileName, exportCompare, copyToServer });
})();
