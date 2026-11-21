/*
 * FILE    : js/core/trend-limits.js
 * PURPOSE : UCL, CL, LCL ng Trend: linis ng naka-save na limits, pagbasa ng numero mula sa text, tsek ng ayos, at kung labas ba sa limit ang isang value
 * DEPENDS : js/core/trend-config.js
 * VERSION : v9.3 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const TREND = root.trendConfig;

  // Numero lang ang tinatanggap; ang iba ay null (walang limit).
  function toLimitNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  // Nililinis ang naka-save na limits: { <key>: { ucl, cl, lcl } } para sa lahat ng value ng Trend.
  function normalizeAll(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const result = {};
    TREND.METRIC_LIST.forEach((metric) => {
      const item = source[metric.key] && typeof source[metric.key] === 'object' ? source[metric.key] : {};
      result[metric.key] = { ucl: toLimitNumber(item.ucl), cl: toLimitNumber(item.cl), lcl: toLimitNumber(item.lcl) };
    });
    return result;
  }

  // Limits mula sa settings ng machine (localStorage o file).
  function getLimits(settings) {
    return normalizeAll(settings ? settings[TREND.STORAGE.LIMITS_FIELD] : null);
  }

  // Text ng input -> { ok, value }. Blangko ay ok na null; hindi numero ay ok = false.
  function parseText(text) {
    const trimmed = String(text === undefined || text === null ? '' : text).trim();
    if (trimmed === '') return { ok: true, value: null };
    if (!TREND.NUMBER_PATTERN.test(trimmed)) return { ok: false, value: null };
    const value = Number(trimmed);
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, value: null };
  }

  // Tama ba ang ayos: UCL >= CL >= LCL (ang mga naka-set lang ang sinusuri).
  function isOrdered(limit) {
    const valueList = [limit.ucl, limit.cl, limit.lcl].filter((value) => value !== null);
    for (let index = 1; index < valueList.length; index += 1) {
      if (valueList[index - 1] < valueList[index]) return false;
    }
    return true;
  }

  // May naka-set bang kahit isang limit ang value na ito?
  function hasAny(limit) {
    return limit.ucl !== null || limit.cl !== null || limit.lcl !== null;
  }

  // May naka-set bang limit sa kahit anong value ng Trend?
  function hasAnyInAll(limitMap) {
    return TREND.METRIC_LIST.some((metric) => hasAny(limitMap[metric.key]));
  }

  // 'above' kapag lampas sa UCL, 'below' kapag mababa sa LCL, 'ok' kung nasa loob; walang laman kung walang value.
  function classify(value, limit) {
    if (value === null || value === undefined) return '';
    if (limit.ucl !== null && value > limit.ucl) return TREND.POINT_STATE.above;
    if (limit.lcl !== null && value < limit.lcl) return TREND.POINT_STATE.below;
    return TREND.POINT_STATE.ok;
  }

  root.trendLimits = Object.freeze({ normalizeAll, getLimits, parseText, isOrdered, hasAny, hasAnyInAll, classify });
})();
