import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { DriveCard } from "@/components/drive-card";
import { IconDownload } from "@/components/icons";
import { requireMember } from "@/server/auth";
import { getDriveStatus } from "@/server/drive-backup";
import { googleConfigured } from "@/server/google";
import { getT } from "@/server/i18n";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Backup & data" };

export default function BackupPage(props: PageProps<"/more/backup">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Backup searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Backup({ searchParams }: { searchParams: PageProps<"/more/backup">["searchParams"] }) {
  const ctx = await requireMember(["owner"]);
  const [{ t, lang }, sp, drive] = await Promise.all([getT(), searchParams, getDriveStatus(ctx.orgId)]);
  const flash = typeof sp.drive === "string" && /^[a-z_]{1,40}$/.test(sp.drive) ? sp.drive : null;
  const deleteHref = `mailto:${BUSINESS.grievanceEmail}?subject=${encodeURIComponent(`Delete account: ${ctx.org.slug}`)}&body=${encodeURIComponent(`Mess: ${ctx.org.name} (${ctx.org.slug})\nOwner phone: ${ctx.user.phone}\n\nPlease delete my account and data.`)}`;

  return (
    <>
      <PageHeader title={t.backupAndData} back="/more" />
      <main className="mx-auto max-w-md space-y-6 p-4">
        <DriveCard
          configured={googleConfigured()}
          flash={flash}
          t={t}
          status={drive && {
            email: drive.email,
            status: drive.status,
            folderId: drive.folderId,
            lastError: drive.lastError,
            lastBackup: drive.lastBackupAt
              ? new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: ctx.org.timezone }).format(drive.lastBackupAt)
              : null,
          }}
        />

        <section className="space-y-2">
          <h2 className="section-title">{t.backup}</h2>
          <div className="card space-y-3 p-4">
            <p className="text-sm text-muted">{t.downloadHint}</p>
            {/* Plain link: the browser downloads the ZIP (no client JS needed). */}
            <a href="/api/export" download className="btn-secondary w-full">
              <IconDownload className="size-5" /> {t.downloadData}
            </a>
          </div>
        </section>

        <section className="card space-y-1 p-4">
          <a href={deleteHref} className="font-medium text-bad underline">{t.deleteMyData}</a>
          <p className="text-sm text-muted">{t.deleteHint}</p>
        </section>
      </main>
    </>
  );
}
