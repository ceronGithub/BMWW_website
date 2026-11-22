/*
 * FILE    : js/core/calibration-repeatability.js
 * PURPOSE : Calibration Repeatability: binabasa ang lahat ng calibration CSV sa saklaw ng petsa (After = Actual, Master) at kinakalkula ang repeatability (kopya ng analyzeRange ng Master)
 * DEPENDS : js/core/csv-reader.js, master-analysis.js, calibration-analysis.js, calibration-config.js
 * VERSION : v11.3 | 2026-11-22 | Bawat record ay inihahambing sa SARILING Master (column.masterValues) sa halip na sa Master ng pinakabagong record (computeOwnMasterStats); ang masterList ng resulta ay Master ng pinakabagong record, para sa chart line at table
 * VERSION : v11.2 | 2026-11-22 | Daily Check: kapag blangko ang After, Before ang Actual (gamit ang calibrationAnalysis.getActualSource); ang record na blangko ang pareho ay hindi binibilang; ' (Daily Check)' sa pangalan ng record
 * VERSION : v9.2 | 2026-11-22 | bagong file (hindi ginalaw ang master-analysis.js at calibration-analysis.js)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CALIBRATION = root.calibrationConfig;
  const { csv, masterAnalysis, calibrationAnalysis } = root;

  // Binibigyan ng pagkakataon ang browser na mag-update ng screen.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 00:00 ng araw ng petsa.
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Binabasa ang actual (After) at master ng isang row, ayon sa pagkakasunod ng barcodeList (kahit magkaiba ang ayos ng barcode sa file). Null kung wala sa file ang barcode.
  function readPoints(rowList, rowIndex, layout, barcodeList, source) {
    const actualStart = source === 'before' ? layout.beforeStart : layout.afterStart;
    const offsetMap = new Map();
    layout.barcodeList.forEach((barcode, offset) => { if (!offsetMap.has(barcode)) offsetMap.set(barcode, offset); });
    const actualList = [];
    const masterList = [];
    barcodeList.forEach((barcode) => {
      if (!offsetMap.has(barcode)) { actualList.push(null); masterList.push(null); return; }
      const offset = offsetMap.get(barcode);
      actualList.push(csv.toNumber(csv.getCell(rowList, rowIndex, actualStart + offset)));
      masterList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.masterStart + offset)));
    });
    return { actualList, masterList };
  }

  // Repeatability stats: bawat record ay inihahambing sa sarili nitong Master (column.masterValues); ang masterList (pinakabagong) ay para sa display lang. Parehong hugis ng masterAnalysis.computeRepeatability.
  function computeOwnMasterStats(columnList, masterList, barcodeList) {
    const RANGE = root.CONFIG.MASTER.RANGE;
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
        const ownMaster = column.masterValues ? column.masterValues[index] : masterList[index];
        if (ownMaster === null || ownMaster === undefined) return;
        const difference = Math.abs(actualValue - ownMaster);
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
    const averageDifference = pairCount ? sumDifference / pairCount : RANGE.NO_PAIR_DIFFERENCE;
    return {
      averageDifference, score: pairCount ? Math.max(0, 100 - averageDifference) : 0, maxDifference, worstBarcode, actualAverage, masterAverage,
      difference: Math.abs(actualAverage - masterAverage), pairCount, status: masterAnalysis.classifyRange(averageDifference),
      perBarcodeList: perBarcodeList.map((entry) => ({
        barcode: entry.barcode, master: entry.master,
        actualAverage: entry.actualCount ? entry.actualSum / entry.actualCount : null,
        averageDifference: entry.differenceCount ? entry.differenceSum / entry.differenceCount : null,
        maxDifference: entry.differenceCount ? entry.maxDifference : null
      }))
    };
  }

  // Calibration Repeatability: lahat ng calibration file na ang petsa (last modified) ay nasa pagitan ng startDate at endDate. Ang master ay mula sa pinakabagong record. Parehong hugis ng resulta ng analyzeRange ng Master.
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
    let calibrationFileCount = 0;
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
      const layout = calibrationAnalysis.locateLayout(rowList);
      if (!layout) continue;
      calibrationFileCount += 1;
      if (!barcodeList) barcodeList = layout.barcodeList.slice();
      for (let rowIndex = CALIBRATION.ROW.dataStart; rowIndex < rowList.length; rowIndex += 1) {
        const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, CALIBRATION.DATE_COLUMN));
        if (!rowDate) continue;
        // Actual = After; kung blangko ang After (Daily Check), Before. Blangko ang pareho = nilalaktawan.
        const source = calibrationAnalysis.getActualSource(rowList, rowIndex, layout);
        if (!source) continue;
        recordCount += 1;
        const points = readPoints(rowList, rowIndex, layout, barcodeList, source);
        const key = csv.formatDateTime(rowDate, false) + calibrationAnalysis.getTypeSuffix(source);
        if (!columnMap.has(key)) columnMap.set(key, { key, time: rowDate.getTime(), values: points.actualList, masterValues: points.masterList, fileName: item.name });
        if (!latestDate || rowDate > latestDate) { latestDate = rowDate; latestMaster = points.masterList; }
      }
    }
    if (!calibrationFileCount) throw csv.createError('noCalibrationFile');
    if (!recordCount) throw csv.createError('noRecordInRange');
    const columnList = Array.from(columnMap.values()).sort((first, second) => first.time - second.time);
    return {
      kind: 'range', barcodeList, columnList, masterList: latestMaster, masterDate: latestDate,
      stats: computeOwnMasterStats(columnList, latestMaster, barcodeList),
      startDate, endDate, fileCount: candidateList.length, calibrationFileCount, recordCount, unreadableCount
    };
  }

  root.calibrationRepeatability = Object.freeze({ analyzeRange });
})();
