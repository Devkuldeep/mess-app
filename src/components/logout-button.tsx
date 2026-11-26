"use client";
// Logout syncs first; if changes still can't reach the server (offline), the
// first tap warns and a second tap logs out anyway (those changes are lost).
import { useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { clearOfflinePages } from "./app-runtime";
import { flush, usePendingOps } from "./outbox";
import { localDb } from "@/lib/local-db";

export function LogoutButton({ label, unsyncedWarning }: { label: string; unsyncedWarning: string }) {
  const pending = usePendingOps().length;
  const [armed, setArmed] = useState(false);
  const [busy, start] = useTransition();

  const onClick = () =>
    start(async () => {
      await flush();
      const left = await localDb().outbox.count();
      if (left > 0 && !armed) {
        setArmed(true);
        return;
      }
      await clearOfflinePages();
      await logout();
    });

  return (
    <div className="space-y-2">
      {armed && <p role="alert" className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">{unsyncedWarning.replace("{n}", String(pending))}</p>}
      <button type="button" onClick={onClick} disabled={busy} className="btn-secondary w-full text-bad">
        {busy ? "…" : label}
      </button>
    </div>
  );
}
