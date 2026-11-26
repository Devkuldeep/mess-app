"use client";
// Shows toasts from @/stores/toast-store. Mount once (AppRuntime).
// GSAP: drop-in with a little bounce, swipe sideways to dismiss (Draggable),
// fold away on exit. Auto-hide pauses while the finger is on it.
import { useEffect, useRef } from "react";
import { cva } from "class-variance-authority";
import { useToastStore, type Toast } from "@/stores/toast-store";
import { cn } from "@/lib/cn";
import { Draggable, gsap, prefersReducedMotion, useGSAP } from "../gsap";
import { clientT } from "../shared/client-t";

const toastVariants = cva(
  "pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lg will-change-transform touch-pan-y",
  {
    variants: {
      tone: {
        default: "border-line",
        success: "border-ok/30",
        danger: "border-bad/30",
        warning: "border-warn/30",
      },
    },
    defaultVariants: { tone: "default" },
  },
);
const iconVariants = cva("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold", {
  variants: {
    tone: {
      default: "bg-brand-soft text-brand-ink",
      success: "bg-ok-soft text-ok",
      danger: "bg-bad-soft text-bad",
      warning: "bg-warn-soft text-warn",
    },
  },
});
const ICON = { default: "i", success: "✓", danger: "!", warning: "!" } as const;

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const label = clientT().notifications;
  return (
    <section
      aria-label={label}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex max-w-md flex-col gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </section>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const dismiss = useToastStore((s) => s.dismiss);

  const { contextSafe } = useGSAP(
    () => {
      const el = ref.current!;
      if (prefersReducedMotion()) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15 });
      else gsap.fromTo(el, { y: -24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" });

      // Swipe left/right to dismiss.
      const [drag] = Draggable.create(el, {
        type: "x",
        minimumMovement: 6,
        onPress: () => window.clearTimeout(timer.current),
        onDrag(this: Draggable) {
          gsap.set(el, { opacity: 1 - Math.min(1, Math.abs(this.x) / 160) * 0.8 });
        },
        onDragEnd(this: Draggable) {
          if (Math.abs(this.x) > 80) leave(Math.sign(this.x));
          else {
            gsap.to(el, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" });
            arm();
          }
        },
      });
      return () => drag.kill();
    },
    { scope: ref },
  );

  // Slide out (sideways after a swipe, upward otherwise), fold the gap, then remove.
  const leave = contextSafe((dir = 0) => {
    window.clearTimeout(timer.current);
    const el = ref.current;
    if (!el) return dismiss(toast.id);
    if (prefersReducedMotion()) return gsap.to(el, { opacity: 0, duration: 0.12, onComplete: () => dismiss(toast.id) });
    gsap
      .timeline({ onComplete: () => dismiss(toast.id) })
      .to(el, dir ? { x: dir * 420, opacity: 0, duration: 0.25, ease: "power2.in" } : { y: -16, opacity: 0, scale: 0.97, duration: 0.22, ease: "power2.in" })
      .to(el, { height: 0, marginTop: -8, paddingTop: 0, paddingBottom: 0, borderWidth: 0, duration: 0.18, ease: "power1.inOut" });
  });

  const arm = () => {
    window.clearTimeout(timer.current);
    if (toast.duration > 0) timer.current = window.setTimeout(() => leave(), toast.duration);
  };
  useEffect(() => {
    arm();
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arm once per toast
  }, []);

  const t = clientT();
  return (
    <div
      ref={ref}
      role={toast.tone === "danger" ? "alert" : "status"}
      aria-live={toast.tone === "danger" ? "assertive" : "polite"}
      className={toastVariants({ tone: toast.tone })}
    >
      <span aria-hidden className={iconVariants({ tone: toast.tone })}>{ICON[toast.tone]}</span>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-medium leading-snug">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-muted">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-ink"
          onClick={() => {
            toast.action!.onClick();
            leave();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" aria-label={t.dismiss} onClick={() => leave()} className={cn("-mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-xl text-muted")}>
        ×
      </button>
    </div>
  );
}
