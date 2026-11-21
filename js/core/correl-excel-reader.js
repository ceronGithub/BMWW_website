/*
 * FILE    : js/core/correl-excel-reader.js
 * PURPOSE : Binabasa ang pinakabagong na-export na Master Correl Excel ng machine sa <Server path>\master-correl\<machine name>\<petsa>\ at kinukuha ang Status, R Square at Record date
 * DEPENDS : js/core/config.js, correl-export-config.js, correl-sync.js, master-compare-config.js, compare-sync.js, master-analysis.js
 * INPUT   : folder handle ng <Server path>\master-correl, pangalan ng machine
 * OUTPUT  : { status, fileName, modifiedMs } (kapareho ng item ng correlSync.readCorrelList) o null; hindi nagtatapon ng error. Basa lang, walang sinusulat sa Server.
 * NOTE    : Walang library: sariling basa ng ZIP (store at deflate) at XML. Ang deflate ay nangangailangan ng DecompressionStream (Chrome / Edge).
 * VERSION : v8.7 | 2026-11-21 | readDetailsFromFile, readLatestDetailsInSavingPath, readLatestDetailsForMachine (buong laman ng Master Correl para sa Preview panel)
 * VERSION : v8.6 | 2026-11-21 | readLatestCompareInSavingPath (Excel ng Compare sa <Saving path>\\master-compare\\<petsa ngayon>); findLatestInDayFolders; findDayFolders may parameter na subfolder
 * VERSION : v8.4 | 2026-11-21 | readLatestInSavingPath: tinitingnan din ang <Saving path>\\master-correl\\<machine>\\<petsa> (findDayFolders)
 * VERSION : v8.1 | 2026-11-21 | readLatestInSavingPath (Sender: pinakabagong file sa <Saving path>\\master-correl\\<petsa ngayon>)
 * VERSION : v7.7 | 2026-11-21 | case-insensitive ang hanap sa folder ng machine; getIssue(machineName) para sa dahilan kung bakit hindi nabasa
 * VERSION : v7.6 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const CORREL = root.correlConfig;
  const TEXT = CONFIG.TEXT.master;
  const FILE_MAX_BYTES = 5242880;
  const SHEET_PATH = 'xl/worksheets/sheet1.xml';
  const STRINGS_PATH = 'xl/sharedStrings.xml';
  const LABEL_ROW_LIMIT = 30;
  const EOCD_SIGNATURE = 0x06054b50;
  const CENTRAL_SIGNATURE = 0x02014b50;
  const resultCache = new Map();
  const issueMap = new Map();
  const FOLDER_LIST_LIMIT = 5;
  const CELL_ROW_LIMIT = 400;

  // Pangalan ng folder ng machine (kapareho ng ginagamit ng Export to Excel).
  function getMachineFolderName(machineName) {
    return root.correlPreview ? root.correlPreview.getMachineFolderName(machineName) : String(machineName || '');
  }

  // Binabasa ang mga entry ng ZIP: { name: { method, compressedSize, localOffset } } mula sa central directory.
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

  // Kinukuha ang text ng isang entry (store o deflate); null kung wala o hindi suportado.
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

  // Mga cell ng column A at B (row 1 hanggang LABEL_ROW_LIMIT) bilang [{label, value}].
  function parseLabelRows(sheetXml, sharedList) {
    const doc = new DOMParser().parseFromString(sheetXml, 'application/xml');
    const cellMap = new Map();
    Array.from(doc.getElementsByTagName('c')).forEach((cell) => {
      const reference = cell.getAttribute('r') || '';
      const match = /^([AB])(\d+)$/.exec(reference);
      if (!match || Number(match[2]) > LABEL_ROW_LIMIT) return;
      const type = cell.getAttribute('t');
      let value = '';
      if (type === 'inlineStr') value = Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent).join('');
      else {
        const valueNode = cell.getElementsByTagName('v')[0];
        const raw = valueNode ? valueNode.textContent : '';
        value = type === 's' ? sharedList[Number(raw)] || '' : raw;
      }
      cellMap.set(reference, value);
    });
    const rowList = [];
    for (let row = 1; row <= LABEL_ROW_LIMIT; row += 1) rowList.push({ label: cellMap.get('A' + row) || '', value: cellMap.get('B' + row) || '' });
    return rowList;
  }

  // Halaga sa tabi ng label (hal. 'Status'); walang laman kung wala.
  function findValue(rowList, label) {
    const found = rowList.find((row) => row.label.trim().toLowerCase() === label.toLowerCase());
    return found ? found.value.trim() : '';
  }

  // Binabasa ang isang Excel file at ibinibigay ang malinis na status (o null kung hindi mabasa).
  async function readStatusFromFile(file, machineName) {
    if (file.size > FILE_MAX_BYTES) return null;
    const view = new DataView(await file.arrayBuffer());
    const entryMap = readZipEntries(view);
    if (!entryMap) return null;
    const sheetXml = await readEntryText(view, entryMap, SHEET_PATH);
    if (!sheetXml) return null;
    const sharedList = parseSharedStrings(await readEntryText(view, entryMap, STRINGS_PATH));
    const rowList = parseLabelRows(sheetXml, sharedList);
    const rSquared = Number(findValue(rowList, TEXT.rSquared));
    const recordText = findValue(rowList, TEXT.recordDate);
    const recordMs = Date.parse(recordText.replace(' ', 'T'));
    return root.correlSync.normalizeStatus({
      machineName,
      status: findValue(rowList, CORREL.LABEL.status),
      rSquared: findValue(rowList, TEXT.rSquared) === '' || !Number.isFinite(rSquared) ? null : rSquared,
      recordDate: Number.isNaN(recordMs) ? '' : new Date(recordMs).toISOString(),
      updatedAt: new Date(file.lastModified).toISOString(),
      fileName: file.name
    });
  }

  // Hinahanap ang pinakabagong file (ayon sa last modified) sa lahat ng folder ng petsa ng machine.
  async function findLatestFile(machineHandle) {
    let latest = null;
    for await (const [, dateHandle] of machineHandle.entries()) {
      if (dateHandle.kind !== 'directory') continue;
      for await (const [fileName, fileHandle] of dateHandle.entries()) {
        const lowerName = fileName.toLowerCase();
        if (fileHandle.kind !== 'file' || !fileName.startsWith(CORREL.FILE_PREFIX) || !lowerName.endsWith(CORREL.FILE_EXTENSION)) continue;
        const file = await fileHandle.getFile();
        if (!latest || file.lastModified > latest.lastModified) latest = file;
      }
    }
    return latest;
  }

  // Pinapaikli ang pangalan para sa paghahambing (walang pagkakaiba ang laki ng letra at sobrang espasyo).
  function normalizeName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Hinahanap ang folder ng machine sa master-correl; ibinibigay ang { handle } o { names } (mga folder na nakita) kapag wala.
  async function findMachineFolder(correlFolderHandle, machineName) {
    const wanted = normalizeName(getMachineFolderName(machineName));
    const names = [];
    for await (const [folderName, handle] of correlFolderHandle.entries()) {
      if (handle.kind !== 'directory') continue;
      if (normalizeName(folderName) === wanted) return { handle };
      names.push(folderName);
    }
    return { names: names.slice(0, FOLDER_LIST_LIMIT) };
  }

  // Binabasa ang pinakabagong Excel ng machine; null kung walang folder, walang file, o hindi mabasa (may dahilan sa getIssue). May cache kada file (pangalan + last modified).
  async function readLatestForMachine(correlFolderHandle, machineName) {
    const issueKey = normalizeName(machineName);
    issueMap.delete(issueKey);
    try {
      const folder = await findMachineFolder(correlFolderHandle, machineName);
      if (!folder.handle) {
        issueMap.set(issueKey, { code: 'noFolder', detail: folder.names.join(', ') });
        return null;
      }
      const latest = await findLatestFile(folder.handle);
      if (!latest) {
        issueMap.set(issueKey, { code: 'noFile', detail: '' });
        return null;
      }
      const cacheKey = issueKey + '|' + latest.name + '|' + latest.lastModified;
      if (!resultCache.has(cacheKey)) resultCache.set(cacheKey, await readStatusFromFile(latest, machineName));
      const status = resultCache.get(cacheKey);
      if (!status) {
        issueMap.set(issueKey, { code: 'unreadable', detail: latest.name });
        return null;
      }
      return { status, fileName: latest.name, modifiedMs: latest.lastModified };
    } catch (error) {
      issueMap.set(issueKey, { code: 'error', detail: error && error.name ? error.name : '' });
      return null;
    }
  }

  // Mga folder ng petsa na posibleng may file ng Sender: <Saving path>\\<subfolder>\\<dayName> at <Saving path>\\<subfolder>\\<machine>\\<dayName> (walang error kapag wala).
  async function findDayFolders(rootHandle, machineName, dayName, subfolder) {
    const folderList = [];
    let baseFolder;
    try {
      baseFolder = await rootHandle.getDirectoryHandle(subfolder);
    } catch (error) {
      return folderList;
    }
    try { folderList.push(await baseFolder.getDirectoryHandle(dayName)); } catch (error) { /* walang folder ng petsa */ }
    const machineFolder = await findMachineFolder(baseFolder, machineName);
    if (machineFolder.handle) {
      try { folderList.push(await machineFolder.handle.getDirectoryHandle(dayName)); } catch (error) { /* walang folder ng petsa sa folder ng machine */ }
    }
    return folderList;
  }

  // Pinakabagong file (last modified) sa mga folder ng petsa na ang pangalan ay nagsisimula sa prefix at nagtatapos sa extension; null kung wala.
  async function findLatestInDayFolders(rootHandle, machineName, dayName, subfolder, prefix, extension) {
    let latest = null;
    for (const dayFolder of await findDayFolders(rootHandle, machineName, dayName, subfolder)) {
      for await (const [fileName, fileHandle] of dayFolder.entries()) {
        if (fileHandle.kind !== 'file' || !fileName.startsWith(prefix) || !fileName.toLowerCase().endsWith(extension)) continue;
        const file = await fileHandle.getFile();
        if (!latest || file.lastModified > latest.lastModified) latest = file;
      }
    }
    return latest;
  }

  // Sender: binabasa ang pinakabagong Master Correl Excel ngayong araw sa <Saving path>\\master-correl\\<dayName>\\ (o \\<machine>\\<dayName>\\). dayName = yyyy-mm-dd. Null kung walang folder, walang file, o hindi mabasa. Basa lang; may cache kada file.
  async function readLatestInSavingPath(rootHandle, machineName, dayName) {
    try {
      const latest = await findLatestInDayFolders(rootHandle, machineName, dayName, CORREL.SUBFOLDER, CORREL.FILE_PREFIX, CORREL.FILE_EXTENSION);
      if (!latest) return null;
      const cacheKey = 'saving|' + normalizeName(machineName) + '|' + latest.name + '|' + latest.lastModified;
      if (!resultCache.has(cacheKey)) resultCache.set(cacheKey, await readStatusFromFile(latest, machineName));
      const status = resultCache.get(cacheKey);
      return status ? { status, fileName: latest.name, modifiedMs: latest.lastModified } : null;
    } catch (error) {
      return null;
    }
  }

  // Lahat ng cell ng sheet bilang Map('A21' -> halaga), hanggang CELL_ROW_LIMIT na row.
  function parseAllCells(sheetXml, sharedList) {
    const doc = new DOMParser().parseFromString(sheetXml, 'application/xml');
    const cellMap = new Map();
    Array.from(doc.getElementsByTagName('c')).forEach((cell) => {
      const reference = cell.getAttribute('r') || '';
      const match = /^([A-Z]+)(\d+)$/.exec(reference);
      if (!match || Number(match[2]) > CELL_ROW_LIMIT) return;
      const type = cell.getAttribute('t');
      let value = '';
      if (type === 'inlineStr') value = Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent).join('');
      else {
        const valueNode = cell.getElementsByTagName('v')[0];
        const raw = valueNode ? valueNode.textContent : '';
        value = type === 's' ? sharedList[Number(raw)] || '' : raw;
      }
      cellMap.set(reference, value);
    });
    return cellMap;
  }

  // Numero o null mula sa text ng cell.
  function cellNumber(cellMap, reference) {
    const text = cellMap.get(reference);
    if (text === undefined || text === '') return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
  }

  // Trend (worse / better / same / unknown) mula sa text ng column Trend.
  function trendFromText(text) {
    const trendText = root.compareConfig.TREND_TEXT;
    const found = Object.keys(trendText).find((key) => trendText[key] === text);
    return found || root.compareConfig.TREND.unknown;
  }

  // Binabasa ang Excel ng Compare (sheet Compare) at ginagawang status na kapareho ng <Server path>\\compare\\<machine>.json: worst slider (pinakamalaking Today diff) at listahan ng slider na kailangang tingnan. Null kung hindi mabasa.
  async function readCompareFromFile(file, machineName) {
    if (file.size > FILE_MAX_BYTES) return null;
    const view = new DataView(await file.arrayBuffer());
    const entryMap = readZipEntries(view);
    if (!entryMap) return null;
    const sheetXml = await readEntryText(view, entryMap, SHEET_PATH);
    if (!sheetXml) return null;
    const sharedList = parseSharedStrings(await readEntryText(view, entryMap, STRINGS_PATH));
    const cellMap = parseAllCells(sheetXml, sharedList);
    const label = root.compareConfig.LABEL;
    let headerRow = 0;
    for (let row = 1; row <= LABEL_ROW_LIMIT; row += 1) {
      if ((cellMap.get('A' + row) || '').trim() === label.columnBarcode) { headerRow = row; break; }
    }
    if (!headerRow) return null;
    const rowValue = (text) => {
      for (let row = 1; row < headerRow; row += 1) if ((cellMap.get('A' + row) || '').trim().toLowerCase() === text.toLowerCase()) return (cellMap.get('B' + row) || '').trim();
      return '';
    };
    const classify = root.masterAnalysis && root.masterAnalysis.classifyDeviation ? root.masterAnalysis.classifyDeviation : () => '';
    const sliderList = [];
    for (let row = headerRow + 1; row <= CELL_ROW_LIMIT; row += 1) {
      const barcode = (cellMap.get('A' + row) || '').trim();
      if (!barcode) break;
      const slider = {
        barcode,
        previousActual: cellNumber(cellMap, 'B' + row), previousMaster: cellNumber(cellMap, 'C' + row), previousDifference: cellNumber(cellMap, 'D' + row),
        currentActual: cellNumber(cellMap, 'E' + row), currentMaster: cellNumber(cellMap, 'F' + row), currentDifference: cellNumber(cellMap, 'G' + row),
        change: cellNumber(cellMap, 'H' + row), trend: trendFromText((cellMap.get('I' + row) || '').trim())
      };
      slider.level = slider.currentActual === null || slider.currentMaster === null ? '' : classify(slider.currentActual, slider.currentMaster);
      sliderList.push(slider);
    }
    if (!sliderList.length) return null;
    const worst = sliderList.reduce((top, slider) => ((slider.currentDifference || 0) > (top.currentDifference || 0) ? slider : top), sliderList[0]);
    const greenLevel = Object.keys(root.compareConfig.LEVEL_RANK)[0];
    const attentionList = sliderList.filter((slider) => slider.trend === root.compareConfig.TREND.worse || (slider.level !== '' && slider.level !== greenLevel));
    const recordMs = Date.parse(rowValue(label.todayDate).replace(' ', 'T'));
    const previousMs = Date.parse(rowValue(label.previousDate).replace(' ', 'T'));
    return root.compareSync.normalizeStatus({
      machineName,
      updatedAt: new Date(file.lastModified).toISOString(),
      detected: true,
      recordDate: Number.isNaN(recordMs) ? '' : new Date(recordMs).toISOString(),
      previousDate: Number.isNaN(previousMs) ? '' : new Date(previousMs).toISOString(),
      todayFile: rowValue(label.todayFile),
      previousFile: rowValue(label.previousFile),
      hasPrevious: true,
      worst,
      summary: null,
      sliderList: attentionList
    });
  }

  // Sender: binabasa ang pinakabagong Excel ng Compare ngayong araw sa <Saving path>\\master-compare\\<dayName>\\ (o \\<machine>\\<dayName>\\). Ibinibigay { status, fileName, modifiedMs } (kapareho ng item ng compareSync) o null. Basa lang; may cache kada file.
  async function readLatestCompareInSavingPath(rootHandle, machineName, dayName) {
    try {
      const compare = root.compareConfig;
      const latest = await findLatestInDayFolders(rootHandle, machineName, dayName, compare.SUBFOLDER, compare.FILE_PREFIX, compare.FILE_EXTENSION);
      if (!latest) return null;
      const cacheKey = 'compare|' + normalizeName(machineName) + '|' + latest.name + '|' + latest.lastModified;
      if (!resultCache.has(cacheKey)) resultCache.set(cacheKey, await readCompareFromFile(latest, machineName));
      const status = resultCache.get(cacheKey);
      return status ? { status, fileName: latest.name, modifiedMs: latest.lastModified } : null;
    } catch (error) {
      return null;
    }
  }

  // Binabasa ang buong laman ng Master Correl Excel para sa Preview panel: buod at table ng Barcode, Actual, Master. Null kung hindi mabasa.
  async function readDetailsFromFile(file) {
    if (file.size > FILE_MAX_BYTES) return null;
    const view = new DataView(await file.arrayBuffer());
    const entryMap = readZipEntries(view);
    if (!entryMap) return null;
    const sheetXml = await readEntryText(view, entryMap, SHEET_PATH);
    if (!sheetXml) return null;
    const sharedList = parseSharedStrings(await readEntryText(view, entryMap, STRINGS_PATH));
    const rowList = parseLabelRows(sheetXml, sharedList);
    const cellMap = parseAllCells(sheetXml, sharedList);
    let headerRow = 0;
    for (let row = 1; row <= LABEL_ROW_LIMIT; row += 1) {
      if ((cellMap.get('A' + row) || '').trim() === TEXT.barcode) { headerRow = row; break; }
    }
    if (!headerRow) return null;
    const classify = root.masterAnalysis && root.masterAnalysis.classifyDeviation ? root.masterAnalysis.classifyDeviation : () => '';
    const sliderList = [];
    for (let row = headerRow + 1; row <= CELL_ROW_LIMIT; row += 1) {
      const barcode = (cellMap.get('A' + row) || '').trim();
      if (!barcode) break;
      const actual = cellNumber(cellMap, 'B' + row);
      const master = cellNumber(cellMap, 'C' + row);
      sliderList.push({ barcode, actual, master, difference: actual === null || master === null ? null : Math.abs(actual - master), level: actual === null || master === null ? '' : classify(actual, master) });
    }
    const rSquared = Number(findValue(rowList, TEXT.rSquared));
    return {
      fileName: file.name,
      modifiedMs: file.lastModified,
      status: findValue(rowList, CORREL.LABEL.status),
      rSquared: Number.isFinite(rSquared) && findValue(rowList, TEXT.rSquared) !== '' ? rSquared : null,
      recordDate: findValue(rowList, TEXT.recordDate),
      actualAverage: findValue(rowList, TEXT.actualAverage),
      masterAverage: findValue(rowList, TEXT.masterAverage),
      worst: findValue(rowList, TEXT.worstBarcode),
      sliderList
    };
  }

  // Preview (Sender): buong laman ng pinakabagong Master Correl Excel ngayong araw sa <Saving path>. Null kung wala o hindi mabasa.
  async function readLatestDetailsInSavingPath(rootHandle, machineName, dayName) {
    try {
      const latest = await findLatestInDayFolders(rootHandle, machineName, dayName, CORREL.SUBFOLDER, CORREL.FILE_PREFIX, CORREL.FILE_EXTENSION);
      return latest ? await readDetailsFromFile(latest) : null;
    } catch (error) {
      return null;
    }
  }

  // Preview (LEAD PC): buong laman ng pinakabagong Master Correl Excel ng machine sa <Server path>\\master-correl\\<machine>\\<petsa>. Null kung wala o hindi mabasa.
  async function readLatestDetailsForMachine(correlFolderHandle, machineName) {
    try {
      const folder = await findMachineFolder(correlFolderHandle, machineName);
      if (!folder.handle) return null;
      const latest = await findLatestFile(folder.handle);
      return latest ? await readDetailsFromFile(latest) : null;
    } catch (error) {
      return null;
    }
  }

  // Dahilan kung bakit hindi nabasa ang huling subok sa machine: { code, detail } o null.
  function getIssue(machineName) {
    return issueMap.get(normalizeName(machineName)) || null;
  }

  root.correlExcelReader = Object.freeze({ readLatestForMachine, readLatestInSavingPath, readLatestCompareInSavingPath, readLatestDetailsInSavingPath, readLatestDetailsForMachine, getIssue });
})();
