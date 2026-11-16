/**
 * FILE: js/main.js
 * ANO ITO: Taga-ugnay ng buong page. Hawak ang listahan ng PC (registry), ang piniling PC (tab),
 *          ang mga MWW panel, at ang LEAD screen.
 * DALOY:   1) Load ang registry at ang huling piniling PC.
 *          2) Gumawa ng MWW panel para sa bawat MWW PC.
 *          3) Kapag may idinagdag na PC (Add PC): ilagay sa registry (sa ilalim ng huling kapareho ang uri),
 *             i-save, gumawa ng bagong tab + dropdown option + IP row, at lumipat sa bagong tab.
 * TANDAAN: Ang piniling tab at ang PC ROLE dropdown ay iisa: ang pagpili sa isa ay sumusunod ang isa.
 */
import { CONFIG } from "./config.js";
import { addPc } from "./pcRegistryLogic.js";
import { loadPcRegistry, savePcRegistry, loadActivePcId, saveActivePcId, loadPathSettings, savePathSettings } from "./Storage.js";
import { withPathValue, getSharedPath } from "./pathSettings.js";
import { initPathSettingsView, renderPathSettingsView } from "./pathSettingsView.js";
import { initPcTabsView, renderPcTabsView } from "./pcTabsView.js";
import { createMwwPanel } from "./mwwPanel.js";
import { initLeadView } from "./leadView.js";
import { showToast } from "./toast.js";

// Hinaharang ang right-click sa buong page (standard ng project mula day 1)
document.addEventListener("contextmenu", function (contextEvent) {
  if (!CONFIG.RIGHT_CLICK_BLOCKED) {
    return;
  }
  const isAllowedTarget = CONFIG.RIGHT_CLICK_ALLOWED_SELECTORS.some(function (allowedSelector) {
    return contextEvent.target.closest(allowedSelector);
  });
  if (!isAllowedTarget) {
    contextEvent.preventDefault();
  }
});

const mwwView = document.querySelector(CONFIG.SELECTORS.mwwView);
const leadView = document.querySelector(CONFIG.SELECTORS.leadView);
const panelHost = document.querySelector(CONFIG.SELECTORS.pcPanelHost);
const panelTemplate = document.querySelector(CONFIG.SELECTORS.mwwPanelTemplate);
const leadScreen = initLeadView();

let registry = loadPcRegistry();
// Mga path na ini-paste ng user (storeKey -> text); ang wala rito ay gumagamit ng default
let savedPaths = loadPathSettings();
let activePcId = loadActivePcId(registry);
// pcId -> panel ng MWW PC na iyon
const panelsByPcId = new Map();

/** readSharedPaths — ang SERVER at DATABASE path na kasalukuyang naka-save (o default). */
function readSharedPaths() {
  return { server: getSharedPath(savedPaths, "server"), database: getSharedPath(savedPaths, "database") };
}

/** applySharedPaths — ipinapakita ang bagong SERVER/DATABASE path sa lahat ng MWW panel at sa LEAD notice. */
function applySharedPaths() {
  const sharedPaths = readSharedPaths();
  panelsByPcId.forEach(function (panel) { panel.setSharedPaths(sharedPaths); });
  leadScreen.setMonitoringFolder(sharedPaths.database);
}

/** ensurePanels — gumagawa ng panel para sa bawat MWW PC na wala pa. */
function ensurePanels() {
  registry.forEach(function (pc) {
    if (pc.type === "mww" && !panelsByPcId.has(pc.id)) {
      panelsByPcId.set(pc.id, createMwwPanel(pc, panelHost, panelTemplate, readSharedPaths()));
    }
  });
}

/**
 * showActivePc
 * Ipinapakita ang tamang screen: panel ng piniling MWW PC, o ang LEAD screen.
 * Sa MWW, ang cursor ay awtomatikong napupunta sa susunod na dapat lagyan (Machine -> Barcode -> Operator).
 */
function showActivePc() {
  const activePc = registry.find(function (pc) { return pc.id === activePcId; });
  const isMww = activePc.type === "mww";

  mwwView.classList.toggle(CONFIG.CSS_CLASSES.hidden, !isMww);
  leadView.classList.toggle(CONFIG.CSS_CLASSES.hidden, isMww);
  panelsByPcId.forEach(function (panel, pcId) { panel.setVisible(pcId === activePcId); });

  if (isMww) {
    panelsByPcId.get(activePcId).focusNextField();
  } else {
    leadScreen.setLeadName(activePc.name);
  }
}

/** renderAll — ina-update ang lahat ng bahagi ng UI mula sa registry. */
function renderAll(newPcId) {
  renderPcTabsView(registry, activePcId, newPcId);
  renderPathSettingsView(registry, savedPaths);
  leadScreen.setMachineNames(registry.filter(function (pc) { return pc.type === "mww"; }).map(function (pc) { return pc.name; }));
  showActivePc();
}

/** selectPc — lumilipat sa piniling tab/dropdown option. */
function selectPc(pcId) {
  activePcId = pcId;
  saveActivePcId(activePcId);
  renderAll(null);
}

/**
 * handleAddPcRequest
 * Idinaragdag ang PC sa registry. Ibinabalik { ok } o { ok: false, messageKey } para ipakita ng dialog.
 */
function handleAddPcRequest(pcType, ipText) {
  const outcome = addPc(registry, pcType, ipText);
  if (!outcome.ok) {
    return { ok: false, messageKey: outcome.reason === "limitReached" ? "pcLimitReached" : "unexpectedError" };
  }
  registry = outcome.registry;
  savePcRegistry(registry);
  activePcId = outcome.addedPc.id;
  saveActivePcId(activePcId);
  ensurePanels();
  renderAll(outcome.addedPc.id);
  showToast("✓ " + CONFIG.MESSAGES.pcAdded + " (" + outcome.addedPc.name + ")", "success");
  return { ok: true };
}

/** handleIpChange — sine-save ang bagong IP ng PC. Hindi nire-render para hindi maputol ang pagta-type. */
function handleIpChange(pcId, ipText) {
  registry = registry.map(function (pc) {
    return pc.id === pcId ? { id: pc.id, type: pc.type, name: pc.name, ip: ipText } : pc;
  });
  savePcRegistry(registry);
}

/** handlePathChange — sine-save ang path na ini-paste. Ibinabalik ang true kapag naka-save. */
function handlePathChange(storeKey, pathText) {
  const nextPaths = withPathValue(savedPaths, storeKey, pathText);
  const isSaved = savePathSettings(nextPaths);
  if (isSaved) {
    savedPaths = nextPaths;
    applySharedPaths();
  }
  return isSaved;
}

initPcTabsView({ onSelectPc: selectPc, onAddPcRequest: handleAddPcRequest, onIpChange: handleIpChange });
initPathSettingsView({ onPathChange: handlePathChange });

// Mga sample button: para sa design preview ng LEAD screen lang
document.querySelector(CONFIG.SELECTORS.loadSampleButton).addEventListener("click", function () {
  leadScreen.loadSample();
  showToast("✓ Sample data loaded.", "success");
});
document.querySelector(CONFIG.SELECTORS.clearSampleButton).addEventListener("click", function () {
  leadScreen.clearSample();
  showToast("✓ Sample data cleared.", "success");
});

ensurePanels();
applySharedPaths();
renderAll(null);
