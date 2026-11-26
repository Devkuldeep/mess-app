import { saveCustomer } from "@/app/actions/customers";
import { ActionForm } from "./auth-form";
import type { Dict } from "@/lib/i18n";

type Plan = { id: string; name: string; pricePerMeal: number };
type Values = { id?: string; name?: string; phone?: string | null; address?: string | null; area?: string | null; notes?: string | null; diet?: "veg" | "nonveg"; planId?: string | null; startDate: string };

export function CustomerForm({ t, plans, v }: { t: Dict; plans: Plan[]; v: Values }) {
  return (
    <ActionForm action={saveCustomer} errors={t} submit={t.save}>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <label className="block">
        <span className="label">{t.name}</span>
        <input name="name" defaultValue={v.name} required maxLength={80} autoComplete="off" className="field" />
      </label>
      <label className="block">
        <span className="label">{t.phone}</span>
        <input name="phone" type="tel" inputMode="numeric" defaultValue={v.phone ?? ""} className="field" placeholder="98765 43210" />
      </label>

      <fieldset>
        <legend className="label">{t.plan}</legend>
        <div className="grid gap-2">
          {plans.map((p, i) => (
            <label key={p.id} className="card flex min-h-12 items-center gap-3 px-4 has-checked:border-brand has-checked:bg-brand-soft">
              <input type="radio" name="planId" value={p.id} defaultChecked={v.planId ? v.planId === p.id : i === 0} className="size-5 accent-[var(--brand)]" />
              <span className="flex-1 font-medium">{p.name}</span>
              <span className="text-sm text-muted">₹{p.pricePerMeal} {t.perMeal}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">{t.diet}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["veg", "nonveg"] as const).map((d) => (
            <label key={d} className="card flex min-h-12 items-center justify-center gap-2 has-checked:border-brand has-checked:bg-brand-soft">
              <input type="radio" name="diet" value={d} defaultChecked={(v.diet ?? "veg") === d} className="sr-only" />
              <span className={`size-2.5 rounded-sm ${d === "veg" ? "bg-veg" : "bg-nonveg"}`} aria-hidden />
              <span className="font-medium">{t[d]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="label">{t.address}</span>
        <textarea name="address" defaultValue={v.address ?? ""} rows={2} maxLength={300} className="field py-3" />
      </label>
      <label className="block">
        <span className="label">{t.area}</span>
        <input name="area" defaultValue={v.area ?? ""} maxLength={60} className="field" placeholder="Sector 5" />
      </label>
      <label className="block">
        <span className="label">{t.notes}</span>
        <input name="notes" defaultValue={v.notes ?? ""} maxLength={300} className="field" placeholder={t.notesHint} />
      </label>
      <label className="block">
        <span className="label">{t.startDate}</span>
        <input name="startDate" type="date" defaultValue={v.startDate} required className="field" />
      </label>
    </ActionForm>
  );
}
