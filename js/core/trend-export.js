/*
 * FILE    : js/core/trend-export.js
 * PURPOSE : Export to Excel ng Trend: gumagawa ng Excel (Summary, Points at isang sheet na may chart kada value), ng picture ng 6 chart, at nagse-save: Excel sa Saving path lang; picture at meta sa Saving path at Server path
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, xlsx-writer.js, trend-config.js, trend-limits.js, trend-reader.js, trend-chart.js, trend-image.js, trend-export-config.js, trend-sync.js
 * INPUT   : exportAll({ run, pointList, limitMap, changeList, machineName, settings }) mula sa click ng Export
 * OUTPUT  : Promise<{ message, kind }>; nagtatapon ng error (may code) kapag pumalya ang Saving path o ang paggawa ng file. getErrorMessage(error) ang friendly na mensahe
 * VERSION : v9.4 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const TREND = root.trendConfig;
  const EXPORT = root.trendExportConfig;
  const SETTING = EXPORT.XLSX;
  const LABEL = SETTING.LABEL;
  const { csv, storage, xlsx, trendLimits, trendReader, trendImage, trendSync } = root;
  const STYLE = xlsx.STYLE;

  // Dalawang digit (hal. 7 -> 07).
  function padTwo(value) {
    return String(value).padStart(2, '0');
  }

  // Petsa at oras: yyyy-mm-dd hh:mm.
  function formatDateTime(date) {
    return csv.formatDateInput(date) + ' ' + padTwo(date.getHours()) + ':' + padTwo(date.getMinutes());
  }

  // Cell ng numero; blangko kung walang halaga.
  function numberCell(value, styleIndex) {
    return value === null || value === undefined ? '' : { v: value, s: styleIndex === undefined ? STYLE.precise : styleIndex };
  }

  // Autofit ng column.
  function computeColumnWidths(rows) {
    return xlsx.computeColumnWidths(rows, SETTING.AUTOFIT);
  }

  // Labas ba sa UCL o LCL ang value?
  function isOutOfLimit(value, limit) {
    const state = trendLimits.classify(value, limit);
    return state === TREND.POINT_STATE.above || state === TREND.POINT_STATE.below;
  }

  // Sheet 1: buod at talaan ng limit ng bawat value.
  function buildSummarySheet(context, exportedAt, sourceText) {
    const label = (text) => ({ v: text, s: STYLE.bold });
    const header = (text) => ({ v: text, s: STYLE.header });
    const outCount = trendImage.countOutAll(context.pointList, context.limitMap);
    const rows = [
      [label(LABEL.title)],
      [label(LABEL.machine), context.machineName || '-'],
      [label(LABEL.range), csv.formatDateInput(context.run.startDate) + ' - ' + csv.formatDateInput(context.run.endDate)],
      [label(LABEL.points), context.pointList.length],
      [label(LABEL.records), context.run.recordList.length],
      [label(LABEL.files), context.run.masterFileCount],
      [label(LABEL.out), outCount],
      [label(LABEL.dataSource), sourceText],
      [label(LABEL.exportedAt), formatDateTime(exportedAt)],
      [],
      [header(LABEL.value)].concat(TREND.LIMIT_FIELD_LIST.map((field) => header(field.label)), [header(LABEL.outColumn)])
    ];
    TREND.METRIC_LIST.forEach((metric) => {
      const limit = context.limitMap[metric.key];
      rows.push([metric.label].concat(TREND.LIMIT_FIELD_LIST.map((field) => numberCell(limit[field.key])), [root.trendChart.countOut(context.pointList, metric, limit)]));
    });
    return { name: SETTING.SHEET.summary, rows, columnWidths: computeColumnWidths(rows), showGridLines: false };
  }

  // Sheet 2: lahat ng point ng chart. Pula ang value na labas sa limit.
  function buildPointsSheet(context) {
    const header = (text) => ({ v: text, s: STYLE.header });
    const headerRow = [LABEL.point, LABEL.shiftDay, LABEL.shift, LABEL.cantilever, LABEL.recordTime, LABEL.file, LABEL.set].map(header)
      .concat(TREND.METRIC_LIST.map((metric) => header(metric.label)), [header(LABEL.outColumn)]);
    const rows = [headerRow];
    context.pointList.forEach((point) => {
      const outList = [];
      const valueCellList = TREND.METRIC_LIST.map((metric) => {
        const value = point.record.valueMap[metric.key];
        const state = trendLimits.classify(value, context.limitMap[metric.key]);
        if (state === TREND.POINT_STATE.above) outList.push(metric.label + ' ' + LABEL.above);
        if (state === TREND.POINT_STATE.below) outList.push(metric.label + ' ' + LABEL.below);
        return numberCell(value, isOutOfLimit(value, context.limitMap[metric.key]) ? STYLE.red : STYLE.precise);
      });
      rows.push([
        trendReader.formatPointLabel(point), point.shiftDay, trendReader.getShiftDisplay(point.shift), point.record.cantilever || '-',
        formatDateTime(new Date(point.record.time)), point.record.fileName, point.isOverride ? LABEL.yes : ''
      ].concat(valueCellList, [outList.join(', ')]));
    });
    return { name: SETTING.SHEET.points, rows, columnWidths: computeColumnWidths(rows), showGridLines: false, freeze: { rows: 1, columns: 1 } };
  }

  // Saklaw ng y-axis ng chart ng isang value (kasama ang limit), may espasyo. Walang laman kung walang value.
  function getAxisRange(valueList) {
    const numberList = valueList.filter((value) => typeof value === 'number' && Number.isFinite(value));
    if (!numberList.length) return null;
    const low = Math.min.apply(null, numberList);
    const high = Math.max.apply(null, numberList);
    const pad = (high - low) * SETTING.CHART.Y_PAD_RATIO || Math.abs(high) * SETTING.CHART.Y_PAD_RATIO || 1;
    return { yMin: low - pad, yMax: high + pad };
  }

  // Sheet ng isang value: row ng value at ng UCL, CL, LCL (ang naka-set lang), at line chart sa ilalim ng table.
  function buildMetricSheet(context, metric) {
    const chartSetting = SETTING.CHART;
    const limit = context.limitMap[metric.key];
    const labelList = context.pointList.map((point) => trendReader.formatPointLabel(point));
    const valueList = context.pointList.map((point) => point.record.valueMap[metric.key]);
    const rows = [[{ v: LABEL.point, s: STYLE.header }].concat(labelList.map((text) => ({ v: text, s: STYLE.header })))];
    rows.push([{ v: metric.label, s: STYLE.bold }].concat(valueList.map((value, index) => numberCell(value, isOutOfLimit(value, limit) ? STYLE.red : STYLE.precise))));
    const seriesList = [{ name: metric.label, row: 1, values: valueList, color: chartSetting.COLOR.line, width: chartSetting.LINE_WIDTH, markerSize: chartSetting.MARKER_SIZE }];
    const allValueList = valueList.slice();
    TREND.LIMIT_FIELD_LIST.forEach((field) => {
      const limitValue = limit[field.key];
      if (limitValue === null) return;
      const limitValues = labelList.map(() => limitValue);
      rows.push([{ v: field.label, s: STYLE.bold }].concat(limitValues.map((value) => numberCell(value))));
      seriesList.push({ name: field.label, row: rows.length - 1, values: limitValues, color: chartSetting.COLOR[field.key], width: chartSetting.LIMIT_WIDTH, markerSize: chartSetting.LIMIT_MARKER_SIZE });
      allValueList.push(limitValue);
    });
    const range = getAxisRange(allValueList);
    const sheet = { name: metric.label, rows, columnWidths: computeColumnWidths(rows), showGridLines: false, freeze: { rows: 1, columns: 1 } };
    if (range && labelList.length) {
      sheet.chart = {
        yMin: range.yMin, yMax: range.yMax, title: (context.machineName ? context.machineName + ' ' : '') + metric.label + ' Trend', xTitle: chartSetting.X_TITLE, yTitle: chartSetting.Y_TITLE,
        nameColumn: 0, categoryRow: 0, firstColumn: 1, lastColumn: labelList.length, categoryList: labelList, seriesList,
        anchor: { column: 0, row: chartSetting.ANCHOR_ROW, widthPixels: chartSetting.WIDTH_PIXELS, heightPixels: chartSetting.HEIGHT_PIXELS }
      };
    }
    return sheet;
  }

  // Blob ng Excel file: Summary, Points at 6 na sheet ng value.
  function buildBlob(context, exportedAt, sourceText) {
    const sheetList = [buildSummarySheet(context, exportedAt, sourceText), buildPointsSheet(context)].concat(TREND.METRIC_LIST.map((metric) => buildMetricSheet(context, metric)));
    return xlsx.buildWorkbook(sheetList, SETTING.COLOR);
  }

  // Pangalan ng file: trend_start_to_end_yyyymmdd-hhmmss.xlsx (hindi nao-overwrite ang luma).
  function buildFileName(run, exportedAt) {
    const stamp = csv.formatDateInput(exportedAt).replace(/-/g, '') + '-' + padTwo(exportedAt.getHours()) + padTwo(exportedAt.getMinutes()) + padTwo(exportedAt.getSeconds());
    return EXPORT.FILE_PREFIX + '_' + csv.formatDateInput(run.startDate) + '_to_' + csv.formatDateInput(run.endDate) + '_' + stamp + EXPORT.FILE_EXTENSION;
  }

  // Meta (trend_latest.json): ito ang binabasa ng Dashboard. Ang updatedAt ang tanda ng bagong update.
  function buildMeta(context, exportedAt, excelFileName) {
    return {
      version: EXPORT.META.VERSION, machineName: context.machineName || '', updatedAt: exportedAt.toISOString(),
      startDate: csv.formatDateInput(context.run.startDate), endDate: csv.formatDateInput(context.run.endDate),
      pointCount: context.pointList.length, recordCount: context.run.recordList.length, outCount: trendImage.countOutAll(context.pointList, context.limitMap),
      excelFileName
    };
  }

  // Kinukuha ang Server path at humihingi ng permission (galing sa click). Hindi nagtatapon ng error.
  async function findServer() {
    try {
      return await root.queue.findServerHandle(true);
    } catch (error) {
      return { handle: null, state: CONFIG.QUEUE.CONNECTION.error };
    }
  }

  // Ang buong export. Humihingi muna ng permission (habang sariwa pa ang click), saka gumagawa ng Excel at picture, saka nagse-save.
  async function exportAll(context) {
    if (!storage.isFolderAccessSupported()) throw csv.createError('unsupported');
    const rootHandle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    if (!rootHandle) throw csv.createError('noRoot');
    if (!(await storage.hasPermission(rootHandle, true))) throw csv.createError('noPermission');
    const serverFound = await findServer();
    const settings = context.settings || storage.readLocalSettings();
    const paths = settings[CONFIG.FOLDER_PATHS_FIELD] || {};
    const sourceText = paths[TREND.SOURCE_KEY] || (settings.folderNames || {})[TREND.SOURCE_KEY] || '-';
    const exportedAt = new Date();
    const excelFileName = buildFileName(context.run, exportedAt);
    const parts = {
      dateFolderName: csv.formatDateInput(exportedAt), excelFileName,
      excelBlob: buildBlob(context, exportedAt, sourceText),
      imageBlob: await trendImage.buildBlob(context),
      metaText: JSON.stringify(buildMeta(context, exportedAt, excelFileName))
    };
    const separator = EXPORT.PATH_SEPARATOR;
    const savedPath = await trendSync.saveToSavingPath(rootHandle, parts);
    const savedText = EXPORT.TEXT.saved + (paths[CONFIG.ROOT_KEY] || rootHandle.name) + separator + savedPath;
    const serverResult = await trendSync.sendToServer(serverFound, context.machineName, parts, paths[CONFIG.SERVER_KEY]);
    if (serverResult.ok) return { message: savedText + EXPORT.TEXT.serverSaved + serverResult.path, kind: 'success' };
    return { message: savedText + EXPORT.TEXT.serverFailed + serverResult.message, kind: 'error' };
  }

  // Friendly na mensahe ng error (walang teknikal na detalye).
  function getErrorMessage(error) {
    const text = EXPORT.TEXT.error;
    if (error && text[error.code]) return text[error.code];
    if (error && EXPORT.ERROR_BY_NAME[error.name]) return text[EXPORT.ERROR_BY_NAME[error.name]];
    return text.exportFail;
  }

  root.trendExport = Object.freeze({ exportAll, getErrorMessage, buildBlob, buildFileName });
})();
