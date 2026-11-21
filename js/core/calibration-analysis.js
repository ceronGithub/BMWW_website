/*
 * FILE    : js/core/calibration-analysis.js
 * PURPOSE : Calibration correl: binabasa ang pinakabagong calibration record (After = Actual, Master) at kinakalkula ang R squared
 * DEPENDS : js/core/config.js, csv-reader.js, master-analysis.js, calibration-config.js
 * VERSION : v9.0 | 2026-11-22 | bagong file (kopya ng analyzeLatest ng Master, para sa calibration CSV: "Calibration Status List")
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CALIBRATION = root.calibrationConfig;
  const { csv, masterAnalysis } = root;

  // Binibigyan ng pagkakataon ang browser na mag-update ng screen.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 00:00 ng araw ng petsa.
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Text na walang espasyo sa dulo at maliit na letra (para sa paghahambing).
  function normalizeText(value) {
    return String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  }

  // Average ng mga numero (null ay hindi kasama); null kung walang numero.
  function averageOf(valueList) {
    const numberList = valueList.filter((value) => value !== null);
    return numberList.length ? numberList.reduce((total, value) => total + value, 0) / numberList.length : null;
  }

  // Calibration file ba ito? Ang unang cell ay "Calibration Status List".
  function isCalibrationFile(rowList) {
    return normalizeText(csv.getCell(rowList, CALIBRATION.ROW.title, 0)).startsWith(CALIBRATION.TITLE_PREFIX);
  }

  // Column ng group cell (hal. After, Master) sa row ng group; -1 kung wala.
  function findGroupColumn(rowList, groupName) {
    const groupRow = rowList[CALIBRATION.ROW.group] || [];
    return groupRow.findIndex((cell) => normalizeText(cell) === groupName);
  }

  // Listahan ng barcode (row ng header) simula sa column; humihinto sa blangko o sa AVG / Max / Std. Phase / Slice.
  function readBarcodeList(rowList, startColumn) {
    const barcodeList = [];
    for (let column = startColumn; ; column += 1) {
      const text = String(csv.getCell(rowList, CALIBRATION.ROW.barcode, column)).trim();
      if (text === '' || CALIBRATION.END_MARKER_LIST.includes(text.toLowerCase())) break;
      barcodeList.push(text);
    }
    return barcodeList;
  }

  // Column ng AVG header na nasa loob ng ilang column simula sa fromColumn; -1 kung wala.
  function findAverageColumn(rowList, fromColumn) {
    for (let offset = 0; offset < CALIBRATION.AVERAGE_SCAN_COLUMNS; offset += 1) {
      if (normalizeText(csv.getCell(rowList, CALIBRATION.ROW.barcode, fromColumn + offset)).startsWith('avg')) return fromColumn + offset;
    }
    return -1;
  }

  // Hinahanap ang ayos ng calibration file: simula ng After at Master, listahan ng barcode at AVG column. Null kung hindi calibration file o hindi tugma ang After at Master.
  function locateLayout(rowList) {
    if (!isCalibrationFile(rowList)) return null;
    const afterGroupColumn = findGroupColumn(rowList, CALIBRATION.GROUP.after);
    const masterGroupColumn = findGroupColumn(rowList, CALIBRATION.GROUP.master);
    if (afterGroupColumn < 0 || masterGroupColumn < 0) return null;
    const afterStart = afterGroupColumn + 1;
    const masterStart = masterGroupColumn + 1;
    const barcodeList = readBarcodeList(rowList, afterStart);
    if (!barcodeList.length || readBarcodeList(rowList, masterStart).length !== barcodeList.length) return null;
    return {
      afterStart, masterStart, barcodeList,
      afterAverageColumn: findAverageColumn(rowList, afterStart + barcodeList.length),
      masterAverageColumn: findAverageColumn(rowList, masterStart + barcodeList.length)
    };
  }

  // Binabasa ang actual (After) at master na reading sa isang row.
  function readPoints(rowList, rowIndex, layout) {
    const actualList = [];
    const masterList = [];
    for (let offset = 0; offset < layout.barcodeList.length; offset += 1) {
      actualList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.afterStart + offset)));
      masterList.push(csv.toNumber(csv.getCell(rowList, rowIndex, layout.masterStart + offset)));
    }
    return { actualList, masterList };
  }

  // Pinakabagong calibration record sa araw ng referenceDate (buong araw). Ibinibigay ang parehong hugis ng resulta ng Master Correl.
  async function analyzeLatest(directoryHandle, referenceDate, onProgress) {
    const dayStart = startOfDay(referenceDate).getTime();
    const dayEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 1).getTime();
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    fileList.sort((first, second) => second.modifiedAt - first.modifiedAt);
    const checkList = fileList.slice(0, CALIBRATION.LATEST.MAX_FILES);
    let hasCalibrationFile = false;
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
      const layout = locateLayout(rowList);
      if (!layout) continue;
      hasCalibrationFile = true;
      let bestIndex = -1;
      let bestDate = null;
      for (let rowIndex = CALIBRATION.ROW.dataStart; rowIndex < rowList.length; rowIndex += 1) {
        const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, CALIBRATION.DATE_COLUMN));
        if (rowDate && rowDate.getTime() >= dayStart && rowDate.getTime() < dayEnd && (!bestDate || rowDate > bestDate)) { bestDate = rowDate; bestIndex = rowIndex; }
      }
      if (bestIndex < 0) continue;
      const points = readPoints(rowList, bestIndex, layout);
      const regression = masterAnalysis.computeRegression(points.masterList, points.actualList);
      if (!regression) throw csv.createError('noRegression');
      const actualAverage = layout.afterAverageColumn >= 0 ? csv.toNumber(csv.getCell(rowList, bestIndex, layout.afterAverageColumn)) : null;
      const masterAverage = layout.masterAverageColumn >= 0 ? csv.toNumber(csv.getCell(rowList, bestIndex, layout.masterAverageColumn)) : null;
      return {
        kind: 'latest', fileName: item.name, recordDate: bestDate, barcodeList: layout.barcodeList,
        actualList: points.actualList, masterList: points.masterList, regression,
        status: masterAnalysis.classifyLatest(regression.rSquared),
        actualAverage: actualAverage !== null ? actualAverage : averageOf(points.actualList),
        masterAverage: masterAverage !== null ? masterAverage : averageOf(points.masterList),
        checkedFiles: fileIndex + 1, unreadableCount
      };
    }
    throw csv.createError(hasCalibrationFile ? 'noRecordToday' : 'noCalibrationFile');
  }

  root.calibrationAnalysis = Object.freeze({ isCalibrationFile, locateLayout, analyzeLatest });
})();
