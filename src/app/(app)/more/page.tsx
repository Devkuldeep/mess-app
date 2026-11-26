// "More" tab: a mobile-app style menu. Every option opens its own screen
// under /more/* (mess, plans, dishes, holidays, backup).
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { LangToggle } from "@/components/lang-toggle";
import { LogoutButton } from "@/components/logout-button";
import { MenuItem, MenuRow, MenuSection } from "@/components/menu";
import {
  IconCalendar, IconChart, IconCloud, IconDoc, IconGlobe, IconHelp, IconPot, IconStore, IconTag,
} from "@/components/icons";
import { requireMember } from "@/server/auth";
import { listHolidays, listPlans } from "@/server/data";
import { listDishes } from "@/server/wastage";
import { getDriveStatus } from "@/server/drive-backup";
import { getT } from "@/server/i18n";
import { todayIn } from "@/lib/dates";
import { fmt, type Dict } from "@/lib/i18n";
import pkg from "@/../package.json";

export const metadata = { title: "More" };

export default function MorePage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <More />
    </Suspense>
  );
}

async function More() {
  const ctx = await requireMember();
  const { t, lang } = await getT();
  const owner = ctx.role === "owner";
  const staff = ctx.role !== "delivery";
  const [plans, dishes, holidays, drive] = await Promise.all([
    staff ? listPlans(ctx) : [],
    staff ? listDishes(ctx) : [],
    staff ? listHolidays(ctx, todayIn(ctx.org.timezone)) : [],
    owner ? getDriveStatus(ctx.orgId) : null,
  ]);
  const roleLabel = t[`role_${ctx.role}` as keyof Dict];

  return (
    <>
      <PageHeader title={t.navMore} />
      <main className="mx-auto max-w-md space-y-6 p-4">
        {/* Profile */}
        <section className="card flex items-center gap-4 p-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-on-brand" aria-hidden>
            {[...ctx.user.name.trim()][0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{ctx.user.name}</p>
            <p className="truncate text-sm text-muted">{ctx.org.name}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-ink">{roleLabel}</span>
              <span className="text-muted tabular-nums">{ctx.user.phone}</span>
            </p>
          </div>
        </section>

        {staff && (
          <MenuSection title={t.sectionMess}>
            {owner && <MenuRow href="/more/mess" icon={IconStore} label={t.messDetails} sub={ctx.org.upiId ? `UPI: ${ctx.org.upiId}` : ctx.org.name} />}
            <MenuRow href="/more/plans" icon={IconTag} label={t.plans} sub={fmt(t.nPlans, { n: plans.length })} />
            <MenuRow href="/more/dishes" icon={IconPot} label={t.dishes} sub={fmt(t.nDishes, { n: dishes.length })} />
            <MenuRow href="/more/holidays" icon={IconCalendar} label={t.holidays} sub={holidays.length ? fmt(t.nUpcoming, { n: holidays.length }) : t.none} />
          </MenuSection>
        )}

        {staff && (
          <MenuSection title={t.sectionReports}>
            <MenuRow href="/wastage/report" icon={IconChart} label={t.wastageReport} tone="ok" />
          </MenuSection>
        )}

        {owner && (
          <MenuSection title={t.sectionData}>
            <MenuRow
              href="/more/backup"
              icon={IconCloud}
              label={t.backupAndData}
              tone={drive?.status === "needs_reconnect" ? "warn" : "ok"}
              sub={!drive ? t.driveOff : drive.status === "needs_reconnect" ? t.driveWarn : t.driveOn}
              subTone={!drive ? undefined : drive.status === "needs_reconnect" ? "warn" : "ok"}
            />
          </MenuSection>
        )}

        <MenuSection title={t.sectionApp}>
          <MenuItem icon={IconGlobe} label={t.language}>
            <LangToggle lang={lang} />
          </MenuItem>
        </MenuSection>

        <MenuSection title={t.sectionHelp}>
          <MenuRow href="/contact" icon={IconHelp} label={t.contactUs} tone="muted" />
          <MenuRow href="/privacy" icon={IconDoc} label={t.privacy} tone="muted" />
          <MenuRow href="/terms" icon={IconDoc} label={t.terms} tone="muted" />
          {owner && <MenuRow href="/refund" icon={IconDoc} label={t.refundPolicy} tone="muted" />}
        </MenuSection>

        <LogoutButton label={t.logout} unsyncedWarning={t.unsyncedLogout} />

        <p className="pb-2 text-center text-xs text-muted">Mess Manager · {fmt(t.version, { v: pkg.version })}</p>
      </main>
    </>
  );
}
