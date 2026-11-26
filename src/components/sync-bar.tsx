"use client";
// Offline banner + "N changes waiting to sync". Never let a tap vanish silently.
import { useOffline } from "next/offline";
import { flush, usePendingOps } from "./outbox";
import { IconCloudOff, IconSync } from "./icons";

export function SyncBar({ offlineText, pendingText, syncNow }: { offlineText: string; pendingText: string; syncNow: string }) {
  const offline = useOffline();
  const pending = usePendingOps().length;
  if (!offline && pending === 0) return null;
  return (
    <div role="status" className="border-b border-line bg-warn-soft pt-[env(safe-area-inset-top)] text-sm text-warn">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2">
      {offline ? <IconCloudOff className="size-5 shrink-0" /> : <IconSync className="size-5 shrink-0" />}
      <p className="flex-1">
        {offline ? offlineText : pendingText.replace("{n}", String(pending))}
      </p>
      {!offline && pending > 0 && (
        <button type="button" onClick={() => void flush()} className="min-h-10 rounded-lg px-3 font-semibold underline">
          {syncNow}
        </button>
      )}
      </div>
    </div>
  );
}

export function ConnectivityFallback({ waiting }: { waiting: string }) {
  const offline = useOffline();
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {offline ? (
        <p className="card p-4 text-center text-muted">{waiting}</p>
      ) : (
        <>
          <div className="h-24 animate-pulse rounded-2xl bg-line/60" />
          <div className="h-16 animate-pulse rounded-2xl bg-line/60" />
          <div className="h-16 animate-pulse rounded-2xl bg-line/60" />
        </>
      )}
    </div>
  );
}
