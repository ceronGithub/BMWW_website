/**
 * FILE: js/pathSettingsView.js
 * ANO ITO: Ang UI ng PATH SETTINGS: isang card kada group (SERVER / DATABASE, tapos kada PC),
 *          at isang input kada path na pwedeng i-paste.
 * GINAGAWA: Nagpapakita at nakikinig sa "change" ng input. Ang pag-save ay ginagawa ng main.js (handler).
 * INPUT:   initPathSettingsView({ onPathChange(storeKey, text) -> true/false }) isang beses;
 *          renderPathSettingsView(registry, savedPaths) kada pagbabago ng registry.
 * OUTPUT:  binabago ang DOM; toast kapag naka-save o hindi tinanggap.
 * TANDAAN: Ang input ay sine-save kapag natapos na ang pag-paste/pag-type (change event: Enter o
 *          pag-alis ng cursor), hindi kada letra. Ang mapanganib na text ay ibinabalik sa huling ligtas na laman.
 */
import { CONFIG } from "./config.js";
import { buildPathGroups, resolvePathValue } from "./pathSettings.js";
import { detectSqlInjection } from "./sqlInjectionDetector.js";
import { showToast } from "./toast.js";

const selectors = CONFIG.SELECTORS;
const dataAttributes = CONFIG.DATA_ATTRIBUTES;

// huling ligtas na laman ng bawat input (para maibalik kapag may maling character)
const lastSafeValues = new WeakMap();

/** buildFieldRow — isang row: label at input para sa isang path. */
function buildFieldRow(group, field, savedPaths) {
  const rowElement = document.createElement("div");
  rowElement.className = CONFIG.CSS_CLASSES.ipRow;

  const inputElement = document.createElement("input");
  inputElement.type = "text";
  inputElement.className = "pathSettings__input";
  inputElement.autocomplete = "off";
  inputElement.spellcheck = false;
  inputElement.setAttribute(dataAttributes.pathKey, field.storeKey);
  inputElement.setAttribute(dataAttributes.pathLabel, group.groupTitle + " " + field.label);
  inputElement.setAttribute("aria-label", group.groupTitle + " " + field.label);
  inputElement.value = resolvePathValue(savedPaths, field);
  lastSafeValues.set(inputElement, inputElement.value);

  const labelElement = document.createElement("label");
  labelElement.textContent = field.label;

  rowElement.append(labelElement, inputElement);
  return rowElement;
}

/** renderPathSettingsView — ginagawang muli ang lahat ng card mula sa registry at sa naka-save na path. */
export function renderPathSettingsView(registry, savedPaths) {
  const listElement = document.querySelector(selectors.pathSettingsList);

  const cardElements = buildPathGroups(registry).map(function (group) {
    const cardElement = document.createElement("article");
    cardElement.className = "infoCard";

    const headerElement = document.createElement("h2");
    headerElement.className = "cardHeader";
    headerElement.textContent = group.groupTitle;

    cardElement.appendChild(headerElement);
    group.fields.forEach(function (field) {
      cardElement.appendChild(buildFieldRow(group, field, savedPaths));
    });
    return cardElement;
  });

  listElement.replaceChildren(...cardElements);
}

/** initPathSettingsView — isang beses lang: isang listener sa buong listahan (event delegation). */
export function initPathSettingsView(handlers) {
  const listElement = document.querySelector(selectors.pathSettingsList);

  // Natapos na ang pag-paste/pag-type sa isang input: suriin, tapos i-save
  listElement.addEventListener("change", function (changeEvent) {
    const inputElement = changeEvent.target;
    const storeKey = inputElement.getAttribute(dataAttributes.pathKey);
    if (!storeKey) {
      return;
    }

    const pathText = inputElement.value.trim();
    const safety = detectSqlInjection(pathText, "networkPath");
    if (!safety.isSafe) {
      inputElement.value = lastSafeValues.get(inputElement) || "";
      showToast("✕ " + CONFIG.MESSAGES.inputNotAllowed, "error");
      return;
    }

    inputElement.value = pathText;
    const isSaved = handlers.onPathChange(storeKey, pathText);
    if (!isSaved) {
      showToast("✕ " + CONFIG.MESSAGES.pathNotSaved, "error");
      return;
    }
    lastSafeValues.set(inputElement, pathText);
    showToast("✓ " + CONFIG.MESSAGES.pathSaved + " " + inputElement.getAttribute(dataAttributes.pathLabel), "success");
  });
}
