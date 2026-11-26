import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, FormPasswordInput, FormPhoneInput } from "@/components/ui";
import { LangToggle } from "@/components/lang-toggle";
import { getUser } from "@/server/auth";
import { getT } from "@/server/i18n";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  if (await getUser()) redirect("/today");
  const { t, lang } = await getT();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t.appName}</h1>
        <p className="mt-1 text-muted">{t.tagline}</p>
      </div>
      <div className="card p-4">
        <ActionForm action={login} errors={t} submit={t.login}>
          <FormPhoneInput name="phone" label={t.phone} required invalidMessage={t.invalidPhone} />
          <FormPasswordInput name="password" label={t.password} required autoComplete="current-password" labels={{ show: t.showPassword, hide: t.hidePassword }} />
        </ActionForm>
      </div>
      <p className="text-center text-muted">
        {t.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-brand-ink underline">{t.signup}</Link>
      </p>
      <div className="flex justify-center"><LangToggle lang={lang} /></div>
    </div>
  );
}
