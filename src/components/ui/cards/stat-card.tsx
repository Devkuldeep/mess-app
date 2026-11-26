"use client";
// A big number with a label — "बाकी ₹21,070", "बर्बाद 12%", "आज 42 टिफ़िन".
// GSAP counts the number up on first show (instant with reduced motion).
// `trend` shows ↑/↓ change; `goodWhen` says which direction is good (green).
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/i18n";
import { formatCell, type ColumnFormat } from "@/lib/table";
import { gsap, prefersReducedMotion, useGSAP } from "../gsap";
import { cardVariants, statValueVariants, trendVariants, type CardVariants, type StatTone } from "./card-variants";

export type StatCardProps = Omit<CardVariants, "interactive"> & {
  label: ReactNode;
  value: number | null;
  format?: Exclude<ColumnFormat, "date" | "text">;
  lang?: Lang;
  tone?: StatTone;
  /** Line under the number, e.g. "लक्ष्य 5%". */
  hint?: ReactNode;
  /** Change vs previous period, as a fraction (0.12 = +12%). */
  trend?: number | null;
  /** Which direction is good: "up" for income, "down" for wastage. Default "up". */
  goodWhen?: "up" | "down";
  icon?: ReactNode;
  href?: string;
  /** Count-up animation. Default true. */
  animate?: boolean;
  className?: string;
};

export function StatCard({
  label, value, format = "number", lang = "en", tone, hint, trend, goodWhen = "up", icon, href, animate = true, variant, padding, className,
}: StatCardProps) {
  const numRef = useRef<HTMLSpanElement>(null);
  const text = value === null ? "—" : formatCell(value, format, lang);

  useGSAP(
    () => {
      const el = numRef.current;
      if (!el || value === null || !animate || prefersReducedMotion() || value === 0) return;
      const counter = { v: 0 };
      gsap.to(counter, {
        v: value,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          // keep decimals only for money/percent precision
          const v = format === "number" ? Math.round(counter.v) : counter.v;
          el.textContent = formatCell(v, format, lang);
        },
        onComplete: () => {
          el.textContent = text;
        },
      });
    },
    { dependencies: [value, format, lang], scope: numRef },
  );

  const trendBadge =
    trend === null || trend === undefined ? null : (
      <span className={trendVariants({ good: trend === 0 ? "neutral" : (trend > 0) === (goodWhen === "up") })}>
        <span aria-hidden>{trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}</span>
        {Math.abs(Math.round(trend * 100))}%
      </span>
    );

  const body = (
    <>
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium text-muted">{label}</p>
        {icon && <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-lg">{icon}</span>}
      </div>
      {/* Screen readers get the final value, not the counting digits. */}
      <p className={cn(statValueVariants({ tone }), "mt-1")} aria-label={text}>
        <span ref={numRef} aria-hidden>{text}</span>
      </p>
      {(hint || trendBadge) && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          {trendBadge}
          {hint}
        </div>
      )}
    </>
  );

  return href ? (
    <Link href={href} className={cn(cardVariants({ variant, padding, interactive: true }), className)}>
      {body}
    </Link>
  ) : (
    <div className={cn(cardVariants({ variant, padding }), className)}>{body}</div>
  );
}
