// On-device database (IndexedDB via Dexie). Browser only — import from
// client components. See CLAUDE.md → "Offline architecture".
//
// Adding offline data later (wastage entries, menu, inventory, cached
// customer list): add a table in a NEW `this.version(n + 1).stores({...})`
// call — never edit an existing version's schema.
import Dexie, { type EntityTable } from "dexie";
import type { SyncOp } from "./sync";

export type OutboxRow = {
  seq?: number; // auto-increment → replay order
  opId: string;
  kind: SyncOp["kind"];
  op: SyncOp;
  tries: number;
  createdAt: number;
};

class LocalDb extends Dexie {
  outbox!: EntityTable<OutboxRow, "seq">;

  constructor() {
    super("mess-local");
    this.version(1).stores({
      outbox: "++seq, &opId, kind",
    });
  }
}

let instance: LocalDb | null = null;

/** Lazily opened so server rendering never touches IndexedDB. */
export function localDb(): LocalDb {
  instance ??= new LocalDb();
  return instance;
}

/** Wipe everything on this device (logout on a shared phone). */
export async function clearLocalDb() {
  await localDb().delete();
  instance = null;
}
