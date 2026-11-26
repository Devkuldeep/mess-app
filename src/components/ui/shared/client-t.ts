"use client";
// Translations for client code that has no server-provided `t` (root-level
// UI like toasts and the global confirm). Reads the same `lang` cookie.
import { DEFAULT_LANG, dictionaries, isLang, LANG_COOKIE, type Dict } from "@/lib/i18n";

export function clientT(): Dict {
  if (typeof document === "undefined") return dictionaries[DEFAULT_LANG];
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]+)`));
  const lang = m?.[1];
  return dictionaries[isLang(lang) ? lang : DEFAULT_LANG];
}
