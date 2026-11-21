/*
 * FILE    : js/core/repeatability-reader.js
 * PURPOSE : Binabasa ang pinakabagong na-export na Master Repeatability Excel: LEAD PC = <Server path>\master-repeatability\<machine name>\<petsa>\ ; Sender = <Saving path>\master-repeatability\<petsa ngayon>\
 * DEPENDS : js/core/config.js, master-export-config.js, master-shift-config.js, correl-export-config.js, repeatability-sync-config.js, repeatability-tile-config.js
 * INPUT   : folder handle (Server path o Saving path), pangalan ng machine o petsa (yyyy-mm-dd)
 * OUTPUT  : details { fileName, modifiedMs, status, score, averageDifference, maxDifference, worst, records, range, mode, exportedAt, grid, readings } o null; hindi nagtatapon ng error. Basa lang, walang sinusulat. getIssue(machineName, isSender) = dahilan kung bakit null ang huling basa.
 * NOTE    : Walang library: sariling basa ng ZIP (store at deflate) at XML. Ang deflate ay nangangailangan ng DecompressionStream (Chrome / Edge).
 * VERSION : v8.12 | 2026-11-21 | bagong file
 * VERSION : v8.14 | 2026-11-22 | (1) details.readings: binabasa na rin ang sheet na Readings (barcode, MASTER, mga record) para sa chart ng Preview. (2) getIssue: dahilan kung bakit walang nabasa (walang folder, walang file, hindi mabasa, error)
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
  const issueMap = new Map();
  const ISSUE = TILE.ISSUE;
  const READINGS = TILE.READINGS;

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

  // Lahat ng cell ng sheet bilang Map('A21' -> halaga), hanggang rowLimit na row (default CELL_ROW_LIMIT).
  function parseAllCells(sheetXml, sharedList, rowLimit) {
    const maxRow = rowLimit || TILE.CELL_ROW_LIMIT;
    const doc = new DOMParser().parseFromString(sheetXml, 'application/xml');
    const cellMap = new Map();
    Array.from(doc.getElementsByTagName('c')).forEach((cell) => {
      const match = /^([A-Z]+)(\d+)$/.exec(cell.getAttribute('r') || '');
      if (!match || Number(match[2]) > maxRow) return;
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

  // Numero ng column mula sa letra (A = 1, Z = 26, AA = 27).
  function columnNumberOf(letters) {
    let columnNumber = 0;
    for (const letter of letters) columnNumber = columnNumber * 26 + (letter.charCodeAt(0) - 64);
    return columnNumber;
  }

  // Cell ng sheet bilang Map(row -> Map(column -> halaga)); blangkong cell ay hindi isinasama.
  function toRowMap(cellMap) {
    const rowMap = new Map();
    cellMap.forEach((value, reference) => {
      const match = /^([A-Z]+)(\d+)$/.exec(reference);
      if (!match || value === '') return;
      const row = Number(match[2]);
      if (!rowMap.has(row)) rowMap.set(row, new Map());
      rowMap.get(row).set(columnNumberOf(match[1]), value);
    });
    return rowMap;
  }

  // Data ng chart mula sa sheet na Readings: { barcodeList, masterList, recordList: [{ key, values }] }; null kung kulang o iba ang ayos. May column na Shift sa ikalawang column kapag mode na shift.
  function parseReadings(cellMap) {
    const rowMap = toRowMap(cellMap);
    const headerRow = rowMap.get(READINGS.HEADER_ROW);
    const masterRow = rowMap.get(READINGS.MASTER_ROW);
    if (!headerRow || !masterRow) return null;
    const shiftText = root.shiftConfig ? root.shiftConfig.TEXT.shiftColumn : '';
    const leadCount = shiftText && headerRow.get(2) === shiftText ? 2 : 1;
    let lastColumn = 0;
    headerRow.forEach((text, column) => { if (column > leadCount) lastColumn = Math.max(lastColumn, column); });
    if (lastColumn === 0) return null;
    const barcodeList = [];
    const masterList = [];
    for (let column = leadCount + 1; column <= lastColumn; column += 1) {
      barcodeList.push(headerRow.get(column) || '');
      masterList.push(toNumber(masterRow.get(column) || ''));
    }
    const recordList = [];
    Array.from(rowMap.keys()).filter((row) => row >= READINGS.FIRST_RECORD_ROW).sort((first, second) => first - second).forEach((row) => {
      const recordRow = rowMap.get(row);
      const key = recordRow.get(1);
      if (!key) return;
      recordList.push({ key, values: barcodeList.map((barcode, index) => toNumber(recordRow.get(leadCount + 1 + index) || '')) });
    });
    return { barcodeList, masterList, recordList };
  }

  // Binabasa ang isang Excel file at ibinibigay ang details; null kung hindi mabasa o walang Status.
  async function readDetailsFromFile(file) {
    if (file.size > TILE.FILE_MAX_BYTES) return null;
    const view = new DataView(await file.arrayBuffer());
    const entryMap = readZipEntries(view);
    if (!entryMap) return null;
    const sheetXml = await readEntryText(view, entryMap, SHEET_PATH);
    if (!sheetXml) return null;
    const sharedList = parseSharedStrings(await readEntryText(view, entryMap, STRINGS_PATH));
    const cellMap = parseAllCells(sheetXml, sharedList);
    const status = findValue(cellMap, EXPORT.LABEL.status);
    if (!status) return null;
    const shiftText = root.shiftConfig ? root.shiftConfig.TEXT.modeLabel : '';
    // Sheet na Readings: kung wala o hindi mabasa, ang chart lang ang mawawala (buod at grid ay tuloy).
    let readings = null;
    try {
      const readingsXml = await readEntryText(view, entryMap, READINGS.SHEET_PATH);
      readings = readingsXml ? parseReadings(parseAllCells(readingsXml, sharedList, READINGS.ROW_LIMIT)) : null;
    } catch (error) {
      readings = null;
    }
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
      grid: buildGrid(cellMap),
      readings
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

  // Itinatala ang dahilan kung bakit walang nabasa ({ code, detail }) sa ilalim ng key.
  function setIssue(key, code, detail) {
    issueMap.set(key, { code, detail: detail || '' });
  }

  // Walang folder ba (NotFoundError) ang dahilan ng error?
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  // Dahilan kung bakit hindi nabasa ang huling subok: { code, detail } o null. Sender: isSender = true (walang machine name).
  function getIssue(machineName, isSender) {
    return issueMap.get(isSender ? ISSUE.SENDER_KEY : normalizeName(machineName)) || null;
  }

  // LEAD PC: pinakabagong Excel ng machine sa <Server path>\master-repeatability\<machine>\<petsa>\. Tinitingnan ang folder ng petsa mula pinakabago (yyyy-mm-dd) hanggang makakita ng file. Kapag null, may dahilan sa getIssue.
  async function readForMachine(serverHandle, machineName) {
    const issueKey = normalizeName(machineName);
    issueMap.delete(issueKey);
    try {
      let baseHandle;
      try {
        baseHandle = await serverHandle.getDirectoryHandle(SYNC.SERVER.SUBFOLDER);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        setIssue(issueKey, 'noBaseFolder');
        return null;
      }
      const wanted = normalizeName(getMachineFolderName(machineName));
      let machineHandle = null;
      const folderNameList = [];
      for await (const [folderName, handle] of baseHandle.entries()) {
        if (handle.kind !== 'directory') continue;
        if (normalizeName(folderName) === wanted) { machineHandle = handle; break; }
        folderNameList.push(folderName);
      }
      if (!machineHandle) {
        setIssue(issueKey, 'noFolder', folderNameList.slice(0, ISSUE.FOLDER_LIST_LIMIT).join(', '));
        return null;
      }
      const dayList = [];
      for await (const [dayName, handle] of machineHandle.entries()) {
        if (handle.kind === 'directory') dayList.push({ dayName, handle });
      }
      dayList.sort((first, second) => (first.dayName < second.dayName ? 1 : -1));
      for (const day of dayList) {
        const latest = await findLatestInFolder(day.handle);
        if (!latest) continue;
        const details = await readCached(latest);
        if (!details) setIssue(issueKey, 'unreadable', latest.name);
        return details;
      }
      setIssue(issueKey, 'noFile');
      return null;
    } catch (error) {
      setIssue(issueKey, 'error', error && error.name ? error.name : '');
      return null;
    }
  }

  // Sender: pinakabagong Excel ngayong araw sa <Saving path>\master-repeatability\<dayName>\ (dayName = yyyy-mm-dd). Kapag null, may dahilan sa getIssue(machineName, true).
  async function readInSavingPath(rootHandle, dayName) {
    issueMap.delete(ISSUE.SENDER_KEY);
    try {
      let baseHandle;
      try {
        baseHandle = await rootHandle.getDirectoryHandle(EXPORT.SUBFOLDER);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        setIssue(ISSUE.SENDER_KEY, 'noBaseFolder');
        return null;
      }
      let dayHandle;
      try {
        dayHandle = await baseHandle.getDirectoryHandle(dayName);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        setIssue(ISSUE.SENDER_KEY, 'noDayFolder');
        return null;
      }
      const latest = await findLatestInFolder(dayHandle);
      if (!latest) { setIssue(ISSUE.SENDER_KEY, 'noFile'); return null; }
      const details = await readCached(latest);
      if (!details) setIssue(ISSUE.SENDER_KEY, 'unreadable', latest.name);
      return details;
    } catch (error) {
      setIssue(ISSUE.SENDER_KEY, 'error', error && error.name ? error.name : '');
      return null;
    }
  }

  root.repeatabilityReader = Object.freeze({ readForMachine, readInSavingPath, readDetailsFromFile, getIssue });
})();
