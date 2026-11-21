/*
 * FILE    : js/core/trend-chart.js
 * PURPOSE : SVG line chart ng isang value ng Trend (Day at Night point kada petsa) na may UCL, CL, LCL, pulang point kapag labas sa limit, at marker kapag nagpalit ng cantilever. Walang library
 * DEPENDS : js/core/trend-config.js, trend-limits.js, trend-reader.js
 * VERSION : v9.3 | 2026-11-22 | bagong file (hindi ginalaw ang chart-draw.js)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const TREND = root.trendConfig;
  const CHART = TREND.CHART;
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const { trendLimits, trendReader } = root;

  // Gumagawa ng SVG element (walang innerHTML).
  function svgElement(name, attributeMap, text) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.keys(attributeMap || {}).forEach((key) => element.setAttribute(key, attributeMap[key]));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Maikling text ng numero para sa tick at label.
  function formatTick(value) {
    return String(Number(value.toPrecision(6)));
  }

  // Maayos na tick at saklaw ng axis.
  function buildTicks(minimumValue, maximumValue) {
    let low = minimumValue;
    let high = maximumValue;
    if (low === high) { low -= 1; high += 1; }
    const rawStep = (high - low) / CHART.TICK_COUNT;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
    const start = Math.floor(low / step) * step;
    const end = Math.ceil(high / step) * step;
    const tickList = [];
    for (let value = start; value <= end + step / 2; value += step) tickList.push(Number(value.toFixed(10)));
    return { tickList, minimum: start, maximum: end };
  }

  // Saklaw ng y-axis: lahat ng value at ng mga limit, may kaunting espasyo.
  function getValueRange(valueList, limit) {
    const all = valueList.filter((value) => value !== null).concat([limit.ucl, limit.cl, limit.lcl].filter((value) => value !== null));
    if (!all.length) return null;
    const low = Math.min.apply(null, all);
    const high = Math.max.apply(null, all);
    const pad = (high - low) * CHART.PAD_RATIO || Math.abs(high) * CHART.PAD_RATIO || 1;
    return { low: low - pad, high: high + pad };
  }

  // Ilan ang point na labas sa UCL o LCL.
  function countOut(pointList, metric, limit) {
    return pointList.filter((point) => {
      const state = trendLimits.classify(point.record.valueMap[metric.key], limit);
      return state === TREND.POINT_STATE.above || state === TREND.POINT_STATE.below;
    }).length;
  }

  // Pinaikli ang mahabang label (cantilever).
  function shorten(text) {
    return text.length > CHART.MAX_LABEL_CHARS ? text.slice(0, CHART.MAX_LABEL_CHARS - 1) + '…' : text;
  }

  // Text ng tooltip ng point.
  function buildTooltip(point, metric, value, state) {
    const parts = [trendReader.formatPointLabel(point), point.record.cantilever || '-', metric.label + ' ' + (value === null ? '-' : value.toFixed(metric.digits))];
    if (state === TREND.POINT_STATE.above) parts.push('> ' + TREND.TEXT.limitLine.ucl);
    if (state === TREND.POINT_STATE.below) parts.push('< ' + TREND.TEXT.limitLine.lcl);
    if (point.isOverride) parts.push(TREND.TEXT.legendSet);
    return parts.join(' | ');
  }

  // Iginuguhit ang chart ng isang value sa loob ng container (pinapalitan ang laman).
  function draw(container, options) {
    const { metric, pointList, limit, changeList } = options;
    container.replaceChildren();
    const range = getValueRange(pointList.map((point) => point.record.valueMap[metric.key]), limit);
    const pad = CHART.PADDING;
    const width = Math.max(CHART.MIN_WIDTH, pad.left + pad.right + pointList.length * CHART.POINT_GAP);
    const height = CHART.HEIGHT;
    const svg = svgElement('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height, role: 'img', 'aria-label': metric.label + ' trend', class: 'trend-svg' });
    svg.append(svgElement('text', { x: pad.left, y: 24, class: 'trend-text trend-title' }, metric.label));
    container.append(svg);
    if (!range || !pointList.length) {
      svg.append(svgElement('text', { x: width / 2, y: height / 2, class: 'trend-text', 'text-anchor': 'middle' }, TREND.TEXT.noData));
      return;
    }
    const ticks = buildTicks(range.low, range.high);
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const xAt = (index) => pad.left + (index + 0.5) * (plotWidth / pointList.length);
    const yAt = (value) => pad.top + plotHeight - ((value - ticks.minimum) / (ticks.maximum - ticks.minimum)) * plotHeight;

    ticks.tickList.forEach((tick) => {
      svg.append(svgElement('line', { x1: pad.left, x2: width - pad.right, y1: yAt(tick), y2: yAt(tick), class: 'trend-grid' }));
      svg.append(svgElement('text', { x: pad.left - 8, y: yAt(tick) + 5, class: 'trend-text trend-tick', 'text-anchor': 'end' }, formatTick(tick)));
    });
    svg.append(svgElement('line', { x1: pad.left, x2: pad.left, y1: pad.top, y2: height - pad.bottom, class: 'trend-axis' }));
    svg.append(svgElement('line', { x1: pad.left, x2: width - pad.right, y1: height - pad.bottom, y2: height - pad.bottom, class: 'trend-axis' }));

    pointList.forEach((point, index) => {
      const labelX = xAt(index);
      const labelY = height - pad.bottom + 16;
      svg.append(svgElement('text', { x: labelX, y: labelY, class: 'trend-text trend-xlabel', 'text-anchor': 'end', transform: 'rotate(' + CHART.LABEL_SLANT + ' ' + labelX + ' ' + labelY + ')' }, trendReader.formatPointLabel(point)));
    });

    // Marker ng pagpalit ng cantilever: patayong linya sa pagitan ng dalawang point, at pangalan ng bagong cantilever. Ang una ay may pangalan din.
    if (pointList.length) svg.append(svgElement('text', { x: pad.left + 4, y: pad.top - 8, class: 'trend-text trend-change-label' }, shorten(pointList[0].record.cantilever || '-')));
    changeList.forEach((change) => {
      const markerX = (xAt(change.index - 1) + xAt(change.index)) / 2;
      const marker = svgElement('g', { class: 'trend-change' });
      marker.append(svgElement('title', {}, TREND.TEXT.legendChange + ': ' + (change.from || '-') + ' → ' + (change.to || '-') + ' (' + change.label + ')'));
      marker.append(svgElement('line', { x1: markerX, x2: markerX, y1: pad.top - 4, y2: height - pad.bottom, class: 'trend-change-line' }));
      marker.append(svgElement('text', { x: markerX + 3, y: pad.top - 8, class: 'trend-text trend-change-label' }, shorten(change.to || '-')));
      svg.append(marker);
    });

    // Limit lines: UCL, CL, LCL (ang naka-set lang).
    TREND.LIMIT_FIELD_LIST.forEach((field) => {
      const limitValue = limit[field.key];
      if (limitValue === null) return;
      svg.append(svgElement('line', { x1: pad.left, x2: width - pad.right, y1: yAt(limitValue), y2: yAt(limitValue), class: 'trend-limit trend-limit-' + field.key }));
      svg.append(svgElement('text', { x: width - pad.right + 6, y: yAt(limitValue) + 5, class: 'trend-text trend-limit-label trend-limit-label-' + field.key }, field.label + ' ' + formatTick(limitValue)));
    });

    // Linya ng data (naputol kapag walang value) at mga point.
    let pathText = '';
    let isPenDown = false;
    pointList.forEach((point, index) => {
      const value = point.record.valueMap[metric.key];
      if (value === null) { isPenDown = false; return; }
      pathText += (isPenDown ? ' L ' : ' M ') + xAt(index).toFixed(2) + ' ' + yAt(value).toFixed(2);
      isPenDown = true;
    });
    if (pathText) svg.append(svgElement('path', { d: pathText.trim(), class: 'trend-line' }));
    pointList.forEach((point, index) => {
      const value = point.record.valueMap[metric.key];
      if (value === null) return;
      const state = trendLimits.classify(value, limit);
      const isOut = state === TREND.POINT_STATE.above || state === TREND.POINT_STATE.below;
      const group = svgElement('g', { class: 'trend-point' + (isOut ? ' is-out' : '') + (point.isOverride ? ' is-override' : '') });
      group.append(svgElement('title', {}, buildTooltip(point, metric, value, state)));
      if (point.isOverride) group.append(svgElement('circle', { cx: xAt(index), cy: yAt(value), r: CHART.OVERRIDE_RADIUS, class: 'trend-point-ring' }));
      group.append(svgElement('circle', { cx: xAt(index), cy: yAt(value), r: CHART.POINT_RADIUS, class: 'trend-point-dot' }));
      svg.append(group);
    });
  }

  root.trendChart = Object.freeze({ draw, countOut });
})();
