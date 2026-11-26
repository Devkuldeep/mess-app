import Link from "next/link";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ActionForm } from "@/components/auth-form";
import { LangToggle } from "@/components/lang-toggle";
import { LogoutButton } from "@/components/logout-button";
import { IconDownload } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { DriveCard } from "@/components/drive-card";
import { getDriveStatus } from "@/server/drive-backup";
import { googleConfigured } from "@/server/google";
import { BUSINESS } from "@/lib/business";
import { requireMember } from "@/server/auth";
import { listHolidays, listPlans } from "@/server/data";
import { getT } from "@/server/i18n";
import { addHoliday, archiveDish, deletePlan, removeHoliday, saveDish, savePlan, updateOrg } from "@/app/actions/settings";
import { listDishes, type DishRow } from "@/server/wastage";
import { todayIn } from "@/lib/dates";
import { formatDate, formatHour, type Dict } from "@/lib/i18n";

export const metadata = { title: "More" };

export default function MorePage(props: PageProps<"/more">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <More searchParams={props.searchParams} />
    </Suspense>
  );
}

async function More({ searchParams }: { searchParams: PageProps<"/more">["searchParams"] }) {
  const ctx = await requireMember();
  const [{ t, lang }, sp] = await Promise.all([getT(), searchParams]);
  const drive = ctx.role === "owner" ? await getDriveStatus(ctx.orgId) : null;
  const driveFlash = typeof sp.drive === "string" && /^[a-z_]{1,40}$/.test(sp.drive) ? sp.drive : null;
  const staff = ctx.role !== "delivery";
  const today = todayIn(ctx.org.timezone);
  const [plans, holidays, dishes] = staff
    ? await Promise.all([listPlans(ctx), listHolidays(ctx, today), listDishes(ctx)])
    : [[], [], []];

  return (
    <>
      <PageHeader title={t.settings} sub={`${ctx.user.name} · ${ctx.org.name}`} />
      <main className="mx-auto max-w-md space-y-6 p-4">
        <section className="card flex items-center justify-between gap-3 p-4">
          <span className="font-medium">{t.language}</span>
          <LangToggle lang={lang} />
        </section>

        {ctx.role === "owner" && (
          <section className="space-y-2">
            <h2 className="section-title">{t.messDetails}</h2>
            <div className="card p-4">
              <ActionForm action={updateOrg} errors={t} submit={t.save}>
                <Field label={t.messName}><input name="name" defaultValue={ctx.org.name} required className="field" /></Field>
                <Field label={t.phone}><input name="phone" type="tel" inputMode="numeric" defaultValue={ctx.org.phone ?? ""} className="field" /></Field>
                <Field label={t.upiId}><input name="upiId" defaultValue={ctx.org.upiId ?? ""} autoCapitalize="none" placeholder="name@okaxis" className="field" /></Field>
                <Field label={t.wastageTarget}>
                  <input name="wastageTargetPct" type="number" inputMode="numeric" min={1} max={50} defaultValue={ctx.org.wastageTargetPct} className="field" />
                </Field>
                <Field label={t.cutoff}>
                  <select name="skipCutoffHour" defaultValue={ctx.org.skipCutoffHour} className="field">
                    {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{formatHour(h, lang)}</option>)}
                  </select>
                </Field>
              </ActionForm>
            </div>
          </section>
        )}

        {staff && <Plans t={t} plans={plans} />}

        {staff && <Dishes t={t} dishes={dishes} />}

        {staff && (
          <Link href="/wastage/report" className="card flex min-h-14 items-center justify-between px-4 font-medium">
            {t.wastageReport} <span aria-hidden>→</span>
          </Link>
        )}

        {ctx.role === "owner" && (
          <DriveCard
            configured={googleConfigured()}
            flash={driveFlash}
            t={t}
            status={drive && {
              email: drive.email,
              status: drive.status,
              folderId: drive.folderId,
              lastError: drive.lastError,
              lastBackup: drive.lastBackupAt
                ? new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: ctx.org.timezone }).format(drive.lastBackupAt)
                : null,
            }}
          />
        )}

        {ctx.role === "owner" && (
          <section className="space-y-2">
            <h2 className="section-title">{t.backup}</h2>
            <div className="card space-y-3 p-4">
              <p className="text-sm text-muted">{t.downloadHint}</p>
              {/* Plain link: the browser downloads the ZIP (no client JS needed). */}
              <a href="/api/export" download className="btn-secondary w-full">
                <IconDownload className="size-5" /> {t.downloadData}
              </a>
            </div>
          </section>
        )}

        {staff && (
          <section className="space-y-2">
            <h2 className="section-title">{t.holidays}</h2>
            <div className="card divide-y divide-line">
              {holidays.map((h) => (
                <form key={h.date} action={removeHoliday} className="flex min-h-14 items-center gap-3 pl-4 pr-1">
                  <input type="hidden" name="date" value={h.date} />
                  <span className="flex-1"><b>{formatDate(h.date, lang)}</b> {h.reason && <span className="text-muted">· {h.reason}</span>}</span>
                  <button className="icon-btn text-xl" aria-label={t.delete}>×</button>
                </form>
              ))}
              <form action={addHoliday} className="space-y-2 p-4">
                <div className="flex gap-2">
                  <input type="date" name="date" min={today} required className="field w-40" aria-label={t.holiday} />
                  <input name="reason" maxLength={100} placeholder={t.reason} className="field flex-1" />
                </div>
                <button className="btn-secondary w-full">{t.addHoliday}</button>
              </form>
            </div>
          </section>
        )}

        {ctx.role === "owner" && (
          <section className="card space-y-1 p-4">
            <a
              href={`mailto:${BUSINESS.grievanceEmail}?subject=${encodeURIComponent(`Delete account: ${ctx.org.slug}`)}&body=${encodeURIComponent(`Mess: ${ctx.org.name} (${ctx.org.slug})\nOwner phone: ${ctx.user.phone}\n\nPlease delete my account and data.`)}`}
              className="font-medium text-bad underline"
            >
              {t.deleteMyData}
            </a>
            <p className="text-sm text-muted">{t.deleteHint}</p>
          </section>
        )}

        <LogoutButton label={t.logout} unsyncedWarning={t.unsyncedLogout} />

        <section aria-label={t.legal}>
          <SiteFooter compact />
        </section>
      </main>
    </>
  );
}

function Plans({ t, plans }: { t: Dict; plans: { id: string; name: string; meals: string; pricePerMeal: number; customers: number }[] }) {
  return (
    <section className="space-y-2">
      <h2 className="section-title">{t.plans}</h2>
      <div className="card divide-y divide-line">
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-2 p-3">
            <form action={savePlan} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input name="name" defaultValue={p.name} required className="field min-w-0 flex-1" aria-label={t.name} />
              <label className="relative w-24">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">₹</span>
                <input name="pricePerMeal" defaultValue={p.pricePerMeal} inputMode="decimal" required className="field pl-7 tabular-nums" aria-label={t.perMeal} />
              </label>
              <button className="icon-btn text-brand-ink" aria-label={t.save}>✓</button>
            </form>
            {p.customers === 0 ? (
              <form action={deletePlan}>
                <input type="hidden" name="id" value={p.id} />
                <button className="icon-btn text-xl" aria-label={t.delete}>×</button>
              </form>
            ) : <span className="w-12 text-center text-sm text-muted" title={t.planInUse}>{p.customers}</span>}
          </div>
        ))}
        <form action={savePlan} className="space-y-2 p-4">
          <div className="flex gap-2">
            <input name="name" required placeholder={t.name} className="field min-w-0 flex-1" />
            <input name="pricePerMeal" inputMode="decimal" required placeholder="₹" className="field w-24" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["lunch", "dinner", "both"] as const).map((m, i) => (
              <label key={m} className="chip justify-center has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink">
                <input type="radio" name="meals" value={m} defaultChecked={i === 2} className="sr-only" />
                {m === "both" ? t.bothMeals : t[m]}
              </label>
            ))}
          </div>
          <button className="btn-secondary w-full">{t.addPlan}</button>
        </form>
      </div>
    </section>
  );
}

function Dishes({ t, dishes }: { t: Dict; dishes: DishRow[] }) {
  return (
    <section className="space-y-2">
      <h2 className="section-title">{t.dishes}</h2>
      <div className="card divide-y divide-line">
        {dishes.map((d) => (
          <div key={d.id} className="space-y-2 p-3">
            <form action={saveDish} className="space-y-2">
              <input type="hidden" name="id" value={d.id} />
              <div className="flex items-center gap-2">
                <input name="name" defaultValue={d.name} required maxLength={40} className="field min-w-0 flex-1 font-medium" aria-label={t.name} />
                <span className="w-10 text-center text-sm text-muted">{t[`unit_${d.unit}`]}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <span className="label">{t.perTiffin}</span>
                  <input name="perTiffin" defaultValue={d.perTiffin} inputMode="decimal" required className="field tabular-nums" />
                </label>
                <label className="flex-1">
                  <span className="label">{t.costPerUnit}</span>
                  <input name="costPerUnit" defaultValue={d.costPerUnit ?? ""} inputMode="decimal" className="field tabular-nums" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex min-h-12 flex-1 items-center gap-2 text-sm">
                  <input type="checkbox" name="variety" defaultChecked={d.variety} className="size-5 accent-[var(--brand)]" />
                  {t.varietyFlag}
                </label>
                <button className="btn-secondary min-h-10 px-3 text-sm">{t.save}</button>
              </div>
            </form>
            <form action={archiveDish}>
              <input type="hidden" name="id" value={d.id} />
              <button className="text-sm text-bad underline">{t.remove}</button>
            </form>
          </div>
        ))}
        <form action={saveDish} className="space-y-2 p-4">
          <div className="flex gap-2">
            <input name="name" required maxLength={40} placeholder={t.name} className="field min-w-0 flex-1" />
            <input name="perTiffin" inputMode="decimal" required placeholder={t.perTiffin} className="field w-28" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["kg", "litre", "count"] as const).map((u, i) => (
              <label key={u} className="chip justify-center has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink">
                <input type="radio" name="unit" value={u} defaultChecked={i === 0} className="sr-only" />
                {t[`unit_${u}`]}
              </label>
            ))}
          </div>
          <button className="btn-secondary w-full">{t.addDish}</button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}
