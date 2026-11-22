/*
 * FILE    : js/core/lot-onhold.js
 * PURPOSE : Hold file ng On hold: isinusulat sa <Server path>\onhold\ at <Saving path>\onhold\, at tinatanggal sa dalawa kapag nagsimula ulit ang lote ng barcode
 * DEPENDS : js/core/config.js, js/core/storage.js, js/core/lot-config.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 3)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const HOLD = root.lotConfig.ONHOLD;
  const storage = root.storage;

  /**
   * PARA SAAN    : ligtas na pangalan ng bahagi ng file (Barcode o LOT Unit)
   * GINAGAWA     : pinapalitan ng _ ang mga character na bawal sa pangalan ng file
   * INPUT/OUTPUT : text -> text na ligtas
   * TINATAWAG NG : lot-onhold.js buildFileName, buildPrefix
   * TUMATAWAG SA : wala
   */
  function toSafeName(text) {
    return String(text).replace(HOLD.UNSAFE_PATTERN, '_');
  }

  /**
   * PARA SAAN    : unahan ng pangalan ng lahat ng hold file ng isang barcode
   * GINAGAWA     : <Barcode>__ (uppercase, ligtas na pangalan)
   * INPUT/OUTPUT : barcode -> text
   * TINATAWAG NG : lot-onhold.js buildFileName, removeByBarcode
   * TUMATAWAG SA : lot-onhold.js toSafeName
   */
  function buildPrefix(barcode) {
    return toSafeName(String(barcode).toUpperCase()) + HOLD.SEPARATOR;
  }

  /**
   * PARA SAAN    : pangalan ng hold file ng isang LOT Unit
   * GINAGAWA     : <Barcode>__<LOT Unit>.txt
   * INPUT/OUTPUT : { barcode, lotUnit } -> text
   * TINATAWAG NG : lot-onhold.js write
   * TUMATAWAG SA : lot-onhold.js buildPrefix, toSafeName
   */
  function buildFileName(info) {
    return buildPrefix(info.barcode) + toSafeName(info.lotUnit) + HOLD.EXTENSION;
  }

  /**
   * PARA SAAN    : dalawang digit na numero
   * GINAGAWA     : 5 -> 05
   * INPUT/OUTPUT : number -> text
   * TINATAWAG NG : lot-onhold.js formatTime
   * TUMATAWAG SA : wala
   */
  function pad(number) {
    return String(number).padStart(2, '0');
  }

  /**
   * PARA SAAN    : oras na nakikita sa hold file
   * GINAGAWA     : yyyy-mm-dd hh:mm:ss (oras ng PC)
   * INPUT/OUTPUT : ms -> text
   * TINATAWAG NG : lot-onhold.js buildContent
   * TUMATAWAG SA : lot-onhold.js pad
   */
  function formatTime(ms) {
    const date = new Date(ms);
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  /**
   * PARA SAAN    : laman ng hold file
   * GINAGAWA     : isang linya kada field (Barcode, LOT Unit, Wafer, Operator, Machine, Time, PC name)
   * INPUT/OUTPUT : info -> text
   * TINATAWAG NG : lot-onhold.js write
   * TUMATAWAG SA : lot-onhold.js formatTime
   */
  function buildContent(info) {
    const F = HOLD.FIELD;
    const lineList = [
      F.barcode + '=' + info.barcode, F.lotUnit + '=' + info.lotUnit, F.wafer + '=' + info.wafer, F.operator + '=' + info.operator,
      F.machine + '=' + info.machine, F.time + '=' + formatTime(info.timeMs), F.pcName + '=' + info.pcName
    ];
    return lineList.join(HOLD.LINE_END) + HOLD.LINE_END;
  }

  /**
   * PARA SAAN    : kunin ang folder handle at ang permission ng isang target (Server path o Saving path)
   * GINAGAWA     : binabasa ang handle sa IndexedDB at sinusuri ang permission (walang paghingi; ginagawa iyon ng lotMonitoringStore.requestAccess)
   * INPUT/OUTPUT : targetKey -> { handle } o { warning } (text ng babala)
   * TINATAWAG NG : lot-onhold.js writeTarget, removeTarget
   * TUMATAWAG SA : storage.loadHandle, storage.hasPermission
   */
  async function getHandle(targetKey) {
    const target = HOLD.TARGET[targetKey];
    let handle = null;
    try {
      if (storage.isFolderAccessSupported()) handle = await storage.loadHandle(CONFIG.HANDLE_KEY[target.handleKey]);
    } catch (error) {
      handle = null;
    }
    if (!handle) return { warning: target.label + HOLD.TEXT.noFolder };
    let isAllowed = false;
    try {
      isAllowed = await storage.hasPermission(handle, false);
    } catch (error) {
      isAllowed = false;
    }
    return isAllowed ? { handle } : { warning: target.label + HOLD.TEXT.noPermission };
  }

  /**
   * PARA SAAN    : isulat ang hold file sa isang target
   * GINAGAWA     : gumagawa ng folder na onhold kung wala, tapos isinusulat ang file
   * INPUT/OUTPUT : (targetKey, fileName, content) -> Promise<text na babala | ''>
   * TINATAWAG NG : lot-onhold.js write
   * TUMATAWAG SA : lot-onhold.js getHandle
   */
  async function writeTarget(targetKey, fileName, content) {
    const found = await getHandle(targetKey);
    if (!found.handle) return found.warning;
    try {
      const folder = await found.handle.getDirectoryHandle(HOLD.FOLDER, { create: true });
      const fileHandle = await folder.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      try {
        await writable.write(content);
      } catch (error) {
        try { await writable.abort(); } catch (abortError) { /* walang magagawa kung pumalya rin ang abort */ }
        throw error;
      }
      await writable.close();
      return '';
    } catch (error) {
      return HOLD.TARGET[targetKey].label + HOLD.TEXT.writeError;
    }
  }

  /**
   * PARA SAAN    : isulat ang hold file sa PAREHONG Server path at Saving path
   * GINAGAWA     : sinusubukan ang dalawa; ang pumalya sa isa ay hindi hadlang sa isa pa
   * INPUT/OUTPUT : info { barcode, lotUnit, wafer, operator, machine, pcName, timeMs } -> Promise<string[]> (listahan ng babala; walang laman kung dalawa ay naisulat)
   * TINATAWAG NG : lot-tracking.js applyRemark
   * TUMATAWAG SA : lot-onhold.js buildFileName, buildContent, writeTarget
   */
  async function write(info) {
    const fileName = buildFileName(info);
    const content = buildContent(info);
    const warningList = [];
    for (const targetKey of Object.keys(HOLD.TARGET)) {
      const warning = await writeTarget(targetKey, fileName, content);
      if (warning) warningList.push(warning);
    }
    return warningList;
  }

  /**
   * PARA SAAN    : tanggalin ang hold file ng barcode sa isang target
   * GINAGAWA     : binubura ang bawat file sa onhold na nagsisimula sa <Barcode>__; walang folder = walang gagawin
   * INPUT/OUTPUT : (targetKey, prefix) -> Promise<text na babala | ''>
   * TINATAWAG NG : lot-onhold.js removeByBarcode
   * TUMATAWAG SA : lot-onhold.js getHandle
   */
  async function removeTarget(targetKey, prefix) {
    const found = await getHandle(targetKey);
    if (!found.handle) return found.warning;
    let folder = null;
    try {
      folder = await found.handle.getDirectoryHandle(HOLD.FOLDER, { create: false });
    } catch (error) {
      return '';
    }
    try {
      const nameList = [];
      for await (const entry of folder.values()) {
        if (entry.kind === 'file' && entry.name.toUpperCase().startsWith(prefix)) nameList.push(entry.name);
      }
      for (const name of nameList) await folder.removeEntry(name);
      return '';
    } catch (error) {
      return HOLD.TARGET[targetKey].label + HOLD.TEXT.removeError;
    }
  }

  /**
   * PARA SAAN    : tanggalin ang hold ng barcode kapag nagsimula ulit ang lote nito
   * GINAGAWA     : tinatanggal ang hold file sa PAREHONG Server path at Saving path
   * INPUT/OUTPUT : barcode -> Promise<string[]> (listahan ng babala)
   * TINATAWAG NG : lot-tracking.js startLote
   * TUMATAWAG SA : lot-onhold.js buildPrefix, removeTarget
   */
  async function removeByBarcode(barcode) {
    const prefix = buildPrefix(barcode);
    const warningList = [];
    for (const targetKey of Object.keys(HOLD.TARGET)) {
      const warning = await removeTarget(targetKey, prefix);
      if (warning) warningList.push(warning);
    }
    return warningList;
  }

  root.lotOnhold = Object.freeze({ write, removeByBarcode, buildFileName });
})();
