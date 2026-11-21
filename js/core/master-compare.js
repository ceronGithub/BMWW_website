/*
 * FILE    : js/core/master-compare.js
 * PURPOSE : Kalkulasyon ng Compare vs previous: hinahanap ang naunang Master Correl record at kinukumpara kada slider (barcode)
 * DEPENDS : js/core/csv-reader.js, master-analysis.js, master-compare-config.js
 * VERSION : v3.5 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const COMPARE = root.compareConfig;
  const { csv, masterAnalysis } = root;

  // Binibilog ang numero para walang float na ingay (hal. 0.30000000000000004).
  function roundValue(value) {
    const factor = Math.pow(10, COMPARE.ROUND_DIGITS);
    return Math.round(value * factor) / factor;
  }

  // |actual - master|; null kung kulang ang isa.
  function getDifference(actualValue, masterValue) {
    if (actualValue === null || actualValue === undefined || masterValue === null || masterValue === undefined) return null;
    return roundValue(Math.abs(actualValue - masterValue));
  }

  // Petsa na may dagdag o bawas na araw (00:00).
  function addDays(date, dayCount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayCount);
  }

  // Hinahanap ang pinakabagong master record BAGO ang napiling petsa, sa loob ng LOOKBACK_DAYS.
  // Isang scan lang: ginagamit ang analyzeLatest na may saklaw (start = petsa - lookback, end = petsa - 1 na araw).
  async function findPrevious(directoryHandle, selectedDate, onProgress) {
    const windowStart = addDays(selectedDate, -COMPARE.LOOKBACK_DAYS);
    const windowEnd = addDays(selectedDate, -1);
    try {
      return await masterAnalysis.analyzeLatest(directoryHandle, windowStart, onProgress, windowEnd);
    } catch (error) {
      if (error && (error.code === 'noRecordToday' || error.code === 'noMasterFile')) throw csv.createError('noPreviousRecord');
      throw error;
    }
  }

  // Trend ng isang slider: lumalala, gumaganda, pareho o walang previous.
  function getTrend(change, currentLevel, previousLevel) {
    if (change === null) return COMPARE.TREND.unknown;
    const currentRank = COMPARE.LEVEL_RANK[currentLevel];
    const previousRank = COMPARE.LEVEL_RANK[previousLevel];
    const hasRank = currentRank !== undefined && previousRank !== undefined;
    if (change >= COMPARE.WORSEN_MIN || (hasRank && currentRank > previousRank)) return COMPARE.TREND.worse;
    if (change <= -COMPARE.WORSEN_MIN || (hasRank && currentRank < previousRank)) return COMPARE.TREND.better;
    return COMPARE.TREND.same;
  }

  // Kinukumpara ang dalawang resulta ng analyzeLatest (current at previous), pinagtutugma ayon sa pangalan ng barcode.
  function compareRecords(current, previous) {
    const previousIndexMap = new Map();
    previous.barcodeList.forEach((barcode, index) => previousIndexMap.set(barcode, index));
    const sliderList = current.barcodeList.map((barcode, index) => {
      const previousIndex = previousIndexMap.has(barcode) ? previousIndexMap.get(barcode) : -1;
      const previousActual = previousIndex >= 0 ? previous.actualList[previousIndex] : null;
      const previousMaster = previousIndex >= 0 ? previous.masterList[previousIndex] : null;
      const currentDifference = getDifference(current.actualList[index], current.masterList[index]);
      const previousDifference = getDifference(previousActual, previousMaster);
      const currentLevel = masterAnalysis.classifyDeviation(current.actualList[index], current.masterList[index]);
      const previousLevel = masterAnalysis.classifyDeviation(previousActual, previousMaster);
      const change = currentDifference !== null && previousDifference !== null ? roundValue(currentDifference - previousDifference) : null;
      return { barcode, currentDifference, previousDifference, change, currentLevel, previousLevel, trend: getTrend(change, currentLevel, previousLevel) };
    });
    const countOf = (trend) => sliderList.filter((slider) => slider.trend === trend).length;
    let biggestIncrease = null;
    sliderList.forEach((slider) => {
      if (slider.change !== null && slider.change > 0 && (!biggestIncrease || slider.change > biggestIncrease.change)) biggestIncrease = slider;
    });
    const summary = {
      worseCount: countOf(COMPARE.TREND.worse), betterCount: countOf(COMPARE.TREND.better),
      sameCount: countOf(COMPARE.TREND.same), unknownCount: countOf(COMPARE.TREND.unknown),
      biggestIncrease,
      currentWorst: masterAnalysis.findWorstSlider(current.barcodeList, current.actualList, current.masterList),
      previousWorst: masterAnalysis.findWorstSlider(previous.barcodeList, previous.actualList, previous.masterList),
      rSquaredChange: current.regression.rSquared - previous.regression.rSquared
    };
    return { current, previous, sliderList, summary };
  }

  root.masterCompare = Object.freeze({ findPrevious, compareRecords, getTrend });
})();
