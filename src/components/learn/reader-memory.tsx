"use client";
// "Wahin se padho": remembers the last chapter opened on this device.
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

const KEY = "learn.last.v1";
type Last = { slug: string; num: string; title: string };

/** Rendered on a chapter page: saves it as the last one read. */
export function RememberChapter(last: Last) {
  const { slug, num, title } = last;
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ slug, num, title }));
    } catch {
      /* storage blocked */
    }
  }, [slug, num, title]);
  return null;
}

// Read-only external store: the raw string is the snapshot (stable between
// renders); the server and the first client render see null.
const readLast = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const noSubscribe = () => () => {};

function parseLast(raw: string | null): Last | null {
  try {
    const v = JSON.parse(raw ?? "null") as Last | null;
    return v && typeof v.slug === "string" && /^[\w-]+$/.test(v.slug) && typeof v.title === "string" ? v : null;
  } catch {
    return null;
  }
}

/** Rendered on /learn: a "continue" card if a chapter was opened before. */
export function ContinueReading() {
  const raw = useSyncExternalStore(noSubscribe, readLast, () => null);
  const last = parseLast(raw);
  if (!last) return null;
  return (
    <Link href={`/learn/${last.slug}`} className="card flex items-center gap-3 border-brand/40 bg-brand-soft p-4 text-brand-ink">
      <span aria-hidden className="text-2xl">🔖</span>
      <span className="min-w-0">
        <span className="block text-sm">Wahin se padho</span>
        <span className="block truncate font-semibold">
          {last.num}. {last.title}
        </span>
      </span>
      <span aria-hidden className="ml-auto text-xl">→</span>
    </Link>
  );
}
