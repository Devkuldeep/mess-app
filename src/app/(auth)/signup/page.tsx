import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/actions/auth";
import { ActionForm, FormCheckbox, FormInput, FormPasswordInput, FormPhoneInput } from "@/components/ui";
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
          <FormInput name="name" label={t.yourName} required maxLength={80} autoComplete="name" />
          <FormPhoneInput name="phone" label={t.phone} required invalidMessage={t.invalidPhone} />
          <FormPasswordInput name="password" label={t.password} required minLength={8} autoComplete="new-password" hint={t.passwordShort} labels={{ show: t.showPassword, hide: t.hidePassword }} />
          <FormCheckbox
            name="consent"
            required
            label={
              <span className="font-normal">
                {t.consentPrefix} <Link href="/terms" target="_blank" className="font-medium text-brand-ink underline">{t.terms}</Link>{" "}
                {t.consentAnd} <Link href="/privacy" target="_blank" className="font-medium text-brand-ink underline">{t.privacy}</Link> {t.consentSuffix}
              </span>
            }
          />
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
