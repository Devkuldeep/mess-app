// /join/<token> — a staff member opens the owner's WhatsApp invite link.
// New number → make a password; existing account → enter its password;
// already signed in with that number → one tap. See actions/staff.ts.
import Link from "next/link";
import { redirect } from "next/navigation";
import { joinWithInvite } from "@/app/actions/staff";
import { ActionForm, FormCheckbox, FormInput, FormPasswordInput } from "@/components/ui";
import { LangToggle } from "@/components/lang-toggle";
import { LogoutButton } from "@/components/logout-button";
import { getMember, getUser } from "@/server/auth";
import { getInvite } from "@/server/staff";
import { getT } from "@/server/i18n";
import { homeFor, isInviteExpired, isInviteToken, maskPhone } from "@/lib/invite";
import { fmt, type Dict } from "@/lib/i18n";

export const metadata = { title: "Join", robots: { index: false } };

export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const { t, lang } = await getT();
  const invite = isInviteToken(token) ? await getInvite(token) : null;
  const valid = invite && !isInviteExpired(invite.expiresAt, new Date());

  if (!valid) {
    return (
      <div className="space-y-6">
        <p role="alert" className="card p-6 text-center text-muted">{t.inviteInvalid}</p>
        <div className="flex justify-center"><LangToggle lang={lang} /></div>
      </div>
    );
  }

  const user = await getUser();
  // Already in this mess (e.g. opened the link twice) → straight in.
  if (user?.phone === invite.phone) {
    const m = await getMember();
    if (m?.orgId === invite.orgId) redirect(homeFor(m.role));
  }
  const role = t[`role_${invite.role}` as keyof Dict];
  const hidden = <input type="hidden" name="inviteToken" value={token} />;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{fmt(t.joinTitle, { mess: invite.orgName })}</h1>
        <p className="mt-1 text-muted">{fmt(t.joinAs, { role })}</p>
        <p className="mt-1 text-sm text-muted">{fmt(t.joinFor, { name: invite.name, phone: maskPhone(invite.phone) })}</p>
      </div>

      <div className="card p-4">
        {user && user.phone !== invite.phone ? (
          <div className="space-y-4">
            <p role="alert" className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">{fmt(t.inviteWrongUser, { phone: maskPhone(invite.phone) })}</p>
            <LogoutButton label={t.logout} unsyncedWarning={t.unsyncedLogout} />
          </div>
        ) : user ? (
          <ActionForm action={joinWithInvite} errors={t} submit={t.joinNow}>
            {hidden}
            <input type="hidden" name="mode" value="session" />
            <p className="text-center">{fmt(t.joinHello, { name: user.name })}</p>
          </ActionForm>
        ) : invite.hasAccount ? (
          <ActionForm action={joinWithInvite} errors={t} submit={t.joinNow}>
            {hidden}
            <input type="hidden" name="mode" value="login" />
            <p className="text-sm text-muted">{t.joinExisting}</p>
            <FormPasswordInput name="password" label={t.password} required autoComplete="current-password" labels={{ show: t.showPassword, hide: t.hidePassword }} />
          </ActionForm>
        ) : (
          <ActionForm action={joinWithInvite} errors={t} submit={t.joinNow}>
            {hidden}
            <input type="hidden" name="mode" value="signup" />
            <p className="text-sm text-muted">{t.joinNew}</p>
            <FormInput name="name" label={t.yourName} required maxLength={80} defaultValue={invite.name} autoComplete="name" />
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
        )}
      </div>
      <div className="flex justify-center"><LangToggle lang={lang} /></div>
    </div>
  );
}
