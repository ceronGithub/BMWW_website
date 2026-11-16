/**
 * FILE: js/mwwPanel.js
 * ANO ITO: Ang buong screen ng isang MWW PC (LOT_TRACKING): LOTE INFORMATION, paths, Machine, at RESULT.
 *          Bawat MWW tab ay may sariling kopya nito (galing sa #mwwPanelTemplate).
 * GINAGAWA:
 *   1) Daloy ng input: Machine may laman -> autofocus sa Barcode -> Enter -> Operator -> Enter = simula ng lote.
 *   2) Pagsisimula ng lote: Start Date/Time = oras ngayon, tapos kumukuha ng baseline ng
 *      Calib, CLO1A, at CLO1A1.
 *   3) Kada CONFIG.SCAN_INTERVAL_MS: hinahanap ang mga bagong file at folder at ipinapakita sa RESULT.
 *   4) NEW LOTE button: nililinis ang form at ang RESULT para sa susunod na scan (kapareho ng macro).
 * INPUT:   pc (galing sa registry), panelHost (lalagyan), panelTemplate (<template>)
 * OUTPUT:  { setVisible(isVisible), focusNextField() }
 * TANDAAN: Ang mga folder ay pinipili ng user gamit ang "Pick folder" (kailangan ng Chrome o Edge).
 *          Ang laman ng Path text box ay pang-display lang; ang tunay na binabasa ay ang piniling folder.
 */
import { CONFIG } from "./config.js";
import { detectSqlInjection } from "./sqlInjectionDetector.js";
import { showToast } from "./toast.js";
import { saveFolderHandle, loadFolderHandle } from "./folderHandleStore.js";
import { checkReadAccess, scanFolderTree, findNewItems, resolveCreatedMoment } from "./folderScanner.js";

const emptyCellMark = "—";

/** padTwo — 5 -> "05" */
function padTwo(numberValue) {
  return String(numberValue).padStart(2, "0");
}
/** formatDate — "2026-11-17" */
function formatDate(dateValue) {
  return dateValue.getFullYear() + "-" + padTwo(dateValue.getMonth() + 1) + "-" + padTwo(dateValue.getDate());
}
/** formatTime — "08:10:05" */
function formatTime(dateValue) {
  return padTwo(dateValue.getHours()) + ":" + padTwo(dateValue.getMinutes()) + ":" + padTwo(dateValue.getSeconds());
}

/**
 * parseWaferInfo
 * Kinukuha ang Wafer, Layer No., at Blk sa pangalan ng file/folder (hal. 4A25C20A).
 * Kapag hindi tugma ang pangalan, walang laman ang tatlo (gaya ng macro).
 */
function parseWaferInfo(itemName) {
  const matchResult = CONFIG.FILE_NAME_PATTERN.exec(itemName);
  if (!matchResult) {
    return { wafer: "", layerNo: "", blk: "" };
  }
  return { wafer: matchResult[1].toUpperCase(), layerNo: matchResult[2], blk: matchResult[3].toUpperCase() };
}

/**
 * keepFieldSafe
 * Pinipigilan ang mapanganib na input: kapag nabigo sa SQL injection check o whitelist
 * ng uri ng field, ibinabalik nang tahimik sa huling ligtas na laman.
 */
function keepFieldSafe(inputField, fieldType) {
  inputField.dataset.lastSafeValue = inputField.value;
  inputField.addEventListener("input", function () {
    if (detectSqlInjection(inputField.value, fieldType).isSafe) {
      inputField.dataset.lastSafeValue = inputField.value;
    } else {
      inputField.value = inputField.dataset.lastSafeValue;
    }
  });
}

/** onEnterKey — tumatawag ng callback kapag Enter ang pinindot sa field. */
function onEnterKey(inputField, callback) {
  inputField.addEventListener("keydown", function (keyEvent) {
    if (keyEvent.key !== "Enter" || keyEvent.isComposing) {
      return;
    }
    keyEvent.preventDefault();
    callback();
  });
}

export function createMwwPanel(pc, panelHost, panelTemplate) {
  const panelElement = panelTemplate.content.firstElementChild.cloneNode(true);
  panelElement.setAttribute(CONFIG.DATA_ATTRIBUTES.pcId, pc.id);
  panelHost.appendChild(panelElement);

  const selectors = CONFIG.SELECTORS;
  const barcodeInput = panelElement.querySelector(selectors.barcodeInput);
  const operatorInput = panelElement.querySelector(selectors.operatorInput);
  const machineNameInput = panelElement.querySelector(selectors.machineNameInput);
  const startDateInput = panelElement.querySelector(selectors.startDateInput);
  const startTimeInput = panelElement.querySelector(selectors.startTimeInput);
  const endDateInput = panelElement.querySelector(selectors.endDateInput);
  const endTimeInput = panelElement.querySelector(selectors.endTimeInput);
  const serverPathInput = panelElement.querySelector(selectors.serverPathInput);
  const databasePathInput = panelElement.querySelector(selectors.databasePathInput);
  const newLoteButton = panelElement.querySelector(selectors.newLoteButton);
  const resultBody = panelElement.querySelector(selectors.resultBody);
  const resultEmptyState = panelElement.querySelector(selectors.resultEmptyState);
  const scanStatusLine = panelElement.querySelector(selectors.scanStatus);

  // key ng watch path (calib, clo1a, clo1a1) -> text box ng path
  const watchPathInputs = new Map();
  // key -> folder handle na pinili ng user
  const linkedFolders = new Map();
  // key -> Map ng laman ng folder noong nagsimula ang lote
  const baselineItems = new Map();
  // "key|relativePath" -> { sourceKey, name, kind, relativePath, createdMoment }
  const foundItems = new Map();
  // mga babalang ipapakita sa status line (walang link, walang permission, masyadong malaki)
  let problemMessages = [];

  let loteStartMoment = null;
  let scanTimerId = null;
  let isScanning = false;
  let isStartingLote = false;

  /* ===================== SETUP NG MGA FIELD ===================== */

  machineNameInput.value = pc.name;
  serverPathInput.value = CONFIG.DEFAULT_SERVER_PATH;
  databasePathInput.value = CONFIG.DEFAULT_DATABASE_PATH;

  CONFIG.WATCH_PATHS.forEach(function (watchPath) {
    const pathInput = panelElement.querySelector('[' + CONFIG.DATA_ATTRIBUTES.field + '="' + watchPath.fieldName + '"]');
    pathInput.value = watchPath.defaultPath;
    watchPathInputs.set(watchPath.key, pathInput);
    keepFieldSafe(pathInput, "networkPath");
  });

  keepFieldSafe(barcodeInput, "barcode");
  keepFieldSafe(operatorInput, "operator");
  keepFieldSafe(machineNameInput, "machineName");
  keepFieldSafe(serverPathInput, "networkPath");
  keepFieldSafe(databasePathInput, "networkPath");

  /* ===================== PAGPILI NG FOLDER ===================== */

  /** buildHandleKey — susi sa IndexedDB: bawat PC at bawat watch path ay may sariling handle. */
  function buildHandleKey(watchPathKey) {
    return pc.id + ":" + watchPathKey;
  }

  /** showPickStatus — ang maliit na text sa ilalim ng path row ("Naka-link: Calib" o "Hindi pa napipili"). */
  function showPickStatus(watchPathKey, statusText, isLinked) {
    const statusElement = panelElement.querySelector('[' + CONFIG.DATA_ATTRIBUTES.pickStatus + '="' + watchPathKey + '"]');
    statusElement.textContent = statusText;
    statusElement.classList.toggle("isLinked", isLinked);
  }

  /**
   * takeBaseline
   * Kumukuha ng larawan ng laman ng folder ngayon. Ang lahat ng nandito na ay HINDI bago.
   */
  async function takeBaseline(watchPath) {
    const scanResult = await scanFolderTree(linkedFolders.get(watchPath.key));
    baselineItems.set(watchPath.key, scanResult.items);
    if (scanResult.isTruncated) {
      problemMessages.push(watchPath.label + ": sobrang dami ng laman, bahagi lang ang na-scan.");
    }
  }

  /**
   * pickFolder
   * Bubuksan ang folder picker ng browser. Ise-save ang napili para hindi na ulit pumili sa susunod.
   */
  async function pickFolder(watchPath) {
    if (typeof window.showDirectoryPicker !== "function") {
      showToast("✕ " + CONFIG.MESSAGES.browserNotSupported, "error");
      return;
    }
    try {
      const folderHandle = await window.showDirectoryPicker({ id: watchPath.key, mode: "read" });
      linkedFolders.set(watchPath.key, folderHandle);
      await saveFolderHandle(buildHandleKey(watchPath.key), folderHandle);
      showPickStatus(watchPath.key, "Naka-link: " + folderHandle.name, true);
      showToast("✓ " + CONFIG.MESSAGES.folderPicked + " " + watchPath.label, "success");

      // May tumatakbong lote na: simulan ding bantayan ang bagong link na folder mula ngayon
      if (loteStartMoment) {
        problemMessages = problemMessages.filter(function (message) { return !message.startsWith(watchPath.label + ":"); });
        await takeBaseline(watchPath);
        runScanTick();
      }
    } catch (error) {
      // Isinara lang ng user ang picker; hindi ito error
      if (error.name !== "AbortError") {
        console.error("mwwPanel: hindi mapili ang folder", error);
        showToast("✕ " + CONFIG.MESSAGES.unexpectedError, "error");
      }
    }
  }

  panelElement.querySelectorAll(CONFIG.SELECTORS.pickFolderButton).forEach(function (pickButton) {
    const watchPath = CONFIG.WATCH_PATHS.find(function (candidate) {
      return candidate.key === pickButton.getAttribute(CONFIG.DATA_ATTRIBUTES.pickKey);
    });
    pickButton.addEventListener("click", function () { pickFolder(watchPath); });
  });

  /** restoreLinkedFolders — ibinabalik ang mga folder na napili na noon (hihingi na lang ng permission pag nag-start). */
  async function restoreLinkedFolders() {
    for (const watchPath of CONFIG.WATCH_PATHS) {
      const storedHandle = await loadFolderHandle(buildHandleKey(watchPath.key));
      if (storedHandle) {
        linkedFolders.set(watchPath.key, storedHandle);
        showPickStatus(watchPath.key, "Naka-link: " + storedHandle.name, true);
      }
    }
  }
  restoreLinkedFolders();

  /* ===================== RESULT TABLE ===================== */

  /** buildDisplayPath — path na ipapakita: ang nakasulat na path + ang relative path ng item. */
  function buildDisplayPath(record) {
    const basePath = watchPathInputs.get(record.sourceKey).value.trim();
    return basePath + "\\" + record.relativePath.split("/").join("\\");
  }

  /** buildResultRow — isang <tr>. Gumagamit ng textContent para hindi malusutan ng HTML mula sa pangalan ng file. */
  function buildResultRow(record) {
    const waferInfo = parseWaferInfo(record.name);
    const watchPath = CONFIG.WATCH_PATHS.find(function (candidate) { return candidate.key === record.sourceKey; });
    const cellTexts = [
      watchPath.label,
      formatDate(record.createdMoment) + " " + formatTime(record.createdMoment),
      record.kind === "directory" ? "Folder" : "File",
      buildDisplayPath(record),
      waferInfo.wafer || emptyCellMark,
      waferInfo.blk || emptyCellMark,
      waferInfo.layerNo || emptyCellMark,
      record.name
    ];
    const rowElement = document.createElement("tr");
    cellTexts.forEach(function (cellText, cellIndex) {
      const cellElement = document.createElement("td");
      cellElement.textContent = cellText;
      if (cellIndex === 3) {
        cellElement.className = "pathCell";
      }
      rowElement.appendChild(cellElement);
    });
    return rowElement;
  }

  /** renderResults — pinakaluma sa taas (gaya ng macro), hanggang CONFIG.MAX_RESULT_ROWS lang. */
  function renderResults() {
    const sortedRecords = Array.from(foundItems.values()).sort(function (firstRecord, secondRecord) {
      return firstRecord.createdMoment - secondRecord.createdMoment;
    });
    const visibleRecords = sortedRecords.slice(0, CONFIG.MAX_RESULT_ROWS);
    resultBody.replaceChildren(...visibleRecords.map(buildResultRow));
    resultEmptyState.classList.toggle(CONFIG.CSS_CLASSES.hidden, visibleRecords.length > 0);
  }

  /** renderScanStatus — isang linya: ano ang binabantayan, ilan ang nakita, at anong babala. */
  function renderScanStatus(checkMoment) {
    const watchedLabels = CONFIG.WATCH_PATHS
      .filter(function (watchPath) { return baselineItems.has(watchPath.key); })
      .map(function (watchPath) { return watchPath.label; });
    const statusParts = [];
    if (watchedLabels.length > 0) {
      statusParts.push("Nagbabantay: " + watchedLabels.join(", "));
      statusParts.push(foundItems.size + " bagong file/folder");
      if (foundItems.size > CONFIG.MAX_RESULT_ROWS) {
        statusParts.push("unang " + CONFIG.MAX_RESULT_ROWS + " lang ang ipinapakita");
      }
      if (checkMoment) {
        statusParts.push("huling check " + formatTime(checkMoment));
      }
    }
    scanStatusLine.textContent = statusParts.concat(problemMessages).join("  ·  ");
  }

  /* ===================== PAG-SCAN ===================== */

  /**
   * runScanTick
   * Isang pag-check ng lahat ng binabantayang folder. Ang item na wala sa baseline ay bago.
   * Hindi nag-o-overlap: kapag may tumatakbo pang scan, lalaktawan ito.
   * Ang item na nawala na sa folder (binura o inilipat) ay inaalis din sa RESULT.
   */
  async function runScanTick() {
    if (isScanning || !loteStartMoment) {
      return;
    }
    isScanning = true;
    const runStartMoment = loteStartMoment;
    const checkMoment = new Date();
    try {
      for (const watchPath of CONFIG.WATCH_PATHS) {
        if (!baselineItems.has(watchPath.key)) {
          continue;
        }
        const scanResult = await scanFolderTree(linkedFolders.get(watchPath.key));
        const newItems = findNewItems(baselineItems.get(watchPath.key), scanResult.items);

        // Nagsimula ng ibang lote habang nag-i-scan: itapon ang resulta ng luma
        if (runStartMoment !== loteStartMoment) {
          return;
        }

        const stillPresentKeys = new Set();
        for (const newItem of newItems) {
          const recordKey = watchPath.key + "|" + newItem.relativePath;
          stillPresentKeys.add(recordKey);
          if (!foundItems.has(recordKey)) {
            const createdMoment = await resolveCreatedMoment(newItem, runStartMoment, checkMoment);
            foundItems.set(recordKey, {
              sourceKey: watchPath.key,
              name: newItem.name,
              kind: newItem.kind,
              relativePath: newItem.relativePath,
              createdMoment: createdMoment
            });
          }
        }
        // Alisin ang mga item ng source na ito na wala na sa folder
        Array.from(foundItems.keys()).forEach(function (recordKey) {
          if (recordKey.startsWith(watchPath.key + "|") && !stillPresentKeys.has(recordKey)) {
            foundItems.delete(recordKey);
          }
        });
      }
      if (runStartMoment === loteStartMoment) {
        renderResults();
        renderScanStatus(checkMoment);
      }
    } catch (error) {
      console.error("mwwPanel: pumalya ang scan", error);
    } finally {
      isScanning = false;
    }
  }

  function stopScanning() {
    if (scanTimerId !== null) {
      clearInterval(scanTimerId);
      scanTimerId = null;
    }
  }

  /**
   * prepareBaselines
   * Para sa bawat watch path: humihingi ng permission, tapos kumukuha ng baseline.
   * Una ang lahat ng permission request (kailangan pa ang pindot/Enter ng user), bago ang mabagal na pag-scan.
   */
  async function prepareBaselines() {
    problemMessages = [];
    const readyWatchPaths = [];
    const notLinkedLabels = [];

    for (const watchPath of CONFIG.WATCH_PATHS) {
      const folderHandle = linkedFolders.get(watchPath.key);
      if (!folderHandle) {
        notLinkedLabels.push(watchPath.label);
        continue;
      }
      if (await checkReadAccess(folderHandle, true)) {
        readyWatchPaths.push(watchPath);
      } else {
        problemMessages.push(watchPath.label + ": walang pahintulot sa folder.");
        showToast("⚠ " + CONFIG.MESSAGES.folderPermissionDenied + " " + watchPath.label, "warning");
      }
    }
    if (notLinkedLabels.length > 0) {
      problemMessages.push("Walang link: " + notLinkedLabels.join(", ") + " (pindutin ang Pick folder)");
      showToast("⚠ " + CONFIG.MESSAGES.foldersNotLinked + " " + notLinkedLabels.join(", "), "warning");
    }
    for (const watchPath of readyWatchPaths) {
      await takeBaseline(watchPath);
    }
  }

  /* ===================== LOTE ===================== */

  /**
   * startLote
   * Tinatawag kapag Enter sa Operator. Kailangan ng Machine, Barcode, at Operator (gaya ng macro).
   * Stamp ng Start Date/Time = ngayon, linilinis ang End, tapos nagsisimula ang pagbabantay ng mga folder.
   */
  async function startLote() {
    if (isStartingLote) {
      return;
    }
    const machineValue = machineNameInput.value.trim();
    const barcodeValue = barcodeInput.value.trim();
    const operatorValue = operatorInput.value.trim();

    if (!machineValue) { showToast("✕ " + CONFIG.MESSAGES.machineRequired, "error"); machineNameInput.focus(); return; }
    if (!barcodeValue) { showToast("✕ " + CONFIG.MESSAGES.barcodeRequired, "error"); barcodeInput.focus(); return; }
    if (!operatorValue) { showToast("✕ " + CONFIG.MESSAGES.operatorRequired, "error"); operatorInput.focus(); return; }

    // Huling harang bago magsimula (ang live filter sa itaas ay unang harang lang)
    const isAllSafe = detectSqlInjection(machineValue, "machineName").isSafe &&
      detectSqlInjection(barcodeValue, "barcode").isSafe &&
      detectSqlInjection(operatorValue, "operator").isSafe;
    if (!isAllSafe) {
      showToast("✕ " + CONFIG.MESSAGES.inputNotAllowed, "error");
      return;
    }

    isStartingLote = true;
    try {
      stopScanning();
      const startMoment = new Date();
      loteStartMoment = startMoment;
      startDateInput.value = formatDate(startMoment);
      startTimeInput.value = formatTime(startMoment);
      endDateInput.value = "";
      endTimeInput.value = "";

      foundItems.clear();
      baselineItems.clear();
      renderResults();
      scanStatusLine.textContent = "Kumukuha ng listahan ng mga folder...";

      await prepareBaselines();
      if (loteStartMoment !== startMoment) {
        return;
      }

      renderScanStatus(null);
      scanTimerId = setInterval(runScanTick, CONFIG.SCAN_INTERVAL_MS);
      showToast("✓ " + CONFIG.MESSAGES.loteStarted + " " + barcodeValue + " (" + machineValue + ").", "success");

      // Handa na agad sa susunod na scan ng Barcode
      barcodeInput.focus();
      barcodeInput.select();
    } finally {
      isStartingLote = false;
    }
  }

  /**
   * resetForNextLote
   * NEW LOTE button (kapareho ng startNewLote ng macro): nililinis ang Barcode, Operator, Start Date/Time,
   * at ang RESULT; itinitigil ang pagbabantay. Ang End Date/Time ay hindi ginagalaw. Cursor ay bumabalik sa Barcode.
   */
  function resetForNextLote() {
    stopScanning();
    loteStartMoment = null;
    barcodeInput.value = "";
    operatorInput.value = "";
    barcodeInput.dataset.lastSafeValue = "";
    operatorInput.dataset.lastSafeValue = "";
    startDateInput.value = "";
    startTimeInput.value = "";
    foundItems.clear();
    baselineItems.clear();
    problemMessages = [];
    renderResults();
    scanStatusLine.textContent = "";
    barcodeInput.focus();
    showToast("✓ " + CONFIG.MESSAGES.loteReady, "success");
  }

  newLoteButton.addEventListener("click", resetForNextLote);

  /* ===================== DALOY NG ENTER AT AUTOFOCUS ===================== */

  // Machine -> Barcode
  onEnterKey(machineNameInput, function () {
    if (!machineNameInput.value.trim()) {
      showToast("✕ " + CONFIG.MESSAGES.machineRequired, "error");
      return;
    }
    barcodeInput.focus();
    barcodeInput.select();
  });
  // Barcode -> Operator (ang barcode scanner ay nagpapadala ng Enter pagkatapos mag-scan)
  onEnterKey(barcodeInput, function () {
    if (!barcodeInput.value.trim()) {
      showToast("✕ " + CONFIG.MESSAGES.barcodeRequired, "error");
      return;
    }
    operatorInput.focus();
    operatorInput.select();
  });
  // Operator -> simula ng lote
  onEnterKey(operatorInput, startLote);

  /**
   * focusNextField
   * Ang susunod na field na dapat lagyan: Machine kung walang laman, tapos Barcode,
   * tapos Operator. Kung puno na lahat, Barcode (handa sa susunod na scan).
   */
  function focusNextField() {
    if (!machineNameInput.value.trim()) {
      machineNameInput.focus();
    } else if (!barcodeInput.value.trim()) {
      barcodeInput.focus();
    } else if (!operatorInput.value.trim()) {
      operatorInput.focus();
    } else {
      barcodeInput.focus();
      barcodeInput.select();
    }
  }

  /** setVisible — ipinapakita o itinatago ang panel na ito (isa lang ang nakikita kada tab). */
  function setVisible(isVisible) {
    panelElement.classList.toggle(CONFIG.CSS_CLASSES.hidden, !isVisible);
  }

  renderResults();
  return { setVisible: setVisible, focusNextField: focusNextField };
}
