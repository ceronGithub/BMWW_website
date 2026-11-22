/*
 * FILE    : js/core/trend-export.js
 * PURPOSE : Export to Excel ng Trend: gumagawa ng Excel (sheet 1 Data na pababa ang talaan, sheet 2 Charts na lahat ng 6 chart sa iisang sheet, puti ang background), ng picture ng 6 chart, at nagse-save: Excel sa Saving path lang; picture at meta sa Saving path at Server path
 * DEPENDS : js/core/config.js, storage.js, csv-reader.js, xlsx-writer.js, trend-config.js, trend-limits.js, trend-reader.js, trend-chart.js, trend-image.js, trend-export-config.js, trend-sync.js
 * INPUT   : exportAll({ run, pointList, limitMap, changeList, machineName, settings }) mula sa click ng Export
 * OUTPUT  : Promise<{ message, kind }>; nagtatapon ng error (may code) kapag pumalya ang Saving path o ang paggawa ng file. getErrorMessage(error) ang friendly na mensahe
 * VERSION : v9.5 | 2026-11-22 | Excel ay 2 sheet na lang: Data (pababa ang data, kasama ang UCL/CL/LCL column) at Charts (6 chart sa iisang sheet, isang column). Wala nang Summary, Points at sheet kada value
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

  // Sheet 1 (Data): pababa ang pagtala ng data, isang point kada row. Mga column: Point, petsa, shift, cantilever, oras, file, Set, 6 na value,
  // Labas sa limit, at sa dulo ang UCL / CL / LCL ng bawat value (ang naka-set lang) para magamit ng chart. Pula ang value na labas sa limit.
  function buildDataSheet(context) {
    const header = (text) => ({ v: text, s: STYLE.header });
    const infoLabelList = [LABEL.point, LABEL.shiftDay, LABEL.shift, LABEL.cantilever, LABEL.recordTime, LABEL.file, LABEL.set];
    const metricColumn = {};
    const limitColumn = {};
    let nextColumn = infoLabelList.length;
    TREND.METRIC_LIST.forEach((metric) => { metricColumn[metric.key] = nextColumn; nextColumn += 1; });
    const outColumn = nextColumn;
    nextColumn += 1;
    const limitHeaderList = [];
    TREND.METRIC_LIST.forEach((metric) => {
      limitColumn[metric.key] = {};
      TREND.LIMIT_FIELD_LIST.forEach((field) => {
        if (context.limitMap[metric.key][field.key] === null) return;
        limitColumn[metric.key][field.key] = nextColumn;
        limitHeaderList.push(metric.label + ' ' + field.label);
        nextColumn += 1;
      });
    });
    const rows = [infoLabelList.concat(TREND.METRIC_LIST.map((metric) => metric.label), [LABEL.outColumn], limitHeaderList).map(header)];
    context.pointList.forEach((point) => {
      const outList = [];
      const valueCellList = TREND.METRIC_LIST.map((metric) => {
        const value = point.record.valueMap[metric.key];
        const state = trendLimits.classify(value, context.limitMap[metric.key]);
        if (state === TREND.POINT_STATE.above) outList.push(metric.label + ' ' + LABEL.above);
        if (state === TREND.POINT_STATE.below) outList.push(metric.label + ' ' + LABEL.below);
        return numberCell(value, isOutOfLimit(value, context.limitMap[metric.key]) ? STYLE.red : STYLE.precise);
      });
      const limitCellList = [];
      TREND.METRIC_LIST.forEach((metric) => {
        TREND.LIMIT_FIELD_LIST.forEach((field) => {
          if (limitColumn[metric.key][field.key] !== undefined) limitCellList.push(numberCell(context.limitMap[metric.key][field.key]));
        });
      });
      rows.push([
        trendReader.formatPointLabel(point), point.shiftDay, trendReader.getShiftDisplay(point.shift), point.record.cantilever || '-',
        formatDateTime(new Date(point.record.time)), point.record.fileName, point.isOverride ? LABEL.yes : ''
      ].concat(valueCellList, [outList.join(', ')], limitCellList));
    });
    return { sheet: { name: SETTING.SHEET.data, rows, columnWidths: computeColumnWidths(rows), showGridLines: false, freeze: { rows: 1, columns: 1 } }, metricColumn, limitColumn, outColumn };
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

  // Chart ng isang value: ang data ay galing sa sheet na Data (pababa). anchor.row ang posisyon sa sheet na Charts.
  function buildMetricChart(context, dataInfo, metric, chartIndex) {
    const chartSetting = SETTING.CHART;
    const limit = context.limitMap[metric.key];
    const labelList = context.pointList.map((point) => trendReader.formatPointLabel(point));
    const valueList = context.pointList.map((point) => point.record.valueMap[metric.key]);
    const seriesList = [{ name: metric.label, column: dataInfo.metricColumn[metric.key], values: valueList, color: chartSetting.COLOR.line, width: chartSetting.LINE_WIDTH, markerSize: chartSetting.MARKER_SIZE }];
    const allValueList = valueList.slice();
    TREND.LIMIT_FIELD_LIST.forEach((field) => {
      const limitValue = limit[field.key];
      if (limitValue === null) return;
      seriesList.push({ name: metric.label + ' ' + field.label, column: dataInfo.limitColumn[metric.key][field.key], values: labelList.map(() => limitValue), color: chartSetting.COLOR[field.key], width: chartSetting.LIMIT_WIDTH, markerSize: chartSetting.LIMIT_MARKER_SIZE });
      allValueList.push(limitValue);
    });
    const range = getAxisRange(allValueList);
    if (!range) return null;
    return {
      byColumn: true, dataSheet: SETTING.SHEET.data, headerRow: 0, firstRow: 1, lastRow: labelList.length, categoryColumn: 0, categoryList: labelList, seriesList,
      yMin: range.yMin, yMax: range.yMax, title: (context.machineName ? context.machineName + ' ' : '') + metric.label + ' Trend', xTitle: chartSetting.X_TITLE, yTitle: chartSetting.Y_TITLE,
      anchor: { column: 0, row: chartIndex * chartSetting.ROWS_PER_CHART, widthPixels: chartSetting.WIDTH_PIXELS, heightPixels: chartSetting.HEIGHT_PIXELS }
    };
  }

  // Sheet 2 (Charts): lahat ng 6 chart sa iisang sheet, isang column, pababa. Puti ang background (walang gridlines, puti ang chart).
  function buildChartsSheet(context, dataInfo) {
    const chartList = [];
    TREND.METRIC_LIST.forEach((metric, index) => {
      const chart = buildMetricChart(context, dataInfo, metric, index);
      if (chart) chartList.push(chart);
    });
    return { name: SETTING.SHEET.charts, rows: [], showGridLines: false, chartList };
  }

  // Blob ng Excel file: sheet 1 Data at sheet 2 Charts.
  function buildBlob(context) {
    const dataInfo = buildDataSheet(context);
    return xlsx.buildWorkbook([dataInfo.sheet, buildChartsSheet(context, dataInfo)], SETTING.COLOR);
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
    const exportedAt = new Date();
    const excelFileName = buildFileName(context.run, exportedAt);
    const parts = {
      dateFolderName: csv.formatDateInput(exportedAt), excelFileName,
      excelBlob: buildBlob(context),
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
