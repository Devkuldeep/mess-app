import { redirect } from "next/navigation";
import { createOrg } from "@/app/actions/auth";
import { ActionForm, FormInput } from "@/components/ui";
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
          <FormInput name="name" label={t.messName} required minLength={2} maxLength={80} placeholder="Sharma Tiffin Service" />
          <FormInput
            name="slug"
            label={<>{t.messLink} <span className="font-normal">({t.optional})</span></>}
            hint={t.messLinkHint}
            maxLength={40}
            pattern="[a-z0-9-]*"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="sharma-tiffin"
          />
        </ActionForm>
      </div>
    </div>
  );
}
