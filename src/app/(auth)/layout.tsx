import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-8">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon.svg" alt="" width={64} height={64} className="rounded-2xl" />
      </div>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-line/60" />}>{children}</Suspense>
      <div className="mt-auto pt-8"><SiteFooter compact /></div>
    </main>
  );
}
