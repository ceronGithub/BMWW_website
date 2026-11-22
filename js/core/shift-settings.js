/*
 * FILE    : js/core/shift-settings.js
 * PURPOSE : Card na "Shift" sa Settings: Day start/end at Night start/end (global na oras ng shift)
 * DEPENDS : js/core/config.js, js/core/shift-times.js, js/core/shift-settings-config.js
 * VERSION : v1 | 2026-11-22 | bagong file; tinatawag ng js/pages/settings.js (init at onSave), kapareho ng trend-settings.js
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const SETTINGS = root.shiftSettingsConfig;
  const TEXT = SETTINGS.TEXT;
  const TIMES = root.shiftTimes;
  const ERROR_CLASS = root.CONFIG.ROW_INPUT_CLASS.error;
  let inputMap = {};

  // Gumagawa ng element na may class at text (textContent lang).
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Isang field ng oras: label at input na type time.
  function buildField(field, value, onChange) {
    const group = makeElement('div', 'form-group');
    const inputId = SETTINGS.INPUT_ID_PREFIX + field.key;
    const label = makeElement('label', 'form-label', field.label);
    label.htmlFor = inputId;
    const input = makeElement('input', 'form-input shift-time-input');
    input.type = 'time';
    input.id = inputId;
    input.step = 60;
    input.value = value;
    input.addEventListener('input', () => {
      input.classList.remove(ERROR_CLASS);
      onChange();
    });
    inputMap[field.key] = input;
    group.append(label, input);
    return group;
  }

  // Ginagawa ang card: pamagat, tala, apat na oras at button na Ibalik sa default.
  function init(settings, onChange) {
    const host = document.querySelector(SETTINGS.SELECTOR.card);
    if (!host) return;
    inputMap = {};
    const savedTimes = settings && settings[TIMES.CONFIG.FIELD];
    const validation = savedTimes ? TIMES.validateTimes(savedTimes) : null;
    const timeMap = validation && validation.ok ? validation.times : TIMES.getDefaultTimes();
    const head = makeElement('div', 'card-head');
    const headText = makeElement('div');
    headText.append(makeElement('h2', 'card-title', TEXT.title), makeElement('p', 'card-note', TEXT.note));
    head.append(headText);
    const grid = makeElement('div', 'shift-time-grid');
    SETTINGS.FIELD_LIST.forEach((field) => grid.append(buildField(field, timeMap[field.key], onChange)));
    const resetButton = makeElement('button', 'btn btn-secondary shift-time-reset', TEXT.resetButton);
    resetButton.type = 'button';
    resetButton.addEventListener('click', () => {
      const defaultMap = TIMES.getDefaultTimes();
      SETTINGS.FIELD_LIST.forEach((field) => {
        inputMap[field.key].value = defaultMap[field.key];
        inputMap[field.key].classList.remove(ERROR_CLASS);
      });
      onChange();
    });
    host.replaceChildren(head, grid, resetButton);
  }

  // Binabasa at sinusuri ang mga input. Ibinibigay { times, error }; error ay walang laman kung tama.
  function read() {
    const timeMap = {};
    SETTINGS.FIELD_LIST.forEach((field) => {
      const input = inputMap[field.key];
      if (!input) return;
      input.classList.remove(ERROR_CLASS);
      timeMap[field.key] = input.value;
    });
    if (!Object.keys(inputMap).length) return { times: null, error: '' };
    const result = TIMES.validateTimes(timeMap);
    if (result.ok) return { times: result.times, error: '' };
    result.keyList.forEach((key) => { if (inputMap[key]) inputMap[key].classList.add(ERROR_CLASS); });
    const firstKey = result.keyList.find((key) => inputMap[key]);
    if (firstKey) inputMap[firstKey].focus({ preventScroll: false });
    return { times: null, error: result.reason === TIMES.CONFIG.ERROR.format ? TEXT.format : TEXT.order };
  }

  root.shiftSettings = Object.freeze({ init, read });
})();
