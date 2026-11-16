/**
 * FILE: js/pcRegistryLogic.js
 * ANO ITO: Pure logic ng listahan (registry) ng mga PC: MWW at LEAD.
 * GINAGAWA: Nagbibigay ng default na listahan, nagdaragdag ng bagong PC, at
 *           nagsasabi kung saan ilalagay (sa ilalim ng huling PC na kapareho ang uri).
 *           Walang DOM, walang storage, walang UI.
 * INPUT:   registry = array ng { id, type, name, ip }
 *          type = "mww" o "lead" (keys ng CONFIG.PC_TYPES)
 * OUTPUT:  bagong array / object. Hindi binabago ang pinasok na array.
 * TANDAAN: Ang validation ng IP (SQL injection check) ay hindi dito; hiwalay na file.
 *          Ang registry order ay siya ring order ng dropdown at ng mga tab.
 */
import { CONFIG } from "./config.js";

/**
 * createDefaultRegistry
 * Gumagawa ng listahan mula sa CONFIG.DEFAULT_PCS (MWW 1, MWW 2, LEAD PC1, LEAD PC2).
 * Ang ip ay galing sa defaultIp ng bawat PC.
 */
export function createDefaultRegistry() {
  return CONFIG.DEFAULT_PCS.map(function (defaultPc) {
    return {
      id: defaultPc.id,
      type: defaultPc.type,
      name: defaultPc.name,
      ip: defaultPc.defaultIp
    };
  });
}

/**
 * getPcNumber
 * Kinukuha ang numero sa dulo ng pangalan: "MWW 2" -> 2, "LEAD PC1" -> 1.
 * Kapag walang numero, ibinabalik ang 0.
 */
function getPcNumber(pcName) {
  const match = /(\d+)\s*$/.exec(pcName);
  return match ? Number(match[1]) : 0;
}

/**
 * getNextPcNumber
 * Pinakamataas na numero ng kapareho ang uri + 1. Kapag wala pa, startNumber ng uri.
 */
export function getNextPcNumber(registry, type) {
  const typeConfig = CONFIG.PC_TYPES[type];
  const highestNumber = registry
    .filter(function (pc) { return pc.type === type; })
    .reduce(function (highest, pc) { return Math.max(highest, getPcNumber(pc.name)); }, typeConfig.startNumber - 1);
  return highestNumber + 1;
}

/**
 * countByType
 * Ilan na ang PC ng ganitong uri.
 */
export function countByType(registry, type) {
  return registry.filter(function (pc) { return pc.type === type; }).length;
}

/**
 * findLastPcOfType
 * Ang huling PC sa listahan na kapareho ang uri. null kapag wala.
 */
export function findLastPcOfType(registry, type) {
  for (let index = registry.length - 1; index >= 0; index -= 1) {
    if (registry[index].type === type) {
      return registry[index];
    }
  }
  return null;
}

/**
 * addPc
 * Nagdaragdag ng bagong PC sa ilalim ng huling PC na kapareho ang uri.
 * Kapag wala pang ganoong uri, sa dulo ng listahan.
 * Ibinabalik:
 *   { ok: true, registry, addedPc, anchorPcId }
 *       anchorPcId = id ng PC na pagsusunuran ng bagong tab/dropdown option/IP row
 *                    (null kung ilalagay sa dulo)
 *   { ok: false, reason: "invalidType" | "limitReached" }
 */
export function addPc(registry, type, ip) {
  if (!Object.hasOwn(CONFIG.PC_TYPES, type)) {
    return { ok: false, reason: "invalidType" };
  }
  const typeConfig = CONFIG.PC_TYPES[type];
  if (countByType(registry, type) >= CONFIG.MAX_PC_PER_TYPE) {
    return { ok: false, reason: "limitReached" };
  }

  const pcNumber = getNextPcNumber(registry, type);
  const addedPc = {
    id: type + pcNumber,
    type: type,
    name: typeConfig.namePrefix + pcNumber,
    ip: typeof ip === "string" ? ip.trim() : ""
  };

  const anchorPc = findLastPcOfType(registry, type);
  const insertIndex = anchorPc ? registry.indexOf(anchorPc) + 1 : registry.length;
  const newRegistry = registry.slice(0, insertIndex).concat([addedPc], registry.slice(insertIndex));

  return {
    ok: true,
    registry: newRegistry,
    addedPc: addedPc,
    anchorPcId: anchorPc ? anchorPc.id : null
  };
}

/**
 * buildIpLabel
 * Label ng IP row sa PC'S card: "MWW 3 IP", "LEAD PC3 IP".
 */
export function buildIpLabel(pc) {
  return pc.name + CONFIG.PC_TYPES[pc.type].ipLabelSuffix;
}

/**
 * buildRoleOptions
 * Mga option ng PC ROLE dropdown: [{ value: id, label: name }], kapareho ang order ng registry.
 */
export function buildRoleOptions(registry) {
  return registry.map(function (pc) { return { value: pc.id, label: pc.name }; });
}

/**
 * isValidStoredPc
 * Tinitingnan kung ligtas at tama ang hugis ng isang PC na galing sa storage.
 */
function isValidStoredPc(pc) {
  return Boolean(pc) &&
    typeof pc.id === "string" && /^[a-z]+\d+$/.test(pc.id) &&
    typeof pc.type === "string" && Object.hasOwn(CONFIG.PC_TYPES, pc.type) &&
    typeof pc.name === "string" && pc.name.length > 0 && CONFIG.FIELD_WHITELISTS.pcName.test(pc.name) &&
    (pc.ip === null || (typeof pc.ip === "string" && CONFIG.FIELD_WHITELISTS.networkPath.test(pc.ip)));
}

/**
 * restoreRegistry
 * Galing sa storage (parsed na value). Kapag sira, kulang, o may kakaiba, ibabalik
 * ang default na listahan. Pinipilit ding nandoon ang mga default na PC.
 */
export function restoreRegistry(storedValue) {
  const defaultRegistry = createDefaultRegistry();
  if (!Array.isArray(storedValue) || storedValue.length === 0) {
    return defaultRegistry;
  }

  const seenIds = new Set();
  const cleanRegistry = [];
  for (const pc of storedValue) {
    if (!isValidStoredPc(pc) || seenIds.has(pc.id)) {
      return defaultRegistry;
    }
    seenIds.add(pc.id);
    cleanRegistry.push({
      id: pc.id,
      type: pc.type,
      name: pc.name,
      ip: typeof pc.ip === "string" ? pc.ip : ""
    });
  }

  const hasAllDefaults = defaultRegistry.every(function (defaultPc) { return seenIds.has(defaultPc.id); });
  return hasAllDefaults ? cleanRegistry : defaultRegistry;
}
