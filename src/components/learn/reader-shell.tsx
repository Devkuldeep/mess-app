"use client";
// Reading chrome for /learn: sticky bar with a progress line, and reader
// settings (text size, day/sepia/night). Settings are a per-device convenience
// kept in localStorage; the page renders fine without them.
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

type Theme = "auto" | "light" | "sepia" | "dark";
const THEMES: { v: Theme; label: string }[] = [
  { v: "auto", label: "Auto" },
  { v: "light", label: "Din" },
  { v: "sepia", label: "Sepia" },
  { v: "dark", label: "Raat" },
];
const SIZES = [
  { v: 0, label: "A−" },
  { v: 1, label: "A" },
  { v: 2, label: "A+" },
  { v: 3, label: "A++" },
];
const KEY = "learn.prefs.v1";

type Prefs = { theme: Theme; size: number };
const DEFAULT: Prefs = { theme: "auto", size: 1 };

function parsePrefs(raw: string | null): Prefs {
  try {
    const p = JSON.parse(raw ?? "null") as Partial<Prefs> | null;
    if (!p) return DEFAULT;
    return {
      theme: THEMES.some((t) => t.v === p.theme) ? (p.theme as Theme) : "auto",
      size: Number.isInteger(p.size) && (p.size as number) >= 0 && (p.size as number) <= 3 ? (p.size as number) : 1,
    };
  } catch {
    return DEFAULT;
  }
}

// A tiny external store over localStorage (with an in-memory fallback when
// storage is blocked). The server and the first client render use DEFAULT.
const listeners = new Set<() => void>();
let memory: string | null = null;
let cached: { raw: string | null; value: Prefs } = { raw: null, value: DEFAULT };

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}
function getSnapshot(): Prefs {
  const raw = readRaw();
  if (raw !== cached.raw) cached = { raw, value: parsePrefs(raw) };
  return cached.value;
}
const getServerSnapshot = () => DEFAULT;
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
function writePrefs(p: Prefs) {
  const raw = JSON.stringify(p);
  memory = raw;
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    /* private mode / storage blocked: the in-memory copy still works for this visit */
  }
  listeners.forEach((l) => l());
}

export function ReaderShell({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Reading progress: written straight to the bar's style (no re-render per scroll).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Close the settings panel on Esc or a tap outside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !toggle.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const update = (next: Partial<Prefs>) => writePrefs({ ...prefs, ...next });

  return (
    <div className="reader-root flex min-h-dvh flex-col" data-theme={prefs.theme} data-size={prefs.size}>
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Seedha padhai par jao
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="relative mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Link href="/learn" className="flex min-h-11 min-w-0 items-center gap-2 font-semibold">
            <span aria-hidden className="text-xl">📖</span>
            <span className="truncate">App kaise banta hai</span>
          </Link>
          <span className="flex-1" />
          <Link href="/" className="hidden min-h-11 items-center px-2 text-sm text-muted hover:text-ink sm:inline-flex">
            Mess Manager
          </Link>
          <button
            ref={toggle}
            type="button"
            className="icon-btn text-base font-semibold text-ink"
            aria-expanded={open}
            aria-controls="reader-settings"
            aria-label="Padhne ki settings: akshar aur rang"
            onClick={() => setOpen((o) => !o)}
          >
            Aa
          </button>
          {open && (
            <div
              ref={panel}
              id="reader-settings"
              role="group"
              aria-label="Padhne ki settings"
              className="card absolute top-full right-4 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-4 p-4 shadow-lg"
            >
              <fieldset>
                <legend className="label">Akshar ka size</legend>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button key={s.v} type="button" className="chip flex-1 justify-center" aria-pressed={prefs.size === s.v} onClick={() => update({ size: s.v })}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label">Rang</legend>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((t) => (
                    <button key={t.v} type="button" className="chip justify-center px-2" aria-pressed={prefs.theme === t.v} onClick={() => update({ theme: t.v })}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </div>
        <div className="h-0.5 overflow-hidden" aria-hidden>
          <div ref={bar} className="reader-progress h-full origin-left bg-brand" style={{ transform: "scaleX(0)" }} />
        </div>
      </header>
      <div id="content" className="flex-1">
        {children}
      </div>
    </div>
  );
}
