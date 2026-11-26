import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ScreenHint } from "@/components/menu";
import { ConfirmButton, QuickForm } from "@/components/quick-form";
import { IconTrash } from "@/components/icons";
import { requireStaff } from "@/server/auth";
import { listDishes } from "@/server/wastage";
import { getT } from "@/server/i18n";
import { archiveDish, saveDish } from "@/app/actions/settings";
import { fmt } from "@/lib/i18n";

export const metadata = { title: "Dishes" };

export default function DishesPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Dishes />
    </Suspense>
  );
}

async function Dishes() {
  const ctx = await requireStaff();
  const [{ t }, dishes] = await Promise.all([getT(), listDishes(ctx)]);
  return (
    <>
      <PageHeader title={t.dishes} sub={fmt(t.nDishes, { n: dishes.length })} back="/more" />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <ScreenHint>{t.dishesHint}</ScreenHint>

        {dishes.map((d) => (
          <section key={d.id} className="card space-y-3 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">{t[`unit_${d.unit}`]}</span>
              <span className="flex-1" />
              <ConfirmButton action={archiveDish} fields={{ id: d.id }} label={t.remove} confirm={t.sure} icon={<IconTrash className="size-4" />} />
            </div>
            <QuickForm action={saveDish} submit={t.save} saved={t.saved}>
              <input type="hidden" name="id" value={d.id} />
              <input name="name" defaultValue={d.name} required maxLength={40} className="field font-medium" aria-label={t.name} />
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="label">{t.perTiffin} ({t[`unit_${d.unit}`]})</span>
                  <input name="perTiffin" defaultValue={d.perTiffin} inputMode="decimal" required className="field tabular-nums" />
                </label>
                <label>
                  <span className="label">{t.costPerUnit}</span>
                  <input name="costPerUnit" defaultValue={d.costPerUnit ?? ""} inputMode="decimal" className="field tabular-nums" placeholder="—" />
                </label>
              </div>
              <label className="flex min-h-12 items-center gap-3 text-sm">
                <input type="checkbox" name="variety" defaultChecked={d.variety} className="size-5 accent-[var(--brand)]" />
                {t.varietyFlag}
              </label>
            </QuickForm>
          </section>
        ))}

        <section className="card space-y-3 border-dashed p-4">
          <h2 className="font-semibold">{t.newDish}</h2>
          <QuickForm action={saveDish} submit={t.addDish} saved={t.saved} buttonClass="btn-primary w-full" resetOnSave>
            <div className="flex gap-2">
              <input name="name" required maxLength={40} placeholder={t.name} className="field min-w-0 flex-1" />
              <input name="perTiffin" inputMode="decimal" required placeholder={t.perTiffin} className="field w-32" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["kg", "litre", "count"] as const).map((u, i) => (
                <label key={u} className="chip justify-center has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink">
                  <input type="radio" name="unit" value={u} defaultChecked={i === 0} className="sr-only" />
                  {t[`unit_${u}`]}
                </label>
              ))}
            </div>
          </QuickForm>
        </section>
      </main>
    </>
  );
}
