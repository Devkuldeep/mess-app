import { setLang } from "@/app/actions/auth";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  return (
    <form action={setLang} className="inline-flex rounded-full border border-line bg-card p-1 text-sm">
      {(["hi", "en"] as const).map((l) => (
        <button
          key={l}
          name="lang"
          value={l}
          aria-pressed={lang === l}
          className="min-h-9 rounded-full px-3 font-medium text-muted aria-pressed:bg-brand aria-pressed:text-on-brand"
        >
          {l === "hi" ? "हिंदी" : "English"}
        </button>
      ))}
    </form>
  );
}
