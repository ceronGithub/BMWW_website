/*
 * FILE    : js/core/lot-unit-collector.js
 * PURPOSE : Pinagsasama ang mga nakitang file/folder sa isang LOT Unit (X.csv at X_Time.csv = isang row) at nilalagyan ng "unang nakita" na oras
 * DEPENDS : js/core/lot-config.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 * VERSION : v2 | 2026-11-23 | Yugto 4: bawat row ay may itemList (lahat ng file/folder ng unit, may handle) para sa Send
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const UNIT = root.lotConfig.UNIT;

  // File/folder ba ito na may _Time sa pangalan.
  function isTimeItem(item) {
    return UNIT.TIME_PATTERN.test(item.fileName);
  }

  // Pangalan ng LOT Unit = Wafer + Layer No. + Blk (hal. 4A25C20A).
  function buildUnitName(item) {
    return item.wafer + item.layer + item.blk;
  }

  // Pangunahing file ng unit: ang hindi _Time; kung pareho ang uri, ang pinakaluma.
  function pickPrimary(itemList) {
    const mainList = itemList.filter((item) => !isTimeItem(item));
    const pool = mainList.length > 0 ? mainList : itemList;
    return pool.reduce((oldest, item) => (item.modifiedMs < oldest.modifiedMs ? item : oldest));
  }

  // Kinukuha ang unang nakitang oras ng key; kung wala pa, itinatala ang nowMs at minamarkahang nagbago.
  function resolveFirstSeen(firstSeenMap, key, nowMs, state) {
    if (!firstSeenMap[key]) {
      firstSeenMap[key] = nowMs;
      state.isChanged = true;
    }
    return firstSeenMap[key];
  }

  // Gumagawa ng isang row ng RESULT mula sa pangunahing item.
  function buildRow(primary, unitName, modifiedMs, firstSeenMs, itemList) {
    return {
      unitName,
      sourceLabel: primary.sourceLabel,
      path: primary.path,
      type: primary.type,
      fileName: primary.fileName,
      wafer: primary.wafer,
      blk: primary.blk,
      layer: primary.layer,
      modifiedMs,
      firstSeenMs,
      itemList
    };
  }

  // Ginagawang row ng RESULT ang itemList. Isang row kada LOT Unit; End moment = pinakabagong oras ng mga file ng unit.
  // Ang firstSeenMap ay dinadagdagan ng mga bagong key (binabago ito mismo). Ibinabalik: { rowList (pinakabago muna), isFirstSeenChanged }.
  function collectUnits(itemList, firstSeenMap, nowMs) {
    const state = { isChanged: false };
    const groupMap = new Map();
    const rowList = [];
    itemList.forEach((item) => {
      if (!item.wafer) {
        if (!UNIT.SHOW_UNMATCHED) return;
        const itemKey = 'item|' + item.sourceLabel + '|' + item.path;
        rowList.push(buildRow(item, '', item.modifiedMs, resolveFirstSeen(firstSeenMap, itemKey, nowMs, state), [item]));
        return;
      }
      const unitName = buildUnitName(item);
      if (!groupMap.has(unitName)) groupMap.set(unitName, []);
      groupMap.get(unitName).push(item);
    });
    groupMap.forEach((groupItemList, unitName) => {
      const newestMs = Math.max(...groupItemList.map((item) => item.modifiedMs));
      const unitKey = 'unit|' + unitName;
      rowList.push(buildRow(pickPrimary(groupItemList), unitName, newestMs, resolveFirstSeen(firstSeenMap, unitKey, nowMs, state), groupItemList));
    });
    rowList.sort((first, second) => second.modifiedMs - first.modifiedMs);
    return { rowList, isFirstSeenChanged: state.isChanged };
  }

  root.lotUnitCollector = Object.freeze({ collectUnits });
})();
