/*
 * FILE    : js/core/security.js
 * PURPOSE : Right click block, sanitize
 * DEPENDS : wala
 * VERSION : v1 | 2026-11-19 | unang bersyon
 */
'use strict';
// Pampahirap lang ito, hindi tunay na proteksyon. Walang secrets sa frontend.

// Tinitingnan kung nasa input o textarea ang target.
function isEditable(target) {
  return target instanceof Element && target.closest('input, textarea') !== null;
}

// Hinaharangan ang right click maliban sa input/textarea.
function blockContextMenu(event) {
  if (!isEditable(event.target)) event.preventDefault();
}

// Hinaharangan ang F12, Ctrl+U, Ctrl+S, Ctrl+Shift+I/J/C.
function blockShortcut(event) {
  const key = event.key.toLowerCase();
  const ctrl = event.ctrlKey || event.metaKey;
  const blocked = key === 'f12' || (ctrl && (key === 'u' || key === 's')) || (ctrl && event.shiftKey && ['i', 'j', 'c'].includes(key));
  if (blocked) event.preventDefault();
}

// Nililinis ang input: tanggal control characters, trim, limit ang haba.
export function sanitizeInput(value, maxLength) {
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

// Ini-install ang mga listener.
export function initSecurity() {
  document.addEventListener('contextmenu', blockContextMenu);
  document.addEventListener('keydown', blockShortcut);
}
