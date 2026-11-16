/**
 * FILE: js/folderScanner.js
 * ANO ITO: Taga-scan ng folder at taga-hanap ng BAGONG file at folder (kapareho ng
 *          modResultFileScanner ng Excel macro). BASA LANG: hindi nagsusulat o nagbubura.
 * PAANO:   Dahil hindi nagbibigay ng "date created" ang browser, ganito ang paraan:
 *          1) Sa pagsisimula ng lote, kumukuha ng LARAWAN (baseline) ng lahat ng nasa folder.
 *          2) Kada tick, kumukuha ulit ng larawan. Ang wala sa baseline = bago = ipapakita.
 * INPUT:   folderHandle (FileSystemDirectoryHandle mula sa folder picker)
 * OUTPUT:  tingnan ang bawat function sa ibaba.
 * TANDAAN: Kapareho ng macro: may subfolder hanggang CONFIG.MAX_SCAN_DEPTH, at nilalaktawan ang
 *          mga file na nasa IGNORED_FILE_NAMES / IGNORED_FILE_PREFIXES (hal. "~$").
 */
import { CONFIG } from "./config.js";

/** isIgnoredName — true kung dapat laktawan ang file/folder (temp file at iba pa). */
function isIgnoredName(itemName) {
  return CONFIG.IGNORED_FILE_NAMES.includes(itemName) ||
    CONFIG.IGNORED_FILE_PREFIXES.some(function (prefix) { return itemName.startsWith(prefix); });
}

/**
 * checkReadAccess
 * Tinitingnan kung may pahintulot nang magbasa sa folder. Kapag wala pa at shouldAsk = true,
 * hihingi ng permission (kailangang galing sa click o keypress ng user).
 */
export async function checkReadAccess(folderHandle, shouldAsk) {
  try {
    const accessOptions = { mode: "read" };
    if ((await folderHandle.queryPermission(accessOptions)) === "granted") {
      return true;
    }
    if (!shouldAsk) {
      return false;
    }
    return (await folderHandle.requestPermission(accessOptions)) === "granted";
  } catch (error) {
    console.error("folderScanner: hindi ma-check ang permission", error);
    return false;
  }
}

/**
 * scanFolderTree
 * Nililista ang lahat ng file at subfolder sa loob ng folder (hanggang MAX_SCAN_DEPTH).
 * Ibinabalik: { items: Map(relativePath -> { name, kind, relativePath, handle }), isTruncated }
 * isTruncated = true kapag lumampas sa CONFIG.MAX_SCAN_ENTRIES at itinigil ang pag-scan.
 * Ang folder na hindi mabasa (walang permission) ay nilalaktawan, tuloy ang iba (gaya ng macro).
 */
export async function scanFolderTree(rootHandle) {
  const items = new Map();
  let isTruncated = false;

  async function walkFolder(folderHandle, pathPrefix, depth) {
    try {
      for await (const [entryName, entryHandle] of folderHandle.entries()) {
        if (isIgnoredName(entryName)) {
          continue;
        }
        if (items.size >= CONFIG.MAX_SCAN_ENTRIES) {
          isTruncated = true;
          return;
        }
        const relativePath = pathPrefix ? pathPrefix + "/" + entryName : entryName;
        items.set(relativePath, { name: entryName, kind: entryHandle.kind, relativePath: relativePath, handle: entryHandle });

        // Pumapasok sa subfolder kahit luma ito, baka may bagong file sa loob
        if (entryHandle.kind === "directory" && depth < CONFIG.MAX_SCAN_DEPTH) {
          await walkFolder(entryHandle, relativePath, depth + 1);
        }
      }
    } catch (error) {
      console.error("folderScanner: hindi mabasa ang " + (pathPrefix || "root folder"), error);
    }
  }

  await walkFolder(rootHandle, "", 0);
  return { items: items, isTruncated: isTruncated };
}

/**
 * findNewItems
 * Ang mga item sa currentItems na wala sa baselineItems. Ito ang "bagong ginawa".
 */
export function findNewItems(baselineItems, currentItems) {
  const newItems = [];
  currentItems.forEach(function (item, relativePath) {
    if (!baselineItems.has(relativePath)) {
      newItems.push(item);
    }
  });
  return newItems;
}

/**
 * resolveCreatedMoment
 * Oras ng pagkakagawa na ipapakita sa "Date Created".
 * - File: kapag ang lastModified ay nasa pagitan ng simula ng lote at ng pagkakita natin,
 *   iyon ang gagamitin (mas eksakto). Kapag hindi (hal. kinopya na lumang file), oras ng pagkakita.
 * - Folder: walang oras ang browser, kaya oras ng pagkakita (hanggang ~3 segundo ang layo).
 */
export async function resolveCreatedMoment(item, loteStartMoment, firstSeenMoment) {
  if (item.kind !== "file") {
    return firstSeenMoment;
  }
  try {
    const fileInfo = await item.handle.getFile();
    const isInsideLote = fileInfo.lastModified >= loteStartMoment.getTime() &&
      fileInfo.lastModified <= firstSeenMoment.getTime();
    return isInsideLote ? new Date(fileInfo.lastModified) : firstSeenMoment;
  } catch (error) {
    console.error("folderScanner: hindi mabasa ang " + item.relativePath, error);
    return firstSeenMoment;
  }
}
