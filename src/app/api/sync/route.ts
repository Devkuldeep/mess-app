// Offline outbox replay endpoint. Body: { ops: SyncOp[] } (max 200).
import { getMember } from "@/server/auth";
import { applyOps } from "@/server/mutations";
import { parseOp, type SyncOp } from "@/lib/sync";

export async function POST(req: Request) {
  // JSON-only: a cross-site form can't send this content type without a CORS preflight.
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "unsupported media type" }, { status: 415 });
  }
  const ctx = await getMember();
  if (!ctx) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { ops?: unknown } | null;
  if (!body || !Array.isArray(body.ops) || body.ops.length > 200) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const ops: SyncOp[] = [];
  const results = [];
  for (const raw of body.ops) {
    const op = parseOp(raw);
    if (op) ops.push(op);
    else results.push({ opId: String((raw as { opId?: unknown })?.opId ?? ""), ok: false, error: "invalid", retry: false });
  }
  results.push(...(await applyOps(ctx, ops)));
  return Response.json({ results });
}
