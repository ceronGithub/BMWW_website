/*
 * FILE    : js/core/calibration-compare.js
 * PURPOSE : Hinahanap ang naunang calibration record (bago ang napiling petsa) para sa Compare vs previous; ang kalkulasyon ng pagkukumpara ay galing sa masterCompare
 * DEPENDS : js/core/csv-reader.js, master-analysis.js, calibration-analysis.js, calibration-config.js, master-compare-config.js, master-compare.js
 * VERSION : v9.1 | 2026-11-22 | bagong file (isang scan ng mga file; hindi ginalaw ang calibration-analysis.js)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CALIBRATION = root.calibrationConfig;
  const COMPARE = root.compareConfig;
  const { csv, masterAnalysis, calibrationAnalysis } = root;

  // Binibigyan ng pagkakataon ang browser na mag-update ng screen.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Petsa na may dagdag o bawas na araw (00:00).
  function addDays(date, dayCount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayCount);
  }

  // Average ng mga numero (null ay hindi kasama); null kung walang numero.
  function averageOf(valueList) {
    const numberList = valueList.filter((value) => value !== null);
    return numberList.length ? numberList.reduce((total, value) => total + value, 0) / numberList.length : null;
  }

  // Binabasa ang actual (After) at master na reading ng isang row.
  function readPoints(rowList, rowIndex, layout) {
    const actualList = [];
    const masterList = [];
    for (let offset = 0; offset < layout.barcodeList.length; offset += 1) {
      actualList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.afterStart + offset)));
      masterList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.masterStart + offset)));
    }
    return { actualList, masterList };
  }

  // Hinahanap ang pinakabagong calibration record BAGO ang napiling petsa, sa loob ng LOOKBACK_DAYS. Ibinibigay ang parehong hugis ng resulta ng Calibration Correl.
  async function findPrevious(directoryHandle, selectedDate, onProgress) {
    const windowStart = addDays(selectedDate, -COMPARE.LOOKBACK_DAYS).getTime();
    const windowEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    fileList.sort((first, second) => second.modifiedAt - first.modifiedAt);
    const checkList = fileList.slice(0, CALIBRATION.LATEST.MAX_FILES);
    let unreadableCount = skippedCount;
    let best = null;
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
      const layout = calibrationAnalysis.locateLayout(rowList);
      if (!layout) continue;
      for (let rowIndex = CALIBRATION.ROW.dataStart; rowIndex < rowList.length; rowIndex += 1) {
        const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, CALIBRATION.DATE_COLUMN));
        if (!rowDate || rowDate.getTime() < windowStart || rowDate.getTime() >= windowEnd) continue;
        if (!best || rowDate > best.recordDate) best = { recordDate: rowDate, rowIndex, rowList, layout, fileName: item.name, fileIndex };
      }
    }
    if (!best) throw csv.createError('noPreviousRecord');
    const points = readPoints(best.rowList, best.rowIndex, best.layout);
    const regression = masterAnalysis.computeRegression(points.masterList, points.actualList);
    if (!regression) throw csv.createError('noRegression');
    const layout = best.layout;
    const actualAverage = layout.afterAverageColumn >= 0 ? csv.toNumber(csv.getCell(best.rowList, best.rowIndex, layout.afterAverageColumn)) : null;
    const masterAverage = layout.masterAverageColumn >= 0 ? csv.toNumber(csv.getCell(best.rowList, best.rowIndex, layout.masterAverageColumn)) : null;
    return {
      kind: 'latest', fileName: best.fileName, recordDate: best.recordDate, barcodeList: layout.barcodeList,
      actualList: points.actualList, masterList: points.masterList, regression,
      status: masterAnalysis.classifyLatest(regression.rSquared),
      actualAverage: actualAverage !== null ? actualAverage : averageOf(points.actualList),
      masterAverage: masterAverage !== null ? masterAverage : averageOf(points.masterList),
      checkedFiles: checkList.length, unreadableCount
    };
  }

  root.calibrationCompare = Object.freeze({ findPrevious });
})();
