// Loading placeholder shaped like a card / stat card (Suspense fallback).
import { cn } from "@/lib/cn";

export function CardSkeleton({ lines = 2, stat = false, className }: { lines?: number; stat?: boolean; className?: string }) {
  return (
    <div aria-busy="true" className={cn("rounded-2xl border border-line bg-card p-4", className)}>
      <div className="h-3.5 w-1/3 animate-pulse rounded bg-line/70" />
      {stat ? (
        <div className="mt-3 h-9 w-1/2 animate-pulse rounded bg-line/70" />
      ) : (
        Array.from({ length: lines }, (_, i) => <div key={i} className="mt-3 h-3 animate-pulse rounded bg-line/50" style={{ width: `${85 - i * 15}%` }} />)
      )}
    </div>
  );
}
