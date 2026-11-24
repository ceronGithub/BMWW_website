/*
 * FILE    : js/core/lot-watch.js
 * PURPOSE : Bantay kapag walang aktibong lote: estado ng huling tingin at ng mga unit na kilala o tinanggihan, at ang dialog na nagtatanong ng Barcode
 * DEPENDS : js/core/config.js, js/core/lot-config.js, js/core/lot-validation.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-24 | bagong file (Yugto 6)
 * NOTE    : Walang pagbabasa ng folder dito; ang page (lot-tracking.js) ang naghahanap ng file at ibinibigay ang mga row.
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const WATCH = root.lotConfig.WATCH;
  const SEL = WATCH.SELECTOR;
  const TEXT = WATCH.TEXT;

  /**
   * PARA SAAN    : gumawa ng bantay na may sariling estado
   * GINAGAWA     : tinatandaan ang oras ng huling tingin (simula = oras ng pagbukas ng page), ang mga unit na kilala na (nasa lote) at ang mga tinanggihan (Cancel)
   * INPUT/OUTPUT : startMs -> { getEarliestMs, markLooked, reset, addKnown, decline, findNewUnits }
   * TINATAWAG NG : lot-tracking.js init
   * TUMATAWAG SA : wala
   */
  function createWatcher(startMs) {
    let lastLookMs = startMs;
    const ignoredSet = new Set();

    /**
     * PARA SAAN    : susi ng unit sa listahan (hindi sensitibo sa laki ng letra)
     * GINAGAWA     : lowercase ng pangalan ng unit
     * INPUT/OUTPUT : unitName -> text
     * TINATAWAG NG : addKnown, decline, findNewUnits
     * TUMATAWAG SA : wala
     */
    function toKey(unitName) {
      return String(unitName).toLowerCase();
    }

    /**
     * PARA SAAN    : pinakamaagang oras ng file na hahanapin
     * GINAGAWA     : huling tingin - START_TOLERANCE_MS (kapareho ng RESULT ng lote)
     * INPUT/OUTPUT : wala -> ms
     * TINATAWAG NG : lot-tracking.js watchTick
     * TUMATAWAG SA : wala
     */
    function getEarliestMs() {
      return lastLookMs - CONFIG.LOT.START_TOLERANCE_MS;
    }

    /**
     * PARA SAAN    : itala ang oras ng huling tingin
     * GINAGAWA     : hindi umaatras (ang mas lumang oras ay hindi pinapalitan)
     * INPUT/OUTPUT : ms -> wala
     * TINATAWAG NG : lot-tracking.js watchTick
     * TUMATAWAG SA : wala
     */
    function markLooked(ms) {
      if (ms > lastLookMs) lastLookMs = ms;
    }

    /**
     * PARA SAAN    : ibalik ang huling tingin sa isang oras (pagkatapos ng END o NEW LOTE)
     * GINAGAWA     : itinatakda ang huling tingin sa ms, para hindi itanong ang mga file ng natapos na lote
     * INPUT/OUTPUT : ms -> wala
     * TINATAWAG NG : lot-tracking.js endLote, onNewLote
     * TUMATAWAG SA : wala
     */
    function reset(ms) {
      lastLookMs = ms;
    }

    /**
     * PARA SAAN    : itala ang mga unit na kilala na (nasa lote o natanong na) para hindi itanong
     * GINAGAWA     : idinadagdag sa listahan; ang walang pangalan ay nilalaktawan
     * INPUT/OUTPUT : string[] -> wala
     * TINATAWAG NG : lot-tracking.js refreshResults, watchTick
     * TUMATAWAG SA : lot-watch.js toKey
     */
    function addKnown(unitNameList) {
      unitNameList.forEach((name) => { if (name) ignoredSet.add(toKey(name)); });
    }

    /**
     * PARA SAAN    : itala na tinanggihan ang mga unit (Cancel) para hindi na itanong
     * GINAGAWA     : kapareho ng addKnown; hiwalay ang pangalan para malinaw ang layunin
     * INPUT/OUTPUT : string[] -> wala
     * TINATAWAG NG : lot-tracking.js watchTick (Cancel sa dialog), cancelOperator (Esc), onNewLote
     * TUMATAWAG SA : lot-watch.js addKnown
     */
    function decline(unitNameList) {
      addKnown(unitNameList);
    }

    /**
     * PARA SAAN    : piliin ang mga unit na bago at hindi pa natatanong
     * GINAGAWA     : sinasala ang mga row na may pangalan ng unit na wala sa listahan ng kilala o tinanggihan
     * INPUT/OUTPUT : rowList (galing sa lotUnitCollector.collectUnits) -> row[]
     * TINATAWAG NG : lot-tracking.js watchTick
     * TUMATAWAG SA : lot-watch.js toKey
     */
    function findNewUnits(rowList) {
      return rowList.filter((row) => row.unitName && !ignoredSet.has(toKey(row.unitName)));
    }

    return Object.freeze({ getEarliestMs, markLooked, reset, addKnown, decline, findNewUnits });
  }

  /**
   * PARA SAAN    : hanapin ang elemento ng dialog
   * GINAGAWA     : document.querySelector ayon sa susi ng WATCH.SELECTOR
   * INPUT/OUTPUT : key -> Element | null
   * TINATAWAG NG : lot-watch.js askBarcode
   * TUMATAWAG SA : wala
   */
  function query(key) {
    return document.querySelector(SEL[key]);
  }

  /**
   * PARA SAAN    : ilista ang mga pangalan ng unit para sa dialog
   * GINAGAWA     : hanggang UNIT_SHOW_MAX na pangalan, at "at n pa" kung marami
   * INPUT/OUTPUT : string[] -> text
   * TINATAWAG NG : lot-watch.js askBarcode
   * TUMATAWAG SA : wala
   */
  function describeUnits(unitNameList) {
    const shown = unitNameList.slice(0, WATCH.UNIT_SHOW_MAX).join(', ');
    const rest = unitNameList.length - WATCH.UNIT_SHOW_MAX;
    return TEXT.found + shown + (rest > 0 ? TEXT.more.replace('{n}', String(rest)) : '');
  }

  /**
   * PARA SAAN    : itanong ang Barcode kapag may bagong file na walang aktibong lote
   * GINAGAWA     : binubuksan ang <dialog>; Enter o OK = tanggapin (uppercase, bawal ang walang laman); Cancel o Esc = tanggihan
   * INPUT/OUTPUT : unitNameList -> Promise<{ isCancelled, barcode }>
   * TINATAWAG NG : lot-tracking.js watchTick
   * TUMATAWAG SA : lot-watch.js query, describeUnits, lotValidation.normalizeBarcode
   */
  function askBarcode(unitNameList) {
    const dialog = query('dialog');
    const cancelled = { isCancelled: true, barcode: '' };
    if (!dialog || typeof dialog.showModal !== 'function') return Promise.resolve(cancelled);
    const barcodeInput = query('barcode');
    const errorBox = query('error');
    query('units').textContent = describeUnits(unitNameList);
    barcodeInput.value = '';
    barcodeInput.maxLength = CONFIG.LOT.BARCODE_MAX;
    errorBox.textContent = '';
    let result = cancelled;
    return new Promise((resolve) => {
      /**
       * PARA SAAN    : tanggapin ang OK o ang Enter sa Barcode
       * GINAGAWA     : nililinis ang Barcode (uppercase); kapag walang laman, may mensahe at bukas pa; kapag tama, isinasara ang dialog
       * INPUT/OUTPUT : event click sa #lot-watch-ok o keydown Enter sa #lot-watch-barcode -> wala
       * TINATAWAG NG : event click sa #lot-watch-ok, keydown sa #lot-watch-barcode
       * TUMATAWAG SA : lotValidation.normalizeBarcode
       */
      function onOk() {
        const barcode = root.lotValidation.normalizeBarcode(barcodeInput.value);
        if (!barcode) { errorBox.textContent = TEXT.barcodeEmpty; barcodeInput.focus(); return; }
        result = { isCancelled: false, barcode };
        dialog.close('ok');
      }
      /**
       * PARA SAAN    : tanggapin ang Enter sa Barcode input
       * GINAGAWA     : Enter = OK (hindi habang nagko-compose ng IME)
       * INPUT/OUTPUT : event keydown -> wala
       * TINATAWAG NG : event keydown sa #lot-watch-barcode
       * TUMATAWAG SA : lot-watch.js onOk
       */
      function onKeydown(event) {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        onOk();
      }
      /**
       * PARA SAAN    : tanggapin ang Cancel
       * GINAGAWA     : isinasara ang dialog na walang Barcode
       * INPUT/OUTPUT : event click sa #lot-watch-cancel -> wala
       * TINATAWAG NG : event click sa #lot-watch-cancel
       * TUMATAWAG SA : wala
       */
      function onCancel() {
        dialog.close('cancel');
      }
      /**
       * PARA SAAN    : tapusin ang tanong kapag nagsara ang dialog (OK, Cancel o Esc)
       * GINAGAWA     : tinatanggal ang mga listener at ibinabalik ang resulta; ang Esc ay Cancel
       * INPUT/OUTPUT : event close sa dialog -> wala
       * TINATAWAG NG : event close sa #lot-watch-dialog
       * TUMATAWAG SA : wala
       */
      function onClose() {
        query('ok').removeEventListener('click', onOk);
        query('cancel').removeEventListener('click', onCancel);
        barcodeInput.removeEventListener('keydown', onKeydown);
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'ok' ? result : cancelled);
      }
      query('ok').addEventListener('click', onOk);
      query('cancel').addEventListener('click', onCancel);
      barcodeInput.addEventListener('keydown', onKeydown);
      dialog.addEventListener('close', onClose);
      dialog.returnValue = '';
      dialog.showModal();
      barcodeInput.focus();
    });
  }

  root.lotWatch = Object.freeze({ createWatcher, askBarcode });
})();
