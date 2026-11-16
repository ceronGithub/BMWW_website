/**
 * FILE: js/folderHandleStore.js
 * ANO ITO: Taga-save at taga-load ng mga "folder handle" sa IndexedDB.
 * BAKIT:   Hindi mababasa ng browser ang C:\ path nang basta-basta. Ang user ay pipili ng folder
 *          nang isang beses; ang handle na iyon ay ise-save dito para hindi na mag-pick ulit
 *          sa susunod na bukas ng page (hihingi na lang ng permission).
 * INPUT:   handleKey (text, hal. "mww1:calib"), folderHandle (FileSystemDirectoryHandle)
 * OUTPUT:  saveFolderHandle -> true/false; loadFolderHandle -> handle o null. Hindi nagko-crash.
 * TANDAAN: Ang technical error ay sa console.error lang; walang lumalabas sa user.
 */
import { CONFIG } from "./config.js";

const databaseVersion = 1;

/** openDatabase — binubuksan ang IndexedDB at ginagawa ang store sa unang gamit. */
function openDatabase() {
  return new Promise(function (resolve, reject) {
    const openRequest = window.indexedDB.open(CONFIG.STORAGE_KEYS.folderHandlesDatabase, databaseVersion);
    openRequest.onupgradeneeded = function () {
      openRequest.result.createObjectStore(CONFIG.STORAGE_KEYS.folderHandlesStore);
    };
    openRequest.onsuccess = function () { resolve(openRequest.result); };
    openRequest.onerror = function () { reject(openRequest.error); };
  });
}

/** runRequest — ginagawang Promise ang isang IndexedDB request. */
function runRequest(request) {
  return new Promise(function (resolve, reject) {
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

/**
 * saveFolderHandle
 * Sine-save ang handle sa ilalim ng handleKey. Ibinabalik ang true kapag nakasulat.
 */
export async function saveFolderHandle(handleKey, folderHandle) {
  try {
    const database = await openDatabase();
    const storeName = CONFIG.STORAGE_KEYS.folderHandlesStore;
    await runRequest(database.transaction(storeName, "readwrite").objectStore(storeName).put(folderHandle, handleKey));
    database.close();
    return true;
  } catch (error) {
    console.error("folderHandleStore: hindi ma-save ang " + handleKey, error);
    return false;
  }
}

/**
 * loadFolderHandle
 * Kinukuha ang naka-save na handle. Ibinabalik ang null kapag wala o hindi mabasa.
 */
export async function loadFolderHandle(handleKey) {
  try {
    const database = await openDatabase();
    const storeName = CONFIG.STORAGE_KEYS.folderHandlesStore;
    const storedHandle = await runRequest(database.transaction(storeName, "readonly").objectStore(storeName).get(handleKey));
    database.close();
    return storedHandle || null;
  } catch (error) {
    console.error("folderHandleStore: hindi mabasa ang " + handleKey, error);
    return null;
  }
}
