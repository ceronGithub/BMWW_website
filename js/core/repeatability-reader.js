/*
 * FILE    : js/core/repeatability-reader.js
 * PURPOSE : Binabasa ang pinakabagong na-export na Master Repeatability Excel: LEAD PC = <Server path>\master-repeatability\<machine name>\<petsa>\ ; Sender = <Saving path>\master-repeatability\<petsa ngayon>\
 * DEPENDS : js/core/config.js, master-export-config.js, master-shift-config.js, correl-export-config.js, repeatability-sync-config.js, repeatability-tile-config.js
 * INPUT   : folder handle (Server path o Saving path), pangalan ng machine o petsa (yyyy-mm-dd)
 * OUTPUT  : details { fileName, modifiedMs, status, score, averageDifference, maxDifference, worst, records, range, mode, exportedAt, grid } o null; hindi nagtatapon ng error. Basa lang, walang sinusulat.
 * NOTE    : Walang library: sariling basa ng ZIP (store at deflate) at XML. Ang deflate ay nangangailangan ng DecompressionStream (Chrome / Edge).
 * VERSION : v8.12 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EXPORT = root.exportConfig;
  const SYNC = root.repeatabilitySyncConfig;
  const TILE = root.repeatabilityTileConfig;
  const TEXT = CONFIG.TEXT.master;
  const SHEET_PATH = 'xl/worksheets/sheet1.xml';
  const STRINGS_PATH = 'xl/sharedStrings.xml';
  const EOCD_SIGNATURE = 0x06054b50;
  const CENTRAL_SIGNATURE = 0x02014b50;
  const detailsCache = new Map();

  // Mga entry ng ZIP { name: { method, compressedSize, localOffset } } mula sa central directory; null kung hindi ZIP.
  function readZipEntries(view) {
    let endOffset = -1;
    for (let offset = view.byteLength - 22; offset >= Math.max(0, view.byteLength - 65557); offset -= 1) {
      if (view.getUint32(offset, true) === EOCD_SIGNATURE) { endOffset = offset; break; }
    }
    if (endOffset < 0) return null;
    const entryCount = view.getUint16(endOffset + 10, true);
    let offset = view.getUint32(endOffset + 16, true);
    const entryMap = new Map();
    const decoder = new TextDecoder();
    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) return null;
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const name = decoder.decode(new Uint8Array(view.buffer, view.byteOffset + offset + 46, nameLength));
      entryMap.set(name, { method: view.getUint16(offset + 10, true), compressedSize: view.getUint32(offset + 20, true), localOffset: view.getUint32(offset + 42, true) });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return entryMap;
  }

  // Text ng isang entry (store o deflate); null kung wala o hindi suportado.
  async function readEntryText(view, entryMap, name) {
    const entry = entryMap.get(name);
    if (!entry) return null;
    const dataOffset = entry.localOffset + 30 + view.getUint16(entry.localOffset + 26, true) + view.getUint16(entry.localOffset + 28, true);
    const bytes = new Uint8Array(view.buffer, view.byteOffset + dataOffset, entry.compressedSize);
    if (entry.method === 0) return new TextDecoder().decode(bytes);
    if (entry.method !== 8 || typeof DecompressionStream !== 'function') return null;
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(await new Response(stream).arrayBuffer());
  }

  // Listahan ng shared strings (kapag ang Excel mismo ang nag-save ng file).
  function parseSharedStrings(xmlText) {
    if (!xmlText) return [];
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    return Array.from(doc.getElementsByTagName('si')).map((item) => Array.from(item.getElementsByTagName('t')).map((node) => node.textContent).join(''));
  }

  // Lahat ng cell ng sheet bilang Map('A21' -> halaga), hanggang CELL_ROW_LIMIT na row.
  function parseAllCells(sheetXml, sharedList) {
    const doc = new DOMParser().parseFromString(sheetXml, 'application/xml');
    const cellMap = new Map();
    Array.from(doc.getElementsByTagName('c')).forEach((cell) => {
      const match = /^([A-Z]+)(\d+)$/.exec(cell.getAttribute('r') || '');
      if (!match || Number(match[2]) > TILE.CELL_ROW_LIMIT) return;
      const type = cell.getAttribute('t');
      let value = '';
      if (type === 'inlineStr') value = Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent).join('');
      else {
        const valueNode = cell.getElementsByTagName('v')[0];
        const raw = valueNode ? valueNode.textContent : '';
        value = type === 's' ? sharedList[Number(raw)] || '' : raw;
      }
      cellMap.set(cell.getAttribute('r'), value);
    });
    return cellMap;
  }

  // Grid ng buong sheet { columnList, rowList } para sa Preview tab.
  function buildGrid(cellMap) {
    let lastRow = 0;
    let lastColumn = 0;
    const entryList = [];
    cellMap.forEach((value, reference) => {
      const match = /^([A-Z]+)(\d+)$/.exec(reference);
      if (!match || value === '') return;
      let columnNumber = 0;
      for (const letter of match[1]) columnNumber = columnNumber * 26 + (letter.charCodeAt(0) - 64);
      lastRow = Math.max(lastRow, Number(match[2]));
      lastColumn = Math.max(lastColumn, columnNumber);
      entryList.push({ row: Number(match[2]), column: columnNumber, value });
    });
    const rowList = Array.from({ length: lastRow }, () => Array(lastColumn).fill(''));
    entryList.forEach((entry) => { rowList[entry.row - 1][entry.column - 1] = entry.value; });
    const columnList = Array.from({ length: lastColumn }, (unused, index) => String.fromCharCode(65 + (index % 26)));
    return { columnList, rowList };
  }

  // Halaga sa column B sa tabi ng label sa column A (row 1 hanggang LABEL_ROW_LIMIT); walang laman kung wala.
  function findValue(cellMap, label) {
    for (let row = 1; row <= TILE.LABEL_ROW_LIMIT; row += 1) {
      if ((cellMap.get('A' + row) || '').trim().toLowerCase() === label.toLowerCase()) return (cellMap.get('B' + row) || '').trim();
    }
    return '';
  }

  // Numero o null mula sa text.
  function toNumber(text) {
    if (text === '') return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
  }

  // Binabasa ang isang Excel file at ibinibigay ang details; null kung hindi mabasa o walang Status.
  async function readDetailsFromFile(file) {
    if (file.size > TILE.FILE_MAX_BYTES) return null;
    const view = new DataView(await file.arrayBuffer());
    const entryMap = readZipEntries(view);
    if (!entryMap) return null;
    const sheetXml = await readEntryText(view, entryMap, SHEET_PATH);
    if (!sheetXml) return null;
    const cellMap = parseAllCells(sheetXml, parseSharedStrings(await readEntryText(view, entryMap, STRINGS_PATH)));
    const status = findValue(cellMap, EXPORT.LABEL.status);
    if (!status) return null;
    const shiftText = root.shiftConfig ? root.shiftConfig.TEXT.modeLabel : '';
    return {
      fileName: file.name,
      modifiedMs: file.lastModified,
      status,
      score: toNumber(findValue(cellMap, TEXT.repeatability + ' (%)')),
      averageDifference: toNumber(findValue(cellMap, TEXT.averageDifference)),
      maxDifference: toNumber(findValue(cellMap, TEXT.maxDifference)),
      worst: findValue(cellMap, TEXT.worstBarcode),
      records: findValue(cellMap, TEXT.records),
      range: findValue(cellMap, TEXT.range),
      mode: shiftText ? findValue(cellMap, shiftText) : '',
      exportedAt: findValue(cellMap, EXPORT.LABEL.exportedAt),
      grid: buildGrid(cellMap)
    };
  }

  // May cache kada file (pangalan + last modified + laki) para hindi inuulit ang pagbasa kada refresh ng Dashboard.
  async function readCached(file) {
    const key = file.name + '|' + file.lastModified + '|' + file.size;
    if (!detailsCache.has(key)) detailsCache.set(key, await readDetailsFromFile(file));
    return detailsCache.get(key);
  }

  // Pinakabagong file (last modified) sa isang folder ng petsa na tugma sa prefix at extension; null kung wala.
  async function findLatestInFolder(dayHandle) {
    let latest = null;
    for await (const [fileName, fileHandle] of dayHandle.entries()) {
      if (fileHandle.kind !== 'file' || !fileName.startsWith(EXPORT.FILE_PREFIX) || !fileName.toLowerCase().endsWith(EXPORT.FILE_EXTENSION)) continue;
      const file = await fileHandle.getFile();
      if (!latest || file.lastModified > latest.lastModified) latest = file;
    }
    return latest;
  }

  // Pinaikli ang pangalan para sa paghahambing (walang pagkakaiba ang laki ng letra at sobrang espasyo).
  function normalizeName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Pangalan ng folder ng machine, kapareho ng ginagamit ng export (correlConfig.SERVER).
  function getMachineFolderName(machineName) {
    const setting = root.correlConfig.SERVER;
    const cleaned = String(machineName || '').replace(setting.UNSAFE_NAME, '_').replace(setting.TRIM_NAME, '');
    return cleaned || setting.NO_MACHINE_FOLDER;
  }

  // LEAD PC: pinakabagong Excel ng machine sa <Server path>\master-repeatability\<machine>\<petsa>\. Tinitingnan ang folder ng petsa mula pinakabago (yyyy-mm-dd) hanggang makakita ng file.
  async function readForMachine(serverHandle, machineName) {
    try {
      const baseHandle = await serverHandle.getDirectoryHandle(SYNC.SERVER.SUBFOLDER);
      const wanted = normalizeName(getMachineFolderName(machineName));
      let machineHandle = null;
      for await (const [folderName, handle] of baseHandle.entries()) {
        if (handle.kind === 'directory' && normalizeName(folderName) === wanted) { machineHandle = handle; break; }
      }
      if (!machineHandle) return null;
      const dayList = [];
      for await (const [dayName, handle] of machineHandle.entries()) {
        if (handle.kind === 'directory') dayList.push({ dayName, handle });
      }
      dayList.sort((first, second) => (first.dayName < second.dayName ? 1 : -1));
      for (const day of dayList) {
        const latest = await findLatestInFolder(day.handle);
        if (latest) return await readCached(latest);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Sender: pinakabagong Excel ngayong araw sa <Saving path>\master-repeatability\<dayName>\ (dayName = yyyy-mm-dd).
  async function readInSavingPath(rootHandle, dayName) {
    try {
      const baseHandle = await rootHandle.getDirectoryHandle(EXPORT.SUBFOLDER);
      const latest = await findLatestInFolder(await baseHandle.getDirectoryHandle(dayName));
      return latest ? await readCached(latest) : null;
    } catch (error) {
      return null;
    }
  }

  root.repeatabilityReader = Object.freeze({ readForMachine, readInSavingPath, readDetailsFromFile });
})();
