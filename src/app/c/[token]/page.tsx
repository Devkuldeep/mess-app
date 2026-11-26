import Link from "next/link";
import { Suspense } from "react";
import QRCode from "qrcode";
import { ConnectivityFallback } from "@/components/sync-bar";
import { WAITING } from "@/components/page-header";
import { SkipGrid } from "@/components/skip-grid";
import { LangToggle } from "@/components/lang-toggle";
import { getPortal } from "@/server/data";
import { getT } from "@/server/i18n";
import { fmt, formatDate, formatHour, formatMoney } from "@/lib/i18n";
import { upiLink } from "@/lib/links";
import { mealsOf } from "@/lib/schedule";

export const metadata = { title: "My tiffin", robots: { index: false, follow: false } };

export default function PortalPage(props: PageProps<"/c/[token]">) {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
        <Portal params={props.params} />
      </Suspense>
    </main>
  );
}

async function Portal({ params }: { params: PageProps<"/c/[token]">["params"] }) {
  const { token } = await params;
  const [{ t, lang }, p] = await Promise.all([getT(), getPortal(token)]);
  if (!p) return <p className="card mt-10 p-6 text-center text-muted">{t.portalInvalid}</p>;

  const brand = /^#[0-9a-fA-F]{6}$/.test(p.org.brandColor) ? p.org.brandColor : undefined;
  const pay = p.org.upiId && p.balance > 0 ? upiLink({ upiId: p.org.upiId, payee: p.org.name, amount: p.balance, note: p.customer.name }) : null;
  const qr = pay ? await QRCode.toString(pay, { type: "svg", margin: 1, width: 200 }) : null;
  const meals = mealsOf(p.plan?.meals ?? null);

  return (
    <div className="space-y-5" style={brand ? ({ "--brand": brand } as React.CSSProperties) : undefined}>
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand">{p.org.name}</p>
          <h1 className="truncate text-2xl font-bold">{t.portalHello}, {p.customer.name}</h1>
        </div>
        <LangToggle lang={lang} />
      </header>

      <section className={`card p-4 ${p.balance > 0 ? "" : "bg-ok-soft"}`}>
        <p className="text-sm text-muted">{p.balance >= 0 ? t.portalBalance : t.advance}</p>
        <p className={`text-4xl font-bold tabular-nums ${p.balance > 0 ? "text-bad" : "text-ok"}`}>{formatMoney(Math.abs(p.balance))}</p>
        {pay && (
          <div className="mt-4 space-y-3">
            <a href={pay} className="btn-primary w-full">{t.portalPay}</a>
            {qr && (
              <div className="flex flex-col items-center gap-1">
                <div className="rounded-xl bg-white p-2 [&_svg]:size-44" dangerouslySetInnerHTML={{ __html: qr }} />
                <p className="text-xs text-muted">{p.org.upiId}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {!p.plan ? (
        <p className="card p-4 text-muted">{t.portalNoPlan}</p>
      ) : (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t.portalSkipTitle}</h2>
          <p className="text-sm text-muted">{fmt(t.portalSkipHint, { hour: formatHour(p.org.skipCutoffHour, lang) })}</p>
          <SkipGrid
            token={token}
            days={p.days}
            meals={meals}
            dayLabels={p.days.map((d) => formatDate(d.date, lang))}
            labels={{ lunch: t.lunch, dinner: t.dinner, portalSkip: t.portalSkip, portalComing: t.portalComing, portalLocked: t.portalLocked, holiday: t.holiday, portalCutoffPassed: t.portalCutoffPassed }}
          />
        </section>
      )}

      {p.org.phone && (
        <a href={`tel:${p.org.phone}`} className="btn-secondary w-full">📞 {p.org.name}</a>
      )}

      <p className="text-center text-xs text-muted">
        {fmt(t.portalDataNotice, { mess: p.org.name })}{" "}
        <Link href="/privacy" className="underline">{t.privacy}</Link> · <Link href="/terms" className="underline">{t.terms}</Link>
      </p>
    </div>
  );
}
