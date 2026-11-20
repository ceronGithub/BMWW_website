/*
 * FILE    : js/core/csv-reader.js
 * PURPOSE : Pagbasa ng CSV mula sa folder handle, pag-parse ng petsa at numero, at pag-format ng petsa
 * DEPENDS : js/core/config.js
 * VERSION : v2.6 | 2026-11-20 | bagong file (para sa Master)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const MASTER = root.CONFIG.MASTER;
  const DATE_PATTERN = /^(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/;

  // Gumagawa ng Error na may code (ginagamit para sa friendly na mensahe).
  function createError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }

  // Ginagawang array of rows ang CSV text (suporta ang quotes, CRLF at BOM).
  function parseCsv(text) {
    const rowList = [];
    let row = [];
    let field = '';
    let isInQuotes = false;
    const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (isInQuotes) {
        if (character === '"') {
          if (source[index + 1] === '"') { field += '"'; index += 1; } else { isInQuotes = false; }
        } else {
          field += character;
        }
      } else if (character === '"') {
        isInQuotes = true;
      } else if (character === ',') {
        row.push(field);
        field = '';
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && source[index + 1] === '\n') index += 1;
        row.push(field);
        rowList.push(row);
        row = [];
        field = '';
      } else {
        field += character;
      }
    }
    if (field !== '' || row.length) { row.push(field); rowList.push(row); }
    return rowList;
  }

  // Kinukuha ang lahat ng CSV file sa mismong folder (hindi kasama ang subfolder).
  async function listCsvFiles(directoryHandle) {
    const fileList = [];
    let skippedCount = 0;
    for await (const entry of directoryHandle.values()) {
      if (entry.kind !== 'file' || !entry.name.toLowerCase().endsWith(MASTER.CSV_EXTENSION)) continue;
      try {
        const file = await entry.getFile();
        fileList.push({ name: file.name, file, modifiedAt: file.lastModified });
      } catch (error) {
        skippedCount += 1;
      }
    }
    return { fileList, skippedCount };
  }

  // Binabasa at pina-parse ang isang CSV file.
  async function readCsvRows(file) {
    if (file.size > MASTER.CSV_MAX_BYTES) throw createError('fileTooLarge');
    return parseCsv(await file.text());
  }

  // Ligtas na kuha ng cell (walang laman na text kung wala).
  function getCell(rowList, rowIndex, columnIndex) {
    const row = rowList[rowIndex];
    return row && row[columnIndex] !== undefined ? row[columnIndex] : '';
  }

  // Binibilang ang header sa row 2 (hindi walang laman), tulad ng GetHeaderCount sa Excel.
  function countHeaders(rowList) {
    const row = rowList[MASTER.HEADER_ROW] || [];
    let headerCount = 0;
    for (let index = 0; index < Math.min(row.length, MASTER.HEADER_SCAN_COLUMNS); index += 1) {
      if (String(row[index]).trim() !== '') headerCount += 1;
    }
    return headerCount;
  }

  // Ginagawang numero ang text; null kung hindi numero.
  function toNumber(value) {
    const text = String(value === undefined || value === null ? '' : value).trim();
    if (text === '') return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  // 2-digit na taon ay ginagawang 20xx.
  function fixYear(year) {
    return year < 100 ? 2000 + year : year;
  }

  // Pina-parse ang petsa (M/D/Y, D/M/Y kapag ang una ay higit 12, Y-M-D; may oras o wala). Null kung hindi valid.
  function parseAnyDate(value) {
    const text = String(value === undefined || value === null ? '' : value).trim();
    const match = DATE_PATTERN.exec(text);
    if (!match) return null;
    const partOne = Number(match[1]);
    const partTwo = Number(match[2]);
    const partThree = Number(match[3]);
    let year;
    let month;
    let day;
    if (match[1].length === 4) {
      year = partOne; month = partTwo; day = partThree;
    } else {
      year = fixYear(partThree);
      if (partOne > 12) { day = partOne; month = partTwo; } else { month = partOne; day = partTwo; }
    }
    let hour = match[4] ? Number(match[4]) : 0;
    const minute = match[5] ? Number(match[5]) : 0;
    const secondValue = match[6] ? Number(match[6]) : 0;
    if (match[7]) {
      const isAfternoon = match[7].toLowerCase() === 'pm';
      if (isAfternoon && hour < 12) hour += 12;
      if (!isAfternoon && hour === 12) hour = 0;
    }
    const date = new Date(year, month - 1, day, hour, minute, secondValue);
    const isValid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    return isValid ? date : null;
  }

  // Dalawang digit.
  function padTwo(number) {
    return String(number).padStart(2, '0');
  }

  // mm/dd/yyyy hh:mm (24 oras) o may AM/PM.
  function formatDateTime(date, useMeridiem) {
    const datePart = padTwo(date.getMonth() + 1) + '/' + padTwo(date.getDate()) + '/' + date.getFullYear();
    if (!useMeridiem) return datePart + ' ' + padTwo(date.getHours()) + ':' + padTwo(date.getMinutes());
    const hour = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
    return datePart + ' ' + padTwo(hour) + ':' + padTwo(date.getMinutes()) + (date.getHours() < 12 ? ' AM' : ' PM');
  }

  // Para sa <input type="date">: yyyy-mm-dd.
  function formatDateInput(date) {
    return date.getFullYear() + '-' + padTwo(date.getMonth() + 1) + '-' + padTwo(date.getDate());
  }

  // Mula sa <input type="date"> (yyyy-mm-dd) papuntang Date (00:00); null kung hindi valid.
  function parseDateInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 ? date : null;
  }

  root.csv = Object.freeze({ createError, parseCsv, listCsvFiles, readCsvRows, getCell, countHeaders, toNumber, parseAnyDate, formatDateTime, formatDateInput, parseDateInput });
})();
