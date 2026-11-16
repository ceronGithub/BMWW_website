/**
 * FILE: js/storage.js
 * ANO ITO: Ang nag-iisang file na humahawak ng localStorage (Rule 13).
 *          Ang ibang module ay tumatawag lang dito; hindi sila humahawak ng localStorage.
 * GINAGAWA: Nagbabasa at nagsusulat ng JSON sa localStorage nang hindi nagko-crash,
 *           at may espesyal na load/save para sa listahan ng mga PC.
 * INPUT:   key (galing sa CONFIG.STORAGE_KEYS), value (kahit anong JSON-able)
 * OUTPUT:  read -> value o null; write -> true/false; loadPcRegistry -> laging valid na listahan
 * TANDAAN: Ang folder handles (IndexedDB) ay hindi dito; hiwalay na file sa Task 2.
 *          Ang technical detail ng error ay sa console.error lang; walang lumalabas sa user.
 */
import { CONFIG } from "./config.js";
import { restoreRegistry } from "./pcRegistryLogic.js";

/**
 * readStoredJson
 * Binabasa ang key at ginagawang object. Ibinabalik ang null kapag wala, sira ang JSON,
 * o hindi magamit ang localStorage (hal. naka-block sa browser).
 */
export function readStoredJson(key) {
  try {
    const rawText = window.localStorage.getItem(key);
    if (rawText === null) {
      return null;
    }
    return JSON.parse(rawText);
  } catch (error) {
    console.error("storage: hindi mabasa ang key " + key, error);
    return null;
  }
}

/**
 * writeStoredJson
 * Isinusulat ang value bilang JSON. Ibinabalik ang true kapag nakasulat,
 * false kapag nabigo (puno ang storage, naka-block, at iba pa).
 */
export function writeStoredJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("storage: hindi maisulat ang key " + key, error);
    return false;
  }
}

/**
 * loadPcRegistry
 * Kinukuha ang naka-save na listahan ng PC. Kapag wala o sira, ibinabalik ang default
 * na listahan (MWW 1, MWW 2, LEAD PC1, LEAD PC2). Laging may maibabalik.
 */
export function loadPcRegistry() {
  return restoreRegistry(readStoredJson(CONFIG.STORAGE_KEYS.pcRegistry));
}

/**
 * savePcRegistry
 * Sine-save ang listahan ng PC. Ibinabalik ang true o false.
 */
export function savePcRegistry(registry) {
  return writeStoredJson(CONFIG.STORAGE_KEYS.pcRegistry, registry);
}