"use client";
// Friendly error screen for owner/staff pages (instead of Next's default).
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-4xl" aria-hidden>😕</p>
      <h1 className="text-xl font-semibold">कुछ गड़बड़ हो गई · Something went wrong</h1>
      <p className="text-muted">आपका डेटा सुरक्षित है। फिर से कोशिश करें। · Your data is safe. Please try again.</p>
      <button type="button" onClick={reset} className="btn-primary w-full">फिर कोशिश करें · Try again</button>
      {error.digest && <p className="text-xs text-muted">Error {error.digest}</p>}
    </main>
  );
}
