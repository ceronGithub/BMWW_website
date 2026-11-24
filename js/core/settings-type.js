/*
 * FILE     : js/core/settings-type.js
 * PURPOSE  : Settings: toggle na "Select 1 type only" (Sender o LEAD PC), instruction card ng setup ng folder, itago ang Data source sa LEAD PC,
 *            pagbura ng lumang settings file nang hindi ginagalaw ang file ng kabilang uri, at awtomatikong full path mula sa clipboard
 * DEPENDS  : js/core/config.js, js/core/storage.js, js/core/settings-type-config.js
 * USED BY  : js/pages/settings.js (init, onSave, onPickFolder), pages/settings.html at js/templates/settings.template.js (script)
 * VERSION  : v21 | 2026-11-24 | bagong file (Batch A: Task 1, 2, 3, 4)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const SETTINGS = root.settingsTypeConfig;
  const TEXT = SETTINGS.TEXT;

  // ===== STATE =====
  let toggleElement = null;
  let noteElement = null;

  // ===== RENDER =====
  /**
   * PARA SAAN    : gumawa ng element na may class at text nang walang innerHTML
   * GINAGAWA     : createElement, ilagay ang className at textContent
   * INPUT/OUTPUT : tagName, className, text -> HTMLElement
   * TINATAWAG NG : settings-type.js renderToggle, renderGuide
   * TUMATAWAG SA : wala
   */
  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  /**
   * PARA SAAN    : ipakita ang tamang paliwanag sa ilalim ng toggle
   * GINAGAWA     : pinipili ang text ng naka-ON o naka-OFF
   * INPUT/OUTPUT : wala -> void
   * TINATAWAG NG : settings-type.js renderToggle, handleToggleChange
   * TUMATAWAG SA : wala
   */
  function renderToggleNote() {
    if (!noteElement || !toggleElement) return;
    noteElement.textContent = toggleElement.checked ? TEXT.toggleNoteOn : TEXT.toggleNoteOff;
  }

  /**
   * PARA SAAN    : gumuhit ng switch na "Select 1 type only"
   * GINAGAWA     : label + checkbox (role switch) + paliwanag; nilalagay sa #settings-type-lock
   * INPUT/OUTPUT : settings, onChange -> void
   * TINATAWAG NG : settings-type.js init
   * TUMATAWAG SA : settings-type.js makeElement, renderToggleNote, handleToggleChange
   */
  function renderToggle(settings, onChange) {
    const host = document.querySelector(SETTINGS.SELECTOR.toggleHost);
    if (!host) return;
    const row = makeElement('label', SETTINGS.CSS.switchRow);
    toggleElement = makeElement('input', SETTINGS.CSS.switchInput);
    toggleElement.type = 'checkbox';
    toggleElement.id = SETTINGS.ID.toggle;
    toggleElement.setAttribute('role', 'switch');
    toggleElement.setAttribute('aria-label', TEXT.toggleAria);
    toggleElement.checked = Boolean(settings && settings[SETTINGS.FIELD.selectOneTypeOnly]);
    const track = makeElement('span', SETTINGS.CSS.switchTrack);
    track.setAttribute('aria-hidden', 'true');
    row.append(toggleElement, track, makeElement('span', 'type-lock-text', TEXT.toggleLabel));
    noteElement = makeElement('p', 'card-note type-lock-note');
    host.replaceChildren(row, noteElement);
    renderToggleNote();
    toggleElement.addEventListener('change', () => handleToggleChange(onChange));
  }

  /**
   * PARA SAAN    : kapag ginalaw ang toggle
   * GINAGAWA     : i-update ang paliwanag at sabihan ang Settings page
   * INPUT/OUTPUT : onChange (function) -> void
   * TINATAWAG NG : click/change sa #settings-type-toggle
   * TUMATAWAG SA : settings-type.js renderToggleNote, onChange (settings.js handleTypeChange)
   */
  function handleToggleChange(onChange) {
    renderToggleNote();
    if (typeof onChange === 'function') onChange();
  }

  /**
   * PARA SAAN    : gumuhit ng card na may hakbang ng setup ng folder (saan ilalagay ang na-extract na BMWW)
   * GINAGAWA     : title, tala at nakanumerong listahan ng hakbang
   * INPUT/OUTPUT : wala -> void
   * TINATAWAG NG : settings-type.js init
   * TUMATAWAG SA : settings-type.js makeElement
   */
  function renderGuide() {
    const host = document.querySelector(SETTINGS.SELECTOR.guideHost);
    if (!host) return;
    const head = makeElement('div', 'card-head');
    const headText = makeElement('div');
    headText.append(makeElement('h2', 'card-title', TEXT.guideTitle), makeElement('p', 'card-note', TEXT.guideNote));
    head.append(headText);
    const list = makeElement('ol', SETTINGS.CSS.guideList);
    TEXT.guideStepList.forEach((step) => list.append(makeElement('li', '', step)));
    host.replaceChildren(head, list);
  }

  // ===== INIT =====
  /**
   * PARA SAAN    : simulan ang toggle at instruction card ng Settings
   * GINAGAWA     : renderToggle at renderGuide
   * INPUT/OUTPUT : settings (object), onChange (function) -> void
   * TINATAWAG NG : settings.js init, applyRestoredSettings
   * TUMATAWAG SA : settings-type.js renderToggle, renderGuide
   */
  function init(settings, onChange) {
    renderToggle(settings, onChange);
    renderGuide();
  }

  // ===== STATE (basa) =====
  /**
   * PARA SAAN    : alamin kung naka-ON ang "Select 1 type only"
   * GINAGAWA     : binabasa ang checkbox
   * INPUT/OUTPUT : wala -> boolean
   * TINATAWAG NG : settings.js applyTypeLock, onSave
   * TUMATAWAG SA : wala
   */
  function isOn() {
    return Boolean(toggleElement && toggleElement.checked);
  }

  /**
   * PARA SAAN    : alamin kung itatago ang path na ito sa napiling uri (Data source sa LEAD PC)
   * GINAGAWA     : tinitingnan kung LEAD PC ang mode at kasama ang key sa LEAD_HIDDEN_KEYS
   * INPUT/OUTPUT : key (string), mode (string) -> boolean
   * TINATAWAG NG : settings-type.js applyPathVisibility, settings.js checkAllFullPaths
   * TUMATAWAG SA : wala
   */
  function isHiddenKey(key, mode) {
    return mode === CONFIG.MACHINE_MODE.LEAD_PC && SETTINGS.LEAD_HIDDEN_KEYS.includes(key);
  }

  /**
   * PARA SAAN    : itago o ipakita ang row ng mga path ayon sa uri
   * GINAGAWA     : itinatakda ang hidden ng row; ang laman ng input ay hindi ginagalaw
   * INPUT/OUTPUT : rowMap (object ng row), mode (string) -> void
   * TINATAWAG NG : settings.js renderPaths
   * TUMATAWAG SA : settings-type.js isHiddenKey
   */
  function applyPathVisibility(rowMap, mode) {
    Object.keys(rowMap).forEach((key) => {
      rowMap[key].rowElement.hidden = isHiddenKey(key, mode);
    });
  }

  // ===== DATA =====
  /**
   * PARA SAAN    : burahin ang lumang settings file ng machine sa loob ng isang uri lang (hindi ginagalaw ang kabilang uri)
   * GINAGAWA     : binubuksan ang <path>\settings\machines\<sender|monitoring> at tinatanggal ang file; ang bagong file ay hindi binubura
   * INPUT/OUTPUT : parentHandle, fileName, mode, keepFileName -> Promise<boolean> (true kung may nabura; walang error na ibinabato)
   * TINATAWAG NG : settings-type.js removeOldFile
   * TUMATAWAG SA : storage.js getRoleFolderName, getRoleFolder
   */
  async function removeFromRole(parentHandle, fileName, mode, keepFileName) {
    if (!fileName || CONFIG.MACHINE_FILE.RESERVED_FILES.includes(fileName.toLowerCase())) return false;
    if (fileName.toLowerCase() === String(keepFileName || '').toLowerCase()) return false;
    try {
      const folder = await root.storage.getRoleFolder(parentHandle, root.storage.getRoleFolderName(mode), false);
      await folder.removeEntry(fileName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * PARA SAAN    : tamang pagbura ng lumang settings file ayon sa toggle (Task 1 at 2)
   * GINAGAWA     : ON = lumang gawi (storage.removeMachineSettings, lahat ng lumang file maliban sa bago);
   *                OFF = kapag pareho ang uri at nagpalit lang ng pangalan, buburahin ang lumang pangalan sa uri na iyon; kapag nagpalit ng uri, walang buburahin
   * INPUT/OUTPUT : parentHandle, { isSingleType, previousFile, previousMode, mode, fileName } -> Promise<boolean>
   * TINATAWAG NG : settings.js onSave, writeToServer
   * TUMATAWAG SA : storage.js removeMachineSettings, settings-type.js removeFromRole
   */
  async function removeOldFile(parentHandle, options) {
    const { isSingleType, previousFile, previousMode, mode, fileName } = options;
    if (!previousFile) return false;
    if (isSingleType) return root.storage.removeMachineSettings(parentHandle, previousFile, { mode, fileName });
    if (previousMode !== mode) return false;
    return removeFromRole(parentHandle, previousFile, mode, fileName);
  }

  /**
   * PARA SAAN    : kunin ang full path mula sa na-copy ng user (Task 4: awtomatikong full path pagkapili ng folder)
   * GINAGAWA     : binabasa ang clipboard at tinatanggap lang kung tamang path at ang dulo ay kapareho ng napiling folder; tahimik kung hindi pinayagan
   * INPUT/OUTPUT : folderName (string) -> Promise<string> (full path o '' kung wala/hindi tugma)
   * TINATAWAG NG : settings.js onPickFolder
   * TUMATAWAG SA : navigator.clipboard.readText
   */
  async function readClipboardPath(folderName) {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') return '';
    try {
      const raw = String(await navigator.clipboard.readText()).trim().replace(/^"+|"+$/g, '');
      const text = raw.replace(/[\\/]+$/, '');
      if (!text || text.length > CONFIG.FULL_PATH_MAX || !CONFIG.FULL_PATH_PATTERN.test(text)) return '';
      const parts = text.split(CONFIG.PATH_SEPARATOR).filter(Boolean);
      const lastPart = parts.length ? parts[parts.length - 1] : '';
      return lastPart.toLowerCase() === String(folderName).toLowerCase() ? text : '';
    } catch (error) {
      return '';
    }
  }

  root.settingsType = Object.freeze({ init, isOn, isHiddenKey, applyPathVisibility, removeOldFile, readClipboardPath });
})();
