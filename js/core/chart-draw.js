/*
 * FILE    : js/core/chart-draw.js
 * PURPOSE : Gumuguhit ng SVG chart (scatter na may trendline, line, bar) nang walang library, gumagana offline
 * DEPENDS : js/core/config.js (kulay ay galing sa CSS class sa css/pages/master.css)
 * VERSION : v2.6 | 2026-11-20 | bagong file (para sa Master)
 * VERSION : v2.7 | 2026-11-20 | zoom out (PAD_RATIO sa scatter); kulay ng point at dot ayon sa level (green / yellow / red)
 * VERSION : v2.17 | 2026-11-21 | ayos: hindi na naputol ang nakahilig na label ng barcode sa line chart (dagdag na taas ayon sa pinakamahabang label)
 * VERSION : v2.17 | 2026-11-21 | mas malinaw na text: pamagat ng axis (chart-axis-title), equation (chart-equation, may halo), ayos ng sign ng intercept, ayos ng posisyon ng label
 * VERSION : v2.8 | 2026-11-20 | drawLines: series.colorIndex (matatag na kulay kapag may na-unselect) at options.hideLegend
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CHART = root.CONFIG.CHART;
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  // Layout ng kasalukuyang iginuguhit na chart (nagbabago ang taas kapag mahaba ang label sa ilalim).
  let PLOT = null;
  let chartHeight = CHART.HEIGHT;

  // Itinatakda ang layout; extraBottom = dagdag na espasyo sa ilalim para sa mahabang label.
  function useLayout(extraBottom) {
    chartHeight = CHART.HEIGHT + extraBottom;
    PLOT = {
      left: CHART.PADDING.left,
      top: CHART.PADDING.top,
      width: CHART.WIDTH - CHART.PADDING.left - CHART.PADDING.right,
      height: CHART.HEIGHT - CHART.PADDING.top - CHART.PADDING.bottom
    };
  }

  // Dagdag na espasyo sa ilalim para sa nakahilig (-40 degrees) na label, ayon sa pinakamahabang label.
  function getRotatedLabelExtra(labelList) {
    const longest = labelList.reduce((length, label) => Math.max(length, String(label).length), 0);
    const needed = Math.ceil(longest * CHART.LABEL_CHAR_WIDTH * CHART.LABEL_SLANT) + CHART.LABEL_MARGIN;
    return Math.max(0, needed - CHART.PADDING.bottom);
  }

  // Gumagawa ng SVG element (attributes at text lang, walang innerHTML).
  function svgElement(name, attributeMap, text) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.keys(attributeMap || {}).forEach((key) => element.setAttribute(key, attributeMap[key]));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Maayos na bilang ng tick at saklaw ng axis.
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

  // Maikling text ng numero para sa tick.
  function formatTick(value) {
    return String(Number(value.toPrecision(6)));
  }

  // Gumagawa ng bagong SVG sa loob ng container, may pamagat.
  function createSvg(container, titleText) {
    container.replaceChildren();
    const svg = svgElement('svg', { viewBox: '0 0 ' + CHART.WIDTH + ' ' + chartHeight, role: 'img', 'aria-label': titleText, class: 'chart-svg', preserveAspectRatio: 'xMidYMid meet' });
    svg.append(svgElement('text', { x: CHART.WIDTH / 2, y: 28, class: 'chart-text chart-title', 'text-anchor': 'middle' }, titleText));
    container.append(svg);
    return svg;
  }

  // Iginuguhit ang grid, axis, tick label at pamagat ng axis. Ibinibigay ang scale functions.
  function drawAxes(svg, xScale, yScale, xTickList, yTickList, xTitle, yTitle) {
    yTickList.forEach((tick) => {
      const yPosition = yScale(tick);
      svg.append(svgElement('line', { x1: PLOT.left, x2: PLOT.left + PLOT.width, y1: yPosition, y2: yPosition, class: 'chart-grid' }));
      svg.append(svgElement('text', { x: PLOT.left - 8, y: yPosition + 4, class: 'chart-text', 'text-anchor': 'end' }, formatTick(tick)));
    });
    xTickList.forEach((tick) => {
      const xPosition = xScale(tick.value);
      svg.append(svgElement('text', tick.rotate
        ? { x: xPosition, y: PLOT.top + PLOT.height + 18, class: 'chart-text', 'text-anchor': 'end', transform: 'rotate(-40 ' + xPosition + ' ' + (PLOT.top + PLOT.height + 18) + ')' }
        : { x: xPosition, y: PLOT.top + PLOT.height + 22, class: 'chart-text', 'text-anchor': 'middle' }, tick.label));
    });
    svg.append(svgElement('line', { x1: PLOT.left, x2: PLOT.left + PLOT.width, y1: PLOT.top + PLOT.height, y2: PLOT.top + PLOT.height, class: 'chart-axis' }));
    svg.append(svgElement('line', { x1: PLOT.left, x2: PLOT.left, y1: PLOT.top, y2: PLOT.top + PLOT.height, class: 'chart-axis' }));
    if (xTitle) svg.append(svgElement('text', { x: PLOT.left + PLOT.width / 2, y: chartHeight - 10, class: 'chart-text chart-axis-title', 'text-anchor': 'middle' }, xTitle));
    if (yTitle) svg.append(svgElement('text', { x: 18, y: PLOT.top + PLOT.height / 2, class: 'chart-text chart-axis-title', 'text-anchor': 'middle', transform: 'rotate(-90 18 ' + (PLOT.top + PLOT.height / 2) + ')' }, yTitle));
  }

  // Saklaw ng data na may dagdag na espasyo sa gilid (zoom out).
  function getPaddedRange(valueList) {
    const low = Math.min(...valueList);
    const high = Math.max(...valueList);
    const pad = (high - low || 1) * CHART.PAD_RATIO;
    return { low: low - pad, high: high + pad };
  }

  // Scatter: x = master, y = actual, may trendline (linear), equation at R squared.
  function drawScatter(container, options) {
    useLayout(0);
    const svg = createSvg(container, options.title);
    const pointList = options.pointList;
    const xRange = getPaddedRange(pointList.map((point) => point.x));
    const yRange = getPaddedRange(pointList.map((point) => point.y));
    const xTicks = buildTicks(xRange.low, xRange.high);
    const yTicks = buildTicks(yRange.low, yRange.high);
    const xScale = (value) => PLOT.left + ((value - xTicks.minimum) / (xTicks.maximum - xTicks.minimum)) * PLOT.width;
    const yScale = (value) => PLOT.top + PLOT.height - ((value - yTicks.minimum) / (yTicks.maximum - yTicks.minimum)) * PLOT.height;
    drawAxes(svg, xScale, yScale, xTicks.tickList.map((tick) => ({ value: tick, label: formatTick(tick) })), yTicks.tickList, options.xTitle, options.yTitle);
    if (options.trend) {
      const trend = options.trend;
      svg.append(svgElement('line', {
        x1: xScale(xTicks.minimum), y1: yScale(trend.slope * xTicks.minimum + trend.intercept),
        x2: xScale(xTicks.maximum), y2: yScale(trend.slope * xTicks.maximum + trend.intercept), class: 'chart-trend'
      }));
      svg.append(svgElement('text', { x: PLOT.left + 10, y: PLOT.top + 20, class: 'chart-text chart-equation' },
        'y = ' + trend.slope.toFixed(4) + 'x ' + (trend.intercept < 0 ? '- ' : '+ ') + Math.abs(trend.intercept).toFixed(4) + '   R\u00b2 = ' + trend.rSquared.toFixed(4)));
    }
    pointList.forEach((point) => svg.append(svgElement('circle', { cx: xScale(point.x), cy: yScale(point.y), r: 4, class: point.level ? 'chart-point ' + point.level : 'chart-point' })));
  }

  // Index ng kulay: colorIndex ng series kung meron (hindi gumagalaw ang kulay kapag may na-unselect), kung wala ay ang posisyon.
  function getColorIndex(series, seriesIndex) {
    return (series.colorIndex !== undefined ? series.colorIndex : seriesIndex) % CHART.PALETTE_SIZE;
  }

  // Line chart: bawat series ay isang linya sa bawat barcode; ang master ay mas makapal.
  function drawLines(container, options) {
    useLayout(getRotatedLabelExtra(options.categoryList));
    const svg = createSvg(container, options.title);
    const valueList = [0];
    options.seriesList.forEach((series) => series.values.forEach((value) => { if (value !== null) valueList.push(value); }));
    const yTicks = buildTicks(Math.min(...valueList), Math.max(...valueList));
    const categoryCount = options.categoryList.length;
    const xScale = (index) => PLOT.left + (categoryCount > 1 ? (index / (categoryCount - 1)) * PLOT.width : PLOT.width / 2);
    const yScale = (value) => PLOT.top + PLOT.height - ((value - yTicks.minimum) / (yTicks.maximum - yTicks.minimum)) * PLOT.height;
    drawAxes(svg, xScale, yScale, options.categoryList.map((label, index) => ({ value: index, label, rotate: true })), yTicks.tickList, '', '');
    options.seriesList.forEach((series, seriesIndex) => {
      const group = svgElement('g', { class: series.isMaster ? 'chart-series chart-master' : 'chart-series chart-series-' + getColorIndex(series, seriesIndex) });
      let segment = [];
      const flushSegment = () => {
        if (segment.length > 1) group.append(svgElement('polyline', { points: segment.join(' '), class: series.isMaster ? 'chart-line chart-line-master' : 'chart-line' }));
        segment = [];
      };
      series.values.forEach((value, index) => {
        if (value === null) { flushSegment(); return; }
        segment.push(xScale(index).toFixed(1) + ',' + yScale(value).toFixed(1));
        const level = series.levelList && series.levelList[index] ? ' ' + series.levelList[index] : '';
        group.append(svgElement('circle', { cx: xScale(index), cy: yScale(value), r: series.isMaster ? 4 : 3, class: 'chart-dot' + level }));
      });
      flushSegment();
      svg.append(group);
    });
    if (!options.hideLegend) appendLegend(container, options.seriesList);
  }

  // Legend: lahat ng series kung kakaunti; kung marami, master lang at bilang.
  function appendLegend(container, seriesList) {
    const list = document.createElement('ul');
    list.className = 'chart-legend';
    const showAll = seriesList.length <= CHART.LEGEND_MAX;
    seriesList.forEach((series, index) => {
      if (!showAll && !series.isMaster) return;
      const item = document.createElement('li');
      item.className = 'chart-legend-item ' + (series.isMaster ? 'chart-master' : 'chart-series-' + getColorIndex(series, index));
      item.textContent = series.name;
      list.append(item);
    });
    if (!showAll) {
      const note = document.createElement('li');
      note.className = 'chart-legend-note';
      note.textContent = (seriesList.length - 1) + ' actual na linya (kulay ay umiikot)';
      list.append(note);
    }
    container.append(list);
  }

  // Bar chart ng ilang halaga (hal. Actual AVG at Master AVG).
  function drawBars(container, options) {
    useLayout(0);
    const svg = createSvg(container, options.title);
    const yTicks = buildTicks(Math.min(0, ...options.itemList.map((item) => item.value)), Math.max(0, ...options.itemList.map((item) => item.value)));
    const yScale = (value) => PLOT.top + PLOT.height - ((value - yTicks.minimum) / (yTicks.maximum - yTicks.minimum)) * PLOT.height;
    const slotWidth = PLOT.width / options.itemList.length;
    drawAxes(svg, (index) => PLOT.left + slotWidth * (index + 0.5), yScale, options.itemList.map((item, index) => ({ value: index, label: item.label })), yTicks.tickList, '', '');
    options.itemList.forEach((item, index) => {
      const barWidth = Math.min(80, slotWidth * 0.5);
      const xPosition = PLOT.left + slotWidth * (index + 0.5) - barWidth / 2;
      const topY = yScale(Math.max(item.value, 0));
      const baseY = yScale(Math.min(item.value, 0));
      svg.append(svgElement('rect', { x: xPosition, y: topY, width: barWidth, height: Math.max(1, baseY - topY), class: 'chart-bar chart-series-' + (index % CHART.PALETTE_SIZE) }));
      svg.append(svgElement('text', { x: xPosition + barWidth / 2, y: topY - 6, class: 'chart-text', 'text-anchor': 'middle' }, item.value.toFixed(3)));
    });
  }

  root.chart = Object.freeze({ drawScatter, drawLines, drawBars });
})();
