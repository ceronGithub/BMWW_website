/*
 * FILE    : js/core/shift-freshness.js
 * PURPOSE : Tinitingnan kung ang data ay galing sa nakaraang shift (Day 7:30 AM / Night 7:30 PM), naglalagay ng OUTDATED badge sa block, at nagbabantay ng pagpalit ng shift
 * DEPENDS : js/core/shift-freshness-config.js, css/pages/shift-freshness.css
 * INPUT   : oras ng data (ms, galing sa modifiedMs ng file), oras ngayon (ms)
 * OUTPUT  : mga elemento (textContent lang); walang error na itinatapon
 * VERSION : v11 | 2026-11-22 | bagong file (Task 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const FRESH = root.shiftFreshnessConfig;
  const TEXT = FRESH.TEXT;

  // Ang shift ng isang oras (ms): { name, startMs }. startMs = simula ng shift na iyon (ang Night na 12:00 AM hanggang 7:29 AM ay nagsimula noong nakaraang gabi).
  function getShiftAt(timeMs) {
    const date = new Date(timeMs);
    const minute = date.getHours() * 60 + date.getMinutes();
    const dayStart = FRESH.SHIFT.day.startMinute;
    const nightStart = FRESH.SHIFT.night.startMinute;
    const make = (shift, dayOffset) => ({
      name: shift.name,
      startMs: new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, Math.floor(shift.startMinute / 60), shift.startMinute % 60).getTime()
    });
    if (minute >= nightStart) return make(FRESH.SHIFT.night, 0);
    if (minute >= dayStart) return make(FRESH.SHIFT.day, 0);
    return make(FRESH.SHIFT.night, -1);
  }

  // Galing ba sa nakaraang shift ang data? Walang oras = hindi outdated (walang data na ime-mark).
  function isOutdated(dataMs, nowMs) {
    if (!dataMs || Number.isNaN(dataMs)) return false;
    return dataMs < getShiftAt(nowMs).startMs;
  }

  // Maikling paglalarawan ng shift ng data: { shift, date } hal. Day, Nov 22.
  function describeShift(dataMs) {
    const shift = getShiftAt(dataMs);
    return { shift: shift.name, date: new Date(shift.startMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  }

  // Inilalagay ang OUTDATED badge at note sa block kapag galing sa nakaraang shift. Ibinibigay ang parehong block.
  function mark(block, dataMs, nowMs) {
    if (!block || !(block instanceof Element) || !isOutdated(dataMs, nowMs)) return block;
    const info = describeShift(dataMs);
    block.classList.add(FRESH.CLASS.block);
    const badge = document.createElement('p');
    badge.className = FRESH.CLASS.badge;
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-label', TEXT.aria);
    const label = document.createElement('span');
    label.className = 'sf-badge-label';
    label.textContent = '\u26A0 ' + TEXT.badge;
    const note = document.createElement('span');
    note.className = 'sf-badge-note';
    note.textContent = TEXT.note.replace('{shift}', info.shift).replace('{date}', info.date);
    badge.append(label, note);
    block.prepend(badge);
    return block;
  }

  // Binabantayan ang pagpalit ng shift. Tinatawag ang onChange(shift) kapag nagbago. Ibinibigay ang function na pangtigil.
  function watch(onChange) {
    let currentStart = getShiftAt(Date.now()).startMs;
    const check = () => {
      const next = getShiftAt(Date.now());
      if (next.startMs === currentStart) return;
      currentStart = next.startMs;
      onChange(next);
    };
    const timerId = window.setInterval(check, FRESH.WATCH_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', check);
    };
  }

  root.shiftFreshness = Object.freeze({ getShiftAt, isOutdated, describeShift, mark, watch });
})();
