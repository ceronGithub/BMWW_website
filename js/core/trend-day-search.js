/*
 * FILE    : js/core/trend-day-search.js
 * PURPOSE : Hinahanap sa Data source 1 ang lahat ng master record ng isang petsa (kalendaryo): Mean Offset, Stdev, CV, Slope, Intercept, R2, cantilever, shift at pangalan ng file. Basa lang; walang isinusulat
 * DEPENDS : js/core/config.js, csv-reader.js, master-shift-config.js, master-shift.js, trend-config.js, trend-reader.js
 * INPUT   : readDay(directoryHandle, dayKey, onProgress) | dayKey = 'yyyy-mm-dd'
 * OUTPUT  : Promise<{ recordList, fileCount, masterFileCount, unreadableCount }>; nagtatapon ng error na may code (emptyFolder, tooManyFiles) kapag may problema. Ang record ay kapareho ng hugis ng record ng trendReader.readRecords
 * VERSION : v9.6 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const MASTER = root.CONFIG.MASTER;
  const TREND = root.trendConfig;
  const { csv, masterShift, trendReader } = root;

  // Binibigyan ng pagkakataon ang browser na mag-update ng screen.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Idinadagdag sa recordMap ang mga record ng file na ang oras ay nasa pagitan ng windowStart at windowEnd (hindi kasama ang windowEnd).
  function collectRecords(rowList, item, columnMap, windowStart, windowEnd, recordMap) {
    for (let rowIndex = TREND.ROW.dataStart; rowIndex < rowList.length; rowIndex += 1) {
      const rowDate = csv.parseAnyDate(csv.getCell(rowList, rowIndex, TREND.COLUMN.date));
      if (!rowDate) continue;
      const time = rowDate.getTime();
      if (time < windowStart || time >= windowEnd) continue;
      const valueMap = {};
      let hasValue = false;
      TREND.METRIC_LIST.forEach((metric) => {
        const value = csv.toNumber(csv.getCell(rowList, rowIndex, columnMap[metric.key]));
        valueMap[metric.key] = value;
        if (value !== null) hasValue = true;
      });
      if (!hasValue) continue;
      const cantilever = csv.getCell(rowList, rowIndex, TREND.COLUMN.cantilever).trim();
      const id = time + '|' + cantilever;
      if (recordMap.has(id)) continue;
      const shift = masterShift.getShiftOf(rowDate);
      recordMap.set(id, { id, time, fileName: item.name, cantilever, valueMap, shift: shift ? shift.name : '', shiftDay: shift ? shift.dayKey : '' });
    }
  }

  // Hinahanap sa Data source 1 ang mga record ng petsa. Ang file na tinitingnan ay yaong na-modify mula 00:00 ng petsa hanggang FILE_LOOKAHEAD_DAYS pagkatapos nito.
  async function readDay(directoryHandle, dayKey, onProgress) {
    const dayDate = csv.parseDateInput(dayKey);
    if (!dayDate) return { recordList: [], fileCount: 0, masterFileCount: 0, unreadableCount: 0 };
    const windowStart = trendReader.startOfDay(dayDate).getTime();
    const windowEnd = trendReader.addDays(dayDate, 1).getTime();
    const fileLimit = trendReader.addDays(dayDate, 1 + TREND.RANGE.FILE_LOOKAHEAD_DAYS).getTime();
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    const candidateList = fileList.filter((item) => item.modifiedAt >= windowStart && item.modifiedAt < fileLimit);
    if (candidateList.length > TREND.RANGE.MAX_FILES) throw csv.createError('tooManyFiles');
    candidateList.sort((first, second) => first.modifiedAt - second.modifiedAt);
    const recordMap = new Map();
    let masterFileCount = 0;
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
      collectRecords(rowList, item, trendReader.locateColumns(rowList), windowStart, windowEnd, recordMap);
    }
    const recordList = Array.from(recordMap.values()).sort((first, second) => first.time - second.time);
    return { recordList, fileCount: candidateList.length, masterFileCount, unreadableCount };
  }

  root.trendDaySearch = Object.freeze({ readDay });
})();
