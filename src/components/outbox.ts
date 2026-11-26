"use client";
// Offline outbox: writes are saved on the device (Dexie/IndexedDB) first, then
// replayed to /api/sync in order. Survives reloads, app restarts and closed
// tabs. Every op is idempotent server-side. See CLAUDE.md → "Offline".
import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/local-db";
import type { SyncOp, SyncResult } from "@/lib/sync";

const BATCH = 200;
const MAX_TRIES = 20;
const EMPTY: SyncOp[] = [];

/** Pending (unsynced) ops, live across components and tabs. */
export function usePendingOps(): SyncOp[] {
  return useLiveQuery(async () => (await localDb().outbox.orderBy("seq").toArray()).map((r) => r.op), [], EMPTY);
}

type NewDeliveryOp = Omit<Extract<SyncOp, { kind: "delivery" }>, "at">;

/** Queue an op and try to send it. Delivery ops get the device timestamp here. */
export async function enqueue(input: SyncOp | NewDeliveryOp) {
  const op: SyncOp = input.kind === "delivery" && !("at" in input) ? { ...input, at: Date.now() } : (input as SyncOp);
  await localDb().outbox.add({ opId: op.opId, kind: op.kind, op, tries: 0, createdAt: Date.now() });
  void flush();
}

let flushing: Promise<boolean> | null = null;

/** Send pending ops. One at a time per tab (and per device via Web Locks). Resolves true if anything synced. */
export function flush(): Promise<boolean> {
  flushing ??= withLock(doFlush).finally(() => { flushing = null; });
  return flushing;
}

async function withLock(fn: () => Promise<boolean>): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("mess-outbox-flush", fn);
  }
  return fn();
}

async function doFlush(): Promise<boolean> {
  const table = localDb().outbox;
  let synced = false;
  for (;;) {
    const rows = await table.orderBy("seq").limit(BATCH).toArray();
    if (rows.length === 0) return synced;

    let res: Response;
    try {
      res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ops: rows.map((r) => r.op) }),
        cache: "no-store",
      });
    } catch {
      return synced; // offline — keep everything, retry later
    }
    if (!res.ok) return synced; // 401 (logged out) / 5xx: keep, retry later

    const { results } = (await res.json()) as { results: SyncResult[] };
    const byOp = new Map(results.map((r) => [r.opId, r]));
    const done: number[] = [];
    const retry: OutboxRowUpdate[] = [];
    for (const row of rows) {
      const r = byOp.get(row.opId);
      if (!r) continue;
      if (r.ok || !r.retry || row.tries + 1 >= MAX_TRIES) done.push(row.seq!);
      else retry.push({ key: row.seq!, changes: { tries: row.tries + 1 } });
    }
    await localDb().transaction("rw", table, async () => {
      await table.bulkDelete(done);
      if (retry.length) await table.bulkUpdate(retry);
    });
    synced ||= done.length > 0;
    if (done.length < rows.length) return synced; // some failed; stop and retry later
  }
}
type OutboxRowUpdate = { key: number; changes: { tries: number } };

/** Flush on reconnect, on focus, and every 30s. Calls onSynced after ops reach the server. */
export function startAutoFlush(onSynced?: () => void): () => void {
  const tick = () => {
    if (document.visibilityState === "hidden") return;
    void flush().then((s) => s && onSynced?.());
  };
  window.addEventListener("online", tick);
  document.addEventListener("visibilitychange", tick);
  const id = window.setInterval(tick, 30_000);
  tick();
  return () => {
    window.removeEventListener("online", tick);
    document.removeEventListener("visibilitychange", tick);
    window.clearInterval(id);
  };
}

export const newId = () => crypto.randomUUID();
