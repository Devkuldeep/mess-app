"use client";
// GSAP motion for dialogs: soft scale + rise on open, quick fade/shrink on
// close, staggered content, and a "nudge" when a must-answer dialog is tapped
// outside. Reduced motion → short fades only.
import { useCallback, useEffect, useRef, type RefObject } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../gsap";
import { setScrollLock } from "../shared/scroll-lock";

export function useDialogMotion({
  open, dialogRef, panelRef, overlayRef, onClosed,
}: {
  open: boolean;
  dialogRef: RefObject<HTMLDialogElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  onClosed?: () => void;
}) {
  const lockedRef = useRef(false);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });
  const lock = (on: boolean) => {
    if (lockedRef.current === on) return;
    lockedRef.current = on;
    setScrollLock(on);
  };

  const { contextSafe } = useGSAP(
    () => {
      const dialog = dialogRef.current;
      const panel = panelRef.current;
      const overlay = overlayRef.current;
      if (!dialog || !panel || !overlay) return;
      const reduce = prefersReducedMotion();

      if (open) {
        if (!dialog.open) dialog.showModal();
        lock(true);
        const tl = gsap.timeline();
        if (reduce) {
          gsap.set(panel, { x: 0, y: 0, scale: 1 }); // undo any leftover close transform
          tl.fromTo([overlay, panel], { opacity: 0 }, { opacity: 1, duration: 0.15, overwrite: "auto" });
        } else {
          tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", overwrite: "auto" }, 0).fromTo(
            panel,
            { opacity: 0, scale: 0.92, y: 18 },
            { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: "back.out(1.4)", overwrite: "auto" },
            0,
          );
          const items = panel.querySelectorAll("[data-dialog-stagger]");
          if (items.length) {
            tl.from(items, { y: 10, opacity: 0, duration: 0.32, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity" }, 0.1);
          }
        }
      } else if (dialog.open) {
        gsap
          .timeline({
            onComplete: () => {
              dialog.close();
              lock(false);
              onClosedRef.current?.();
            },
          })
          .to(panel, reduce ? { opacity: 0, duration: 0.12, overwrite: "auto" } : { opacity: 0, scale: 0.96, y: 8, duration: 0.18, ease: "power2.in", overwrite: "auto" }, 0)
          .to(overlay, { opacity: 0, duration: reduce ? 0.12 : 0.2, ease: "power1.in", overwrite: "auto" }, 0);
      } else {
        lock(false);
      }
    },
    { dependencies: [open], scope: dialogRef },
  );

  // Must-answer dialog tapped outside: small shake so it's clear it needs a choice.
  // Wrapped with contextSafe at call time (event handler), so it's reverted on unmount.
  const nudge = useCallback(() => {
    contextSafe(() => {
      const panel = panelRef.current;
      if (!panel || prefersReducedMotion()) return;
      gsap.fromTo(panel, { x: 0 }, { keyframes: { x: [-8, 7, -5, 3, 0] }, duration: 0.4, ease: "power1.out", overwrite: "auto" });
    })();
  }, [contextSafe, panelRef]);

  useEffect(
    () => () => {
      if (lockedRef.current) setScrollLock(false);
    },
    [],
  );

  return { nudge, onNativeClose: () => lock(false) };
}
