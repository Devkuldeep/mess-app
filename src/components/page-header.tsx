import Link from "next/link";
import type { ReactNode } from "react";
import { IconBack } from "./icons";

export function PageHeader({ title, sub, back, right }: { title: string; sub?: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-md items-center gap-1 px-2">
        {back ? (
          <Link href={back} className="icon-btn" aria-label="Back"><IconBack /></Link>
        ) : <span className="w-2" />}
        <div className="min-w-0 flex-1 py-2">
          <h1 className="truncate text-xl font-semibold">{title}</h1>
          {sub && <p className="truncate text-sm text-muted">{sub}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export const WAITING = "इंटरनेट का इंतज़ार… · Waiting for internet…";
