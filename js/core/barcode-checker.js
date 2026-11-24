/*
 * FILE    : js/core/barcode-checker.js
 * PURPOSE : Sinusuri ang listahan ng barcode ng isang record (bilang, blangko, doble, anyo) para maiwasan ang maling basa ng data
 * DEPENDS : js/core/config.js, js/core/barcode-checker-config.js
 * USED BY : master-analysis.js, calibration-analysis.js, calibration-repeatability.js, calibration-compare.js
 * VERSION : v23 | 2026-11-24 | bagong file (Batch C: ERRORS.txt Task 11 at 12)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CHECKER = root.barcodeCheckerConfig;
  const TEXT = CHECKER.TEXT;

  // Hiwalay na listahan ng text ayon sa limitasyon (may "at iba pa" kapag marami).
  function formatList(itemList) {
    const shown = itemList.slice(0, CHECKER.LIST_LIMIT).join(TEXT.listSeparator);
    return itemList.length > CHECKER.LIST_LIMIT ? shown + TEXT.more : shown;
  }

  // Tamang bilang bilang text (hal. "15" o "27 hanggang 30").
  function describeExpected(rule) {
    if (rule.min === rule.max) return String(rule.min);
    return TEXT.expectedRange.replace('{min}', String(rule.min)).replace('{max}', String(rule.max));
  }

  // Sinusuri ang listahan ng barcode (mga text, puwedeng may blangko). ruleKey: 'master' o 'calibration'.
  // Ibinibigay { ok, ruleKey, count, problemList: [{ type, text }], message }; walang itinatapon na error.
  function check(ruleKey, rawList) {
    const rule = CHECKER.RULE[ruleKey];
    const trimmedList = (rawList || []).map((value) => String(value === undefined || value === null ? '' : value).trim());
    const blankSlotList = [];
    const filledList = [];
    trimmedList.forEach((value, index) => { if (value === '') blankSlotList.push(index + 1); else filledList.push(value); });
    const problemList = [];
    if (filledList.length < rule.min || filledList.length > rule.max) {
      problemList.push({ type: CHECKER.PROBLEM.count, text: TEXT.count.replace('{found}', String(filledList.length)).replace('{expected}', describeExpected(rule)) });
    }
    if (blankSlotList.length) {
      problemList.push({ type: CHECKER.PROBLEM.blank, text: TEXT.blank.replace('{n}', String(blankSlotList.length)).replace('{list}', formatList(blankSlotList)) });
    }
    const seenSet = new Set();
    const duplicateList = [];
    filledList.forEach((value) => {
      const key = value.toLowerCase();
      if (seenSet.has(key) && !duplicateList.includes(value)) duplicateList.push(value);
      seenSet.add(key);
    });
    if (duplicateList.length) problemList.push({ type: CHECKER.PROBLEM.duplicate, text: TEXT.duplicate.replace('{list}', formatList(duplicateList)) });
    const badFormatList = filledList.filter((value) => !CHECKER.PATTERN.test(value));
    if (badFormatList.length) problemList.push({ type: CHECKER.PROBLEM.format, text: TEXT.format.replace('{list}', formatList(badFormatList)) });
    return {
      ok: problemList.length === 0, ruleKey, count: filledList.length, problemList,
      message: problemList.map((problem) => problem.text).join(TEXT.problemSeparator)
    };
  }

  // Gumagawa ng error (code 'barcodeCheck') na may userMessage para sa screen. Ang UI ang nagpapakita ng userMessage.
  function createError(checkResult, fileName) {
    const prefix = fileName ? TEXT.prefix.replace('{file}', fileName) : TEXT.prefixNoFile;
    const error = new Error(CHECKER.ERROR_CODE);
    error.code = CHECKER.ERROR_CODE;
    error.userMessage = prefix + checkResult.message + TEXT.suffix;
    error.barcodeCheck = checkResult;
    return error;
  }

  root.barcodeChecker = Object.freeze({ check, createError });
})();
