/*
 * FILE    : js/core/file-scanner.js
 * PURPOSE : Basa-lang na paghahanap ng file/folder sa mga source (CLO1A, CLO1A1): by name, by range date, latest
 * DEPENDS : js/core/config.js
 * INPUT   : mga source {key, label, handle, rootPath} at options ng hanap
 * OUTPUT  : {itemList, scannedCount, skippedCount, isStopped, isResultLimited, isScanLimited}
 * VERSION : v2.8 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const SEARCH = CONFIG.FILE_SEARCH;

  // Control ng isang takbo: puwedeng ihinto ng user (Stop button).
  function createControl() {
    return { isStopped: false, stop() { this.isStopped = true; } };
  }

  // Hinahayaan ang browser na mag-update ng screen habang naghahanap.
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 00:00 ng araw ng petsa.
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Simula ng "latest": 00:00 ng (LATEST_DAYS - 1) araw bago ang ngayon (2 = ngayon at kahapon).
  function getLatestStartMs(now) {
    const today = startOfDay(now);
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - (SEARCH.LATEST_DAYS - 1)).getTime();
  }

  // Saklaw ng petsa (ms): mula 00:00 ng Start hanggang 23:59:59.999 ng End.
  function getRangeMs(startDate, endDate) {
    const start = startOfDay(startDate).getTime();
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1).getTime() - 1;
    return { fromMs: start, toMs: end };
  }

  // Gumagawa ng tagasuri ng pangalan: hindi sensitibo sa laki ng letra.
  // Walang * o ? = "naglalaman ng"; may * o ? = wildcard na kailangang tumugma sa buong pangalan.
  function buildNameMatcher(text) {
    const needle = String(text).trim().toLowerCase();
    if (!needle) return () => false;
    if (!/[*?]/.test(needle)) return (name) => name.toLowerCase().includes(needle);
    const pattern = needle.split('').map((character) => {
      if (character === '*') return '.*';
      if (character === '?') return '.';
      return character.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }).join('');
    const expression = new RegExp('^' + pattern + '$', 'i');
    return (name) => expression.test(name);
  }

  // Path ng folder na kinalalagyan (full path ng source kung alam, kung hindi pangalan ng folder).
  function joinPath(rootPath, segmentList) {
    return [rootPath].concat(segmentList).join(CONFIG.PATH_SEPARATOR);
  }

  // Hinahanap ang mga file/folder sa isang folder at mga subfolder (hanggang MAX_DEPTH).
  // Ibinabalik ang pinakabagong oras ng pagbabago sa loob (para sa petsa ng folder). Basa lang.
  async function walkDirectory(directoryHandle, segmentList, depth, context) {
    let newestMs = 0;
    try {
      for await (const entry of directoryHandle.values()) {
        if (context.control.isStopped || context.isResultLimited || context.isScanLimited) break;
        context.scannedCount += 1;
        if (context.scannedCount > SEARCH.MAX_SCANNED) { context.isScanLimited = true; break; }
        if (context.scannedCount % SEARCH.YIELD_EVERY === 0) {
          if (context.onProgress) context.onProgress(context.scannedCount);
          await yieldToBrowser();
        }
        if (entry.kind === 'file') {
          if (entry.name.startsWith(SEARCH.IGNORED_PREFIX)) continue;
          // By name: salain muna ang pangalan bago buksan ang file (mas mabilis).
          if (context.nameMatcher && !context.nameMatcher(entry.name)) continue;
          const file = await entry.getFile();
          if (file.lastModified > newestMs) newestMs = file.lastModified;
          if (file.lastModified < context.fromMs || file.lastModified > context.toMs) continue;
          addItem(context, { name: entry.name, type: SEARCH.TYPE.file, modifiedMs: file.lastModified, size: file.size, segmentList, handle: entry });
        } else if (entry.kind === 'directory' && depth < SEARCH.MAX_DEPTH) {
          const folderSegmentList = segmentList.concat(entry.name);
          const folderNewestMs = await walkDirectory(entry, folderSegmentList, depth + 1, context);
          if (folderNewestMs > newestMs) newestMs = folderNewestMs;
          // Folder ay kasama lang sa Latest; ang petsa nito ay ang pinakabagong file sa loob.
          if (context.includeFolders && folderNewestMs >= context.fromMs && folderNewestMs <= context.toMs) {
            addItem(context, { name: entry.name, type: SEARCH.TYPE.folder, modifiedMs: folderNewestMs, size: null, segmentList, handle: null });
          }
        }
      }
    } catch (error) {
      // Hindi mabasa ang folder na ito (walang access o naputol ang network): laktawan, tuloy ang iba.
      context.skippedCount += 1;
    }
    return newestMs;
  }

  // Nagdadagdag ng item sa resulta; humihinto sa MAX_RESULTS.
  function addItem(context, entry) {
    if (context.itemList.length >= SEARCH.MAX_RESULTS) { context.isResultLimited = true; return; }
    context.idCounter += 1;
    context.itemList.push({
      id: context.idCounter,
      sourceKey: context.source.key,
      sourceLabel: context.source.label,
      name: entry.name,
      type: entry.type,
      modifiedMs: entry.modifiedMs,
      size: entry.size,
      folderPath: joinPath(context.source.rootPath || context.source.handle.name, entry.segmentList),
      handle: entry.handle,
      status: SEARCH.STATUS.pending
    });
  }

  // Hinahanap sa lahat ng source. options: {nameMatcher?, fromMs, toMs, includeFolders, control, onProgress}
  // Ang pinakabago ang nauuna sa resulta.
  async function scanSources(sourceList, options) {
    const context = {
      source: null,
      itemList: [],
      idCounter: 0,
      scannedCount: 0,
      skippedCount: 0,
      isResultLimited: false,
      isScanLimited: false,
      nameMatcher: options.nameMatcher || null,
      fromMs: options.fromMs,
      toMs: options.toMs,
      includeFolders: Boolean(options.includeFolders),
      control: options.control,
      onProgress: options.onProgress || null
    };
    for (const source of sourceList) {
      if (context.control.isStopped || context.isResultLimited || context.isScanLimited) break;
      context.source = source;
      await walkDirectory(source.handle, [], 0, context);
    }
    context.itemList.sort((first, second) => second.modifiedMs - first.modifiedMs || first.name.localeCompare(second.name));
    return {
      itemList: context.itemList,
      scannedCount: context.scannedCount,
      skippedCount: context.skippedCount,
      isStopped: context.control.isStopped,
      isResultLimited: context.isResultLimited,
      isScanLimited: context.isScanLimited
    };
  }

  root.fileScanner = Object.freeze({ createControl, getLatestStartMs, getRangeMs, buildNameMatcher, scanSources });
})();
