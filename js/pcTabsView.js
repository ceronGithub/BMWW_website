/**
 * FILE: js/pcTabsView.js
 * ANO ITO: Ang UI ng listahan ng mga PC: mga tab, PC ROLE dropdown, mga IP row sa PC'S card,
 *          at ang Add PC dialog.
 * GINAGAWA: Nagpapakita at nakikinig sa click. Walang business logic: ang pagdagdag ng PC,
 *           pag-save, at pag-switch ng screen ay ginagawa ng main.js (sa pamamagitan ng handlers).
 * INPUT:   initPcTabsView(handlers) isang beses; renderPcTabsView(registry, activePcId, newPcId) kada pagbabago.
 *          handlers = { onSelectPc(pcId), onAddPcRequest(type, ip) -> {ok, messageKey}, onIpChange(pcId, ip) }
 * OUTPUT:  binabago ang DOM lang.
 * TANDAAN: Ang tab, dropdown option, at IP row ay sumusunod sa pagkakasunod ng registry, kaya ang
 *          bagong LEAD ay laging nasa ilalim ng huling LEAD, at ang bagong MWW sa ilalim ng huling MWW.
 */
import { CONFIG } from "./config.js";
import { buildIpLabel, buildRoleOptions } from "./pcRegistryLogic.js";
import { validateNewPc } from "./NewPcValidation.js";
import { detectSqlInjection } from "./sqlInjectionDetector.js";

const selectors = CONFIG.SELECTORS;
const cssClasses = CONFIG.CSS_CLASSES;

// huling ligtas na laman ng bawat IP input (para maibalik kapag may maling character)
const lastSafeIpValues = new WeakMap();

/**
 * initPcTabsView
 * Isang beses lang: inilalagay ang laman ng Add PC dialog at ikinakabit ang lahat ng click/typing handler.
 */
export function initPcTabsView(handlers) {
  const tabsStrip = document.querySelector(selectors.pcTabsStrip);
  const roleSelect = document.querySelector(selectors.pcRoleSelect);
  const ipList = document.querySelector(selectors.pcIpList);
  const addPcButton = document.querySelector(selectors.addPcButton);
  const addPcDialog = document.querySelector(selectors.addPcDialog);
  const typeSelect = document.querySelector(selectors.addPcTypeSelect);
  const ipInput = document.querySelector(selectors.addPcIpInput);
  const errorElement = document.querySelector(selectors.addPcError);

  // Mga uri ng PC sa dialog: galing sa CONFIG.PC_TYPES
  Object.keys(CONFIG.PC_TYPES).forEach(function (typeKey) {
    const optionElement = document.createElement("option");
    optionElement.value = typeKey;
    optionElement.textContent = CONFIG.PC_TYPES[typeKey].label;
    typeSelect.appendChild(optionElement);
  });

  function showDialogError(messageText) {
    errorElement.textContent = messageText;
    errorElement.classList.remove(cssClasses.hidden);
  }
  function clearDialogError() {
    errorElement.textContent = "";
    errorElement.classList.add(cssClasses.hidden);
  }

  /** submitAddPc — sinusuri ang laman ng dialog, tapos hinihingi kay main.js na idagdag ang PC. */
  function submitAddPc() {
    const validation = validateNewPc({ type: typeSelect.value, ip: ipInput.value });
    if (!validation.isValid) {
      showDialogError(CONFIG.MESSAGES[validation.messageKey]);
      return;
    }
    const outcome = handlers.onAddPcRequest(validation.type, validation.ip);
    if (!outcome.ok) {
      showDialogError(CONFIG.MESSAGES[outcome.messageKey]);
      return;
    }
    addPcDialog.close();
  }

  addPcButton.addEventListener("click", function () {
    ipInput.value = "";
    clearDialogError();
    addPcDialog.showModal();
    typeSelect.focus();
  });
  document.querySelector(selectors.addPcConfirmButton).addEventListener("click", submitAddPc);
  document.querySelector(selectors.addPcCancelButton).addEventListener("click", function () { addPcDialog.close(); });
  ipInput.addEventListener("keydown", function (keyEvent) {
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      submitAddPc();
    }
  });
  // Nawawala ang lumang error kapag nag-type ulit ang user (ang check ay ginagawa pag pinindot ang Add PC)
  ipInput.addEventListener("input", clearDialogError);

  // Click sa tab (delegation: gumagana rin sa mga bagong tab)
  tabsStrip.addEventListener("click", function (clickEvent) {
    const tabButton = clickEvent.target.closest("." + cssClasses.tab);
    if (tabButton) {
      handlers.onSelectPc(tabButton.getAttribute(CONFIG.DATA_ATTRIBUTES.pcId));
    }
  });

  roleSelect.addEventListener("change", function () { handlers.onSelectPc(roleSelect.value); });

  // Pag-edit ng IP sa PC'S card: harangin ang mapanganib na laman, tapos i-save
  ipList.addEventListener("input", function (inputEvent) {
    const ipField = inputEvent.target;
    if (!ipField.classList.contains(cssClasses.ipInput)) {
      return;
    }
    if (!detectSqlInjection(ipField.value, "networkPath").isSafe) {
      ipField.value = lastSafeIpValues.get(ipField) || "";
      return;
    }
    lastSafeIpValues.set(ipField, ipField.value);
    handlers.onIpChange(ipField.getAttribute(CONFIG.DATA_ATTRIBUTES.pcId), ipField.value.trim());
  });
}

/**
 * renderPcTabsView
 * Ginagawang muli ang mga tab, dropdown option, at IP row mula sa registry.
 * Ang PC na bagong dagdag (newPcId) ay kumikislap sandali.
 */
export function renderPcTabsView(registry, activePcId, newPcId) {
  const tabsStrip = document.querySelector(selectors.pcTabsStrip);
  const roleSelect = document.querySelector(selectors.pcRoleSelect);
  const ipList = document.querySelector(selectors.pcIpList);

  // ----- Mga tab -----
  const tabElements = registry.map(function (pc) {
    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = cssClasses.tab;
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute(CONFIG.DATA_ATTRIBUTES.pcId, pc.id);
    tabButton.setAttribute("aria-selected", String(pc.id === activePcId));
    tabButton.textContent = pc.name;
    tabButton.classList.toggle(cssClasses.tabActive, pc.id === activePcId);
    tabButton.classList.toggle(cssClasses.tabNew, pc.id === newPcId);
    return tabButton;
  });
  tabsStrip.replaceChildren(...tabElements);

  // ----- PC ROLE dropdown -----
  const optionElements = buildRoleOptions(registry).map(function (roleOption) {
    const optionElement = document.createElement("option");
    optionElement.value = roleOption.value;
    optionElement.textContent = roleOption.label;
    return optionElement;
  });
  roleSelect.replaceChildren(...optionElements);
  roleSelect.value = activePcId;

  // ----- Mga IP row sa PC'S card -----
  const ipRows = registry.map(function (pc) {
    const rowElement = document.createElement("div");
    rowElement.className = cssClasses.ipRow;
    rowElement.classList.toggle(cssClasses.ipRowNew, pc.id === newPcId);

    const labelElement = document.createElement("label");
    labelElement.textContent = buildIpLabel(pc);

    const ipField = document.createElement("input");
    ipField.type = "text";
    ipField.className = cssClasses.ipInput;
    ipField.value = pc.ip || "";
    ipField.autocomplete = "off";
    ipField.spellcheck = false;
    ipField.setAttribute("aria-label", buildIpLabel(pc));
    ipField.setAttribute(CONFIG.DATA_ATTRIBUTES.pcId, pc.id);
    lastSafeIpValues.set(ipField, ipField.value);

    rowElement.append(labelElement, ipField);
    return rowElement;
  });
  ipList.replaceChildren(...ipRows);

  // Ipakita ang bagong tab kahit mahaba na ang listahan
  const focusedTab = tabsStrip.querySelector("." + (newPcId ? cssClasses.tabNew : cssClasses.tabActive));
  if (focusedTab && typeof focusedTab.scrollIntoView === "function") {
    focusedTab.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}
