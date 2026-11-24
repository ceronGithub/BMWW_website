/*
 * FILE     : js/core/lead-pc.js
 * PURPOSE  : Maraming LEAD PC: bawat LEAD PC ay may sariling pangalan (LEAD PC 1, LEAD PC 2, ...) at file sa Server path
 * DEPENDS  : js/core/config.js, js/core/storage.js, js/core/lead-pc-config.js
 * USED BY  : js/pages/settings.js
 * VERSION  : v24 | 2026-11-24 | bagong file (Batch D: Task 8)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const storage = root.storage;
  const LEAD = root.leadPcConfig;

  // ===== STATE (helpers) =====
  /**
   * PARA SAAN    : alamin kung "wala sa folder" ang error (ang queue.js ay may sariling pribadong bersyon; hindi ito mapakikinabangan)
   * GINAGAWA     : tinitingnan ang error.name
   * INPUT/OUTPUT : error -> boolean
   * TINATAWAG NG : lead-pc.js readLeadFiles
   * TUMATAWAG SA : wala
   */
  function isNotFound(error) {
    return Boolean(error) && error.name === 'NotFoundError';
  }

  /**
   * PARA SAAN    : gumawa ng id na nagpapakilala sa LEAD PC na ito
   * GINAGAWA     : crypto.randomUUID kung meron; kung wala, oras at random
   * INPUT/OUTPUT : wala -> string
   * TINATAWAG NG : lead-pc.js claimLeadName
   * TUMATAWAG SA : crypto.randomUUID
   */
  function createLeadId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return LEAD.ID_PREFIX + window.crypto.randomUUID();
    return LEAD.ID_PREFIX + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /**
   * PARA SAAN    : alamin kung ang text sa pangalan field ay label ng LEAD PC (hindi pangalan ng Sender)
   * GINAGAWA     : sinusubukan ang LABEL_PATTERN
   * INPUT/OUTPUT : text (string) -> boolean
   * TINATAWAG NG : settings.js renderMachine
   * TUMATAWAG SA : wala
   */
  function isLeadLabel(text) {
    return LEAD.LABEL_PATTERN.test(String(text || ''));
  }

  /**
   * PARA SAAN    : text na ipapakita sa pangalan field kapag LEAD PC
   * GINAGAWA     : ang naka-save na pangalan kung LEAD PC na; kung wala pa, ang paalalang bibigyan ng numero
   * INPUT/OUTPUT : settings (object) -> string
   * TINATAWAG NG : settings.js renderMachine
   * TUMATAWAG SA : wala
   */
  function getDisplayName(settings) {
    const isSavedLead = settings && settings.machineMode === CONFIG.MACHINE_MODE.LEAD_PC && settings.machineName;
    return isSavedLead ? settings.machineName : LEAD.TEXT.pending;
  }

  // ===== DATA =====
  /**
   * PARA SAAN    : kunin ang lahat ng LEAD PC file sa Server path
   * GINAGAWA     : binabasa ang <Server>\settings\machines\monitoring\*.json; ang sirang file ay binibilang pa ring okupado
   * INPUT/OUTPUT : serverHandle -> Promise<[{fileName, name, id}]> (error kapag pumalya ang server, maliban kung wala pang folder)
   * TINATAWAG NG : lead-pc.js claimLeadName
   * TUMATAWAG SA : storage.js getRoleFolder
   */
  async function readLeadFiles(serverHandle) {
    let folder;
    try {
      folder = await storage.getRoleFolder(serverHandle, CONFIG.MONITORING_SUBFOLDER, false);
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
    const rule = CONFIG.MACHINE_FILE;
    const result = [];
    for await (const entry of folder.values()) {
      const lowerName = entry.name.toLowerCase();
      if (entry.kind !== 'file' || !lowerName.endsWith(rule.EXTENSION) || rule.RESERVED_FILES.includes(lowerName)) continue;
      const baseName = entry.name.slice(0, entry.name.length - rule.EXTENSION.length);
      try {
        const data = JSON.parse(await (await entry.getFile()).text());
        const name = data && typeof data.machineName === 'string' && data.machineName ? data.machineName : baseName;
        result.push({ fileName: entry.name, name, id: data && typeof data[LEAD.FIELD.id] === 'string' ? data[LEAD.FIELD.id] : '' });
      } catch (error) {
        result.push({ fileName: entry.name, name: baseName, id: '' });
      }
    }
    return result;
  }

  /**
   * PARA SAAN    : piliin ang pangalan ng LEAD PC na ito
   * GINAGAWA     : 1) kung may file na may id ko, ang pangalan nito; 2) ang dating numbered na pangalan kung libre; 3) ang pinakamababang libreng numero
   * INPUT/OUTPUT : fileList, myId (string), preferredName (string), skipSet (Set ng lowercase na pangalan) -> string ('' kung puno)
   * TINATAWAG NG : lead-pc.js claimLeadName
   * TUMATAWAG SA : wala
   */
  function pickLeadName(fileList, myId, preferredName, skipSet) {
    const mine = fileList.find((entry) => entry.id && entry.id === myId);
    if (mine) return mine.name;
    const takenSet = new Set(fileList.filter((entry) => entry.id !== myId).map((entry) => entry.name.toLowerCase()));
    const isFree = (name) => !takenSet.has(name.toLowerCase()) && !skipSet.has(name.toLowerCase());
    if (preferredName && LEAD.NUMBERED_PATTERN.test(preferredName) && isFree(preferredName)) return preferredName;
    for (let number = 1; number <= LEAD.MAX_NUMBER; number += 1) {
      const name = LEAD.BASE_NAME + ' ' + number;
      if (isFree(name)) return name;
    }
    return '';
  }

  /**
   * PARA SAAN    : i-reserba ang pangalan sa Server path bago ang tunay na Save
   * GINAGAWA     : sumusulat ng maliit na file (machineName, machineMode, leadPcId) sa monitoring folder
   * INPUT/OUTPUT : serverHandle, name, fileName, myId -> Promise<void>
   * TINATAWAG NG : lead-pc.js claimLeadName
   * TUMATAWAG SA : storage.js writeMachineSettings
   */
  async function writeClaim(serverHandle, name, fileName, myId) {
    const claim = { machineName: name, machineMode: CONFIG.MACHINE_MODE.LEAD_PC, claimedAt: new Date().toISOString() };
    claim[LEAD.FIELD.id] = myId;
    await storage.writeMachineSettings(serverHandle, fileName, claim);
  }

  /**
   * PARA SAAN    : tiyaking ang file ay akin pa rin pagkatapos magsulat (sabay na nag-Save ang ibang LEAD PC?)
   * GINAGAWA     : binabasa ulit ang file at tinitingnan ang id
   * INPUT/OUTPUT : serverHandle, fileName, myId -> Promise<boolean>
   * TINATAWAG NG : lead-pc.js claimLeadName
   * TUMATAWAG SA : storage.js getRoleFolder
   */
  async function verifyClaim(serverHandle, fileName, myId) {
    try {
      const folder = await storage.getRoleFolder(serverHandle, CONFIG.MONITORING_SUBFOLDER, false);
      const data = JSON.parse(await (await (await folder.getFileHandle(fileName)).getFile()).text());
      return Boolean(data) && data[LEAD.FIELD.id] === myId;
    } catch (error) {
      return false;
    }
  }

  /**
   * PARA SAAN    : bigyan ang LEAD PC ng sariling pangalan at file (Task 8)
   * GINAGAWA     : kapag walang Server path o permission, pansamantalang pangalan lang (unchecked). Kung meron: pumili, i-reserba, i-verify; ulit hanggang MAX_TRIES kapag may sabay.
   *                Sinasabi rin kung ang dating file (previousFile) ay pag-aari na ng ibang LEAD PC, para hindi ito mabura.
   * INPUT/OUTPUT : serverHandle, isAllowed (boolean), settings (object) -> Promise<{state, name, leadPcId, isPreviousForeign}>
   * TINATAWAG NG : settings.js onSave
   * TUMATAWAG SA : lead-pc.js createLeadId, readLeadFiles, pickLeadName, writeClaim, verifyClaim; storage.js toMachineFileName
   */
  async function claimLeadName(serverHandle, isAllowed, settings) {
    const current = settings || {};
    const myId = current[LEAD.FIELD.id] || createLeadId();
    const preferredName = current.machineMode === CONFIG.MACHINE_MODE.LEAD_PC ? current.machineName || '' : '';
    const previousFile = String(current[CONFIG.MACHINE_FILE_FIELD] || '').toLowerCase();
    const fallbackName = LEAD.NUMBERED_PATTERN.test(preferredName) ? preferredName : LEAD.BASE_NAME + ' 1';
    const unchecked = { state: LEAD.STATE.unchecked, name: fallbackName, leadPcId: myId, isPreviousForeign: false };
    if (!serverHandle || !isAllowed) return unchecked;
    const skipSet = new Set();
    try {
      for (let attempt = 0; attempt < LEAD.MAX_TRIES; attempt += 1) {
        const fileList = await readLeadFiles(serverHandle);
        const name = pickLeadName(fileList, myId, preferredName, skipSet);
        if (!name) break;
        const fileName = storage.toMachineFileName(name);
        const isMine = fileList.some((entry) => entry.id === myId && entry.name === name);
        if (!isMine) await writeClaim(serverHandle, name, fileName, myId);
        if (isMine || (await verifyClaim(serverHandle, fileName, myId))) {
          const isPreviousForeign = Boolean(previousFile) && fileList.some((entry) => entry.id && entry.id !== myId && entry.fileName.toLowerCase() === previousFile);
          return { state: LEAD.STATE.claimed, name, leadPcId: myId, isPreviousForeign };
        }
        skipSet.add(name.toLowerCase());
      }
      return { state: LEAD.STATE.full, name: '', leadPcId: myId, isPreviousForeign: false };
    } catch (error) {
      return unchecked;
    }
  }

  root.leadPc = Object.freeze({ isLeadLabel, getDisplayName, claimLeadName, pickLeadName });
})();
