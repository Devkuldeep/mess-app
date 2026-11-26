import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, dictionaries, isLang, LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getT(): Promise<{ t: Dict; lang: Lang }> {
  const lang = await getLang();
  return { t: dictionaries[lang], lang };
}
