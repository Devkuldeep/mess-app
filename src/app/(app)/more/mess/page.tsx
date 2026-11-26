import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { ActionForm, FormInput, FormNumberStepper, FormPhoneInput, FormSelect } from "@/components/ui";
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
            <FormInput name="name" label={t.messName} defaultValue={ctx.org.name} required minLength={2} maxLength={80} />
            <FormPhoneInput name="phone" label={t.phone} defaultValue={ctx.org.phone} invalidMessage={t.invalidPhone} />
            <FormInput name="upiId" label={t.upiId} defaultValue={ctx.org.upiId ?? ""} autoCapitalize="none" autoCorrect="off" placeholder="name@okaxis" />
            <FormSelect
              name="skipCutoffHour"
              label={t.cutoff}
              defaultValue={String(ctx.org.skipCutoffHour)}
              options={Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: formatHour(h, lang) }))}
            />
            <FormNumberStepper name="wastageTargetPct" label={t.wastageTarget} defaultValue={ctx.org.wastageTargetPct} min={1} max={50} unit="%" />
          </ActionForm>
        </div>
      </main>
    </>
  );
}
