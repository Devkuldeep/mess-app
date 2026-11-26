"use client";
// Google Drive backup card (More screen, owner only).
import { useActionState } from "react";
import { backupNow, disconnectDrive, type DriveActionState } from "@/app/actions/drive";
import type { Dict } from "@/lib/i18n";

type Status = { email: string | null; status: "active" | "needs_reconnect"; folderId: string | null; lastBackup: string | null; lastError: string | null } | null;

export function DriveCard({ configured, status, flash, t }: { configured: boolean; status: Status; flash: string | null; t: Dict }) {
  const [state, run, pending] = useActionState<DriveActionState, FormData>(() => backupNow(), undefined);
  const msgKey = flash ? (`driveMsg_${flash}` as keyof Dict) : null;
  const flashText = msgKey && msgKey in t ? t[msgKey] : null;
  const good = flash === "connected";

  return (
    <section id="drive" className="space-y-2">
      <h2 className="section-title">{t.driveTitle}</h2>
      <div className="card space-y-3 p-4">
        {flashText && (
          <p role="status" className={`rounded-xl px-3 py-2 text-sm ${good ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>{flashText}</p>
        )}
        <p className="text-sm text-muted">{t.driveIntro}</p>

        {!configured ? (
          <p className="text-sm text-muted">{t.driveUnavailable}</p>
        ) : !status ? (
          <a href="/api/google/connect" className="btn-primary w-full">
            <GoogleDriveMark /> {t.driveConnect}
          </a>
        ) : (
          <>
            {status.status === "needs_reconnect" && (
              <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">{t.driveReconnect}</p>
            )}
            <div className="text-sm">
              <p className="font-medium">{t.driveConnectedAs.replace("{email}", status.email ?? "Google")}</p>
              <p className="text-muted">{status.lastBackup ? t.driveLast.replace("{when}", status.lastBackup) : t.driveNever} · {t.driveKeeps}</p>
            </div>
            {status.status === "needs_reconnect" ? (
              <a href="/api/google/connect" className="btn-primary w-full">{t.driveConnect}</a>
            ) : (
              <form action={run}>
                <button disabled={pending} className="btn-primary w-full">{pending ? "…" : state?.ok ? t.driveBackedUp : t.driveBackupNow}</button>
              </form>
            )}
            {state?.error && <p role="alert" className="text-sm text-bad">{t[`driveErr_${state.error}` as keyof Dict] ?? state.error}</p>}
            <div className="flex gap-2">
              {status.folderId && (
                <a href={`https://drive.google.com/drive/folders/${status.folderId}`} target="_blank" rel="noreferrer" className="btn-secondary flex-1">
                  {t.driveOpen}
                </a>
              )}
              <form action={disconnectDrive} className="flex-1">
                <button className="btn-ghost w-full text-bad">{t.driveDisconnect}</button>
              </form>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function GoogleDriveMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M8 3h8l6 11h-8z" />
      <path d="M8 3 2 14l4 7 6-11" />
      <path d="M6 21h12l4-7H10" />
    </svg>
  );
}
