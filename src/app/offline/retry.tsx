"use client";

export function RetryButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn-primary w-full" onClick={() => location.reload()}>
      {label}
    </button>
  );
}
