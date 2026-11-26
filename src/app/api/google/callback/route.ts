// GET /api/google/callback?code&state → exchange code, save encrypted token,
// create the backup folder, run a first backup, back to More.
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getMember } from "@/server/auth";
import { exchangeCode, GoogleError, OAUTH_COOKIE, redirectUri } from "@/server/google";
import { backupToDrive, saveConnection } from "@/server/drive-backup";

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: NextRequest) {
  const back = (result: string) => {
    const res = NextResponse.redirect(new URL(`/more/backup?drive=${result}`, req.url));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/google" });
    return res;
  };

  const ctx = await getMember();
  if (!ctx || ctx.role !== "owner") return back("error");

  const q = req.nextUrl.searchParams;
  if (q.get("error")) return back("denied"); // owner pressed Cancel
  const [state, verifier, orgId] = (req.cookies.get(OAUTH_COOKIE)?.value ?? "").split(".");
  const code = q.get("code");
  if (!code || !state || !verifier || !same(state, q.get("state") ?? "") || orgId !== ctx.orgId) return back("error");

  try {
    const t = await exchangeCode(code, verifier, redirectUri(req.nextUrl.origin));
    await saveConnection(ctx, t);
  } catch (e) {
    if (e instanceof GoogleError && e.status === 403) return back("noscope"); // unticked the Drive box
    console.error("[drive] connect failed", e instanceof Error ? e.message : e);
    return back("error");
  }
  const first = await backupToDrive(ctx);
  return back(first.ok ? "connected" : "connected_backup_failed");
}
