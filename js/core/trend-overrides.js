/*
 * FILE    : js/core/trend-overrides.js
 * PURPOSE : Mga Set ng user sa Trend: kung aling record ang point ng isang shift (kapalit ng pinakahuling record). Naka-save sa localStorage ng browser
 * DEPENDS : js/core/trend-config.js
 * VERSION : v9.3 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const STORAGE = root.trendConfig.STORAGE;

  // Text lang ang key at value; may limit ang dami para hindi lumaki nang walang hanggan.
  function clean(raw) {
    const result = {};
    if (!raw || typeof raw !== 'object') return result;
    Object.keys(raw).slice(0, STORAGE.OVERRIDE_MAX).forEach((slotKey) => {
      if (typeof raw[slotKey] === 'string') result[slotKey] = raw[slotKey];
    });
    return result;
  }

  // Binabasa ang lahat ng Set: { <slotKey>: <recordId> }. Walang laman kung wala o sira.
  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE.OVERRIDE_KEY);
      return raw ? clean(JSON.parse(raw)) : {};
    } catch (error) {
      return {};
    }
  }

  // Sine-save ang mga Set. Hindi kritikal kapag pumalya.
  function writeAll(map) {
    try {
      localStorage.setItem(STORAGE.OVERRIDE_KEY, JSON.stringify(clean(map)));
    } catch (error) {
      // Hindi kritikal: mawawala lang ang Set kapag nag-refresh.
    }
  }

  // Itinatakda ang record bilang point ng shift (slotKey).
  function setChoice(slotKey, recordId) {
    const map = readAll();
    map[slotKey] = recordId;
    writeAll(map);
    return map;
  }

  // Ibinabalik ang shift sa pinakahuling record.
  function clearChoice(slotKey) {
    const map = readAll();
    delete map[slotKey];
    writeAll(map);
    return map;
  }

  // Ibinabalik lahat sa pinakahuling record.
  function clearAll() {
    writeAll({});
    return {};
  }

  root.trendOverrides = Object.freeze({ readAll, setChoice, clearChoice, clearAll });
})();
