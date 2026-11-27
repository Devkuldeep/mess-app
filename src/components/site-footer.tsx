import Link from "next/link";
import { BUSINESS } from "@/lib/business";

export const LEGAL_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refund", label: "Refund & Cancellation" },
  { href: "/shipping", label: "Shipping & Delivery" },
  { href: "/contact", label: "Contact Us" },
] as const;

/** Footer with the policy links Google OAuth and Razorpay check for. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`mx-auto max-w-md px-4 text-center text-sm text-muted ${compact ? "py-4" : "border-t border-line py-8"}`}>
      <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex min-h-10 items-center underline-offset-2 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      {!compact && (
        <>
          <p className="mt-3">
            <Link href="/learn" className="inline-flex min-h-10 items-center underline-offset-2 hover:underline">
              📖 App kaise banta hai: developer story
            </Link>
          </p>
          <p className="mt-1">
            © {BUSINESS.appName} · {BUSINESS.legalName}
          </p>
        </>
      )}
    </footer>
  );
}
