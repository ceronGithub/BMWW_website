/*
 * FILE    : js/core/master-analysis.js
 * PURPOSE : Kalkulasyon ng Latest Master (R squared) at Range Master (repeatability), kopya ng logic ng Excel macro
 * DEPENDS : js/core/config.js, js/core/csv-reader.js
 * VERSION : v2.6 | 2026-11-20 | bagong file (para sa Master)
 * VERSION : v2.7 | 2026-11-20 | classifyDeviation (green / yellow / red)
 * VERSION : v2.15 | 2026-11-21 | analyzeLatest: may optional na endDate (pinakabagong record sa pagitan ng start at end date); kapag wala, isang araw lang gaya ng dati
 * VERSION : v2.22 | 2026-11-21 | findWorstSlider (barcode na may pinakamalaking diff ng actual vs master sa Correl)
 * VERSION : v23 | 2026-11-24 | Barcode checker (Task 12): sinusuri ang 15 barcode ng bawat master file na gagamitin (analyzeLatest at analyzeRange); kapag mali, nagtatapon ng error na barcodeCheck
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MASTER = CONFIG.MASTER;
  const csv = root.csv;

  // Binibigyan ng pagkakataon ang browser na mag-update ng screen.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 00:00 ng araw ng petsa.
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Average ng mga numero (null ay hindi kasama); null kung walang numero.
  function averageOf(valueList) {
    const numberList = valueList.filter((value) => value !== null);
    return numberList.length ? numberList.reduce((total, value) => total + value, 0) / numberList.length : null;
  }

  // Binabasa ang 15 actual at 15 master na reading sa isang row.
  function readPoints(rowList, rowIndex) {
    const actualList = [];
    const masterList = [];
    for (let offset = 0; offset < MASTER.POINT_COUNT; offset += 1) {
      actualList.push(csv.toNumber(csv.getCell(rowList, rowIndex, MASTER.ACTUAL_START_COLUMN + offset)));
      masterList.push(csv.toNumber(csv.getCell(rowList, rowIndex, MASTER.MASTER_START_COLUMN + offset)));
    }
    return { actualList, masterList };
  }

  // Barcode ng 15 reading (row 4, F:T).
  function readBarcodes(rowList) {
    const barcodeList = [];
    for (let offset = 0; offset < MASTER.POINT_COUNT; offset += 1) {
      barcodeList.push(String(csv.getCell(rowList, MASTER.BARCODE_ROW, MASTER.ACTUAL_START_COLUMN + offset)).trim());
    }
    return barcodeList;
  }

  // Linear regression at R squared (parang RSQ ng Excel). Null kung hindi makalkula.
  function computeRegression(xList, yList) {
    const pairList = [];
    xList.forEach((xValue, index) => { if (xValue !== null && yList[index] !== null) pairList.push([xValue, yList[index]]); });
    if (pairList.length < 2) return null;
    const xMean = pairList.reduce((total, pair) => total + pair[0], 0) / pairList.length;
    const yMean = pairList.reduce((total, pair) => total + pair[1], 0) / pairList.length;
    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;
    pairList.forEach((pair) => {
      sumXX += (pair[0] - xMean) ** 2;
      sumYY += (pair[1] - yMean) ** 2;
      sumXY += (pair[0] - xMean) * (pair[1] - yMean);
    });
    if (sumXX === 0 || sumYY === 0) return null;
    const slope = sumXY / sumXX;
    return { slope, intercept: yMean - slope * xMean, rSquared: (sumXY * sumXY) / (sumXX * sumYY), pairCount: pairList.length };
  }

  // Status ng Latest Master mula sa R squared (PASS >= 0.99, FAIL < 0.97, WARNING sa pagitan).
  function classifyLatest(rSquared) {
    if (rSquared >= MASTER.LATEST.PASS_MIN) return MASTER.STATUS.pass;
    if (rSquared < MASTER.LATEST.FAIL_BELOW) return MASTER.STATUS.fail;
    return MASTER.STATUS.warning;
  }

  // Status ng Range Master mula sa average difference (PASS <= 1, WARNING <= 3, FAIL > 3).
  function classifyRange(averageDifference) {
    if (averageDifference <= MASTER.RANGE.PASS_MAX) return MASTER.STATUS.pass;
    if (averageDifference <= MASTER.RANGE.WARNING_MAX) return MASTER.STATUS.warning;
    return MASTER.STATUS.fail;
  }

  // Kulay ng isang reading mula sa |actual - master|: green, yellow o red. Walang kulay ('') kung kulang ang data.
  function classifyDeviation(actualValue, masterValue) {
    if (actualValue === null || actualValue === undefined || masterValue === null || masterValue === undefined) return '';
    const factor = Math.pow(10, MASTER.DEVIATION.ROUND_DIGITS);
    const difference = Math.round(Math.abs(actualValue - masterValue) * factor) / factor;
    if (difference <= MASTER.DEVIATION.GREEN_MAX) return MASTER.DEVIATION.LEVEL.green;
    if (difference <= MASTER.DEVIATION.YELLOW_MAX) return MASTER.DEVIATION.LEVEL.yellow;
    return MASTER.DEVIATION.LEVEL.red;
  }

  // Worst slider ng Correl: barcode na may pinakamalaking |actual - master|. Ibinibigay { barcode, difference } o null kung walang kumpletong pares.
  function findWorstSlider(barcodeList, actualList, masterList) {
    let worst = null;
    barcodeList.forEach((barcode, index) => {
      if (actualList[index] === null || masterList[index] === null) return;
      const difference = Math.abs(actualList[index] - masterList[index]);
      if (!worst || difference > worst.difference) worst = { barcode, difference };
    });
    return worst;
  }

  // Repeatability: actual (bawat petsa) laban sa master, kada barcode at kabuuan.
  function computeRepeatability(columnList, masterList, barcodeList) {
    let sumDifference = 0;
    let pairCount = 0;
    let maxDifference = 0;
    let worstBarcode = '';
    let actualTotal = 0;
    let actualCount = 0;
    const perBarcodeList = barcodeList.map((barcode, index) => ({ barcode, master: masterList[index], actualSum: 0, actualCount: 0, differenceSum: 0, differenceCount: 0, maxDifference: 0 }));
    columnList.forEach((column) => {
      column.values.forEach((actualValue, index) => {
        if (actualValue === null) return;
        actualTotal += actualValue;
        actualCount += 1;
        const entry = perBarcodeList[index];
        entry.actualSum += actualValue;
        entry.actualCount += 1;
        if (masterList[index] === null) return;
        const difference = Math.abs(actualValue - masterList[index]);
        sumDifference += difference;
        pairCount += 1;
        entry.differenceSum += difference;
        entry.differenceCount += 1;
        if (difference > entry.maxDifference) entry.maxDifference = difference;
        if (difference > maxDifference) { maxDifference = difference; worstBarcode = barcodeList[index]; }
      });
    });
    const masterNumbers = masterList.filter((value) => value !== null);
    const masterAverage = masterNumbers.length ? masterNumbers.reduce((total, value) => total + value, 0) / masterList.length : 0;
    const actualAverage = actualCount ? actualTotal / actualCount : 0;
    const averageDifference = pairCount ? sumDifference / pairCount : MASTER.RANGE.NO_PAIR_DIFFERENCE;
    const score = pairCount ? Math.max(0, 100 - averageDifference) : 0;
    return {
      averageDifference, score, maxDifference, worstBarcode, actualAverage, masterAverage,
      difference: Math.abs(actualAverage - masterAverage), pairCount, status: classifyRange(averageDifference),
      perBarcodeList: perBarcodeList.map((entry) => ({
        barcode: entry.barcode, master: entry.master,
        actualAverage: entry.actualCount ? entry.actualSum / entry.actualCount : null,
        averageDifference: entry.differenceCount ? entry.differenceSum / entry.differenceCount : null,
        maxDifference: entry.differenceCount ? entry.maxDifference : null
      }))
    };
  }

  // Latest Master: pinakabagong master record sa pagitan ng referenceDate (start) at endDate (kasama ang buong araw).
  // Kapag walang endDate, isang araw lang (referenceDate) gaya ng dati.
  async function analyzeLatest(directoryHandle, referenceDate, onProgress, endDate) {
    const dayStart = startOfDay(referenceDate).getTime();
    const dayEnd = new Date((endDate || referenceDate).getFullYear(), (endDate || referenceDate).getMonth(), (endDate || referenceDate).getDate() + 1).getTime();
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    fileList.sort((first, second) => second.modifiedAt - first.modifiedAt);
    const checkList = fileList.slice(0, MASTER.LATEST.MAX_FILES);
    let hasMasterFile = false;
    let unreadableCount = skippedCount;
    for (let fileIndex = 0; fileIndex < checkList.length; fileIndex += 1) {
      const item = checkList[fileIndex];
      if (onProgress) onProgress(fileIndex + 1, checkList.length, item.name);
      await yieldToBrowser();
      let rowList;
      try {
        rowList = await csv.readCsvRows(item.file);
      } catch (error) {
        unreadableCount += 1;
        continue;
      }
      if (csv.countHeaders(rowList) !== MASTER.HEADER_COUNT) continue;
      hasMasterFile = true;
      let bestIndex = -1;
      let bestDate = null;
      for (let rowIndex = MASTER.DATA_START_ROW; rowIndex < rowList.length; rowIndex += 1) {
        const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, MASTER.DATE_COLUMN));
        if (rowDate && rowDate.getTime() >= dayStart && rowDate.getTime() < dayEnd && (!bestDate || rowDate > bestDate)) { bestDate = rowDate; bestIndex = rowIndex; }
      }
      if (bestIndex < 0) continue;
      const barcodeList = readBarcodes(rowList);
      const barcodeCheck = root.barcodeChecker.check('master', barcodeList);
      if (!barcodeCheck.ok) throw root.barcodeChecker.createError(barcodeCheck, item.name);
      const points = readPoints(rowList, bestIndex);
      const regression = computeRegression(points.masterList, points.actualList);
      if (!regression) throw csv.createError('noRegression');
      const actualAverage = csv.toNumber(csv.getCell(rowList, bestIndex, MASTER.ACTUAL_AVG_COLUMN));
      const masterAverage = csv.toNumber(csv.getCell(rowList, bestIndex, MASTER.MASTER_AVG_COLUMN));
      return {
        kind: 'latest', fileName: item.name, recordDate: bestDate, barcodeList,
        actualList: points.actualList, masterList: points.masterList, regression,
        status: classifyLatest(regression.rSquared),
        actualAverage: actualAverage !== null ? actualAverage : averageOf(points.actualList),
        masterAverage: masterAverage !== null ? masterAverage : averageOf(points.masterList),
        checkedFiles: fileIndex + 1, unreadableCount
      };
    }
    throw csv.createError(hasMasterFile ? 'noRecordToday' : 'noMasterFile');
  }

  // Range Master: lahat ng master file na ang petsa (last modified) ay nasa pagitan ng startDate at endDate.
  async function analyzeRange(directoryHandle, startDate, endDate, onProgress) {
    const rangeStart = startOfDay(startDate).getTime();
    const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1).getTime();
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    const candidateList = fileList.filter((item) => item.modifiedAt >= rangeStart && item.modifiedAt < rangeEnd);
    if (!candidateList.length) throw csv.createError('noFileInRange');
    candidateList.sort((first, second) => first.modifiedAt - second.modifiedAt);
    const columnMap = new Map();
    let barcodeList = null;
    let latestDate = null;
    let latestMaster = null;
    let masterFileCount = 0;
    let recordCount = 0;
    let unreadableCount = skippedCount;
    for (let fileIndex = 0; fileIndex < candidateList.length; fileIndex += 1) {
      const item = candidateList[fileIndex];
      if (onProgress) onProgress(fileIndex + 1, candidateList.length, item.name);
      await yieldToBrowser();
      let rowList;
      try {
        rowList = await csv.readCsvRows(item.file);
      } catch (error) {
        unreadableCount += 1;
        continue;
      }
      if (csv.countHeaders(rowList) !== MASTER.HEADER_COUNT) continue;
      masterFileCount += 1;
      const fileBarcodeList = readBarcodes(rowList);
      const barcodeCheck = root.barcodeChecker.check('master', fileBarcodeList);
      if (!barcodeCheck.ok) throw root.barcodeChecker.createError(barcodeCheck, item.name);
      if (!barcodeList) barcodeList = fileBarcodeList;
      for (let rowIndex = MASTER.DATA_START_ROW; rowIndex < rowList.length; rowIndex += 1) {
        const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, MASTER.DATE_COLUMN));
        if (!rowDate) continue;
        recordCount += 1;
        const points = readPoints(rowList, rowIndex);
        const key = csv.formatDateTime(rowDate, false);
        if (!columnMap.has(key)) columnMap.set(key, { key, time: rowDate.getTime(), values: points.actualList, fileName: item.name });
        if (!latestDate || rowDate > latestDate) { latestDate = rowDate; latestMaster = points.masterList; }
      }
    }
    if (!masterFileCount) throw csv.createError('noMasterFile');
    if (!recordCount) throw csv.createError('noRecordInRange');
    const columnList = Array.from(columnMap.values()).sort((first, second) => first.time - second.time);
    return {
      kind: 'range', barcodeList, columnList, masterList: latestMaster, masterDate: latestDate,
      stats: computeRepeatability(columnList, latestMaster, barcodeList),
      startDate, endDate, fileCount: candidateList.length, masterFileCount, recordCount, unreadableCount
    };
  }

  root.masterAnalysis = Object.freeze({ computeRegression, classifyDeviation, classifyLatest, classifyRange, computeRepeatability, findWorstSlider, analyzeLatest, analyzeRange });
})();
