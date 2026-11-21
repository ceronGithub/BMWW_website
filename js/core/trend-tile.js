/*
 * FILE    : js/core/trend-tile.js
 * PURPOSE : Trend block sa tile ng Dashboard: thumbnail ng picture, badge na UPDATED kapag may bagong export na hindi pa nakikita, at Preview (picture sa bagong tab). Sender = binabasa ang Saving path; LEAD PC = binabasa ang Server path
 * DEPENDS : js/core/config.js, storage.js, queue.js, dashboard-machines-config.js, trend-export-config.js, trend-sync.js
 * INPUT   : readOwn(rootHandle), attachToItems(serverHandle, machineItemList), buildBlock(info, machineName, isSender)
 * OUTPUT  : elemento ng tile; Preview sa bagong tab (basa lang). Hindi nagtatapon ng error
 * VERSION : v9.4 | 2026-11-22 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const DM = root.dashboardMachinesConfig;
  const EXPORT = root.trendExportConfig;
  const SEEN = EXPORT.SEEN;
  const CLASS = EXPORT.CLASS;
  const TEXT = EXPORT.TEXT.tile;
  // Alaala ng picture na nabasa na: key -> { updatedAt, url }. Iisang beses lang binabasa ang picture hangga't walang bagong updatedAt.
  const imageCache = new Map();
  let previewClearId = null;

  // Gumagawa ng elemento na may class at text (textContent lang, ligtas sa XSS).
  function createElementWith(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null && text !== '') element.textContent = text;
    return element;
  }

  // Susi ng alaala: sariling machine o pangalan ng machine sa LEAD PC.
  function getKey(machineName, isSender) {
    return isSender ? SEEN.OWN_KEY : String(machineName || '').toLowerCase();
  }

  // Binabasa ang mga huling nakita (localStorage). Walang laman na object kung may problema.
  function readSeenMap() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SEEN.KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  // Itinatala na nakita na ang update ng key. Hanggang SEEN.MAX lang ang itatabi.
  function markSeen(key, updatedAt) {
    try {
      const seenMap = readSeenMap();
      seenMap[key] = updatedAt;
      const keyList = Object.keys(seenMap);
      keyList.slice(0, Math.max(0, keyList.length - SEEN.MAX)).forEach((oldKey) => { delete seenMap[oldKey]; });
      window.localStorage.setItem(SEEN.KEY, JSON.stringify(seenMap));
    } catch (error) {
      // hindi ma-save ang alaala: lalabas ulit ang UPDATED sa susunod
    }
  }

  // URL ng picture. Binabasa lang ulit kapag nagbago ang updatedAt; ang lumang URL ay binubura. Walang laman kung hindi mabasa.
  async function loadImageUrl(key, latest) {
    const cached = imageCache.get(key);
    if (cached && cached.updatedAt === latest.meta.updatedAt) return cached.url;
    let url = '';
    try {
      if (latest.imageHandle) {
        const file = await latest.imageHandle.getFile();
        if (file.size <= EXPORT.META.IMAGE_MAX_BYTES) url = URL.createObjectURL(file);
      }
    } catch (error) {
      url = '';
    }
    if (cached && cached.url) URL.revokeObjectURL(cached.url);
    imageCache.set(key, { updatedAt: latest.meta.updatedAt, url });
    return url;
  }

  // Ginagawang info ng tile ang nabasa (meta, picture, at kung UPDATED). Null kung wala pang export.
  async function buildInfo(latest, key) {
    if (!latest) {
      const cached = imageCache.get(key);
      if (cached && cached.url) URL.revokeObjectURL(cached.url);
      imageCache.delete(key);
      return null;
    }
    const imageUrl = await loadImageUrl(key, latest);
    return { meta: latest.meta, modifiedMs: latest.modifiedMs, imageUrl, key, isUpdated: readSeenMap()[key] !== latest.meta.updatedAt };
  }

  // Sender: binabasa ang <Saving path>\trend\. Ibinibigay ang info o null.
  async function readOwn(rootHandle) {
    if (!rootHandle || !root.trendSync) return null;
    return buildInfo(await root.trendSync.findInSavingPath(rootHandle), SEEN.OWN_KEY);
  }

  // LEAD PC: binabasa ang <Server path>\trend\<machine name>\ ng bawat machine at inilalagay sa item.trend (null kung wala).
  async function attachToItems(serverHandle, machineItemList) {
    if (!serverHandle || !root.trendSync) return;
    await Promise.all(machineItemList.map(async (item) => {
      item.trend = await buildInfo(await root.trendSync.findOnServer(serverHandle, item.machineName), getKey(item.machineName, false));
    }));
  }

  // Mensahe sa ilalim ng mga tile (nawawala pagkalipas ng ilang segundo).
  function showMessage(message) {
    const element = document.querySelector(DM.SELECTOR.previewStatus);
    if (!element) return;
    element.textContent = message;
    element.classList.add('is-error');
    window.clearTimeout(previewClearId);
    previewClearId = window.setTimeout(() => { element.textContent = ''; element.classList.remove('is-error'); }, DM.TEXT.preview.clearMs);
  }

  // Click ng Preview o thumbnail: itinatala na nakita na (nawawala ang UPDATED) at binubuksan ang picture sa bagong tab.
  function openPreview(info, box) {
    markSeen(info.key, info.meta.updatedAt);
    info.isUpdated = false;
    box.classList.remove(CLASS.updated);
    const badge = box.querySelector('.' + CLASS.badge);
    if (badge) badge.remove();
    if (!info.imageUrl) { showMessage(TEXT.noImage); return; }
    const tab = window.open(info.imageUrl, '_blank');
    if (!tab) showMessage(DM.TEXT.preview.tab.blocked);
  }

  // Button ng Preview.
  function buildPreviewButton(info, machineName, box) {
    const button = createElementWith('button', CLASS.previewButton, TEXT.previewButton);
    button.type = 'button';
    button.setAttribute('aria-label', TEXT.previewAria + machineName);
    button.addEventListener('click', () => openPreview(info, box));
    return button;
  }

  // Thumbnail ng picture (button para madaling i-click o i-tap).
  function buildThumbnail(info, machineName, box) {
    const thumb = createElementWith('button', CLASS.thumb);
    thumb.type = 'button';
    thumb.setAttribute('aria-label', TEXT.previewAria + machineName);
    const image = createElementWith('img', CLASS.image);
    image.src = info.imageUrl;
    image.alt = TEXT.imageAlt + machineName;
    image.loading = 'lazy';
    thumb.append(image);
    thumb.addEventListener('click', () => openPreview(info, box));
    return thumb;
  }

  // Block ng Trend sa tile: label, badge na UPDATED (icon at text, hindi lang kulay), Preview, thumbnail at buod.
  function buildBlock(info, machineName) {
    const row = createElementWith('div', CLASS.row);
    row.append(createElementWith('span', CLASS.label, TEXT.label));
    if (!info) {
      row.append(createElementWith('span', CLASS.empty, TEXT.none));
      const emptyBox = createElementWith('div', CLASS.box + ' ' + CLASS.none);
      emptyBox.append(row);
      return emptyBox;
    }
    const box = createElementWith('div', CLASS.box + (info.isUpdated ? ' ' + CLASS.updated : ''));
    if (info.isUpdated) row.append(createElementWith('span', CLASS.badge, '● ' + TEXT.updatedBadge));
    row.append(buildPreviewButton(info, machineName, box));
    box.append(row);
    if (info.imageUrl) box.append(buildThumbnail(info, machineName, box));
    const meta = info.meta;
    const exportedText = new Date(info.modifiedMs || Date.parse(meta.updatedAt)).toLocaleString();
    box.append(createElementWith('p', CLASS.meta, [TEXT.range + (meta.startDate || '-') + ' - ' + (meta.endDate || '-'), TEXT.points + meta.pointCount, TEXT.out + meta.outCount, TEXT.exported + exportedText].join(' | ')));
    return box;
  }

  root.trendTile = Object.freeze({ readOwn, attachToItems, buildBlock });
})();
