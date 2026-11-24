/*
 * FILE    : js/core/lot-autohold.js
 * PURPOSE : Awtomatikong On hold ng LOT Unit: (1) nabura ng machine ang file, (2) walang Average ang CSV. Tinatanggal ang hold kada unit kapag na-re-measure (bagong file na may Average at hindi nabura)
 * DEPENDS : js/core/config.js, js/core/lot-config.js, js/core/lot-hold-config.js, js/core/lot-csv-check.js, js/core/lot-hold-store.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-24 | bagong file (Task 1A)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const CFG = root.lotHoldConfig;
  const TEXT = CFG.TEXT;
  const REMARKS = CFG.REMARKS;
  const RELOAD_MS = 15000;
  const CACHE_MAX = 200;

  /**
   * PARA SAAN    : gumawa ng bantay ng auto-hold (isa kada page)
   * GINAGAWA     : may sariling alaala: mga naka-hold na unit, bilang ng pagkawala, resulta ng pagbasa ng CSV, at mga kandidato sa paglilinis. Nagre-reset kapag nagpalit ang lote.
   * INPUT/OUTPUT : wala -> { process }
   * TINATAWAG NG : lot-tracking.js (itaas ng module)
   * TUMATAWAG SA : wala
   */
  function create() {
    const heldMap = new Map();
    const missingMap = new Map();
    const resultCache = new Map();
    const candidateMap = new Map();
    let loteKey = '';
    let lastReloadMs = 0;
    let isRunning = false;

    const toKey = (unitName) => String(unitName).toLowerCase();

    // Nire-reset ang alaala ng lote (hindi ang heldMap; galing iyon sa hold file).
    function resetLote(newKey) {
      loteKey = newKey;
      missingMap.clear();
      resultCache.clear();
      candidateMap.clear();
    }

    /**
     * PARA SAAN    : basahin ang listahan ng hold mula sa Saving path at Server path
     * GINAGAWA     : pinagsasama ang dalawa (ang mas bago ang pinipili kada unit); kung hindi nasuri ang alinman (walang permission), hindi ginagalaw ang alaala
     * INPUT/OUTPUT : wala -> Promise<void>
     * TINATAWAG NG : lot-autohold.js process
     * TUMATAWAG SA : lotHoldStore.list
     */
    async function reload() {
      const merged = new Map();
      let isAnyChecked = false;
      for (const targetKey of Object.keys(root.lotConfig.ONHOLD.TARGET)) {
        const result = await root.lotHoldStore.list(targetKey);
        if (result.isChecked) isAnyChecked = true;
        result.holdList.forEach((item) => {
          const key = toKey(item.lotUnit);
          if (!merged.has(key) || item.timeMs > merged.get(key).timeMs) merged.set(key, item);
        });
      }
      lastReloadMs = Date.now();
      if (!isAnyChecked) return;
      heldMap.clear();
      merged.forEach((item, key) => heldMap.set(key, item));
    }

    // Pangunahing file ng unit: ang pinakabagong CSV na hindi _Time. Walang laman kung wala.
    function pickCsvItem(row) {
      const csvList = row.itemList.filter((item) => item.type === CONFIG.LOT.TYPE.file && item.handle
        && item.fileName.toLowerCase().endsWith(CFG.CSV.EXTENSION) && !root.lotConfig.UNIT.TIME_PATTERN.test(item.fileName));
      if (csvList.length === 0) return null;
      return csvList.reduce((newest, item) => (item.modifiedMs > newest.modifiedMs ? item : newest));
    }

    // Binabasa at sinusuri ang CSV; may alaala kada (unit, file, oras ng pagbabago). null kung hindi mabasa.
    async function evaluateFile(unitName, item) {
      const cacheKey = toKey(unitName) + '|' + item.fileName + '|' + item.modifiedMs;
      if (resultCache.has(cacheKey)) return { key: cacheKey, result: resultCache.get(cacheKey) };
      try {
        const file = await item.handle.getFile();
        if (file.size > CFG.READ_MAX_BYTES) return null;
        const result = root.lotCsvCheck.checkText(await file.text());
        if (resultCache.size >= CACHE_MAX) resultCache.clear();
        resultCache.set(cacheKey, result);
        return { key: cacheKey, result };
      } catch (error) {
        return null;
      }
    }

    /**
     * PARA SAAN    : ilagay ang isang LOT Unit sa On hold
     * GINAGAWA     : isinusulat ang hold file (may Reason), Remarks ng unit sa monitoring ay On hold - <dahilan>, sine-save ang monitoring at nagpapadala ng mensahe
     * INPUT/OUTPUT : (context, unit { lotUnit, wafer }, reasonKey 'deleted' | 'noAverage', fileName) -> Promise<void>
     * TINATAWAG NG : lot-autohold.js process
     * TUMATAWAG SA : lotHoldStore.write, context.monitor.setRemarks, context.persist, context.notify
     */
    async function holdUnit(context, unit, reasonKey, fileName) {
      const key = toKey(unit.lotUnit);
      const nowMs = Date.now();
      const info = {
        barcode: context.lote.barcode, lotUnit: unit.lotUnit, wafer: unit.wafer, operator: context.lote.operator,
        machine: context.machine, pcName: context.machine, reason: CFG.REASON[reasonKey], fileName, timeMs: nowMs
      };
      heldMap.set(key, { ...info, source: CFG.FILE.SOURCE_AUTO });
      const remarkText = reasonKey === 'deleted' ? REMARKS.holdDeleted : REMARKS.holdNoAverage;
      context.monitor.setRemarks(context.lote, unit.lotUnit, remarkText);
      const warningList = await root.lotHoldStore.write(info);
      context.persist();
      const detail = reasonKey === 'deleted' ? TEXT.deleted : TEXT.noAverage;
      if (warningList.length > 0) context.notify(TEXT.holdWriteWarning + warningList.join(' | '), true);
      else context.notify(TEXT.held + unit.lotUnit + detail, true);
    }

    /**
     * PARA SAAN    : tanggalin ang hold ng unit pagkatapos ng matagumpay na re-measure
     * GINAGAWA     : binubura ang hold file sa Server path at Saving path; kung On hold pa ang Remarks sa monitoring, ginagawang Re-measured OK
     * INPUT/OUTPUT : (context, unit { lotUnit, remarks }) -> Promise<void>
     * TINATAWAG NG : lot-autohold.js process
     * TUMATAWAG SA : lotHoldStore.removeUnit, context.monitor.setRemarks, context.persist, context.notify
     */
    async function clearUnit(context, unit) {
      const key = toKey(unit.lotUnit);
      candidateMap.delete(key);
      const warningList = await root.lotHoldStore.removeUnit(unit.lotUnit);
      if (warningList.length > 0) { context.notify(TEXT.cleared + unit.lotUnit + ': ' + warningList.join(' | '), true); return; }
      heldMap.delete(key);
      if (String(unit.remarks).startsWith(REMARKS.holdPrefix)) {
        context.monitor.setRemarks(context.lote, unit.lotUnit, REMARKS.cleared);
        context.persist();
      }
      context.notify(TEXT.cleared + unit.lotUnit + '.', false);
    }

    // Nawawalang unit ng block: pagkatapos ng MISSING_SCANS na sunod-sunod na scan na wala ito (at nasuri ang lahat ng Data source), auto-hold.
    async function checkMissing(context, knownList, presentSet) {
      for (const unit of knownList) {
        const key = toKey(unit.lotUnit);
        if (presentSet.has(key)) { missingMap.delete(key); continue; }
        candidateMap.delete(key);
        if (!context.isAllChecked) continue;
        const count = (missingMap.get(key) || 0) + 1;
        missingMap.set(key, count);
        if (count >= CFG.MISSING_SCANS && !heldMap.has(key)) await holdUnit(context, unit, 'deleted', '');
      }
    }

    // Mga unit na nakikita: sinusuri ang Average (hold) at ang re-measure (tanggal ng hold).
    async function checkPresent(context, knownMap, rowList, nowMs) {
      for (const row of rowList) {
        if (!row.unitName) continue;
        const key = toKey(row.unitName);
        const unit = knownMap.get(key);
        if (!unit) continue;
        const item = pickCsvItem(row);
        if (!item || nowMs - item.modifiedMs < CFG.QUIET_MS) { candidateMap.delete(key); continue; }
        const evaluated = await evaluateFile(row.unitName, item);
        if (!evaluated) continue;
        const held = heldMap.get(key);
        if (!evaluated.result.hasAverage) {
          candidateMap.delete(key);
          if (!held || held.timeMs < item.modifiedMs) await holdUnit(context, unit, 'noAverage', item.fileName);
          continue;
        }
        if (!held || item.modifiedMs <= held.timeMs) { candidateMap.delete(key); continue; }
        const candidate = candidateMap.get(key);
        if (!candidate || candidate.key !== evaluated.key) candidateMap.set(key, { key: evaluated.key, sinceMs: nowMs });
        else if (nowMs - candidate.sinceMs >= CFG.SETTLE_MS) await clearUnit(context, unit);
      }
    }

    /**
     * PARA SAAN    : isang ikot ng auto-hold pagkatapos ng bawat scan ng LOT Tracking (aktibong lote lang)
     * GINAGAWA     : hindi nagpapatong ang dalawang ikot; nire-reload ang hold kada RELOAD_MS; sinusuri ang nawawalang unit at ang mga nakikitang unit
     * INPUT/OUTPUT : context { lote, machine, rowList, isAllChecked, monitor, persist, notify } -> Promise<void> (hindi nagtatapon ng error)
     * TINATAWAG NG : lot-tracking.js refreshResults
     * TUMATAWAG SA : reload, checkMissing, checkPresent
     */
    async function process(context) {
      if (isRunning) return;
      isRunning = true;
      try {
        const newKey = context.lote.barcode + '|' + context.lote.startMs;
        if (newKey !== loteKey) resetLote(newKey);
        if (lastReloadMs === 0 || Date.now() - lastReloadMs >= RELOAD_MS) await reload();
        const knownList = context.monitor.getUnitList(context.lote);
        const knownMap = new Map(knownList.map((unit) => [toKey(unit.lotUnit), unit]));
        const presentSet = new Set(context.rowList.filter((row) => row.unitName).map((row) => toKey(row.unitName)));
        await checkMissing(context, knownList, presentSet);
        await checkPresent(context, knownMap, context.rowList, Date.now());
      } catch (error) {
        context.notify(TEXT.held + 'error', true);
      } finally {
        isRunning = false;
      }
    }

    return Object.freeze({ process });
  }

  root.lotAutoHold = Object.freeze({ create });
})();
