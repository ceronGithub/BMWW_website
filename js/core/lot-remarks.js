/*
 * FILE    : js/core/lot-remarks.js
 * PURPOSE : Remarks ng LOT Unit: dialog na may 9 na opsyon, check ng Manual input, at talaan ng mga unit na natanong na
 * DEPENDS : js/core/security.js, js/core/lot-config.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 3)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const REMARKS = root.lotConfig.REMARKS;
  const SEL = REMARKS.SELECTOR;
  const TEXT = REMARKS.TEXT;
  const ASKED = REMARKS.ASKED_STORE;
  const { sanitizeInput } = root.security;

  /**
   * PARA SAAN    : hanapin ang elemento ng dialog
   * GINAGAWA     : document.querySelector ayon sa susi ng REMARKS.SELECTOR
   * INPUT/OUTPUT : key -> Element | null
   * TINATAWAG NG : lot-remarks.js ask
   * TUMATAWAG SA : wala
   */
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  /**
   * PARA SAAN    : suriin ang Manual input
   * GINAGAWA     : nililinis (trim, walang control character, hanggang MANUAL_MAX); bawal ang walang laman at ang unang letra na =, +, - o @
   * INPUT/OUTPUT : text -> { isValid, value, error }
   * TINATAWAG NG : lot-remarks.js ask (click sa OK)
   * TUMATAWAG SA : security.sanitizeInput
   */
  function validateManual(rawText) {
    const value = sanitizeInput(rawText, REMARKS.MANUAL_MAX);
    if (!value) return { isValid: false, value, error: TEXT.manualEmpty };
    if (REMARKS.FORBIDDEN_FIRST.includes(value.charAt(0))) return { isValid: false, value, error: TEXT.manualForbidden };
    return { isValid: true, value, error: '' };
  }

  /**
   * PARA SAAN    : ilagay ang 9 na opsyon sa dialog
   * GINAGAWA     : gumagawa ng radio at label kada opsyon (textContent lang, walang innerHTML)
   * INPUT/OUTPUT : container Element -> wala
   * TINATAWAG NG : lot-remarks.js ask
   * TUMATAWAG SA : wala
   */
  function renderOptions(container) {
    const fragment = document.createDocumentFragment();
    REMARKS.OPTION_LIST.forEach((option, index) => {
      const label = document.createElement('label');
      label.className = 'lot-remarks-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = REMARKS.RADIO_NAME;
      radio.value = option.key;
      label.append(radio, document.createTextNode((index + 1) + '. ' + option.label));
      fragment.append(label);
    });
    container.replaceChildren(fragment);
  }

  /**
   * PARA SAAN    : itanong ang Remarks ng isang LOT Unit sa sariling dialog (hindi window.prompt)
   * GINAGAWA     : binubuksan ang <dialog>, hinihintay ang OK o Cancel (Esc ay Cancel), at ibinabalik ang pinili
   * INPUT/OUTPUT : unitName -> Promise<{ isCancelled, key, type, text }>; text = label ng opsyon o ang Manual input
   * TINATAWAG NG : lot-tracking.js askPendingRemarks
   * TUMATAWAG SA : lot-remarks.js query, renderOptions, validateManual
   */
  function ask(unitName) {
    const dialog = query('dialog');
    const cancelled = { isCancelled: true, key: '', type: '', text: '' };
    if (!dialog || typeof dialog.showModal !== 'function') return Promise.resolve(cancelled);
    const optionBox = query('options');
    const manualInput = query('manual');
    const errorBox = query('error');
    query('unit').textContent = TEXT.unitLabel + unitName;
    renderOptions(optionBox);
    manualInput.value = '';
    manualInput.maxLength = REMARKS.MANUAL_MAX;
    manualInput.disabled = true;
    errorBox.textContent = '';
    let result = cancelled;
    return new Promise((resolve) => {
      /**
       * PARA SAAN    : kunin ang napiling opsyon
       * GINAGAWA     : hinahanap ang radio na checked at ang kaukulang opsyon sa config
       * INPUT/OUTPUT : wala -> opsyon | null
       * TINATAWAG NG : onOk
       * TUMATAWAG SA : wala
       */
      function getChosenOption() {
        const radio = optionBox.querySelector('input[type="radio"]:checked');
        return radio ? REMARKS.OPTION_LIST.find((option) => option.key === radio.value) || null : null;
      }
      /**
       * PARA SAAN    : buksan o isara ang Manual input ayon sa napiling opsyon
       * GINAGAWA     : enabled lang ang Manual input kapag Manual input ang napili
       * INPUT/OUTPUT : event change sa #lot-remarks-options -> wala
       * TINATAWAG NG : event change sa #lot-remarks-options
       * TUMATAWAG SA : getChosenOption
       */
      function onChange() {
        const option = getChosenOption();
        const isManual = Boolean(option) && option.type === 'manual';
        manualInput.disabled = !isManual;
        errorBox.textContent = '';
        if (isManual) manualInput.focus();
      }
      /**
       * PARA SAAN    : tanggapin ang OK
       * GINAGAWA     : sinusuri ang pinili; kapag mali, may mensahe at nananatiling bukas; kapag tama, isinasara ang dialog
       * INPUT/OUTPUT : event click sa #lot-remarks-ok -> wala
       * TINATAWAG NG : event click sa #lot-remarks-ok
       * TUMATAWAG SA : getChosenOption, validateManual
       */
      function onOk() {
        const option = getChosenOption();
        if (!option) { errorBox.textContent = TEXT.chooseFirst; return; }
        let text = option.label;
        if (option.type === 'manual') {
          const checked = validateManual(manualInput.value);
          if (!checked.isValid) { errorBox.textContent = checked.error; manualInput.focus(); return; }
          text = checked.value;
        }
        result = { isCancelled: false, key: option.key, type: option.type, text };
        dialog.close('ok');
      }
      /**
       * PARA SAAN    : tanggapin ang Cancel
       * GINAGAWA     : isinasara ang dialog na walang Remarks
       * INPUT/OUTPUT : event click sa #lot-remarks-cancel -> wala
       * TINATAWAG NG : event click sa #lot-remarks-cancel
       * TUMATAWAG SA : wala
       */
      function onCancel() {
        dialog.close('cancel');
      }
      /**
       * PARA SAAN    : tapusin ang tanong kapag nagsara ang dialog (OK, Cancel o Esc)
       * GINAGAWA     : tinatanggal ang mga listener at ibinabalik ang resulta; ang Esc ay Cancel
       * INPUT/OUTPUT : event close sa dialog -> wala
       * TINATAWAG NG : event close sa #lot-remarks-dialog
       * TUMATAWAG SA : wala
       */
      function onClose() {
        optionBox.removeEventListener('change', onChange);
        query('ok').removeEventListener('click', onOk);
        query('cancel').removeEventListener('click', onCancel);
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'ok' ? result : cancelled);
      }
      optionBox.addEventListener('change', onChange);
      query('ok').addEventListener('click', onOk);
      query('cancel').addEventListener('click', onCancel);
      dialog.addEventListener('close', onClose);
      dialog.returnValue = '';
      dialog.showModal();
    });
  }

  /**
   * PARA SAAN    : basahin ang talaan ng mga unit na natanong na ng isang lote
   * GINAGAWA     : binabasa ang localStorage; ibang lote o sirang data = walang laman
   * INPUT/OUTPUT : loteKey -> string[] (pangalan ng unit)
   * TINATAWAG NG : lot-remarks.js isAsked, markAsked
   * TUMATAWAG SA : wala
   */
  function loadAsked(loteKey) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(ASKED.KEY) || 'null');
      if (!saved || saved.version !== ASKED.VERSION || saved.loteKey !== loteKey || !Array.isArray(saved.unitList)) return [];
      return saved.unitList.filter((name) => typeof name === 'string').slice(0, ASKED.MAX_UNITS);
    } catch (error) {
      return [];
    }
  }

  /**
   * PARA SAAN    : natanong na ba ang unit na ito (OK man o Cancel)
   * GINAGAWA     : tinitingnan ang talaan ng lote
   * INPUT/OUTPUT : (loteKey, unitName) -> bool
   * TINATAWAG NG : lot-tracking.js askPendingRemarks
   * TUMATAWAG SA : lot-remarks.js loadAsked
   */
  function isAsked(loteKey, unitName) {
    return loadAsked(loteKey).includes(unitName);
  }

  /**
   * PARA SAAN    : itala na natanong na ang unit (para hindi maulit)
   * GINAGAWA     : idinadagdag sa talaan ng lote sa localStorage; ang talaan ng ibang lote ay napapalitan
   * INPUT/OUTPUT : (loteKey, unitName) -> wala
   * TINATAWAG NG : lot-tracking.js askPendingRemarks
   * TUMATAWAG SA : lot-remarks.js loadAsked
   */
  function markAsked(loteKey, unitName) {
    const unitList = loadAsked(loteKey);
    if (!unitList.includes(unitName)) unitList.push(unitName);
    try {
      window.localStorage.setItem(ASKED.KEY, JSON.stringify({ version: ASKED.VERSION, loteKey, unitList: unitList.slice(-ASKED.MAX_UNITS) }));
    } catch (error) {
      // Hindi masulat ang localStorage: ang unit ay maaaring itanong ulit pagkatapos mag-refresh.
    }
  }

  root.lotRemarks = Object.freeze({ ask, validateManual, isAsked, markAsked });
})();
