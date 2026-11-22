/*
 * FILE    : js/core/lot-validation.js
 * PURPOSE : Pagsusuri ng input ng LOT Tracking: Barcode (ginagawang uppercase) at Operator (haba at tanggap na character)
 * DEPENDS : js/core/config.js, js/core/security.js, js/core/lot-config.js
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const LOT = root.CONFIG.LOT;
  const VALIDATION = root.lotConfig.VALIDATION;
  const { sanitizeInput } = root.security;

  // Nililinis ang Barcode (trim, walang control character, limit ang haba) at ginagawang uppercase.
  function normalizeBarcode(rawValue) {
    return sanitizeInput(rawValue, LOT.BARCODE_MAX).toUpperCase();
  }

  // Nililinis ang Operator (trim, walang control character, limit ang haba).
  function normalizeOperator(rawValue) {
    return sanitizeInput(rawValue, LOT.OPERATOR_MAX);
  }

  // Valid ang Operator kung 2 hanggang 30 na character at titik, numero, espasyo, ., - o _ lang.
  function isValidOperator(operatorValue) {
    const isLengthValid = operatorValue.length >= LOT.OPERATOR_MIN && operatorValue.length <= LOT.OPERATOR_MAX;
    return isLengthValid && VALIDATION.OPERATOR_PATTERN.test(operatorValue);
  }

  root.lotValidation = Object.freeze({ normalizeBarcode, normalizeOperator, isValidOperator });
})();
