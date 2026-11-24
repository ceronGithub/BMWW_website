/*
 * FILE    : js/core/calibration-repeatability.js
 * PURPOSE : Calibration Repeatability: binabasa ang lahat ng calibration CSV sa saklaw ng petsa (After = Actual, Master) at kinakalkula ang repeatability (kopya ng analyzeRange ng Master)
 * DEPENDS : js/core/csv-reader.js, master-analysis.js, calibration-analysis.js, calibration-config.js
 * VERSION : v23 | 2026-11-24 | Barcode checker (Task 11): ang file na mali ang barcode (hindi 27 hanggang 30, may doble o blangko) ay nilalaktawan at nasa result.barcodeRejectedList (may paliwanag); kapag lahat ng file ay mali, nagtatapon ng error na barcodeCheck
 * VERSION : v11.4 | 2026-11-22 | Ang listahan ng barcode ay hindi na galing sa unang file lang: reference = pinakamahabang listahan ng barcode sa mga file ng saklaw (analyzeRange, pickReferenceBarcodeList, overlapRatio). Ang file na kulang ang tugmang barcode (RANGE.MIN_BARCODE_OVERLAP sa config) ay nilalaktawan at nasa result.skippedFileList; calibrationFileCount ay ang mga ginamit lang
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

  // Isang record ng file bilang mapa ng barcode -> actual at master, para mabasa kahit ano ang ayos o bilang ng barcode ng file.
  function readRecordMaps(rowList, rowIndex, layout, source) {
    const actualStart = source === 'before' ? layout.beforeStart : layout.afterStart;
    const actualMap = new Map();
    const masterMap = new Map();
    layout.barcodeList.forEach((barcode, offset) => {
      if (actualMap.has(barcode)) return;
      actualMap.set(barcode, csv.toNumber(csv.getCell(rowList, rowIndex, actualStart + offset)));
      masterMap.set(barcode, csv.toNumber(csv.getCell(rowList, rowIndex, layout.masterStart + offset)));
    });
    return { actualMap, masterMap };
  }

  // Reference na listahan ng barcode: ang pinakamahabang listahan sa mga file na may record. Kapag magkapareho ang haba, ang mas bagong file (huli sa listahan).
  function pickReferenceBarcodeList(fileEntryList) {
    let best = null;
    fileEntryList.forEach((entry) => {
      if (!entry.recordList.length) return;
      if (!best || entry.barcodeList.length >= best.length) best = entry.barcodeList;
    });
    return best ? best.slice() : null;
  }

  // Ilang bahagi (0 hanggang 1) ng reference na barcode ang nasa file.
  function overlapRatio(fileBarcodeList, referenceList) {
    if (!referenceList.length) return 0;
    const fileSet = new Set(fileBarcodeList);
    let matched = 0;
    referenceList.forEach((barcode) => { if (fileSet.has(barcode)) matched += 1; });
    return matched / referenceList.length;
  }

  // Calibration Repeatability: lahat ng calibration file na ang petsa (last modified) ay nasa pagitan ng startDate at endDate. Ang barcode ay ang pinakamahabang listahan sa mga file (reference); ang file na hindi tugma ay nilalaktawan. Ang master ay mula sa pinakabagong record. Parehong hugis ng resulta ng analyzeRange ng Master, may dagdag na skippedFileList.
  async function analyzeRange(directoryHandle, startDate, endDate, onProgress) {
    const rangeStart = startOfDay(startDate).getTime();
    const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1).getTime();
    const minOverlap = root.calibrationRepeatabilityConfig.RANGE.MIN_BARCODE_OVERLAP;
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    const candidateList = fileList.filter((item) => item.modifiedAt >= rangeStart && item.modifiedAt < rangeEnd);
    if (!candidateList.length) throw csv.createError('noFileInRange');
    candidateList.sort((first, second) => first.modifiedAt - second.modifiedAt);
    // Unang daan: basahin ang bawat file at kunin ang mga record (hindi pa pinipili ang barcode).
    const fileEntryList = [];
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
      const recordList = [];
      for (let rowIndex = CALIBRATION.ROW.dataStart; rowIndex < rowList.length; rowIndex += 1) {
        const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, CALIBRATION.DATE_COLUMN));
        if (!rowDate) continue;
        // Actual = After; kung blangko ang After (Daily Check), Before. Blangko ang pareho = nilalaktawan.
        const source = calibrationAnalysis.getActualSource(rowList, rowIndex, layout);
        if (!source) continue;
        recordList.push({ rowDate, source, maps: readRecordMaps(rowList, rowIndex, layout, source) });
      }
      fileEntryList.push({ name: item.name, barcodeList: layout.barcodeList, barcodeCheck: layout.barcodeCheck, recordList });
    }
    if (!fileEntryList.length) throw csv.createError('noCalibrationFile');
    // Barcode checker: ang file na may record pero mali ang barcode ay hindi ginagamit (iniulat sa barcodeRejectedList).
    const barcodeRejectedList = [];
    const usableEntryList = fileEntryList.filter((entry) => {
      if (!entry.recordList.length || entry.barcodeCheck.ok) return true;
      barcodeRejectedList.push({ name: entry.name, barcodeCount: entry.barcodeCheck.count, reason: entry.barcodeCheck.message, check: entry.barcodeCheck });
      return false;
    });
    const barcodeList = pickReferenceBarcodeList(usableEntryList);
    if (!barcodeList) {
      if (barcodeRejectedList.length) throw root.barcodeChecker.createError(barcodeRejectedList[0].check, barcodeRejectedList[0].name);
      throw csv.createError('noRecordInRange');
    }
    // Ikalawang daan: ang tugma lang sa reference ang ginagamit; ang iba ay nasa skippedFileList.
    const columnMap = new Map();
    const skippedFileList = [];
    let latestDate = null;
    let latestMaster = null;
    let calibrationFileCount = 0;
    let recordCount = 0;
    usableEntryList.forEach((entry) => {
      const ratio = overlapRatio(entry.barcodeList, barcodeList);
      if (ratio < minOverlap) { skippedFileList.push({ name: entry.name, barcodeCount: entry.barcodeList.length, overlap: ratio }); return; }
      calibrationFileCount += 1;
      entry.recordList.forEach((record) => {
        recordCount += 1;
        const actualList = barcodeList.map((barcode) => (record.maps.actualMap.has(barcode) ? record.maps.actualMap.get(barcode) : null));
        const masterList = barcodeList.map((barcode) => (record.maps.masterMap.has(barcode) ? record.maps.masterMap.get(barcode) : null));
        const key = csv.formatDateTime(record.rowDate, false) + calibrationAnalysis.getTypeSuffix(record.source);
        if (!columnMap.has(key)) columnMap.set(key, { key, time: record.rowDate.getTime(), values: actualList, masterValues: masterList, fileName: entry.name });
        if (!latestDate || record.rowDate > latestDate) { latestDate = record.rowDate; latestMaster = masterList; }
      });
    });
    if (!recordCount) throw csv.createError('noRecordInRange');
    const columnList = Array.from(columnMap.values()).sort((first, second) => first.time - second.time);
    return {
      kind: 'range', barcodeList, columnList, masterList: latestMaster, masterDate: latestDate,
      stats: computeOwnMasterStats(columnList, latestMaster, barcodeList),
      startDate, endDate, fileCount: candidateList.length, calibrationFileCount, skippedFileList, barcodeRejectedList, recordCount, unreadableCount
    };
  }

  root.calibrationRepeatability = Object.freeze({ analyzeRange });
})();
