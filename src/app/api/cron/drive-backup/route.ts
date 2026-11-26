// Nightly Google Drive backups for every connected mess.
// Call with:  Authorization: Bearer $CRON_SECRET   (GET or POST)
//  - Vercel Cron sends this header automatically when CRON_SECRET is set.
//  - Docker/VPS: crontab →  0 2 * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/drive-backup
import { timingSafeEqual } from "node:crypto";
import { runScheduledBackups } from "@/server/drive-backup";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

async function handle(req: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: "CRON_SECRET not set" }, { status: 503 });
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runScheduledBackups();
  return Response.json(summary, { headers: { "cache-control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
export const maxDuration = 300;
