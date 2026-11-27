// More → Staff (owner only): invite a manager / delivery person by WhatsApp
// link, see who's waiting to join, change roles, remove people.
import { Suspense } from "react";
import { headers } from "next/headers";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ScreenHint } from "@/components/menu";
import { CopyButton } from "@/components/copy-button";
import { IconTrash, IconWhatsApp } from "@/components/icons";
import { ConfirmButton, FormInput, FormPhoneInput, FormRadioGroup, ListAvatar, QuickForm } from "@/components/ui";
import { requireMember } from "@/server/auth";
import { listStaff } from "@/server/staff";
import { getT } from "@/server/i18n";
import { cancelInvite, changeRole, createInvite, removeMember } from "@/app/actions/staff";
import { isInviteExpired } from "@/lib/invite";
import { whatsappLink } from "@/lib/links";
import { fmt, formatDate, type Dict } from "@/lib/i18n";

export const metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Staff />
    </Suspense>
  );
}

async function Staff() {
  const ctx = await requireMember(["owner"]);
  const [{ t, lang }, { members, invites }, h] = await Promise.all([getT(), listStaff(ctx), headers()]);
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const roleName = (r: string) => t[`role_${r}` as keyof Dict];
  const now = new Date();

  return (
    <>
      <PageHeader title={t.staff} back="/more" />
      <main className="mx-auto max-w-md space-y-6 p-4">
        <ScreenHint>{t.staffHint}</ScreenHint>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">{t.addStaff}</h2>
          <QuickForm action={createInvite} submit={t.createInvite} saved={t.inviteCreated} errors={t} buttonClass="btn-primary w-full" resetOnSave>
            <FormInput name="name" label={t.name} required maxLength={80} autoComplete="off" />
            <FormPhoneInput name="phone" label={t.phone} required invalidMessage={t.invalidPhone} />
            <FormRadioGroup
              name="role"
              label={t.role}
              required
              variant="cards"
              defaultValue="delivery"
              options={[
                { value: "delivery", label: t.role_delivery, description: t.roleDeliveryDesc },
                { value: "manager", label: t.role_manager, description: t.roleManagerDesc },
              ]}
            />
          </QuickForm>
        </section>

        {invites.length > 0 && (
          <section className="space-y-2">
            <h2 className="section-title">{t.pendingInvites}</h2>
            <ul className="card divide-y divide-line overflow-hidden">
              {invites.map((i) => {
                const link = `${origin}/join/${i.token}`;
                const expired = isInviteExpired(i.expiresAt, now);
                const msg = fmt(t.inviteMsg, { name: i.name, mess: ctx.org.name, role: roleName(i.role), link });
                return (
                  <li key={i.id} className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <ListAvatar name={i.name} tone="warn" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{i.name}</p>
                        <p className="truncate text-sm text-muted">
                          <span className="tabular-nums">{i.phone}</span> · {roleName(i.role)}
                        </p>
                        <p className={`text-xs ${expired ? "text-bad" : "text-muted"}`}>
                          {expired ? t.inviteExpired : fmt(t.inviteValidTill, { date: formatDate(i.expiresAt.toISOString().slice(0, 10), lang, { day: "numeric", month: "short" }) })}
                        </p>
                      </div>
                      <ConfirmButton action={cancelInvite} fields={{ id: i.id }} label={t.cancel} confirm={t.sure} icon={<IconTrash className="size-4" />} />
                    </div>
                    {!expired && (
                      <div className="flex gap-2">
                        <a href={whatsappLink(i.phone, msg)} target="_blank" rel="noreferrer" className="btn-primary flex-1 whitespace-nowrap">
                          <IconWhatsApp className="size-5" /> {t.sendWhatsApp}
                        </a>
                        <CopyButton text={link} label={t.copyLink} done={t.copied} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="section-title">{t.team}</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {members.map((m) => {
              const me = m.userId === ctx.user.id;
              const other = m.role === "manager" ? "delivery" : "manager";
              return (
                <li key={m.userId} className="space-y-2 p-4">
                  <div className="flex items-center gap-3">
                    <ListAvatar name={m.name} tone={m.role === "owner" ? "brand" : "ok"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {m.name} {me && <span className="text-sm font-normal text-muted">({t.you})</span>}
                      </p>
                      <p className="truncate text-sm text-muted"><span className="tabular-nums">{m.phone}</span></p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-ink">{roleName(m.role)}</span>
                  </div>
                  {m.role !== "owner" && (
                    <div className="flex items-center justify-end gap-2">
                      <form action={changeRole}>
                        <input type="hidden" name="userId" value={m.userId} />
                        <input type="hidden" name="role" value={other} />
                        <button className="btn-ghost min-h-10 px-3 text-sm">{other === "manager" ? t.makeManager : t.makeDelivery}</button>
                      </form>
                      <ConfirmButton action={removeMember} fields={{ userId: m.userId }} label={t.remove} confirm={t.sure} icon={<IconTrash className="size-4" />} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {members.length === 1 && invites.length === 0 && <p className="px-1 text-sm text-muted">{t.noStaff}</p>}
        </section>
      </main>
    </>
  );
}
