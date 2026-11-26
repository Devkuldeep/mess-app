import Link from "next/link";
import { BUSINESS as B } from "@/lib/business";

export const metadata = {
  title: { absolute: "Mess Manager — tiffin & mess management app" },
  description: "Daily cooking count, delivery checklist that works offline, payments with WhatsApp reminders, customer skip links and wastage tracking. Hindi-first.",
};

const FEATURES = [
  { hi: "कल कितना बनाना है", en: "Tomorrow's count — lunch/dinner, veg/non-veg, after skips and holidays", icon: "🍲" },
  { hi: "डिलीवरी लिस्ट", en: "Area-wise delivery checklist that works without internet", icon: "🛵" },
  { hi: "पेमेंट और बाकी", en: "Monthly bills from meals served, WhatsApp reminders, UPI QR", icon: "₹" },
  { hi: "ग्राहक खुद छुट्टी लें", en: "Customers skip meals from a link — no app, no login", icon: "🔗" },
  { hi: "बचा खाना कम करें", en: "Log leftovers in 30 seconds, see ₹ lost, get cooking suggestions", icon: "📉" },
  { hi: "आपका डेटा आपका", en: "Download all your data any time as Excel files", icon: "🔒" },
  { hi: "Google Drive बैकअप", en: "Optional nightly backup to the owner's own Google Drive — the app only touches the backup files it creates", icon: "☁️" },
];

// Public homepage (also what Google's OAuth review looks at). Logged-in users
// are sent to /today by src/proxy.ts before this renders.
export default function Home() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-bold leading-tight">टिफ़िन और मेस का हिसाब,<br />बिना कॉपी के</h1>
        <p className="text-lg text-muted">Tiffin &amp; mess management for small kitchens — in Hindi, on your phone, even without internet.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/signup" className="btn-primary">{B.trialDays} दिन फ़्री शुरू करें · Start free</Link>
          <Link href="/login" className="btn-secondary">Login</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.hi} className="card flex gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg" aria-hidden>{f.icon}</span>
            <div>
              <h2 className="font-semibold">{f.hi}</h2>
              <p className="text-sm text-muted">{f.en}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="card space-y-2 p-4 text-sm">
        <h2 className="font-semibold">How we handle your data</h2>
        <p className="text-muted">
          Your customers&apos; details belong to your mess. We use them only to run the app — never sold, never used for ads. If you connect
          Google Drive, we ask only for permission to create and manage our own backup files there (<code>drive.file</code>), and use it only to
          save your mess&apos;s nightly backup. Read the{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link> and <Link href="/terms" className="underline">Terms</Link>.
        </p>
      </section>

      <p className="text-center">
        <Link href="/pricing" className="font-semibold text-brand-ink underline">See plans &amp; pricing →</Link>
      </p>
    </div>
  );
}
