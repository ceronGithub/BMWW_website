/*
 * FILE    : js/core/send-log.js
 * PURPOSE : Nagdaragdag ng tala ng naipadala na file sa <Saving path>\logs\send-log.txt
 * DEPENDS : js/core/config.js
 * INPUT   : Saving path (BMWW) folder handle at listahan ng item na naipadala
 * OUTPUT  : isang linya kada file: [yyyy-mm-dd hh:mm:ss] | machine | status | file | galing | destination
 * VERSION : v2.9 | 2026-11-21 | bagong file
 * NOTE    : Dagdag lang sa dulo ng file; walang binubura o pinapalitan sa naunang tala.
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const LOG = CONFIG.FILE_SEARCH.LOG;

  // Dalawang digit na numero.
  function pad(number) {
    return String(number).padStart(2, '0');
  }

  // yyyy-mm-dd hh:mm:ss
  function formatStamp(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  // Tinatanggal ang line break at ang separator sa text para hindi masira ang linya.
  function cleanField(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[\r\n]+/g, ' ').split(LOG.SEPARATOR.trim()).join('/');
  }

  // Gumagawa ng isang linya ng log.
  function buildLine(stamp, machineName, item, destinationLabel) {
    return '[' + formatStamp(stamp) + ']' + LOG.SEPARATOR + [machineName, item.status, item.name, item.folderPath, destinationLabel].map(cleanField).join(LOG.SEPARATOR);
  }

  // Idinadagdag ang mga linya sa dulo ng send-log.txt (ginagawa ang logs folder at file kung wala pa).
  async function appendLog(rootHandle, machineName, itemList, destinationLabel) {
    const lineList = itemList.map((item) => buildLine(new Date(), machineName, item, destinationLabel));
    if (lineList.length === 0) return;
    const folder = await rootHandle.getDirectoryHandle(LOG.FOLDER, { create: true });
    const fileHandle = await folder.getFileHandle(LOG.FILE, { create: true });
    const existingSize = (await fileHandle.getFile()).size;
    const writable = await fileHandle.createWritable({ keepExistingData: true });
    try {
      await writable.seek(existingSize);
      await writable.write(lineList.join(LOG.LINE_END) + LOG.LINE_END);
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { /* walang magagawa */ }
      throw error;
    }
  }

  // Lokasyon ng log para sa mensahe.
  function getLogLocation(rootPath) {
    return (rootPath || '') + (rootPath ? CONFIG.PATH_SEPARATOR : '') + LOG.FOLDER + CONFIG.PATH_SEPARATOR + LOG.FILE;
  }

  root.sendLog = Object.freeze({ appendLog, getLogLocation });
})();
