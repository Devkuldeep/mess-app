// Google Drive backups: connect, back up, prune, disconnect.
// Each mess backs up to its OWN owner's Drive (see CLAUDE.md → Google Drive backup).
import "server-only";
import { db } from "./db";
import type { OrgCtx } from "./auth";
import { buildExport } from "./export";
import { decryptSecret, encryptSecret } from "./secretbox";
import {
  createFolder, deleteFile, DRIVE_SCOPE, folderUsable, GoogleError, listFolder, refreshAccessToken, revokeToken, uploadFile,
} from "./google";

export const KEEP_BACKUPS = 30;

export async function getDriveStatus(orgId: string) {
  const c = await db.driveConnection.findUnique({ where: { orgId } });
  if (!c) return null;
  return {
    email: c.googleEmail, status: c.status, folderId: c.folderId, connectedAt: c.connectedAt,
    lastBackupAt: c.lastBackupAt, lastAttemptAt: c.lastAttemptAt, lastBackupName: c.lastBackupName, lastError: c.lastError,
  };
}

/** Called from the OAuth callback with a fresh token. Creates the backup folder. */
export async function saveConnection(ctx: OrgCtx, t: { accessToken: string; refreshToken?: string; scope: string; email: string | null }) {
  if (!t.scope.split(" ").includes(DRIVE_SCOPE)) throw new GoogleError("drive permission not granted", 403);
  if (!t.refreshToken) throw new GoogleError("no refresh token returned", 400);
  const old = await db.driveConnection.findUnique({ where: { orgId: ctx.orgId } });
  // Reuse the old folder if this is the same Google account and it still exists.
  let folderId = old?.googleEmail === t.email && old?.folderId && (await folderUsable(t.accessToken, old.folderId)) ? old.folderId : null;
  folderId ??= await createFolder(t.accessToken);
  const data = {
    googleEmail: t.email, refreshTokenEnc: encryptSecret(t.refreshToken), folderId, status: "active" as const,
    connectedBy: ctx.user.id, connectedAt: new Date(), lastError: null,
  };
  await db.driveConnection.upsert({ where: { orgId: ctx.orgId }, create: { orgId: ctx.orgId, ...data }, update: data });
}

export async function disconnect(orgId: string) {
  const c = await db.driveConnection.findUnique({ where: { orgId } });
  if (!c) return;
  try {
    await revokeToken(decryptSecret(c.refreshTokenEnc));
  } catch {
    // undecryptable/expired token: nothing to revoke
  }
  await db.driveConnection.delete({ where: { orgId } });
}

export type BackupResult = { ok: true; name: string } | { ok: false; error: string; reconnect: boolean };

/** Upload today's export ZIP; one file per day (same-day re-runs replace it); keep the newest KEEP_BACKUPS. */
export async function backupToDrive(ctx: OrgCtx): Promise<BackupResult> {
  const c = await db.driveConnection.findUnique({ where: { orgId: ctx.orgId } });
  if (!c) return { ok: false, error: "not connected", reconnect: true };
  await db.driveConnection.update({ where: { orgId: ctx.orgId }, data: { lastAttemptAt: new Date() } });
  try {
    const token = await refreshAccessToken(decryptSecret(c.refreshTokenEnc));
    let folderId = c.folderId && (await folderUsable(token, c.folderId)) ? c.folderId : null;
    if (!folderId) {
      folderId = await createFolder(token); // owner deleted the folder → recreate
    }
    const { filename, zip } = await buildExport(ctx);
    const file = await uploadFile(token, folderId, filename, zip);

    // Same-day duplicates, then anything beyond the newest KEEP_BACKUPS.
    const files = await listFolder(token, folderId);
    const extra = [
      ...files.filter((f) => f.name === filename && f.id !== file.id),
      ...files.filter((f) => f.name !== filename).slice(KEEP_BACKUPS - 1),
    ];
    for (const f of extra) await deleteFile(token, f.id).catch(() => {});

    await db.driveConnection.update({
      where: { orgId: ctx.orgId },
      data: { folderId, lastBackupAt: new Date(), lastBackupName: filename, lastError: null, status: "active" },
    });
    return { ok: true, name: filename };
  } catch (e) {
    const reconnect = e instanceof GoogleError && e.reconnect;
    const error = e instanceof Error ? e.message.slice(0, 300) : "backup failed";
    await db.driveConnection.update({
      where: { orgId: ctx.orgId },
      data: { lastError: error, ...(reconnect ? { status: "needs_reconnect" as const } : {}) },
    });
    return { ok: false, error, reconnect };
  }
}

/** OrgCtx for background jobs (no request/session): acts as the owner who connected Drive. */
export async function systemCtx(orgId: string): Promise<OrgCtx | null> {
  const org = await db.org.findUnique({ where: { id: orgId }, include: { members: { where: { role: "owner" }, include: { user: true }, take: 1 } } });
  const owner = org?.members[0]?.user;
  if (!org || !owner) return null;
  return {
    user: { id: owner.id, name: owner.name, phone: owner.phone },
    orgId: org.id,
    role: "owner",
    org: {
      id: org.id, name: org.name, slug: org.slug, phone: org.phone, upiId: org.upiId, brandColor: org.brandColor,
      skipCutoffHour: org.skipCutoffHour, timezone: org.timezone, wastageTargetPct: org.wastageTargetPct,
    },
  };
}

/** Nightly job: back up every active connection not backed up in the last 20 hours. */
export async function runScheduledBackups(budgetMs = 240_000) {
  const started = Date.now();
  const since = new Date(Date.now() - 20 * 3600_000);
  const due = await db.driveConnection.findMany({
    where: { status: "active", OR: [{ lastBackupAt: null }, { lastBackupAt: { lt: since } }] },
    orderBy: { lastBackupAt: { sort: "asc", nulls: "first" } },
    select: { orgId: true },
  });
  const summary = { due: due.length, ok: 0, failed: 0, skipped: 0 };
  for (const { orgId } of due) {
    if (Date.now() - started > budgetMs) {
      summary.skipped++;
      continue; // next run picks them up
    }
    const ctx = await systemCtx(orgId);
    if (!ctx) {
      summary.failed++;
      continue;
    }
    const r = await backupToDrive(ctx);
    if (r.ok) summary.ok++;
    else summary.failed++;
  }
  return summary;
}
