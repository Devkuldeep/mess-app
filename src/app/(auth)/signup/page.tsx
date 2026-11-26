import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/actions/auth";
import { ActionForm } from "@/components/auth-form";
import { LangToggle } from "@/components/lang-toggle";
import { getUser } from "@/server/auth";
import { getT } from "@/server/i18n";

export const metadata = { title: "Sign up" };

export default async function SignupPage() {
  if (await getUser()) redirect("/onboarding");
  const { t, lang } = await getT();
  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold">{t.signup}</h1>
      <div className="card p-4">
        <ActionForm action={signup} errors={t} submit={t.signup}>
          <label className="block">
            <span className="label">{t.yourName}</span>
            <input name="name" autoComplete="name" required maxLength={80} className="field" />
          </label>
          <label className="block">
            <span className="label">{t.phone}</span>
            <input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required className="field" placeholder="98765 43210" />
          </label>
          <label className="block">
            <span className="label">{t.password}</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} className="field" />
          </label>
          <label className="flex items-start gap-3 py-1 text-sm">
            <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
            <span>
              {t.consentPrefix} <Link href="/terms" target="_blank" className="font-medium text-brand-ink underline">{t.terms}</Link>{" "}
              {t.consentAnd} <Link href="/privacy" target="_blank" className="font-medium text-brand-ink underline">{t.privacy}</Link> {t.consentSuffix}
            </span>
          </label>
        </ActionForm>
      </div>
      <p className="text-center text-muted">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-brand-ink underline">{t.login}</Link>
      </p>
      <div className="flex justify-center"><LangToggle lang={lang} /></div>
    </div>
  );
}
