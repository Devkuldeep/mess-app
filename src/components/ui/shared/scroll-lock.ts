"use client";
// Page scroll lock shared by every overlay (drawers, dialogs) so nested ones
// count correctly: the page unlocks only when the last overlay closes.
let locks = 0;

export function setScrollLock(on: boolean) {
  locks = Math.max(0, locks + (on ? 1 : -1));
  document.documentElement.style.overflow = locks ? "hidden" : "";
}
