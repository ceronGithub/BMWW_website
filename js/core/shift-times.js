/*
 * FILE    : js/core/shift-times.js
 * PURPOSE : Global na oras ng shift galing sa Settings (Day start/end, Night start/end); binabasa ng lahat ng page; may default at check
 * DEPENDS : js/core/config.js (window.BMWW, CONFIG.STORAGE_KEY)
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 0: global na shift sa Settings)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  // Mga constant ng shift. Ang default ay kapareho ng dating nakasulat sa master-shift-config.js at shift-freshness-config.js.
  const SHIFT_TIMES_CONFIG = Object.freeze({
    FIELD: 'shiftTimes',
    KEY_LIST: Object.freeze(['dayStart', 'dayEnd', 'nightStart', 'nightEnd']),
    DEFAULT_TIMES: Object.freeze({ dayStart: '07:30', dayEnd: '18:30', nightStart: '19:30', nightEnd: '06:30' }),
    TIME_PATTERN: /^([01]\d|2[0-3]):([0-5]\d)$/,
    ERROR: Object.freeze({ format: 'format', order: 'order' })
  });

  // 'HH:MM' -> minuto ng araw (07:30 = 450). Null kung hindi tama ang anyo.
  function parseTime(text) {
    const match = SHIFT_TIMES_CONFIG.TIME_PATTERN.exec(typeof text === 'string' ? text : '');
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  // Minuto ng araw -> 'HH:MM'.
  function formatTime(minutes) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
    const minute = String(minutes % 60).padStart(2, '0');
    return hour + ':' + minute;
  }

  // Sinusuri ang apat na oras. Ibinabalik { ok: true, minutes, times } o { ok: false, reason, keyList } (keyList = mga key na may mali).
  // Patakaran: Day start < Day end < Night start, at Night end < Day start (ang Night ay tumatawid ng hatinggabi).
  function validateTimes(timeMap) {
    const minutes = {};
    const badList = [];
    SHIFT_TIMES_CONFIG.KEY_LIST.forEach((key) => {
      const parsed = timeMap ? parseTime(timeMap[key]) : null;
      if (parsed === null) badList.push(key);
      else minutes[key] = parsed;
    });
    if (badList.length) return { ok: false, reason: SHIFT_TIMES_CONFIG.ERROR.format, keyList: badList };
    const isOrdered = minutes.dayStart < minutes.dayEnd && minutes.dayEnd < minutes.nightStart && minutes.nightEnd < minutes.dayStart;
    if (!isOrdered) return { ok: false, reason: SHIFT_TIMES_CONFIG.ERROR.order, keyList: SHIFT_TIMES_CONFIG.KEY_LIST.slice() };
    const times = {};
    SHIFT_TIMES_CONFIG.KEY_LIST.forEach((key) => { times[key] = formatTime(minutes[key]); });
    return { ok: true, minutes, times };
  }

  // Ang default na estado: { times, minutes, isDefault: true }.
  function buildDefaultState() {
    const result = validateTimes(SHIFT_TIMES_CONFIG.DEFAULT_TIMES);
    return { times: result.times, minutes: result.minutes, isDefault: true };
  }

  // Estado mula sa naka-save na settings (JSON text). Default kung wala, sira, o hindi tama ang naka-save.
  function resolveState(rawText) {
    let saved = null;
    try {
      const settings = rawText ? JSON.parse(rawText) : null;
      saved = settings && typeof settings === 'object' ? settings[SHIFT_TIMES_CONFIG.FIELD] : null;
    } catch (error) {
      saved = null;
    }
    const result = saved ? validateTimes(saved) : null;
    return result && result.ok ? { times: result.times, minutes: result.minutes, isDefault: false } : buildDefaultState();
  }

  let lastRawText = null;
  let cachedState = buildDefaultState();
  let isLoaded = false;

  // Kasalukuyang estado. Binabasa ang localStorage ng Settings at ginagamit ulit ang resulta hangga't hindi nagbabago ang laman nito.
  function getState() {
    let rawText = null;
    try {
      rawText = localStorage.getItem(root.CONFIG.STORAGE_KEY);
    } catch (error) {
      rawText = null;
    }
    if (isLoaded && rawText === lastRawText) return cachedState;
    lastRawText = rawText;
    cachedState = resolveState(rawText);
    isLoaded = true;
    return cachedState;
  }

  // Mga oras bilang minuto ng araw: { dayStart, dayEnd, nightStart, nightEnd }.
  function getMinutes() {
    return getState().minutes;
  }

  // Mga oras bilang 'HH:MM' (para sa form ng Settings).
  function getTimes() {
    return getState().times;
  }

  // Default na 'HH:MM' (para sa "Ibalik sa default").
  function getDefaultTimes() {
    return buildDefaultState().times;
  }

  root.shiftTimes = Object.freeze({ CONFIG: SHIFT_TIMES_CONFIG, parseTime, formatTime, validateTimes, getMinutes, getTimes, getDefaultTimes });
})();
