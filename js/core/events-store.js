/*
 * FILE    : js/core/events-store.js
 * PURPOSE : Basa at sulat ng events ng Dashboard (localStorage at settings/events.json sa BMWW folder)
 * DEPENDS : js/core/config.js, js/core/security.js, js/core/storage.js
 * VERSION : v3 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EVENTS = CONFIG.EVENTS;
  const STATE = EVENTS.FILE_STATE;
  const storage = root.storage;
  const security = root.security;
  let currentFileState = STATE.noFolder;
  let currentRootHandle = null;

  // Tama ba ang petsa (YYYY-MM-DD, totoong araw sa kalendaryo).
  function isValidDateText(value) {
    if (typeof value !== 'string' || !EVENTS.DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  // Tama ba ang oras (HH:MM) o walang oras.
  function isValidTimeText(value) {
    return value === '' || (typeof value === 'string' && EVENTS.TIME_PATTERN.test(value));
  }

  // Nililinis ang isang event; null kung hindi valid.
  function normalizeEvent(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = security.sanitizeInput(raw.id == null ? '' : raw.id, EVENTS.ID_MAX);
    const title = security.sanitizeInput(raw.title == null ? '' : raw.title, EVENTS.TITLE_MAX);
    const note = security.sanitizeInput(raw.note == null ? '' : raw.note, EVENTS.NOTE_MAX);
    const date = raw.date == null ? '' : String(raw.date);
    const time = raw.time ? String(raw.time) : '';
    if (!id || !title || !isValidDateText(date) || !isValidTimeText(time)) return null;
    const cleanEvent = { id, title, date, time, note };
    if (raw.pending === true) cleanEvent.pending = true;
    return cleanEvent;
  }

  // Nililinis ang listahan: valid lang, walang dobleng id, may limit.
  function normalizeList(rawList) {
    if (!Array.isArray(rawList)) return [];
    const seenIdList = new Set();
    const cleanList = [];
    rawList.forEach((rawEvent) => {
      const cleanEvent = normalizeEvent(rawEvent);
      if (cleanEvent && !seenIdList.has(cleanEvent.id)) {
        seenIdList.add(cleanEvent.id);
        cleanList.push(cleanEvent);
      }
    });
    return cleanList.slice(0, EVENTS.MAX_EVENTS);
  }

  // Inaayos ang listahan: petsa, tapos oras (walang oras ang una), tapos title.
  function sortEvents(list) {
    return [...list].sort((first, second) => (
      first.date.localeCompare(second.date) || first.time.localeCompare(second.time) || first.title.localeCompare(second.title)
    ));
  }

  // Gumagawa ng bagong id ng event.
  function createId() {
    return EVENTS.ID_PREFIX + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  // Tinatanggal ang pending mark bago i-save sa file.
  function stripPending(list) {
    return list.map(({ id, title, date, time, note }) => ({ id, title, date, time, note }));
  }

  // Binabasa ang events sa localStorage.
  function readLocalEvents() {
    try {
      const raw = localStorage.getItem(EVENTS.STORAGE_KEY);
      return raw ? sortEvents(normalizeList(JSON.parse(raw))) : [];
    } catch (error) {
      return [];
    }
  }

  // Sine-save ang events sa localStorage (hindi kritikal kapag pumalya).
  function writeLocalEvents(list) {
    try {
      localStorage.setItem(EVENTS.STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      // Ang file sa BMWW ang pangunahing tala; ang cache ay pandagdag lang.
    }
  }

  // Binabasa ang events.json; null kung wala pang file; nagtatapon ng error kung sira o hindi mabasa.
  async function readEventsFile(rootHandle) {
    try {
      const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER);
      const file = await folder.getFileHandle(EVENTS.FILE_NAME);
      const data = JSON.parse(await (await file.getFile()).text());
      return normalizeList(Array.isArray(data) ? data : data.events);
    } catch (error) {
      if (error && error.name === 'NotFoundError') return null;
      throw error;
    }
  }

  // Sinusulat ang events.json sa BMWW\settings (gumagawa ng folder kung wala).
  async function writeEventsFile(rootHandle, list) {
    const folder = await rootHandle.getDirectoryHandle(CONFIG.SETTINGS_SUBFOLDER, { create: true });
    const file = await folder.getFileHandle(EVENTS.FILE_NAME, { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify({ version: EVENTS.FILE_VERSION, savedAt: new Date().toISOString(), events: stripPending(list) }, null, 2));
    await writable.close();
  }

  // Kinukuha ang BMWW folder handle at nagtatakda ng state (walang handle, walang permission, atbp.).
  async function findRootHandle(shouldRequest) {
    if (!storage.isFolderAccessSupported()) return { handle: null, state: STATE.unsupported };
    const handle = await storage.loadHandle(CONFIG.HANDLE_KEY[CONFIG.ROOT_KEY]);
    if (!handle) return { handle: null, state: STATE.noFolder };
    const isAllowed = await storage.hasPermission(handle, shouldRequest);
    return { handle, state: isAllowed ? STATE.ok : STATE.noPermission };
  }

  // Pinagsasama ang file at lokal: ang file ang pangunahin; ang pending (nai-save habang walang file) ay isinasama.
  function mergeWithPending(fileList, localList) {
    const pendingList = localList.filter((item) => item.pending === true);
    const pendingIdSet = new Set(pendingList.map((item) => item.id));
    return sortEvents(normalizeList([...fileList.filter((item) => !pendingIdSet.has(item.id)), ...pendingList]));
  }

  // Nilo-load ang events: file muna kung mabubuksan, kung hindi ay lokal. Hindi nagtatapon ng error.
  async function loadEvents(shouldRequest) {
    const localList = readLocalEvents();
    let result = { handle: null, state: STATE.noFolder };
    try {
      result = await findRootHandle(shouldRequest === true);
    } catch (error) {
      result = { handle: null, state: STATE.error };
    }
    currentRootHandle = result.handle;
    currentFileState = result.state;
    if (result.state !== STATE.ok) return { events: localList, fileState: currentFileState };
    try {
      const fileList = await readEventsFile(result.handle);
      let mergedList = localList;
      let shouldWrite = localList.length > 0;
      if (fileList !== null) {
        mergedList = mergeWithPending(fileList, localList);
        shouldWrite = localList.some((item) => item.pending === true);
      }
      if (shouldWrite) await writeEventsFile(result.handle, mergedList);
      const finalList = stripPendingList(mergedList, shouldWrite || fileList !== null);
      writeLocalEvents(finalList);
      return { events: finalList, fileState: currentFileState };
    } catch (error) {
      currentFileState = STATE.error;
      return { events: localList, fileState: currentFileState };
    }
  }

  // Pagkatapos magtagumpay ang file, wala nang pending.
  function stripPendingList(list, isInFile) {
    return isInFile ? sortEvents(stripPending(list)) : list;
  }

  // Sine-save ang listahan: file (kung bukas) at localStorage. Pending ang mga hindi naisulat sa file.
  async function saveEvents(list) {
    const cleanList = sortEvents(normalizeList(list));
    if (currentFileState === STATE.ok && currentRootHandle) {
      try {
        if (await storage.hasPermission(currentRootHandle, true)) {
          await writeEventsFile(currentRootHandle, cleanList);
          const savedList = sortEvents(stripPending(cleanList));
          writeLocalEvents(savedList);
          return { events: savedList, fileState: currentFileState };
        }
        currentFileState = STATE.noPermission;
      } catch (error) {
        currentFileState = STATE.error;
      }
    }
    writeLocalEvents(cleanList);
    return { events: cleanList, fileState: currentFileState };
  }

  root.eventsStore = Object.freeze({ isValidDateText, isValidTimeText, sortEvents, createId, readLocalEvents, loadEvents, saveEvents });
})();
