// Loading placeholder for a DataTable (use as a Suspense fallback).
// Fixed heights so nothing jumps when the real rows arrive.
import { cn } from "@/lib/cn";

export function DataTableSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className={cn("card divide-y divide-line overflow-hidden", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-16 items-center gap-3 px-4 py-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded bg-line/70" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-line/50" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded bg-line/70" />
        </div>
      ))}
    </div>
  );
}
