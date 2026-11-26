import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ActionForm } from "@/components/auth-form";
import { Field } from "@/components/menu";
import { requireMember } from "@/server/auth";
import { getT } from "@/server/i18n";
import { updateOrg } from "@/app/actions/settings";
import { formatHour } from "@/lib/i18n";

export const metadata = { title: "Mess details" };

export default function MessPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Mess />
    </Suspense>
  );
}

async function Mess() {
  const ctx = await requireMember(["owner"]);
  const { t, lang } = await getT();
  return (
    <>
      <PageHeader title={t.messDetails} sub={ctx.org.name} back="/more" />
      <main className="mx-auto max-w-md space-y-3 p-4">
        <p className="px-1 text-sm text-muted">{t.messDetailsHint}</p>
        <div className="card p-4">
          <ActionForm action={updateOrg} errors={t} submit={t.save} savedText={t.saved}>
            <Field label={t.messName}>
              <input name="name" defaultValue={ctx.org.name} required minLength={2} maxLength={80} className="field" />
            </Field>
            <Field label={t.phone}>
              <input name="phone" type="tel" inputMode="numeric" defaultValue={ctx.org.phone ?? ""} className="field" placeholder="98765 43210" />
            </Field>
            <Field label={t.upiId}>
              <input name="upiId" defaultValue={ctx.org.upiId ?? ""} autoCapitalize="none" autoCorrect="off" placeholder="name@okaxis" className="field" />
            </Field>
            <Field label={t.cutoff}>
              <select name="skipCutoffHour" defaultValue={ctx.org.skipCutoffHour} className="field">
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{formatHour(h, lang)}</option>)}
              </select>
            </Field>
            <Field label={t.wastageTarget}>
              <input name="wastageTargetPct" type="number" inputMode="numeric" min={1} max={50} defaultValue={ctx.org.wastageTargetPct} className="field" />
            </Field>
          </ActionForm>
        </div>
      </main>
    </>
  );
}
