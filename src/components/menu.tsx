// Settings-style menu building blocks (iOS/Android list look).
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { IconChevron } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export function MenuSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {title && <h2 className="section-title">{title}</h2>}
      <ul className="card divide-y divide-line overflow-hidden">{children}</ul>
    </section>
  );
}

const iconTone = {
  brand: "bg-brand-soft text-brand-ink",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  muted: "bg-surface text-muted",
} as const;

/** One tappable row: icon tile, label, optional status line, chevron. */
export function MenuRow({
  href, icon: I, label, sub, tone = "brand", subTone, external,
}: {
  href: string;
  icon: Icon;
  label: string;
  sub?: ReactNode;
  tone?: keyof typeof iconTone;
  subTone?: "ok" | "warn" | "bad";
  external?: boolean;
}) {
  const subClass = subTone === "ok" ? "text-ok" : subTone === "warn" ? "text-warn" : subTone === "bad" ? "text-bad" : "text-muted";
  return (
    <li>
      <Link
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="flex min-h-16 items-center gap-3 px-4 py-2 active:bg-line/60"
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone[tone]}`}>
          <I className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          {sub && <span className={`block truncate text-sm ${subClass}`}>{sub}</span>}
        </span>
        <IconChevron className="size-5 shrink-0 text-muted" />
      </Link>
    </li>
  );
}

/** A row that holds a control instead of navigating (e.g. language toggle). */
export function MenuItem({ icon: I, label, children }: { icon: Icon; label: string; children: ReactNode }) {
  return (
    <li className="flex min-h-16 items-center gap-3 px-4 py-2">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
        <I className="size-5" />
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {children}
    </li>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

export function ScreenHint({ children }: { children: ReactNode }) {
  return <p className="px-1 text-sm text-muted">{children}</p>;
}
