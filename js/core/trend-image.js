/*
 * FILE    : js/core/trend-image.js
 * PURPOSE : Gumagawa ng isang PNG (Blob) ng 6 na chart ng Trend (UCL, CL, LCL, pulang point, Set ng user, marker ng cantilever) gamit ang canvas. Walang library, walang CDN
 * DEPENDS : js/core/csv-reader.js, trend-config.js, trend-limits.js, trend-reader.js, trend-export-config.js
 * INPUT   : buildBlob({ machineName, run, pointList, limitMap, changeList })
 * OUTPUT  : Promise<Blob> (image/png); nagtatapon ng error na code 'imageFail' kapag pumalya
 * VERSION : v9.4 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const TREND = root.trendConfig;
  const EXPORT = root.trendExportConfig;
  const IMAGE = EXPORT.IMAGE;
  const COLOR = IMAGE.COLOR;
  const { csv, trendLimits, trendReader } = root;

  // Maikling text ng numero para sa tick at label.
  function formatTick(value) {
    return String(Number(value.toPrecision(6)));
  }

  // Pinaikli ang mahabang label (cantilever).
  function shorten(text) {
    return text.length > IMAGE.MAX_LABEL_CHARS ? text.slice(0, IMAGE.MAX_LABEL_CHARS - 1) + '…' : text;
  }

  // Maayos na tick at saklaw ng axis (kapareho ng chart sa screen).
  function buildTicks(minimumValue, maximumValue) {
    let low = minimumValue;
    let high = maximumValue;
    if (low === high) { low -= 1; high += 1; }
    const rawStep = (high - low) / IMAGE.TICK_COUNT;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
    const start = Math.floor(low / step) * step;
    const end = Math.ceil(high / step) * step;
    const tickList = [];
    for (let value = start; value <= end + step / 2; value += step) tickList.push(Number(value.toFixed(10)));
    return { tickList, minimum: start, maximum: end };
  }

  // Saklaw ng y-axis: lahat ng value at ng mga limit, may kaunting espasyo. Null kung walang value.
  function getValueRange(valueList, limit) {
    const all = valueList.filter((value) => value !== null).concat([limit.ucl, limit.cl, limit.lcl].filter((value) => value !== null));
    if (!all.length) return null;
    const low = Math.min.apply(null, all);
    const high = Math.max.apply(null, all);
    const pad = (high - low) * IMAGE.PAD_RATIO || Math.abs(high) * IMAGE.PAD_RATIO || 1;
    return { low: low - pad, high: high + pad };
  }

  // Font na may laki at bigat.
  function makeFont(size, isBold) {
    return (isBold ? 'bold ' : '') + size + 'px ' + IMAGE.FONT_FAMILY;
  }

  // Sumusulat ng text. options: { size, bold, color, align }.
  function drawText(context, text, positionX, positionY, options) {
    context.font = makeFont(options.size, options.bold);
    context.fillStyle = options.color;
    context.textAlign = options.align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(text, positionX, positionY);
  }

  // Gumuguhit ng linya; dash = [] para tuloy-tuloy.
  function drawLine(context, fromX, fromY, toX, toY, color, width, dash) {
    context.beginPath();
    context.setLineDash(dash || []);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
    context.setLineDash([]);
  }

  // Gumuguhit ng bilog (point).
  function drawCircle(context, centerX, centerY, radius, fillColor, strokeColor, strokeWidth) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    if (fillColor) { context.fillStyle = fillColor; context.fill(); }
    if (strokeColor) { context.strokeStyle = strokeColor; context.lineWidth = strokeWidth; context.stroke(); }
  }

  // Ang mga label ng X axis: bawat STEP lang ang may label kapag maraming point.
  function drawXLabels(context, area, pointList, xAt) {
    const pad = IMAGE.PADDING;
    const step = Math.max(1, Math.ceil(pointList.length / IMAGE.MAX_X_LABELS));
    const labelY = area.top + area.height - pad.bottom + 14;
    pointList.forEach((point, index) => {
      if (index % step !== 0) return;
      context.save();
      context.translate(xAt(index), labelY);
      context.rotate((IMAGE.LABEL_ANGLE_DEGREES * Math.PI) / 180);
      drawText(context, trendReader.formatPointLabel(point), 0, 0, { size: 11, color: COLOR.muted, align: 'right' });
      context.restore();
    });
  }

  // Iginuguhit ang chart ng isang value sa loob ng area { left, top, width, height }.
  function drawChart(context, area, metric, pointList, limit, changeList) {
    const pad = IMAGE.PADDING;
    context.strokeStyle = COLOR.cell;
    context.lineWidth = 1;
    context.strokeRect(area.left + 0.5, area.top + 0.5, area.width - 1, area.height - 1);
    drawText(context, metric.label, area.left + pad.left, area.top + 24, { size: 16, bold: true, color: COLOR.text });
    const range = getValueRange(pointList.map((point) => point.record.valueMap[metric.key]), limit);
    if (!range || !pointList.length) {
      drawText(context, TREND.TEXT.noData, area.left + area.width / 2, area.top + area.height / 2, { size: 14, color: COLOR.muted, align: 'center' });
      return;
    }
    const ticks = buildTicks(range.low, range.high);
    const plotLeft = area.left + pad.left;
    const plotRight = area.left + area.width - pad.right;
    const plotTop = area.top + pad.top;
    const plotBottom = area.top + area.height - pad.bottom;
    const xAt = (index) => plotLeft + (index + 0.5) * ((plotRight - plotLeft) / pointList.length);
    const yAt = (value) => plotBottom - ((value - ticks.minimum) / (ticks.maximum - ticks.minimum)) * (plotBottom - plotTop);

    ticks.tickList.forEach((tick) => {
      drawLine(context, plotLeft, yAt(tick), plotRight, yAt(tick), COLOR.grid, 1);
      drawText(context, formatTick(tick), plotLeft - 8, yAt(tick) + 4, { size: 11, color: COLOR.muted, align: 'right' });
    });
    drawLine(context, plotLeft, plotTop, plotLeft, plotBottom, COLOR.axis, 1);
    drawLine(context, plotLeft, plotBottom, plotRight, plotBottom, COLOR.axis, 1);
    drawXLabels(context, area, pointList, xAt);

    // Marker ng pagpalit ng cantilever: patayong putol-putol na linya at pangalan ng bagong cantilever. Ang una ay may pangalan din.
    drawText(context, shorten(pointList[0].record.cantilever || '-'), plotLeft + 4, plotTop - 8, { size: 11, bold: true, color: COLOR.change });
    changeList.forEach((change) => {
      const markerX = (xAt(change.index - 1) + xAt(change.index)) / 2;
      drawLine(context, markerX, plotTop - 4, markerX, plotBottom, COLOR.change, 1.5, [5, 4]);
      drawText(context, shorten(change.to || '-'), markerX + 3, plotTop - 8, { size: 11, bold: true, color: COLOR.change });
    });

    // Limit lines: UCL, CL, LCL (ang naka-set lang).
    TREND.LIMIT_FIELD_LIST.forEach((field) => {
      const limitValue = limit[field.key];
      if (limitValue === null) return;
      drawLine(context, plotLeft, yAt(limitValue), plotRight, yAt(limitValue), COLOR[field.key], IMAGE.LIMIT_WIDTH, field.key === 'cl' ? [] : [8, 5]);
      drawText(context, field.label + ' ' + formatTick(limitValue), plotRight + 6, yAt(limitValue) + 4, { size: 11, bold: true, color: COLOR[field.key] });
    });

    // Linya ng data (naputol kapag walang value) at mga point.
    context.beginPath();
    context.setLineDash([]);
    context.strokeStyle = COLOR.line;
    context.lineWidth = IMAGE.LINE_WIDTH;
    context.lineJoin = 'round';
    let isPenDown = false;
    pointList.forEach((point, index) => {
      const value = point.record.valueMap[metric.key];
      if (value === null) { isPenDown = false; return; }
      if (isPenDown) context.lineTo(xAt(index), yAt(value)); else context.moveTo(xAt(index), yAt(value));
      isPenDown = true;
    });
    context.stroke();
    pointList.forEach((point, index) => {
      const value = point.record.valueMap[metric.key];
      if (value === null) return;
      const state = trendLimits.classify(value, limit);
      const isOut = state === TREND.POINT_STATE.above || state === TREND.POINT_STATE.below;
      if (point.isOverride) drawCircle(context, xAt(index), yAt(value), IMAGE.OVERRIDE_RADIUS, null, COLOR.set, 2.5);
      drawCircle(context, xAt(index), yAt(value), IMAGE.POINT_RADIUS, isOut ? COLOR.out : COLOR.line, COLOR.background, 1.5);
    });
  }

  // Ulo ng picture: pangalan ng machine, saklaw ng petsa, bilang ng point, at legend.
  function drawHeader(context, width, options) {
    const left = IMAGE.MARGIN;
    drawText(context, (options.machineName ? options.machineName + ' - ' : '') + 'Trend', left, IMAGE.MARGIN + 22, { size: 22, bold: true, color: COLOR.text });
    const rangeText = csv.formatDateInput(options.run.startDate) + ' - ' + csv.formatDateInput(options.run.endDate);
    drawText(context, rangeText + ' | ' + TREND.TEXT.summaryPoints + ': ' + options.pointList.length + ' | ' + EXPORT.TEXT.tile.out + options.outCount, left, IMAGE.MARGIN + 46, { size: 13, color: COLOR.muted });
    let legendX = left;
    const legendY = IMAGE.MARGIN + 68;
    IMAGE.LEGEND.forEach((entry) => {
      drawCircle(context, legendX + 5, legendY - 4, 5, COLOR[entry[0]], null, 0);
      drawText(context, entry[1], legendX + 15, legendY, { size: 12, color: COLOR.muted });
      legendX += 15 + context.measureText(entry[1]).width + 22;
    });
  }

  // Ilan ang point na labas sa UCL o LCL, sa lahat ng value.
  function countOutAll(pointList, limitMap) {
    return TREND.METRIC_LIST.reduce((total, metric) => total + root.trendChart.countOut(pointList, metric, limitMap[metric.key]), 0);
  }

  // Ginagawang Blob ang canvas.
  function toBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(csv.createError('imageFail'))), IMAGE.MIME);
    });
  }

  // Ang buong picture: ulo at 6 na chart (COLUMNS kada row).
  async function buildBlob(options) {
    const columnCount = IMAGE.COLUMNS;
    const rowCount = Math.ceil(TREND.METRIC_LIST.length / columnCount);
    const width = IMAGE.MARGIN * 2 + columnCount * IMAGE.CHART_WIDTH + (columnCount - 1) * IMAGE.GAP;
    const height = IMAGE.MARGIN * 2 + IMAGE.HEADER_HEIGHT + rowCount * IMAGE.CHART_HEIGHT + (rowCount - 1) * IMAGE.GAP;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw csv.createError('imageFail');
    context.fillStyle = COLOR.background;
    context.fillRect(0, 0, width, height);
    drawHeader(context, width, { machineName: options.machineName, run: options.run, pointList: options.pointList, outCount: countOutAll(options.pointList, options.limitMap) });
    TREND.METRIC_LIST.forEach((metric, index) => {
      const area = {
        left: IMAGE.MARGIN + (index % columnCount) * (IMAGE.CHART_WIDTH + IMAGE.GAP),
        top: IMAGE.MARGIN + IMAGE.HEADER_HEIGHT + Math.floor(index / columnCount) * (IMAGE.CHART_HEIGHT + IMAGE.GAP),
        width: IMAGE.CHART_WIDTH,
        height: IMAGE.CHART_HEIGHT
      };
      drawChart(context, area, metric, options.pointList, options.limitMap[metric.key], options.changeList);
    });
    return toBlob(canvas);
  }

  root.trendImage = Object.freeze({ buildBlob, countOutAll });
})();
