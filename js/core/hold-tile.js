/*
 * FILE    : js/core/hold-tile.js
 * PURPOSE : ON HOLD block sa tile ng Dashboard. Sender: binabasa ang <Saving path>\onhold (sariling machine). LEAD PC: binabasa ang <Server path>\onhold at hinahati kada machine. Basa lang.
 * DEPENDS : js/core/hold-tile-config.js, js/core/lot-config.js, js/core/lot-hold-config.js, js/core/lot-hold-store.js
 * USED BY : js/pages/dashboard-machines.js
 * VERSION : v1 | 2026-11-24 | bagong file (Task 1B)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const TILE = root.holdTileConfig;
  const CLASS = TILE.CLASS;
  const TEXT = TILE.TEXT;

  // Elemento na may class at text (textContent lang, galing sa file ang laman kaya hindi innerHTML).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Oras bilang hh:mm (walang laman kung 0).
  function formatClock(ms) {
    if (!ms) return '';
    const date = new Date(ms);
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  /**
   * PARA SAAN    : listahan ng hold ng sariling machine (Sender)
   * GINAGAWA     : binabasa ang <Saving path>\onhold at kinukuha ang may Machine na kapareho ng machineName; kung hindi nasuri, walang laman
   * INPUT/OUTPUT : machineName -> Promise<holdList[]> (pinakabago muna)
   * TINATAWAG NG : dashboard-machines.js refresh (Sender)
   * TUMATAWAG SA : lotHoldStore.list('saving')
   */
  async function readOwn(machineName) {
    try {
      const result = await root.lotHoldStore.list('saving');
      const key = String(machineName).toLowerCase();
      return result.holdList.filter((item) => item.machine.toLowerCase() === key).sort((first, second) => second.timeMs - first.timeMs);
    } catch (error) {
      return [];
    }
  }

  /**
   * PARA SAAN    : ilagay ang listahan ng hold sa bawat machine item ng LEAD PC
   * GINAGAWA     : binabasa ang <Server path>\onhold, hinahati kada Machine, at nilalagay sa item.holdList (walang laman kung wala)
   * INPUT/OUTPUT : machineItemList (binabago ang bawat item) -> Promise<void>
   * TINATAWAG NG : dashboard-machines.js renderLead
   * TUMATAWAG SA : lotHoldStore.list('server')
   */
  async function attachToItems(machineItemList) {
    const groupMap = new Map();
    try {
      const result = await root.lotHoldStore.list('server');
      result.holdList.forEach((item) => {
        const key = item.machine.toLowerCase();
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push(item);
      });
    } catch (error) {
      // Hindi nabasa: walang hold na ipapakita.
    }
    machineItemList.forEach((item) => {
      item.holdList = (groupMap.get(item.machineName.toLowerCase()) || []).sort((first, second) => second.timeMs - first.timeMs);
    });
  }

  /**
   * PARA SAAN    : block ng ON HOLD sa tile
   * GINAGAWA     : label at bilang; kung may hold, listahan ng LOT Unit, Barcode, dahilan at oras (hanggang MAX_SHOWN)
   * INPUT/OUTPUT : holdList (o null) -> Element
   * TINATAWAG NG : dashboard-machines.js buildTileBlocks
   * TUMATAWAG SA : wala
   */
  function buildBlock(holdList) {
    const list = Array.isArray(holdList) ? holdList : [];
    const box = createElementWith('div', CLASS.box + ' ' + (list.length > 0 ? CLASS.hold : CLASS.clear));
    const row = createElementWith('div', CLASS.row);
    row.append(createElementWith('span', 'dm-correl-label', TEXT.label), createElementWith('span', CLASS.badge, String(list.length)));
    box.append(row);
    if (list.length === 0) {
      box.append(createElementWith('p', 'card-note', TEXT.none));
      return box;
    }
    const itemList = createElementWith('ul', CLASS.list);
    list.slice(0, TILE.MAX_SHOWN).forEach((hold) => {
      const item = createElementWith('li', CLASS.item);
      const reasonText = hold.reason ? (TEXT.reason[hold.reason] || hold.reason) : TEXT.manual;
      item.append(createElementWith('span', CLASS.unit, hold.lotUnit), createElementWith('span', CLASS.meta, TEXT.barcode + hold.barcode + ' | ' + reasonText + (hold.timeMs ? ' | ' + formatClock(hold.timeMs) : '')));
      itemList.append(item);
    });
    box.append(itemList);
    if (list.length > TILE.MAX_SHOWN) box.append(createElementWith('p', 'card-note', TEXT.more.replace('{n}', String(list.length - TILE.MAX_SHOWN))));
    return box;
  }

  root.holdTile = Object.freeze({ readOwn, attachToItems, buildBlock });
})();
