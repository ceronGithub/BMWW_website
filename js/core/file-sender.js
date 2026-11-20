/*
 * FILE    : js/core/file-sender.js
 * PURPOSE : Nagkokopya ng napiling file papunta sa destination folder (Server path ng Settings o manual na folder)
 * DEPENDS : js/core/config.js
 * INPUT   : destination folder handle at listahan ng item (galing sa file-scanner)
 * OUTPUT  : status kada item: SENT, EXISTS (hindi pinalitan), FAILED
 * VERSION : v2.8 | 2026-11-20 | bagong file
 * VERSION : v2.9 | 2026-11-21 | overwrite (REPLACED) kapag pumayag ang user; ang kapangalan sa loob ng parehong padala ay hindi pinapatungan
 * NOTE    : Kopya lang ito. Read-only ang source (Rule 7). Ang kapangalan sa destination ay papalitan lang kung overwrite = true.
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const SEARCH = CONFIG.FILE_SEARCH;

  // Ang destination ba ay mismong source folder (o nasa loob nito)? Para hindi magkopya sa sarili.
  async function isInsideSource(destinationHandle, sourceHandleList) {
    for (const sourceHandle of sourceHandleList) {
      try {
        if (await sourceHandle.isSameEntry(destinationHandle)) return true;
        const relative = await sourceHandle.resolve(destinationHandle);
        if (relative !== null) return true;
      } catch (error) {
        // Hindi matiyak: ituloy (hindi ito sapat na dahilan para harangan).
      }
    }
    return false;
  }

  // Mayroon na bang file na may ganitong pangalan sa destination?
  async function fileExists(directoryHandle, fileName) {
    try {
      await directoryHandle.getFileHandle(fileName);
      return true;
    } catch (error) {
      if (error && error.name === 'NotFoundError') return false;
      throw error;
    }
  }

  // Ilan sa mga item ang may kapangalan na sa destination (file lang).
  async function countExisting(itemList, destinationHandle) {
    let count = 0;
    for (const item of itemList) {
      if (item.type === SEARCH.TYPE.file && (await fileExists(destinationHandle, item.name))) count += 1;
    }
    return count;
  }

  // Kinokopya ang isang file. Kapag may kapangalan: EXISTS (hindi pinapalitan) o REPLACED kung overwrite.
  // Ang pagsulat ay sa pamamagitan ng createWritable (may pansamantalang kopya; ang luma ay napapalitan lang kapag natapos).
  // Kapag may error sa bagong file na ginawa natin, binubura ang kalahating kopya.
  async function copyOne(item, destinationHandle, overwrite) {
    if (item.type !== SEARCH.TYPE.file || !item.handle) return SEARCH.STATUS.failed;
    const hasExisting = await fileExists(destinationHandle, item.name);
    if (hasExisting && !overwrite) return SEARCH.STATUS.exists;
    let isCreated = false;
    try {
      const sourceFile = await item.handle.getFile();
      const targetHandle = await destinationHandle.getFileHandle(item.name, { create: true });
      isCreated = !hasExisting;
      const writable = await targetHandle.createWritable();
      await sourceFile.stream().pipeTo(writable);
      return hasExisting ? SEARCH.STATUS.replaced : SEARCH.STATUS.sent;
    } catch (error) {
      if (isCreated) {
        try { await destinationHandle.removeEntry(item.name); } catch (removeError) { /* walang magagawa */ }
      }
      return SEARCH.STATUS.failed;
    }
  }

  // Ipinapadala ang listahan. onItem(item) ay tinatawag pagkatapos ng bawat file. control.isStopped = ihinto.
  // Kung dalawang napiling file ang magkapareho ang pangalan, ang una lang ang kokopyahin (EXISTS ang pangalawa), para walang magpatong.
  async function sendItems(itemList, destinationHandle, control, overwrite, onItem) {
    const summary = { sent: 0, replaced: 0, exists: 0, failed: 0, isStopped: false };
    const copiedNameList = new Set();
    for (const item of itemList) {
      if (control.isStopped) { summary.isStopped = true; break; }
      const nameKey = item.name.toLowerCase();
      if (copiedNameList.has(nameKey)) item.status = SEARCH.STATUS.exists;
      else item.status = await copyOne(item, destinationHandle, overwrite);
      if (item.status === SEARCH.STATUS.sent || item.status === SEARCH.STATUS.replaced) copiedNameList.add(nameKey);
      if (item.status === SEARCH.STATUS.sent) summary.sent += 1;
      else if (item.status === SEARCH.STATUS.replaced) summary.replaced += 1;
      else if (item.status === SEARCH.STATUS.exists) summary.exists += 1;
      else summary.failed += 1;
      if (onItem) onItem(item);
    }
    return summary;
  }

  // Humihingi ng write permission sa destination (dapat galing sa click).
  async function ensureWriteAccess(destinationHandle) {
    const options = { mode: 'readwrite' };
    if ((await destinationHandle.queryPermission(options)) === 'granted') return true;
    return (await destinationHandle.requestPermission(options)) === 'granted';
  }

  root.fileSender = Object.freeze({ isInsideSource, ensureWriteAccess, countExisting, sendItems });
})();
