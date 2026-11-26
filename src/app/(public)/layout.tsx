import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

// Public pages: no cookies/session here, so they prerender as static HTML.
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo.png" alt="" width={32} height={32} />
            Mess Manager
          </Link>
          <span className="flex-1" />
          <Link href="/login" className="btn-secondary min-h-10 px-3 text-sm">Login</Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
