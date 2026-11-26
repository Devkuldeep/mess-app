import { saveCustomer } from "@/app/actions/customers";
import { ActionForm, FormDatePicker, FormInput, FormPhoneInput, FormRadioGroup, FormTextarea } from "@/components/ui";
import type { Dict, Lang } from "@/lib/i18n";

type Plan = { id: string; name: string; pricePerMeal: number };
type Values = { id?: string; name?: string; phone?: string | null; address?: string | null; area?: string | null; notes?: string | null; diet?: "veg" | "nonveg"; planId?: string | null; startDate: string };

export function CustomerForm({ t, lang, today, plans, v }: { t: Dict; lang: Lang; today: string; plans: Plan[]; v: Values }) {
  return (
    <ActionForm action={saveCustomer} errors={t} submit={t.save}>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <FormInput name="name" label={t.name} defaultValue={v.name} required maxLength={80} autoComplete="off" />
      <FormPhoneInput name="phone" label={<>{t.phone} <span className="font-normal">({t.optional})</span></>} defaultValue={v.phone} invalidMessage={t.invalidPhone} />

      <FormRadioGroup
        name="planId"
        label={t.plan}
        variant="cards"
        defaultValue={v.planId ?? plans[0]?.id}
        options={plans.map((p) => ({ value: p.id, label: p.name, meta: `₹${p.pricePerMeal} ${t.perMeal}` }))}
      />

      <FormRadioGroup
        name="diet"
        label={t.diet}
        defaultValue={v.diet ?? "veg"}
        options={[
          { value: "veg", label: t.veg, icon: <span className="size-2.5 rounded-sm bg-veg" aria-hidden /> },
          { value: "nonveg", label: t.nonveg, icon: <span className="size-2.5 rounded-sm bg-nonveg" aria-hidden /> },
        ]}
      />

      <FormTextarea name="address" label={t.address} defaultValue={v.address ?? ""} rows={2} maxLength={300} />
      <FormInput name="area" label={t.area} defaultValue={v.area ?? ""} maxLength={60} placeholder="Sector 5" />
      <FormInput name="notes" label={t.notes} defaultValue={v.notes ?? ""} maxLength={300} placeholder={t.notesHint} />
      <FormDatePicker
        name="startDate"
        label={t.startDate}
        defaultValue={v.startDate}
        required
        today={today}
        lang={lang}
        shortcuts={[{ label: t.today, days: 0 }, { label: t.tomorrow, days: 1 }]}
      />
    </ActionForm>
  );
}
