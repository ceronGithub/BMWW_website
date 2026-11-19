/*
 * FILE    : js/core/storage.js
 * PURPOSE : Folder access, IndexedDB handles, settings file
 * DEPENDS : js/core/config.js
 * VERSION : v1 | 2026-11-19 | unang bersyon
 */
'use strict';
import { CONFIG } from './config.js';

// Sinusuportahan ba ng browser ang folder picker (Chrome/Edge).
export function isFolderAccessSupported() {
  return typeof window.showDirectoryPicker === 'function';
}

// Binubuksan ang IndexedDB kung saan nakasave ang folder handles.
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONFIG.DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(CONFIG.DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Sine-save ang folder handle para hindi na pumili ulit.
export async function saveHandle(key, handle) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CONFIG.DB_STORE, 'readwrite');
    transaction.objectStore(CONFIG.DB_STORE).put(handle, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Kinukuha ang naka-save na handle (null kung wala).
export async function loadHandle(key) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(CONFIG.DB_STORE).objectStore(CONFIG.DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Bubuksan ang folder picker (read at write).
export function pickFolder() {
  return window.showDirectoryPicker({ mode: 'readwrite', startIn: 'desktop' });
}

// Tinitingnan o hinihingi ang permission sa folder.
export async function hasPermission(handle, shouldRequest) {
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  if (!shouldRequest) return false;
  return (await handle.requestPermission(options)) === 'granted';
}

// Binabasa ang settings cache sa localStorage.
export function readLocalSettings() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

// Sine-save ang settings cache sa localStorage.
export function writeLocalSettings(settings) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Hindi kritikal: ang file sa BMWW ang pangunahing tala.
  }
}

// Gumagawa ng settings folder (kung wala pa) at sinusulat ang settings.json.
export async function writeSettingsFile(rootHandle, settings) {
  const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER, { create: true });
  const file = await folder.getFileHandle(CONFIG.SETTINGS_FILE, { create: true });
  const writable = await file.createWritable();
  await writable.write(JSON.stringify(settings, null, 2));
  await writable.close();
}

// Binabasa ang settings.json (null kung wala o sira).
export async function readSettingsFile(rootHandle) {
  try {
    const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
    const file = await folder.getFileHandle(CONFIG.SETTINGS_FILE);
    return JSON.parse(await (await file.getFile()).text());
  } catch (error) {
    return null;
  }
}
