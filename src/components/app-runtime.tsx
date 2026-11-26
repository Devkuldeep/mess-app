"use client";
// App-wide offline plumbing, mounted once in the root layout:
//  - registers the Serwist service worker (production only)
//  - keeps the offline outbox flushing and re-renders when it syncs
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SerwistProvider } from "@serwist/turbopack/react";
import { startAutoFlush } from "./outbox";
import { clearLocalDb } from "@/lib/local-db";

export function AppRuntime({ children }: { children: ReactNode }) {
  const router = useRouter();
  // When a tap made offline reaches the server, refresh server-rendered data.
  useEffect(() => startAutoFlush(() => router.refresh()), [router]);

  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV !== "production"}
      // Don't hard-reload when the network returns: it would wipe half-filled
      // forms. Next's useOffline + the outbox already retry on reconnect.
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}

/** Logout on a shared phone: drop cached pages and unsynced local data. */
export async function clearOfflinePages() {
  navigator.serviceWorker?.controller?.postMessage("clear-pages");
  await clearLocalDb().catch(() => {});
}
