/*
 * FILE    : js/core/master-compare.js
 * PURPOSE : Kalkulasyon ng Compare vs previous: hinahanap ang naunang Master Correl record at kinukumpara kada slider (barcode)
 * DEPENDS : js/core/csv-reader.js, master-analysis.js, master-compare-config.js
 * VERSION : v3.5 | 2026-11-21 | bagong file
 * VERSION : v7 | 2026-11-21 | detectWorst (worst slider na yellow o red lang); may actual at master ang bawat slider; masterChanged at isAttention
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
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

  // Hinahanap ang worst slider ng run at tinitingnan kung na-detect: ang level nito ay yellow o red (COMPARE.DETECT.MIN_LEVEL).
  // Ibinibigay { barcode, index, actual, master, difference, level } o null kung walang worst slider o green lahat.
  function detectWorst(result) {
    if (!result || !result.barcodeList) return null;
    let worst = null;
    result.barcodeList.forEach((barcode, index) => {
      const actual = result.actualList[index];
      const master = result.masterList[index];
      const difference = getDifference(actual, master);
      if (difference === null) return;
      if (!worst || difference > worst.difference) worst = { barcode, index, actual, master, difference };
    });
    if (!worst) return null;
    worst.level = masterAnalysis.classifyDeviation(worst.actual, worst.master);
    const rank = COMPARE.LEVEL_RANK[worst.level];
    return rank !== undefined && rank >= COMPARE.LEVEL_RANK[COMPARE.DETECT.MIN_LEVEL] ? worst : null;
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
      const currentActual = current.actualList[index];
      const currentMaster = current.masterList[index];
      const trend = getTrend(change, currentLevel, previousLevel);
      const greenLevel = CONFIG.MASTER.DEVIATION.LEVEL.green;
      // masterChanged: magkaiba ang Master ng dalawang record. isAttention: hindi green ngayon o lumalala (para sa malinis na table).
      const masterChanged = previousMaster !== null && currentMaster !== null && roundValue(Math.abs(currentMaster - previousMaster)) > 0;
      const isAttention = trend === COMPARE.TREND.worse || (currentLevel !== '' && currentLevel !== greenLevel);
      return { barcode, currentActual, currentMaster, previousActual, previousMaster, currentDifference, previousDifference, change, currentLevel, previousLevel, trend, masterChanged, isAttention };
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

  root.masterCompare = Object.freeze({ findPrevious, compareRecords, getTrend, detectWorst });
})();
