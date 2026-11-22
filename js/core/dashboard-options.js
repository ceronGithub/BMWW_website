/*
 * FILE    : js/core/dashboard-options.js
 * PURPOSE : Opsyon ng Dashboard: checkbox kung ipapakita ang Master Repeatability at Calibration Repeatability sa tile (opsyonal; default naka-OFF). Naka-save sa localStorage.
 * DEPENDS : js/core/calibration-tile-config.js
 * INPUT   : localStorage key bmww.dashboardOptions
 * OUTPUT  : get() = { masterRepeatability, calibrationRepeatability } (boolean); mount() = mga checkbox sa #dm-options (textContent lang)
 * VERSION : v12 | 2026-11-22 | bagong file (Task 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const SETTING = root.calibrationTileConfig.OPTION;
  const TEXT = root.calibrationTileConfig.TEXT.option;

  // Binabasa ang naka-save na opsyon; default kapag walang laman o sira ang data.
  function get() {
    const result = Object.assign({}, SETTING.DEFAULT);
    try {
      const saved = JSON.parse(window.localStorage.getItem(SETTING.STORAGE_KEY) || '{}');
      SETTING.FIELD_LIST.forEach((field) => { if (typeof saved[field] === 'boolean') result[field] = saved[field]; });
    } catch (error) {
      // walang storage o sirang data: default ang gagamitin
    }
    return result;
  }

  // Sine-save ang opsyon; tahimik kung hindi maisulat.
  function save(options) {
    try {
      window.localStorage.setItem(SETTING.STORAGE_KEY, JSON.stringify(options));
    } catch (error) {
      // hindi maisulat: umiiral lang ang pagbabago hanggang isara ang page
    }
  }

  // Isang checkbox na may label.
  function buildCheckbox(field, isChecked, onChange) {
    const label = document.createElement('label');
    label.className = 'dm-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = isChecked;
    input.addEventListener('change', () => {
      const next = get();
      next[field] = input.checked;
      save(next);
      onChange(next);
    });
    const text = document.createElement('span');
    text.textContent = TEXT[field];
    label.append(input, text);
    return label;
  }

  // Inilalagay ang mga checkbox sa container; tinatawag ang onChange(options) kapag may binago.
  function mount(container, onChange) {
    if (!container) return;
    const options = get();
    const legend = document.createElement('span');
    legend.className = 'dm-options-legend';
    legend.textContent = TEXT.legend;
    container.replaceChildren(legend, ...SETTING.FIELD_LIST.map((field) => buildCheckbox(field, options[field], onChange)));
  }

  root.dashboardOptions = Object.freeze({ get, mount });
})();
