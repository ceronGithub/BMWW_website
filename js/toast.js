/**
 * FILE: js/toast.js
 * ANO ITO: Ang nag-iisang toast ng buong page (top-center, kusang nawawala).
 * INPUT:   message (text), type ("success" | "error" | "warning")
 * OUTPUT:  naglalagay ng toast sa #toastStack. Walang ibinabalik.
 * TANDAAN: Ang oras ng pagpapakita ay galing sa CONFIG (TOAST_LEAVE_AT_MS at TOAST_VISIBLE_MS).
 */
import { CONFIG } from "./config.js";

/**
 * showToast
 * Gumagawa ng isang toast, ina-animate ang paglabas nito, at inaalis pagkatapos ng takdang oras.
 */
export function showToast(message, type) {
  const toastStack = document.querySelector(CONFIG.SELECTORS.toastStack);
  const toastItem = document.createElement("div");
  toastItem.className = "toastItem is" + type.charAt(0).toUpperCase() + type.slice(1);
  toastItem.textContent = message;
  toastStack.appendChild(toastItem);

  setTimeout(function () { toastItem.classList.add("isLeaving"); }, CONFIG.TOAST_LEAVE_AT_MS);
  setTimeout(function () { toastItem.remove(); }, CONFIG.TOAST_VISIBLE_MS);
}
