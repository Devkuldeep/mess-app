import { redirect } from "next/navigation";
import { createOrg } from "@/app/actions/auth";
import { ActionForm } from "@/components/auth-form";
import { getMember, requireUser } from "@/server/auth";
import { getT } from "@/server/i18n";

export const metadata = { title: "Set up" };

export default async function OnboardingPage() {
  await requireUser();
  if (await getMember()) redirect("/today");
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold">{t.setupMess}</h1>
      <div className="card p-4">
        <ActionForm action={createOrg} errors={t} submit={t.create}>
          <label className="block">
            <span className="label">{t.messName}</span>
            <input name="name" required minLength={2} maxLength={80} className="field" placeholder="Sharma Tiffin Service" />
          </label>
          <label className="block">
            <span className="label">{t.messLink} <span className="font-normal">({t.optional})</span></span>
            <input name="slug" maxLength={40} pattern="[a-z0-9-]*" autoCapitalize="none" className="field" placeholder="sharma-tiffin" />
            <span className="mt-1 block text-sm text-muted">{t.messLinkHint}</span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
