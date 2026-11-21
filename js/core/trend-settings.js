/*
 * FILE    : js/core/trend-settings.js
 * PURPOSE : Card na "Trend limits" sa Settings: UCL, CL, LCL ng Mean Offset, Stdev, CV, Slope, Intercept, R2 (iisa para sa lahat ng cantilever)
 * DEPENDS : js/core/config.js, security.js, trend-config.js, trend-limits.js
 * VERSION : v9.3 | 2026-11-22 | bagong file; tinatawag ng js/pages/settings.js (init at onSave)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const TREND = root.trendConfig;
  const TEXT = TREND.TEXT.settings;
  const ERROR_CLASS = root.CONFIG.ROW_INPUT_CLASS.error;
  const { trendLimits } = root;
  const { sanitizeInput } = root.security;
  let inputMap = {};

  // Gumagawa ng element na may class at text (textContent lang).
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Input ng isang limit (UCL, CL o LCL) ng isang value.
  function buildInput(metric, field, onChange) {
    const input = makeElement('input', 'form-input trend-limit-input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.maxLength = TREND.LIMIT_MAX_LENGTH;
    input.id = 'trend-limit-' + metric.key + '-' + field.key;
    input.setAttribute('aria-label', metric.label + ' ' + field.label);
    input.addEventListener('input', () => {
      input.classList.remove(ERROR_CLASS);
      onChange();
    });
    return input;
  }

  // Ginagawa ang card: pamagat, tala, at table ng limits (isang row kada value).
  function init(settings, onChange) {
    const host = document.querySelector(TREND.SELECTOR.settingsCard);
    if (!host) return;
    inputMap = {};
    const limitMap = trendLimits.getLimits(settings);
    const head = makeElement('div', 'card-head');
    const headText = makeElement('div');
    headText.append(makeElement('h2', 'card-title', TEXT.title), makeElement('p', 'card-note', TEXT.note));
    head.append(headText);
    const table = makeElement('table', 'trend-limit-table');
    const headRow = makeElement('tr');
    headRow.append(makeElement('th', '', TEXT.valueColumn));
    TREND.LIMIT_FIELD_LIST.forEach((field) => headRow.append(makeElement('th', '', field.label)));
    const tableHead = makeElement('thead');
    tableHead.append(headRow);
    table.append(tableHead);
    const body = makeElement('tbody');
    TREND.METRIC_LIST.forEach((metric) => {
      const row = makeElement('tr');
      const rowHead = makeElement('th', 'trend-limit-name', metric.label);
      rowHead.scope = 'row';
      row.append(rowHead);
      inputMap[metric.key] = {};
      TREND.LIMIT_FIELD_LIST.forEach((field) => {
        const input = buildInput(metric, field, onChange);
        const saved = limitMap[metric.key][field.key];
        input.value = saved === null ? '' : String(saved);
        inputMap[metric.key][field.key] = input;
        const cell = makeElement('td');
        cell.append(input);
        row.append(cell);
      });
      body.append(row);
    });
    table.append(body);
    const wrap = makeElement('div', 'trend-limit-wrap');
    wrap.append(table);
    host.replaceChildren(head, wrap);
  }

  // Binabasa at sinusuri ang mga input. Ibinibigay { limits, error }; error ay walang laman kung tama.
  function read() {
    const limits = {};
    let firstError = '';
    Object.keys(inputMap).forEach((key) => {
      Object.keys(inputMap[key]).forEach((fieldKey) => inputMap[key][fieldKey].classList.remove(ERROR_CLASS));
    });
    for (const metric of TREND.METRIC_LIST) {
      const row = inputMap[metric.key];
      if (!row) continue;
      limits[metric.key] = {};
      for (const field of TREND.LIMIT_FIELD_LIST) {
        const parsed = trendLimits.parseText(sanitizeInput(row[field.key].value, TREND.LIMIT_MAX_LENGTH));
        if (!parsed.ok) {
          row[field.key].classList.add(ERROR_CLASS);
          row[field.key].focus({ preventScroll: false });
          return { limits: null, error: metric.label + ' ' + field.label + TEXT.invalid };
        }
        limits[metric.key][field.key] = parsed.value;
      }
      if (!trendLimits.isOrdered(limits[metric.key])) {
        TREND.LIMIT_FIELD_LIST.forEach((field) => row[field.key].classList.add(ERROR_CLASS));
        if (!firstError) firstError = metric.label + ': ' + TEXT.order;
      }
    }
    return firstError ? { limits: null, error: firstError } : { limits: trendLimits.normalizeAll(limits), error: '' };
  }

  root.trendSettings = Object.freeze({ init, read });
})();
