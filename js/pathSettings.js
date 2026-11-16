/**
 * FILE: js/pathSettings.js
 * ANO ITO: Pure logic ng PATH SETTINGS (mga path sa Sheet1 ng Excel).
 * GINAGAWA: Gumagawa ng listahan ng mga field mula sa registry ng PC, kumukuha ng tamang value
 *           (naka-save o default), at gumagawa ng bagong naka-save na object. Walang DOM, walang storage.
 * INPUT:   registry = [{ id, type, name, ip }], savedPaths = { storeKey: text }
 * OUTPUT:  buildPathGroups -> [{ groupTitle, fields: [{ storeKey, label, defaultPath }] }]
 *          resolvePathValue -> text; withPathValue -> bagong object; restorePathSettings -> valid na object;
 *          getSharedPath -> text ("server" o "database"), gagamitin ng ibang task.
 * TANDAAN: storeKey ay "server", "database", o "<pcId>:<desktop|adminShare|calib>".
 *          Ang bagong idinagdag na PC ay walang default; blangko ang input hanggang mag-paste ang user.
 */
import { CONFIG } from "./config.js";

const sharedKeyDefaults = Object.freeze({
  server: CONFIG.DEFAULT_SERVER_PATH,
  database: CONFIG.DEFAULT_DATABASE_PATH
});

/**
 * buildPathGroups
 * Unang group: SERVER at DATABASE. Kasunod ang isang group kada PC, kapareho ng pagkakasunod ng registry.
 */
export function buildPathGroups(registry) {
  const sharedGroup = {
    groupTitle: CONFIG.PATH_SHARED_GROUP_TITLE,
    fields: Object.keys(sharedKeyDefaults).map(function (sharedKey) {
      return { storeKey: sharedKey, label: CONFIG.PATH_LABELS[sharedKey], defaultPath: sharedKeyDefaults[sharedKey] };
    })
  };

  const pcGroups = registry.map(function (pc) {
    const pathKeys = CONFIG.PATH_KEYS_BY_PC_TYPE[pc.type] || [];
    const pcDefaults = CONFIG.PC_PATH_DEFAULTS[pc.id] || {};
    return {
      groupTitle: pc.name,
      fields: pathKeys.map(function (pathKey) {
        return { storeKey: pc.id + ":" + pathKey, label: CONFIG.PATH_LABELS[pathKey], defaultPath: pcDefaults[pathKey] || "" };
      })
    };
  });

  return [sharedGroup].concat(pcGroups);
}

/**
 * resolvePathValue
 * Kung may naka-save (kahit blangko, ibig sabihin binura ng user), iyon ang gagamitin.
 * Kung wala, ang default.
 */
export function resolvePathValue(savedPaths, field) {
  return Object.hasOwn(savedPaths, field.storeKey) ? savedPaths[field.storeKey] : field.defaultPath;
}

/** withPathValue — bagong object na may bagong value; hindi ginagalaw ang luma. */
export function withPathValue(savedPaths, storeKey, pathText) {
  return { ...savedPaths, [storeKey]: pathText };
}

/** restorePathSettings — ang tanggap lang ay plain object na ang laman ay text; ang iba ay itinatapon. */
export function restorePathSettings(storedValue) {
  const isPlainObject = storedValue !== null && typeof storedValue === "object" && !Array.isArray(storedValue);
  if (!isPlainObject) {
    return {};
  }
  const cleanPaths = {};
  Object.keys(storedValue).forEach(function (storeKey) {
    if (typeof storedValue[storeKey] === "string") {
      cleanPaths[storeKey] = storedValue[storeKey];
    }
  });
  return cleanPaths;
}

/** getSharedPath — ang SERVER o DATABASE path na kasalukuyang ginagamit. */
export function getSharedPath(savedPaths, sharedKey) {
  return resolvePathValue(savedPaths, { storeKey: sharedKey, defaultPath: sharedKeyDefaults[sharedKey] });
}
