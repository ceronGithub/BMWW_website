/*
 * FILE    : js/core/barcode-checker-config.js
 * PURPOSE : Constants ng barcode checker: tamang bilang ng barcode (Master 15, Calibration 27 hanggang 30), anyo ng barcode at text ng mensahe
 * DEPENDS : js/core/config.js
 * VERSION : v23 | 2026-11-24 | bagong file (Batch C: ERRORS.txt Task 11 at 12)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.barcodeCheckerConfig = Object.freeze({
    // Tamang bilang ng barcode kada record. min = max ay eksaktong bilang.
    RULE: Object.freeze({
      master: Object.freeze({ label: 'Master', min: 15, max: 15 }),
      calibration: Object.freeze({ label: 'Calibration', min: 27, max: 30 })
    }),
    // Tanggap na anyo ng isang barcode: walang espasyo at walang , ; " ' < > (karaniwang tanda ng nagdikit o nasirang cell).
    PATTERN: /^[^\s,;"'<>]+$/,
    // Ilang halimbawa lang ang ilalagay sa mensahe.
    LIST_LIMIT: 5,
    ERROR_CODE: 'barcodeCheck',
    PROBLEM: Object.freeze({ count: 'count', blank: 'blank', duplicate: 'duplicate', format: 'format' }),
    TEXT: Object.freeze({
      count: '{found} ang nabasang barcode, dapat {expected}',
      blank: 'may {n} blangkong barcode (slot {list})',
      duplicate: 'may dobleng barcode: {list}',
      format: 'may barcode na mali ang anyo: {list}',
      expectedRange: '{min} hanggang {max}',
      more: ' at iba pa',
      listSeparator: ', ',
      problemSeparator: '; ',
      prefix: 'Hindi tinuloy ang pagbasa ng {file}: ',
      prefixNoFile: 'Hindi tinuloy ang pagbasa: ',
      suffix: '. Suriin ang file para maiwasan ang maling basa ng data.',
      rejectedNote: ' file ang nilaktawan dahil mali ang barcode: '
    })
  });
})();
