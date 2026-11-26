import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ScreenHint } from "@/components/menu";
import { ConfirmButton, QuickForm } from "@/components/quick-form";
import { IconCalendar, IconTrash } from "@/components/icons";
import { requireStaff } from "@/server/auth";
import { listHolidays } from "@/server/data";
import { getT } from "@/server/i18n";
import { addHoliday, removeHoliday } from "@/app/actions/settings";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/i18n";

export const metadata = { title: "Holidays" };

export default function HolidaysPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Holidays />
    </Suspense>
  );
}

async function Holidays() {
  const ctx = await requireStaff();
  const today = todayIn(ctx.org.timezone);
  const [{ t, lang }, holidays] = await Promise.all([getT(), listHolidays(ctx, today)]);
  return (
    <>
      <PageHeader title={t.holidays} back="/more" />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <ScreenHint>{t.holidayHint}</ScreenHint>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">{t.addHoliday}</h2>
          <QuickForm action={addHoliday} submit={t.addHoliday} saved={t.saved} buttonClass="btn-primary w-full" resetOnSave>
            <input type="date" name="date" min={today} defaultValue={today} required className="field" aria-label={t.holiday} />
            <input name="reason" maxLength={100} placeholder={`${t.reason} (${t.optional})`} className="field" />
          </QuickForm>
        </section>

        <section className="space-y-2">
          <h2 className="section-title">{t.upcomingHolidays}</h2>
          {holidays.length === 0 ? (
            <p className="card p-6 text-center text-muted">{t.noHolidays}</p>
          ) : (
            <ul className="card divide-y divide-line overflow-hidden">
              {holidays.map((h) => (
                <li key={h.date} className="flex min-h-16 items-center gap-3 py-2 pr-2 pl-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warn-soft text-warn">
                    <IconCalendar className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{formatDate(h.date, lang, { weekday: "long", day: "numeric", month: "long" })}</span>
                    {h.reason && <span className="block truncate text-sm text-muted">{h.reason}</span>}
                  </span>
                  <ConfirmButton action={removeHoliday} fields={{ date: h.date }} label={t.delete} confirm={t.sure} icon={<IconTrash className="size-4" />} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
