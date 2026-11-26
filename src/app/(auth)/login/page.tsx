import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm } from "@/components/auth-form";
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
          <label className="block">
            <span className="label">{t.phone}</span>
            <input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required className="field" placeholder="98765 43210" />
          </label>
          <label className="block">
            <span className="label">{t.password}</span>
            <input name="password" type="password" autoComplete="current-password" required className="field" />
          </label>
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
