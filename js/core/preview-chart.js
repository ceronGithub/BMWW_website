/*
 * FILE    : js/core/preview-chart.js
 * PURPOSE : Gumagawa ng chart para sa Preview panel ng Dashboard: scatter ng Master Correl (Master vs Actual, may trendline) at line chart ng Compare (Previous vs Today diff kada slider)
 * DEPENDS : js/core/config.js, js/core/chart-draw.js, js/core/master-compare-config.js, js/core/dashboard-machines-config.js
 * INPUT   : details ng Master Correl (galing sa correlExcelReader.readDetailsFromFile) o ng Compare (readCompareDetailsFromFile)
 * OUTPUT  : elemento ng chart (div.chart-box) o null kapag kulang ang data; hindi nagtatapon ng error
 * VERSION : v8.9 | 2026-11-21 | PREVIEW_TAB.MIN_POINTS (dating PREVIEW_PANEL); ang chart ay inilalagay na sa bagong tab
 * VERSION : v8.8 | 2026-11-21 | bagong file (chart sa Preview panel, kapareho ng chart sa Excel)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const TEXT = root.dashboardMachinesConfig.TEXT.preview.panel;
  const MIN_POINTS = root.dashboardMachinesConfig.PREVIEW_TAB.MIN_POINTS;

  // Linear regression (y = slope * x + intercept) at R squared; null kung hindi makalkula.
  function computeTrend(xList, yList) {
    const count = xList.length;
    const sumX = xList.reduce((total, value) => total + value, 0);
    const sumY = yList.reduce((total, value) => total + value, 0);
    const sumXY = xList.reduce((total, value, index) => total + value * yList[index], 0);
    const sumXX = xList.reduce((total, value) => total + value * value, 0);
    const sumYY = yList.reduce((total, value) => total + value * value, 0);
    const spreadX = count * sumXX - sumX * sumX;
    const spreadY = count * sumYY - sumY * sumY;
    if (count < MIN_POINTS || spreadX === 0) return null;
    const slope = (count * sumXY - sumX * sumY) / spreadX;
    const correlation = spreadY === 0 ? 0 : (count * sumXY - sumX * sumY) / Math.sqrt(spreadX * spreadY);
    return { slope, intercept: (sumY - slope * sumX) / count, rSquared: correlation * correlation };
  }

  // Lalagyan ng chart (ang style ay nasa js/core/preview-tab-style.js).
  function createChartBox() {
    const box = document.createElement('div');
    box.className = 'chart-box';
    return box;
  }

  // Scatter ng Master Correl: x = Master, y = Actual, kulay ayon sa level; ang R Square ay ang nasa file kung meron.
  function buildCorrelChart(details, machineName) {
    const usable = details.sliderList.filter((slider) => typeof slider.actual === 'number' && typeof slider.master === 'number');
    if (usable.length < MIN_POINTS) return null;
    const trend = computeTrend(usable.map((slider) => slider.master), usable.map((slider) => slider.actual));
    if (trend && typeof details.rSquared === 'number') trend.rSquared = details.rSquared;
    const box = createChartBox();
    root.chart.drawScatter(box, {
      title: TEXT.correlChartTitle + machineName,
      xTitle: TEXT.correlChartX,
      yTitle: TEXT.correlChartY,
      pointList: usable.map((slider) => ({ x: slider.master, y: slider.actual, level: slider.level, barcode: slider.barcode })),
      trend
    });
    return box;
  }

  // Petsa lang (yyyy-mm-dd) mula sa text ng record.
  function datePart(text) {
    return String(text || '').slice(0, TEXT.compare.dateLength);
  }

  // Line chart ng Compare: diff (|Actual - Master|) ng Previous at Today sa bawat slider.
  function buildCompareChart(details, machineName) {
    if (details.sliderList.length < 1) return null;
    const style = root.compareConfig.CHART;
    const hasPrevious = details.sliderList.some((slider) => slider.previousDifference !== null);
    const seriesList = [];
    if (hasPrevious) seriesList.push({ name: TEXT.compare.seriesPrevious + ' (' + datePart(details.previousDate) + ')', values: details.sliderList.map((slider) => slider.previousDifference), isMaster: false, colorIndex: style.PREVIOUS_COLOR_INDEX });
    seriesList.push({ name: TEXT.compare.seriesToday + ' (' + datePart(details.todayDate) + ')', values: details.sliderList.map((slider) => slider.currentDifference), isMaster: false, colorIndex: style.TODAY_COLOR_INDEX });
    const box = createChartBox();
    root.chart.drawLines(box, { title: machineName + ' ' + TEXT.compare.chartTitle, categoryList: details.sliderList.map((slider) => slider.barcode), seriesList, hideLegend: false });
    return box;
  }

  root.previewChart = Object.freeze({ buildCorrelChart, buildCompareChart });
})();
