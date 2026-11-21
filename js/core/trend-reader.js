/*
 * FILE    : js/core/trend-reader.js
 * PURPOSE : Binabasa ang mga master CSV (15 headers) ng Data source 1, kinukuha ang Mean Offset, Stdev, CV, Slope, Intercept, R2 ng bawat record, at pinipili ang point ng Day at Night shift kada petsa
 * DEPENDS : js/core/config.js, csv-reader.js, master-shift-config.js, master-shift.js, trend-config.js
 * VERSION : v9.3 | 2026-11-22 | bagong file (hindi ginalaw ang master-analysis.js at master-shift.js)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const MASTER = root.CONFIG.MASTER;
  const TREND = root.trendConfig;
  const { csv, masterShift } = root;

  // Binibigyan ng pagkakataon ang browser na mag-update ng screen.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 00:00 ng araw ng petsa.
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Petsa na dinagdagan ng bilang ng araw (00:00).
  function addDays(date, count) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
  }

  // Hinahanap ang column ng bawat value sa header row; kung wala, ang nakatakdang column (Y hanggang AD).
  function locateColumns(rowList) {
    const headerRow = rowList[TREND.ROW.header] || [];
    const scanLimit = Math.min(headerRow.length, MASTER.HEADER_SCAN_COLUMNS);
    const columnMap = {};
    TREND.METRIC_LIST.forEach((metric) => {
      let found = -1;
      for (let index = 0; index < scanLimit; index += 1) {
        if (String(headerRow[index] || '').trim().toLowerCase() === metric.header) { found = index; break; }
      }
      columnMap[metric.key] = found >= 0 ? found : metric.fallbackColumn;
    });
    return columnMap;
  }

  // Binabasa ang mga record ng isang file na nasa pagitan ng windowStart at windowEnd. Ang dobleng record (parehong oras at cantilever) ay isang beses lang.
  function readFileRecords(rowList, item, columnMap, windowStart, windowEnd, recordMap) {
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

  // Binabasa ang lahat ng master file na posibleng may record sa saklaw ng petsa. Basa lang; walang isinusulat sa Data source.
  async function readRecords(directoryHandle, startDate, endDate, onProgress) {
    const rangeStart = startOfDay(startDate).getTime();
    // Hanggang 06:30 ng kinabukasan ng End date (Night shift), kaya +2 araw ang hangganan ng oras ng record.
    const windowEnd = addDays(endDate, 2).getTime();
    const fileLimit = addDays(endDate, 1 + TREND.RANGE.FILE_LOOKAHEAD_DAYS).getTime();
    const { fileList, skippedCount } = await csv.listCsvFiles(directoryHandle);
    if (!fileList.length) throw csv.createError('emptyFolder');
    const candidateList = fileList.filter((item) => item.modifiedAt >= rangeStart && item.modifiedAt < fileLimit);
    if (!candidateList.length) throw csv.createError('noFileInRange');
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
      readFileRecords(rowList, item, locateColumns(rowList), rangeStart, windowEnd, recordMap);
    }
    if (!masterFileCount) throw csv.createError('noMasterFile');
    const recordList = Array.from(recordMap.values()).sort((first, second) => first.time - second.time);
    const startKey = csv.formatDateInput(startDate);
    const endKey = csv.formatDateInput(endDate);
    if (!recordList.some((record) => record.shift && record.shiftDay >= startKey && record.shiftDay <= endKey)) throw csv.createError('noRecordInRange');
    return { recordList, startDate, endDate, fileCount: candidateList.length, masterFileCount, unreadableCount };
  }

  // Susi ng isang shift ng isang petsa: "<petsa ng simula ng shift>|<Morning o Night>".
  function getSlotKey(record) {
    return record.shiftDay + '|' + record.shift;
  }

  // Ayos ng shift sa loob ng isang petsa: Morning (Day) bago Night.
  function getShiftOrder(shiftName) {
    return shiftName === root.shiftConfig.SHIFT.morning.name ? 0 : 1;
  }

  // Ang point ng bawat shift kada petsa (Day at Night): ang Set ng user kung meron, kung wala ang pinakahuling record. Nakaayos ayon sa petsa at shift.
  function pickPoints(recordList, overrideMap, startDate, endDate) {
    const startKey = csv.formatDateInput(startDate);
    const endKey = csv.formatDateInput(endDate);
    const slotMap = new Map();
    recordList.forEach((record) => {
      if (!record.shift || record.shiftDay < startKey || record.shiftDay > endKey) return;
      const slotKey = getSlotKey(record);
      if (!slotMap.has(slotKey)) slotMap.set(slotKey, { slotKey, shift: record.shift, shiftDay: record.shiftDay, latest: null, chosen: null });
      const slot = slotMap.get(slotKey);
      if (!slot.latest || record.time > slot.latest.time) slot.latest = record;
      if (overrideMap[slotKey] === record.id) slot.chosen = record;
    });
    return Array.from(slotMap.values()).map((slot) => ({
      slotKey: slot.slotKey, shift: slot.shift, shiftDay: slot.shiftDay,
      record: slot.chosen || slot.latest,
      isOverride: Boolean(slot.chosen) && slot.chosen.id !== slot.latest.id
    })).sort((first, second) => {
      if (first.shiftDay !== second.shiftDay) return first.shiftDay < second.shiftDay ? -1 : 1;
      return getShiftOrder(first.shift) - getShiftOrder(second.shift);
    });
  }

  // Ang mga record na ang petsa (kalendaryo) ay ang napiling araw, nakaayos ayon sa oras.
  function listRecordsOfDay(recordList, dayKey) {
    return recordList.filter((record) => csv.formatDateInput(new Date(record.time)) === dayKey).sort((first, second) => first.time - second.time);
  }

  // Mga pagpalit ng cantilever sa pagitan ng magkasunod na point.
  function findCantileverChanges(pointList) {
    const changeList = [];
    for (let index = 1; index < pointList.length; index += 1) {
      const previous = pointList[index - 1].record.cantilever;
      const current = pointList[index].record.cantilever;
      if (previous !== current) changeList.push({ index, from: previous, to: current, label: formatPointLabel(pointList[index]) });
    }
    return changeList;
  }

  // Pangalan ng shift na ipinapakita (Day o Night).
  function getShiftDisplay(shiftName) {
    return TREND.SHIFT_DISPLAY[shiftName] || shiftName;
  }

  // Label ng point: "MM/DD Day" o "MM/DD Night" (petsa ng simula ng shift).
  function formatPointLabel(point) {
    return point.shiftDay.slice(5).replace('-', '/') + ' ' + getShiftDisplay(point.shift);
  }

  root.trendReader = Object.freeze({
    startOfDay, addDays, locateColumns, readRecords, getSlotKey, pickPoints, listRecordsOfDay,
    findCantileverChanges, getShiftDisplay, formatPointLabel
  });
})();
