/*
 * FILE    : js/core/lot-send.js
 * PURPOSE : Send ng LOT Unit sa Server path (SERVER lang): kinokopya ang file o folder ng unit, kasama ang _Time
 * DEPENDS : js/core/config.js, js/core/file-sender.js, js/core/lot-config.js
 * USED BY : js/pages/lot-tracking.js
 * VERSION : v1 | 2026-11-23 | bagong file (Yugto 4)
 * NOTE    : Basa lang ang source (Data source). Ang kapangalan sa destination ay papalitan lang kung overwrite = true.
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const TYPE = CONFIG.FILE_SEARCH.TYPE;
  const STATUS = CONFIG.FILE_SEARCH.STATUS;
  const SEND = root.lotConfig.SEND;

  /**
   * PARA SAAN    : buuin ang listahan ng ipapadala ng isang LOT Unit
   * GINAGAWA     : kinukuha ang lahat ng file/folder ng unit (X at X_Time) na may handle; walang doble ang pangalan
   * INPUT/OUTPUT : unitRow { itemList } -> [{ name, type, handle }]
   * TINATAWAG NG : lot-tracking.js onSendClick
   * TUMATAWAG SA : wala
   */
  function buildSendList(unitRow) {
    const seenNameSet = new Set();
    const sendList = [];
    (unitRow.itemList || []).forEach((item) => {
      if (!item.handle || seenNameSet.has(item.fileName.toLowerCase())) return;
      seenNameSet.add(item.fileName.toLowerCase());
      sendList.push({ name: item.fileName, type: item.type, handle: item.handle });
    });
    return sendList;
  }

  /**
   * PARA SAAN    : alamin kung may kapangalan na sa destination
   * GINAGAWA     : file = getFileHandle; folder = getDirectoryHandle; NotFoundError = wala
   * INPUT/OUTPUT : (destinationHandle, item) -> Promise<bool>
   * TINATAWAG NG : lot-send.js countExisting, copyFolder
   * TUMATAWAG SA : wala
   */
  async function entryExists(destinationHandle, item) {
    try {
      if (item.type === TYPE.folder) await destinationHandle.getDirectoryHandle(item.name);
      else await destinationHandle.getFileHandle(item.name);
      return true;
    } catch (error) {
      if (error && (error.name === 'NotFoundError' || error.name === 'TypeMismatchError')) return error.name === 'TypeMismatchError';
      throw error;
    }
  }

  /**
   * PARA SAAN    : bilangin ang mga kapangalan na sa destination (para sa tanong na papalitan ba)
   * GINAGAWA     : tinitingnan ang bawat item ng listahan
   * INPUT/OUTPUT : (sendList, destinationHandle) -> Promise<number>
   * TINATAWAG NG : lot-tracking.js onSendClick
   * TUMATAWAG SA : lot-send.js entryExists
   */
  async function countExisting(sendList, destinationHandle) {
    let count = 0;
    for (const item of sendList) {
      if (await entryExists(destinationHandle, item)) count += 1;
    }
    return count;
  }

  /**
   * PARA SAAN    : kopyahin ang laman ng isang folder (recursive) sa destination folder
   * GINAGAWA     : bawat file ay kinokopya sa pamamagitan ng stream; ang subfolder ay recursive hanggang SEND.MAX_DEPTH; basa lang ang source
   * INPUT/OUTPUT : (sourceDir, targetDir, depth) -> Promise<void> (nagtatapon ng error kapag pumalya)
   * TINATAWAG NG : lot-send.js copyFolder
   * TUMATAWAG SA : lot-send.js copyDirectoryContent (sarili)
   */
  async function copyDirectoryContent(sourceDir, targetDir, depth) {
    for await (const entry of sourceDir.values()) {
      if (entry.kind === 'file') {
        const sourceFile = await entry.getFile();
        const targetHandle = await targetDir.getFileHandle(entry.name, { create: true });
        const writable = await targetHandle.createWritable();
        await sourceFile.stream().pipeTo(writable);
      } else if (depth < SEND.MAX_DEPTH) {
        const childDir = await targetDir.getDirectoryHandle(entry.name, { create: true });
        await copyDirectoryContent(entry, childDir, depth + 1);
      }
    }
  }

  /**
   * PARA SAAN    : kopyahin ang isang folder ng unit sa destination
   * GINAGAWA     : may kapangalan at walang overwrite = EXISTS; kapag pumalya at bagong gawa ang folder, binubura ang kalahating kopya
   * INPUT/OUTPUT : (item { name, handle }, destinationHandle, overwrite) -> Promise<status ng FILE_SEARCH.STATUS>
   * TINATAWAG NG : lot-send.js sendUnit
   * TUMATAWAG SA : lot-send.js entryExists, copyDirectoryContent
   */
  async function copyFolder(item, destinationHandle, overwrite) {
    const hasExisting = await entryExists(destinationHandle, item);
    if (hasExisting && !overwrite) return STATUS.exists;
    let isCreated = false;
    try {
      const targetDir = await destinationHandle.getDirectoryHandle(item.name, { create: true });
      isCreated = !hasExisting;
      await copyDirectoryContent(item.handle, targetDir, 0);
      return hasExisting ? STATUS.replaced : STATUS.sent;
    } catch (error) {
      if (isCreated) {
        try { await destinationHandle.removeEntry(item.name, { recursive: true }); } catch (removeError) { /* walang magagawa */ }
      }
      return STATUS.failed;
    }
  }

  /**
   * PARA SAAN    : ipadala ang lahat ng file/folder ng isang LOT Unit sa Server path
   * GINAGAWA     : file ay sa pamamagitan ng fileSender.sendItems; folder ay copyFolder. Naipadala lang (isSent) kung SENT o REPLACED ang LAHAT; ang kahit isang FAILED o EXISTS ay hindi
   * INPUT/OUTPUT : (sendList, destinationHandle, overwrite) -> Promise<{ isSent, sentCount, existsCount, failedCount }>
   * TINATAWAG NG : lot-tracking.js onSendClick
   * TUMATAWAG SA : fileSender.sendItems, lot-send.js copyFolder
   */
  async function sendUnit(sendList, destinationHandle, overwrite) {
    const summary = { isSent: false, sentCount: 0, existsCount: 0, failedCount: 0 };
    const statusList = [];
    const fileList = sendList.filter((item) => item.type !== TYPE.folder);
    if (fileList.length > 0) {
      try {
        await root.fileSender.sendItems(fileList, destinationHandle, { isStopped: false }, overwrite, null);
        fileList.forEach((item) => statusList.push(item.status));
      } catch (error) {
        // Hindi masuri ang destination: ituring na FAILED ang lahat ng file (NOT SENT).
        fileList.forEach(() => statusList.push(STATUS.failed));
      }
    }
    for (const item of sendList.filter((entry) => entry.type === TYPE.folder)) {
      statusList.push(await copyFolder(item, destinationHandle, overwrite));
    }
    statusList.forEach((status) => {
      if (status === STATUS.sent || status === STATUS.replaced) summary.sentCount += 1;
      else if (status === STATUS.exists) summary.existsCount += 1;
      else summary.failedCount += 1;
    });
    summary.isSent = statusList.length > 0 && summary.sentCount === statusList.length;
    return summary;
  }

  root.lotSend = Object.freeze({ buildSendList, countExisting, sendUnit });
})();
