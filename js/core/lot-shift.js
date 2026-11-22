/*
 * FILE    : js/core/lot-shift.js
 * PURPOSE : Shift (Day/Night) at monitoring day ng LOT Tracking, ayon sa oras ng shift sa Settings; format ng petsa at oras
 * DEPENDS : js/core/lot-config.js, js/core/shift-times.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 2)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const SHIFT = root.lotConfig.SHIFT;
  const MINUTES_PER_HOUR = 60;

  // Dalawang digit na numero (hal. 5 -> 05).
  function pad(number) {
    return String(number).padStart(2, '0');
  }

  // Minuto ng araw ng isang oras (07:30 = 450).
  function getMinuteOfDay(date) {
    return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
  }

  // Day kung nasa pagitan ng simula ng Day at simula ng Night (ayon sa Settings); Night ang lahat ng iba.
  function getShift(ms) {
    const minutes = root.shiftTimes.getMinutes();
    const minuteOfDay = getMinuteOfDay(new Date(ms));
    return minuteOfDay >= minutes.dayStart && minuteOfDay < minutes.nightStart ? SHIFT.DAY : SHIFT.NIGHT;
  }

  // Monitoring day: nagpapalit sa simula ng Day shift (hindi sa hatinggabi). Ibinabalik { iso: 'yyyy-mm-dd', key: 'ddmmyyyy' }.
  function getMonitoringDay(ms) {
    const date = new Date(ms);
    const dayOffset = getMinuteOfDay(date) < root.shiftTimes.getMinutes().dayStart ? -1 : 0;
    const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset);
    const year = String(dayDate.getFullYear());
    const month = pad(dayDate.getMonth() + 1);
    const day = pad(dayDate.getDate());
    return { iso: year + '-' + month + '-' + day, key: day + month + year };
  }

  // 'yyyy-mm-dd' -> 'ddmmyyyy' (pangalan ng file). Walang laman kung hindi tama ang anyo.
  function toFileKey(isoDay) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDay));
    return parts ? parts[3] + parts[2] + parts[1] : '';
  }

  // Petsa at oras bilang yyyy-mm-dd hh:mm:ss (walang laman kung 0).
  function formatDateTime(ms) {
    if (!ms) return '';
    const date = new Date(ms);
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
      + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  root.lotShift = Object.freeze({ getShift, getMonitoringDay, toFileKey, formatDateTime });
})();
