/*
 * FILE    : js/core/calibration-repeatability.js
 * PURPOSE : Calibration Repeatability: binabasa ang lahat ng calibration CSV sa saklaw ng petsa (After = Actual, Master) at kinakalkula ang repeatability (kopya ng analyzeRange ng Master)
 * DEPENDS : js/core/csv-reader.js, master-analysis.js, calibration-analysis.js, calibration-config.js
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
  function readPoints(rowList, rowIndex, layout, barcodeList) {
    const offsetMap = new Map();
    layout.barcodeList.forEach((barcode, offset) => { if (!offsetMap.has(barcode)) offsetMap.set(barcode, offset); });
    const actualList = [];
    const masterList = [];
    barcodeList.forEach((barcode) => {
      if (!offsetMap.has(barcode)) { actualList.push(null); masterList.push(null); return; }
      const offset = offsetMap.get(barcode);
      actualList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.afterStart + offset)));
      masterList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.masterStart + offset)));
    });
    return { actualList, masterList };
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
        recordCount += 1;
        const points = readPoints(rowList, rowIndex, layout, barcodeList);
        const key = csv.formatDateTime(rowDate, false);
        if (!columnMap.has(key)) columnMap.set(key, { key, time: rowDate.getTime(), values: points.actualList, fileName: item.name });
        if (!latestDate || rowDate > latestDate) { latestDate = rowDate; latestMaster = points.masterList; }
      }
    }
    if (!calibrationFileCount) throw csv.createError('noCalibrationFile');
    if (!recordCount) throw csv.createError('noRecordInRange');
    const columnList = Array.from(columnMap.values()).sort((first, second) => first.time - second.time);
    return {
      kind: 'range', barcodeList, columnList, masterList: latestMaster, masterDate: latestDate,
      stats: masterAnalysis.computeRepeatability(columnList, latestMaster, barcodeList),
      startDate, endDate, fileCount: candidateList.length, calibrationFileCount, recordCount, unreadableCount
    };
  }

  root.calibrationRepeatability = Object.freeze({ analyzeRange });
})();
