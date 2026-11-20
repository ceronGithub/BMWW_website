/*
 * FILE    : js/core/master-shift.js
 * PURPOSE : Mode ng Master Repeatability: All data points (flat) o Latest per shift (pinakahuling record ng Morning at ng Night kada petsa)
 * DEPENDS : js/core/config.js, master-shift-config.js, csv-reader.js, master-analysis.js
 * VERSION : v2.12 | 2026-11-21 | bagong file (hindi ginalaw ang master-analysis.js)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const SHIFT = root.shiftConfig;
  const { csv, masterAnalysis } = root;

  // Anong shift ang oras na ito: { name, dayKey } o null kung labas sa dalawang shift. dayKey = petsa kung kailan nagsimula ang shift.
  function getShiftOf(date) {
    const minute = date.getHours() * 60 + date.getMinutes();
    const morning = SHIFT.SHIFT.morning;
    const night = SHIFT.SHIFT.night;
    if (minute >= morning.startMinute && minute <= morning.endMinute) return { name: morning.name, dayKey: csv.formatDateInput(date) };
    if (minute >= night.startMinute) return { name: night.name, dayKey: csv.formatDateInput(date) };
    if (minute <= night.endMinute) {
      const previousDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
      return { name: night.name, dayKey: csv.formatDateInput(previousDay) };
    }
    return null;
  }

  // Pinakahuling record ng bawat shift kada petsa (hanggang dalawa kada petsa), nakaayos ayon sa oras.
  function pickLatestPerShift(columnList) {
    const latestMap = new Map();
    columnList.forEach((column) => {
      const shift = getShiftOf(new Date(column.time));
      if (!shift) return;
      const mapKey = shift.dayKey + '|' + shift.name;
      const current = latestMap.get(mapKey);
      if (!current || column.time > current.time) latestMap.set(mapKey, Object.assign({}, column, { shift: shift.name, shiftDay: shift.dayKey }));
    });
    return Array.from(latestMap.values()).sort((first, second) => first.time - second.time);
  }

  // Ibinabalik ang resulta ayon sa mode. Sa 'shift', ang stats ay kinakalkula ulit gamit lang ang napiling record.
  function applyMode(result, mode) {
    const chosenMode = mode === SHIFT.MODE.shift ? SHIFT.MODE.shift : SHIFT.MODE.all;
    if (chosenMode === SHIFT.MODE.all) return Object.assign({}, result, { mode: chosenMode });
    const columnList = pickLatestPerShift(result.columnList);
    if (!columnList.length) throw csv.createError('noRecordInShift');
    return Object.assign({}, result, {
      mode: chosenMode, columnList, recordCount: columnList.length,
      stats: masterAnalysis.computeRepeatability(columnList, result.masterList, result.barcodeList)
    });
  }

  root.masterShift = Object.freeze({ getShiftOf, pickLatestPerShift, applyMode });
})();
