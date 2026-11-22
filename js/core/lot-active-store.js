/*
 * FILE    : js/core/lot-active-store.js
 * PURPOSE : Sine-save ang aktibong lote (bmww.activeLote) sa localStorage para hindi mawala kapag nag-refresh ang page
 * DEPENDS : js/core/lot-config.js, js/core/config.js, js/core/security.js
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const STORE = root.lotConfig.ACTIVE_STORE;
  const LOT = root.CONFIG.LOT;
  const { sanitizeInput } = root.security;

  // Numero bang positibo at buo.
  function isPositiveInteger(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }

  // Nililinis ang talaan ng unang nakita: numero lang ang halaga, at pinakabago lang ang itinatabi kapag sobra.
  function cleanFirstSeen(rawMap) {
    const entryList = [];
    if (rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap)) {
      Object.keys(rawMap).forEach((key) => {
        if (isPositiveInteger(rawMap[key])) entryList.push([key, rawMap[key]]);
      });
    }
    entryList.sort((first, second) => second[1] - first[1]);
    return Object.fromEntries(entryList.slice(0, STORE.MAX_FIRST_SEEN));
  }

  // Sine-save ang aktibong lote ng machine. Tahimik kung hindi makapag-save (hindi dapat tumigil ang page).
  function save(state) {
    try {
      const payload = {
        version: STORE.VERSION,
        machine: state.machine,
        barcode: state.lote.barcode,
        operator: state.lote.operator,
        startMs: state.lote.startMs,
        firstSeen: cleanFirstSeen(state.firstSeen)
      };
      window.localStorage.setItem(STORE.KEY, JSON.stringify(payload));
    } catch (error) {
      // Walang storage o puno: hindi maibabalik ang lote pagkatapos mag-refresh, pero tuloy ang trabaho.
    }
  }

  // Binabasa ang naka-save na lote. Ibinabalik { lote, firstSeen } o null kung wala, sira, o ibang machine.
  function load(machine) {
    try {
      const raw = window.localStorage.getItem(STORE.KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== STORE.VERSION || saved.machine !== machine) return null;
      const barcode = sanitizeInput(saved.barcode, LOT.BARCODE_MAX);
      const operator = sanitizeInput(saved.operator, LOT.OPERATOR_MAX);
      if (!barcode || operator.length < LOT.OPERATOR_MIN || !isPositiveInteger(saved.startMs)) return null;
      return { lote: { barcode, operator, startMs: saved.startMs, endMs: 0 }, firstSeen: cleanFirstSeen(saved.firstSeen) };
    } catch (error) {
      return null;
    }
  }

  // Binubura ang naka-save na lote (kapag natapos o na-clear).
  function clear() {
    try {
      window.localStorage.removeItem(STORE.KEY);
    } catch (error) {
      // Walang magagawa: lilipas din ang lote sa susunod na save.
    }
  }

  root.lotActiveStore = Object.freeze({ save, load, clear });
})();
