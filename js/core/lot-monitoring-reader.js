/*
 * FILE    : js/core/lot-monitoring-reader.js
 * PURPOSE : Binabasa (basa lang) ang monitoring JSON ng bawat machine sa <Server path>\monitoring\<machine>\ddmmyyyy_MONITORING.json para sa LEAD PC view
 * DEPENDS : js/core/config.js, js/core/storage.js, js/core/lot-config.js, js/core/lot-lead-config.js, js/core/lot-shift.js
 * USED BY : js/pages/lot-tracking-lead.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 5)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const MON = root.lotConfig.MONITORING;
  const LEAD = root.lotLeadConfig;
  const storage = root.storage;
  const lotShift = root.lotShift;

  // Row na may lahat ng 16 na field (text, time at number ay nililinis; galing ito sa file kaya hindi pinagkakatiwalaan).
  function normalizeRow(rawRow) {
    const source = rawRow && typeof rawRow === 'object' ? rawRow : {};
    const row = {};
    MON.COLUMN_LIST.forEach((column) => {
      const value = source[column.field];
      if (column.type === 'text') row[column.field] = typeof value === 'string' ? value.slice(0, MON.TEXT_MAX) : '';
      else row[column.field] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    });
    return row;
  }

  // Doc mula sa nabasang JSON; null kung hindi tama ang version o anyo. Ang folderName ang gagamitin kung walang pangalan ng machine sa doc.
  function normalizeDoc(rawDoc, folderName) {
    if (!rawDoc || typeof rawDoc !== 'object' || rawDoc.version !== MON.VERSION || !Array.isArray(rawDoc.rows)) return null;
    const hasMachine = typeof rawDoc.machine === 'string' && rawDoc.machine.length > 0;
    return {
      version: MON.VERSION,
      machine: hasMachine ? rawDoc.machine.slice(0, MON.TEXT_MAX) : folderName,
      monitoringDay: typeof rawDoc.monitoringDay === 'string' ? rawDoc.monitoringDay : '',
      updatedMs: typeof rawDoc.updatedMs === 'number' ? rawDoc.updatedMs : 0,
      rows: rawDoc.rows.slice(0, MON.ROWS_MAX).map(normalizeRow)
    };
  }

  // Binabasa ang JSON ng araw sa folder ng isang machine. Ibinabalik { doc, problem }; hindi nagtatapon ng error.
  async function readMachineDay(machineFolder, fileName, folderName) {
    let fileHandle = null;
    try {
      fileHandle = await machineFolder.getFileHandle(fileName);
    } catch (error) {
      return { doc: null, problem: error && error.name === 'NotFoundError' ? LEAD.PROBLEM.noFile : LEAD.PROBLEM.unreadable };
    }
    let text = '';
    try {
      text = await (await fileHandle.getFile()).text();
    } catch (error) {
      return { doc: null, problem: LEAD.PROBLEM.unreadable };
    }
    try {
      const doc = normalizeDoc(JSON.parse(text), folderName);
      return doc ? { doc, problem: LEAD.PROBLEM.none } : { doc: null, problem: LEAD.PROBLEM.invalid };
    } catch (error) {
      return { doc: null, problem: LEAD.PROBLEM.invalid };
    }
  }

  /**
   * PARA SAAN    : kunin ang monitoring ng lahat ng machine sa Server path para sa isang monitoring day
   * GINAGAWA     : kinukuha ang handle ng Server path, tinitingnan (o hinihingi kung shouldRequest) ang permission, binabasa ang bawat subfolder ng <Server path>\monitoring (isang machine bawat subfolder); basa lang, walang isinusulat
   * INPUT/OUTPUT : (isoDay 'yyyy-mm-dd', shouldRequest bool) -> Promise<{ state, machineList: [{ folderName, machine, doc, problem }] }>
   * TINATAWAG NG : lot-tracking-lead.js load
   * TUMATAWAG SA : storage.loadHandle, storage.hasPermission, lotShift.toFileKey, readMachineDay
   */
  async function readDay(isoDay, shouldRequest) {
    const result = (state, machineList) => ({ state, machineList: machineList || [] });
    if (!storage.isFolderAccessSupported()) return result(LEAD.STATE.unsupported);
    let serverHandle = null;
    try {
      serverHandle = await storage.loadHandle(CONFIG.HANDLE_KEY.server);
    } catch (error) {
      serverHandle = null;
    }
    if (!serverHandle) return result(LEAD.STATE.noServer);
    let isAllowed = false;
    try {
      isAllowed = await storage.hasPermission(serverHandle, shouldRequest === true);
    } catch (error) {
      isAllowed = false;
    }
    if (!isAllowed) return result(LEAD.STATE.noPermission);
    let monitoringFolder = null;
    try {
      monitoringFolder = await serverHandle.getDirectoryHandle(MON.FOLDER);
    } catch (error) {
      return result(error && error.name === 'NotFoundError' ? LEAD.STATE.noMonitoring : LEAD.STATE.readError);
    }
    const fileName = lotShift.toFileKey(isoDay) + MON.JSON_SUFFIX;
    const machineList = [];
    try {
      for await (const entry of monitoringFolder.values()) {
        if (entry.kind !== 'directory') continue;
        const read = await readMachineDay(entry, fileName, entry.name);
        machineList.push({ folderName: entry.name, machine: read.doc ? read.doc.machine : entry.name, doc: read.doc, problem: read.problem });
      }
    } catch (error) {
      return result(LEAD.STATE.readError);
    }
    machineList.sort((first, second) => first.machine.localeCompare(second.machine));
    return result(LEAD.STATE.ok, machineList);
  }

  root.lotMonitoringReader = Object.freeze({ readDay });
})();
