import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ScreenHint } from "@/components/menu";
import { ConfirmButton, QuickForm } from "@/components/ui";
import { IconTrash } from "@/components/icons";
import { requireStaff } from "@/server/auth";
import { listPlans } from "@/server/data";
import { getT } from "@/server/i18n";
import { deletePlan, savePlan } from "@/app/actions/settings";
import { fmt, type Dict } from "@/lib/i18n";

export const metadata = { title: "Plans" };

export default function PlansPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Plans />
    </Suspense>
  );
}

const mealLabel = (t: Dict, m: string) => (m === "both" ? t.bothMeals : t[m as "lunch" | "dinner"]);

async function Plans() {
  const ctx = await requireStaff();
  const [{ t }, plans] = await Promise.all([getT(), listPlans(ctx)]);
  return (
    <>
      <PageHeader title={t.plans} sub={fmt(t.nPlans, { n: plans.length })} back="/more" />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <ScreenHint>{t.plansHint}</ScreenHint>

        {plans.map((p) => (
          <section key={p.id} className="card space-y-3 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">{mealLabel(t, p.meals)}</span>
              <span className="flex-1 text-sm text-muted">{fmt(t.customersOnPlan, { n: p.customers })}</span>
              {p.customers === 0 && (
                <ConfirmButton action={deletePlan} fields={{ id: p.id }} label={t.delete} confirm={t.sure} icon={<IconTrash className="size-4" />} />
              )}
            </div>
            <QuickForm action={savePlan} submit={t.save} saved={t.saved}>
              <input type="hidden" name="id" value={p.id} />
              <div className="flex gap-2">
                <input name="name" defaultValue={p.name} required maxLength={60} className="field min-w-0 flex-1 font-medium" aria-label={t.name} />
                <label className="relative w-28">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">₹</span>
                  <input name="pricePerMeal" defaultValue={p.pricePerMeal} inputMode="decimal" required className="field pl-7 text-right tabular-nums" aria-label={t.perMeal} />
                </label>
              </div>
              <p className="-mt-1 text-right text-xs text-muted">{t.perMeal}</p>
            </QuickForm>
          </section>
        ))}

        <section className="card space-y-3 border-dashed p-4">
          <h2 className="font-semibold">{t.newPlan}</h2>
          <QuickForm action={savePlan} submit={t.addPlan} saved={t.saved} buttonClass="btn-primary w-full" resetOnSave>
            <div className="flex gap-2">
              <input name="name" required maxLength={60} placeholder={t.name} className="field min-w-0 flex-1" />
              <label className="relative w-28">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">₹</span>
                <input name="pricePerMeal" inputMode="decimal" required placeholder="60" className="field pl-7 text-right" aria-label={t.perMeal} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["lunch", "dinner", "both"] as const).map((m, i) => (
                <label key={m} className="chip justify-center px-2 text-center has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink">
                  <input type="radio" name="meals" value={m} defaultChecked={i === 2} className="sr-only" />
                  {mealLabel(t, m)}
                </label>
              ))}
            </div>
          </QuickForm>
        </section>
      </main>
    </>
  );
}
