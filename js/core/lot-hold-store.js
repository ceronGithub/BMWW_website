/*
 * FILE    : js/core/lot-hold-store.js
 * PURPOSE : Hold file ng auto-hold: sulat (may Reason), basa ng listahan, at tanggal kada LOT Unit sa <Server path>\onhold\ at <Saving path>\onhold\
 * DEPENDS : js/core/config.js, js/core/storage.js, js/core/lot-config.js, js/core/lot-hold-config.js, js/core/lot-onhold.js
 * USED BY : js/core/lot-autohold.js
 * VERSION : v1 | 2026-11-24 | bagong file (Task 1A). Hindi ginalaw ang lot-onhold.js; parehong pangalan ng file (<Barcode>__<LOT Unit>.txt)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const HOLD = root.lotConfig.ONHOLD;
  const FILE = root.lotHoldConfig.FILE;
  const storage = root.storage;

  // Ligtas na pangalan ng bahagi ng file (kapareho ng lot-onhold.js).
  function toSafeName(text) {
    return String(text).replace(HOLD.UNSAFE_PATTERN, '_');
  }

  // Oras bilang yyyy-mm-dd hh:mm:ss.
  function formatTime(ms) {
    const pad = (number) => String(number).padStart(2, '0');
    const date = new Date(ms);
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  /**
   * PARA SAAN    : kunin ang folder handle ng target kung may permission
   * GINAGAWA     : binabasa ang handle (IndexedDB) at sinusuri ang permission (walang paghingi)
   * INPUT/OUTPUT : targetKey -> Promise<{ handle } | { warning }>
   * TINATAWAG NG : lot-hold-store.js write, removeUnit, list
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

  // Laman ng hold file: lahat ng field ng lumang hold file, dagdag ang Reason, Source, File at TimeMs.
  function buildContent(info) {
    const F = FILE.FIELD;
    const lineList = [
      F.barcode + '=' + info.barcode, F.lotUnit + '=' + info.lotUnit, F.wafer + '=' + info.wafer, F.operator + '=' + info.operator,
      F.machine + '=' + info.machine, F.time + '=' + formatTime(info.timeMs), F.pcName + '=' + info.pcName,
      F.reason + '=' + info.reason, F.source + '=' + FILE.SOURCE_AUTO, F.fileName + '=' + (info.fileName || ''), F.timeMs + '=' + info.timeMs
    ];
    return lineList.join(HOLD.LINE_END) + HOLD.LINE_END;
  }

  // Isinusulat ang isang hold file sa isang target. Ibinabalik ang babala o ''.
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
   * PARA SAAN    : isulat ang auto-hold file sa Server path at Saving path
   * GINAGAWA     : <Barcode>__<LOT Unit>.txt na may Reason; ang pumalya sa isa ay hindi hadlang sa isa pa
   * INPUT/OUTPUT : info { barcode, lotUnit, wafer, operator, machine, pcName, reason, fileName, timeMs } -> Promise<string[]> (babala)
   * TINATAWAG NG : lot-autohold.js holdUnit
   * TUMATAWAG SA : lotOnhold.buildFileName, lot-hold-store.js buildContent, writeTarget
   */
  async function write(info) {
    const fileName = root.lotOnhold.buildFileName(info);
    const content = buildContent(info);
    const warningList = [];
    for (const targetKey of Object.keys(HOLD.TARGET)) {
      const warning = await writeTarget(targetKey, fileName, content);
      if (warning) warningList.push(warning);
    }
    return warningList;
  }

  /**
   * PARA SAAN    : tanggalin ang hold ng isang LOT Unit (kahit anong barcode)
   * GINAGAWA     : binubura ang file na nagtatapos sa __<LOT Unit>.txt sa onhold ng Server path at Saving path
   * INPUT/OUTPUT : unitName -> Promise<string[]> (babala)
   * TINATAWAG NG : lot-autohold.js clearUnit
   * TUMATAWAG SA : lot-hold-store.js getHandle
   */
  async function removeUnit(unitName) {
    const suffix = (HOLD.SEPARATOR + toSafeName(unitName) + HOLD.EXTENSION).toUpperCase();
    const warningList = [];
    for (const targetKey of Object.keys(HOLD.TARGET)) {
      const found = await getHandle(targetKey);
      if (!found.handle) { warningList.push(found.warning); continue; }
      let folder = null;
      try {
        folder = await found.handle.getDirectoryHandle(HOLD.FOLDER, { create: false });
      } catch (error) {
        continue;
      }
      try {
        const nameList = [];
        for await (const entry of folder.values()) {
          if (entry.kind === 'file' && entry.name.toUpperCase().endsWith(suffix)) nameList.push(entry.name);
        }
        for (const name of nameList) await folder.removeEntry(name);
      } catch (error) {
        warningList.push(HOLD.TARGET[targetKey].label + HOLD.TEXT.removeError);
      }
    }
    return warningList;
  }

  // Hinahati ang laman ng hold file (Field=Value bawat linya) sa object.
  function parseContent(text) {
    const F = FILE.FIELD;
    const map = {};
    String(text).split(/\r\n|\n|\r/).forEach((line) => {
      const at = line.indexOf('=');
      if (at > 0) map[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    });
    const timeMs = Number(map[F.timeMs]);
    return {
      barcode: map[F.barcode] || '', lotUnit: map[F.lotUnit] || '', wafer: map[F.wafer] || '', operator: map[F.operator] || '',
      machine: map[F.machine] || '', reason: map[F.reason] || '', source: map[F.source] || '', fileName: map[F.fileName] || '',
      timeMs: Number.isFinite(timeMs) && timeMs > 0 ? timeMs : 0, timeText: map[F.time] || ''
    };
  }

  /**
   * PARA SAAN    : listahan ng mga unit na naka-hold (para sa paglilinis at, sa susunod, sa Dashboard)
   * GINAGAWA     : binabasa ang bawat .txt sa onhold ng isang target; ang hindi mabasa ay nilalaktawan
   * INPUT/OUTPUT : targetKey ('saving' | 'server') -> Promise<{ isChecked: bool, holdList: [{ barcode, lotUnit, wafer, operator, machine, reason, source, fileName, timeMs }] }>
   * TINATAWAG NG : lot-autohold.js reload
   * TUMATAWAG SA : lot-hold-store.js getHandle, parseContent
   */
  async function list(targetKey) {
    const found = await getHandle(targetKey);
    if (!found.handle) return { isChecked: false, holdList: [] };
    let folder = null;
    try {
      folder = await found.handle.getDirectoryHandle(HOLD.FOLDER, { create: false });
    } catch (error) {
      return { isChecked: true, holdList: [] };
    }
    const holdList = [];
    try {
      for await (const entry of folder.values()) {
        if (entry.kind !== 'file' || !entry.name.toLowerCase().endsWith(HOLD.EXTENSION) || holdList.length >= FILE.READ_MAX_FILES) continue;
        try {
          const file = await entry.getFile();
          if (file.size > FILE.READ_MAX_BYTES) continue;
          const item = parseContent(await file.text());
          if (!item.timeMs) item.timeMs = file.lastModified;
          if (item.lotUnit) holdList.push(item);
        } catch (error) {
          // Hindi mabasa ang file na ito: laktawan.
        }
      }
    } catch (error) {
      return { isChecked: false, holdList: [] };
    }
    return { isChecked: true, holdList };
  }

  root.lotHoldStore = Object.freeze({ write, removeUnit, list });
})();
