/*
 * FILE    : js/core/lot-csv-check.js
 * PURPOSE : Binabasa ang result CSV ng BM3100 at sinusuri kung may Average sa [Summary]; walang Average = may problema (re-measure)
 * DEPENDS : js/core/lot-hold-config.js
 * USED BY : js/core/lot-autohold.js
 * VERSION : v1 | 2026-11-24 | bagong file (Task 1A)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const HOLD = root.lotHoldConfig;
  const CSV = HOLD.CSV;

  /**
   * PARA SAAN    : hatiin ang isang linya ng CSV sa mga cell
   * GINAGAWA     : simpleng hati sa kuwit na may suporta sa "quotes"
   * INPUT/OUTPUT : line -> string[]
   * TINATAWAG NG : lot-csv-check.js checkText
   * TUMATAWAG SA : wala
   */
  function splitLine(line) {
    const cellList = [];
    let current = '';
    let isQuoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') isQuoted = !isQuoted;
      else if (char === ',' && !isQuoted) { cellList.push(current); current = ''; }
      else current += char;
    }
    cellList.push(current);
    return cellList;
  }

  /**
   * PARA SAAN    : alamin kung may Average ang result CSV
   * GINAGAWA     : hinahanap ang [Summary], tapos ang row na ang unang cell ay Average at may kahit isang numerong value
   * INPUT/OUTPUT : text -> { hasAverage: bool, valueCount: number }
   * TINATAWAG NG : lot-autohold.js evaluateFile
   * TUMATAWAG SA : lot-csv-check.js splitLine
   */
  function checkText(text) {
    let isSummary = false;
    const lineList = String(text).split(/\r\n|\n|\r/);
    for (const line of lineList) {
      const cellList = splitLine(line);
      const first = (cellList[0] || '').trim().toLowerCase();
      if (first === CSV.SUMMARY_TITLE) { isSummary = true; continue; }
      if (!isSummary) continue;
      if (first.startsWith('[')) isSummary = false;
      else if (first === CSV.AVERAGE_LABEL) {
        const valueCount = cellList.slice(1).filter((cell) => cell.trim() !== '' && Number.isFinite(Number(cell))).length;
        return { hasAverage: valueCount > 0, valueCount };
      }
    }
    return { hasAverage: false, valueCount: 0 };
  }

  root.lotCsvCheck = Object.freeze({ checkText });
})();
