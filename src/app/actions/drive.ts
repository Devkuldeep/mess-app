"use server";
import { refresh } from "next/cache";
import { requireMember } from "@/server/auth";
import { backupToDrive, disconnect, getDriveStatus } from "@/server/drive-backup";

export type DriveActionState = { ok?: boolean; error?: string } | undefined;

export async function backupNow(): Promise<DriveActionState> {
  const ctx = await requireMember(["owner"]);
  const s = await getDriveStatus(ctx.orgId);
  // Simple rate limit: one manual backup per minute.
  if (s?.lastAttemptAt && Date.now() - s.lastAttemptAt.getTime() < 60_000) return { error: "wait" };
  const r = await backupToDrive(ctx);
  refresh();
  return r.ok ? { ok: true } : { error: r.reconnect ? "reconnect" : "failed" };
}

export async function disconnectDrive() {
  const ctx = await requireMember(["owner"]);
  await disconnect(ctx.orgId);
  refresh();
}
