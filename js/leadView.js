/**
 * FILE: js/leadView.js
 * PURPOSE: LEAD PC screen — monitoring notice, lots table, ongoing status per machine.
 * DESIGN PREVIEW: data comes from the sample button; later it will be read from the daily MONITORING file.
 */
(function () {
  const lotTracking = window.lotTracking;
  const monitoringFolder = "C:\\Users\\Ceron Calsena\\OneDrive\\Desktop\\BM_ANALYZER_Files\\Tracking_lot\\";

  /** todayFileName — builds ddmmyyyy_MONITORING.xlsx for today's date. */
  function todayFileName() {
    const rightNow = new Date();
    return String(rightNow.getDate()).padStart(2, "0") +
      String(rightNow.getMonth() + 1).padStart(2, "0") +
      rightNow.getFullYear() + "_MONITORING.xlsx";
  }

  const sampleLeadRows = [
    { barcode: "LOT240116A", lotUnit: "1", wafer: "4A25C", blk: "A", layerNo: "12", startTime: "08:10:05", endTime: "08:51:39", duration: "41.6", operator: "Ceron", machine: "MWW 1", status: "Done",    filePath: "C:\\BM-Logging\\CLO1A\\4A25C" },
    { barcode: "LOT240116B", lotUnit: "1", wafer: "4A26B", blk: "A", layerNo: "13", startTime: "09:02:10", endTime: "",         duration: "",     operator: "Ana",   machine: "MWW 2", status: "Ongoing", filePath: "C:\\BM-Logging\\CLO1A1\\4A26B" }
  ];

  /** renderLeadRows — fills the lots table and toggles the empty state. */
  function renderLeadRows(rows) {
    document.getElementById("leadResultBody").innerHTML = rows.map(function (row) {
      const badgeClass = row.status === "Done" ? "isDone" : "isOngoing";
      return "<tr><td>" + row.barcode + "</td><td>" + row.lotUnit + "</td><td>" + row.wafer + "</td><td>" + row.blk +
        "</td><td>" + row.layerNo + "</td><td>" + row.startTime + "</td><td>" + (row.endTime || "—") +
        "</td><td>" + (row.duration || "—") + "</td><td>" + row.operator + "</td><td>" + row.machine +
        "</td><td><span class=\"statusBadge " + badgeClass + "\">" + row.status + "</span></td><td class=\"pathCell\">" +
        row.filePath + "</td></tr>";
    }).join("");
    document.getElementById("leadEmptyState").classList.toggle("isHidden", rows.length > 0);
  }

  /** renderOngoing — one line per machine: either the running lot or "no ongoing lot". */
  function renderOngoing(rows) {
    document.getElementById("ongoingStack").innerHTML = ["MWW 1", "MWW 2"].map(function (machineName) {
      const runningLot = rows.filter(function (row) { return row.machine === machineName && row.status === "Ongoing"; })[0];
      if (!runningLot) {
        return "<div class=\"ongoingRow\">" + machineName + " &nbsp;|&nbsp; Walang ONGOING na lote.</div>";
      }
      return "<div class=\"ongoingRow isRunning\">" + machineName + " &nbsp;|&nbsp; ONGOING: " + runningLot.barcode +
        "<span class=\"ongoingDetail\">Wafer " + runningLot.wafer + " · Layer " + runningLot.layerNo +
        " · Start " + runningLot.startTime + " · " + runningLot.operator + "</span></div>";
    }).join("");
  }

  /** renderNotice — tells the lead whether today's monitoring file exists yet. */
  function renderNotice(hasRows) {
    const notice = document.getElementById("monitoringNotice");
    notice.classList.toggle("isFound", hasRows);
    notice.textContent = hasRows
      ? "Monitoring file: " + monitoringFolder + todayFileName()
      : "Wala pang monitoring file para sa araw na ito: " + monitoringFolder + todayFileName();
  }

  function renderLead(rows) {
    renderNotice(rows.length > 0);
    renderLeadRows(rows);
    renderOngoing(rows);
  }

  lotTracking.loadLeadSample = function () { renderLead(sampleLeadRows); };
  lotTracking.clearLeadSample = function () { renderLead([]); };

  renderLead([]);
})();
