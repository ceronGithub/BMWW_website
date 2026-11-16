/**
 * FILE: js/mwwView.js
 * PURPOSE: MWW PC screen — NEW LOTE button, input filter, RESULT table rendering.
 * DESIGN PREVIEW: NEW LOTE only fills Start Date/Time. Scanning and sending come later.
 */
(function () {
  const lotTracking = window.lotTracking;

  // Characters blocked in typed fields (XSS/injection guard). Silently stripped.
  const forbiddenCharacters = /[<>{}[\]/\\;'"`=]/g;

  ["barcodeInput", "operatorInput", "machineNameInput"].forEach(function (inputId) {
    const inputField = document.getElementById(inputId);
    inputField.addEventListener("input", function () {
      inputField.value = inputField.value.replace(forbiddenCharacters, "");
    });
  });

  // Path and PC IP fields must keep backslashes (C:\folder\sub, \\10.120.8.46), so they use a lighter filter:
  // everything else on the forbidden list is still stripped silently.
  const forbiddenPathCharacters = /[<>{}[\];'"`=]/g;

  ["filePath1Input", "filePath2Input", "serverPathInput", "databasePathInput",
   "leadPc1IpInput", "leadPc2IpInput", "mww1IpInput", "mww2IpInput"].forEach(function (inputId) {
    const pathField = document.getElementById(inputId);
    pathField.addEventListener("input", function () {
      pathField.value = pathField.value.replace(forbiddenPathCharacters, "");
    });
  });

  function formatDate(dateValue) {
    return dateValue.getFullYear() + "-" +
      String(dateValue.getMonth() + 1).padStart(2, "0") + "-" +
      String(dateValue.getDate()).padStart(2, "0");
  }
  function formatTime(dateValue) {
    return [dateValue.getHours(), dateValue.getMinutes(), dateValue.getSeconds()]
      .map(function (part) { return String(part).padStart(2, "0"); }).join(":");
  }

  /**
   * NEW LOTE
   * A lot can only start when Barcode, Operator and Machine Name are filled in
   * (same rule as the Excel macro). Stamps Start Date/Time with the current time.
   */
  document.getElementById("newLoteButton").addEventListener("click", function () {
    const barcodeValue = document.getElementById("barcodeInput").value.trim();
    const operatorValue = document.getElementById("operatorInput").value.trim();
    const machineValue = document.getElementById("machineNameInput").value.trim();

    if (!machineValue) { lotTracking.showToast("✕ Lagyan muna ng Machine Name.", "error"); return; }
    if (!barcodeValue) { lotTracking.showToast("✕ I-scan o i-type muna ang Barcode.", "error"); return; }
    if (!operatorValue) { lotTracking.showToast("✕ Lagyan muna ng Operator.", "error"); return; }

    const rightNow = new Date();
    document.getElementById("startDateInput").value = formatDate(rightNow);
    document.getElementById("startTimeInput").value = formatTime(rightNow);
    document.getElementById("endDateInput").value = "";
    document.getElementById("endTimeInput").value = "";
    lotTracking.showToast("✓ Lote " + barcodeValue + " started on " + machineValue + ".", "success");
  });

  const sampleMwwRows = [
    { source: "Folder", dateCreated: "2026-11-16 08:12", type: "Folder", path: "C:\\BM-Logging\\CLO1A\\4A25C", wafer: "4A25C", blk: "A", layerNo: "12", fileName: "4A25C" },
    { source: "File",   dateCreated: "2026-11-16 08:14", type: ".csv",   path: "C:\\BM-Logging\\CLO1A\\4A25C", wafer: "4A25C", blk: "A", layerNo: "12", fileName: "4A25C_A_L12.csv" },
    { source: "File",   dateCreated: "2026-11-16 08:31", type: ".csv",   path: "C:\\BM-Logging\\CLO1A1\\4A26B", wafer: "4A26B", blk: "A", layerNo: "13", fileName: "4A26B_A_L13.csv" }
  ];

  /** renderMwwRows — fills the RESULT table, or shows the empty state when there are no rows. */
  function renderMwwRows(rows) {
    const tableBody = document.getElementById("mwwResultBody");
    tableBody.innerHTML = rows.map(function (row) {
      return "<tr><td>" + row.source + "</td><td>" + row.dateCreated + "</td><td>" + row.type +
        "</td><td class=\"pathCell\">" + row.path + "</td><td>" + row.wafer + "</td><td>" + row.blk +
        "</td><td>" + row.layerNo + "</td><td>" + row.fileName + "</td></tr>";
    }).join("");
    document.getElementById("mwwEmptyState").classList.toggle("isHidden", rows.length > 0);
  }

  lotTracking.loadMwwSample = function () {
    const rightNow = new Date();
    document.getElementById("barcodeInput").value = "LOT240116A";
    document.getElementById("operatorInput").value = "Ceron";
    document.getElementById("startDateInput").value = formatDate(rightNow);
    document.getElementById("startTimeInput").value = "08:10:05";
    document.getElementById("endDateInput").value = formatDate(rightNow);
    document.getElementById("endTimeInput").value = "00:41:34";
    renderMwwRows(sampleMwwRows);
  };
  lotTracking.clearMwwSample = function () {
    ["barcodeInput", "operatorInput", "startDateInput", "endDateInput", "startTimeInput", "endTimeInput"]
      .forEach(function (fieldId) { document.getElementById(fieldId).value = ""; });
    renderMwwRows([]);
  };

  renderMwwRows([]);
})();