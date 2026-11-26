"use client";
// GSAP motion for the drawer: open/close timelines, staggered content, and
// swipe-to-close with Draggable (overlay fades with the drag).
// Reduced motion → short fades only, no sliding.
import { useEffect, useRef, type RefObject } from "react";
import { Draggable, gsap, prefersReducedMotion, useGSAP } from "../gsap";
import { setScrollLock } from "../shared/scroll-lock";
import type { DrawerSide } from "./drawer-variants";

const OFFSCREEN: Record<DrawerSide, gsap.TweenVars> = {
  bottom: { yPercent: 100 },
  top: { yPercent: -100 },
  left: { xPercent: -100 },
  right: { xPercent: 100 },
};
const AXIS: Record<DrawerSide, "x" | "y"> = { bottom: "y", top: "y", left: "x", right: "x" };
/** +1 when "closing" moves along +axis (down/right), -1 for up/left. */
const SIGN: Record<DrawerSide, 1 | -1> = { bottom: 1, top: -1, left: -1, right: 1 };

/** Close if dragged past this share of the panel, or flicked faster than this (px/ms). */
const CLOSE_DISTANCE = 0.28;
const CLOSE_VELOCITY = 0.6;


export function useDrawerMotion({
  open, side, swipe, dialogRef, panelRef, overlayRef, onRequestClose, onClosed,
}: {
  open: boolean;
  side: DrawerSide;
  swipe: boolean;
  dialogRef: RefObject<HTMLDialogElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  onRequestClose: () => void;
  onClosed?: () => void;
}) {
  const dragRef = useRef<Draggable | null>(null);
  const lockedRef = useRef(false);
  // Latest callbacks without re-running the animation effect.
  const cb = useRef({ onRequestClose, onClosed });
  useEffect(() => {
    cb.current = { onRequestClose, onClosed };
  });

  const lock = (on: boolean) => {
    if (lockedRef.current === on) return;
    lockedRef.current = on;
    setScrollLock(on);
  };

  useGSAP(
    () => {
      const dialog = dialogRef.current;
      const panel = panelRef.current;
      const overlay = overlayRef.current;
      if (!dialog || !panel || !overlay) return;
      const reduce = prefersReducedMotion();
      dragRef.current?.kill();
      dragRef.current = null;

      if (open) {
        if (!dialog.open) dialog.showModal();
        lock(true);

        const tl = gsap.timeline();
        if (reduce) {
          gsap.set(panel, { x: 0, y: 0, xPercent: 0, yPercent: 0 });
          tl.fromTo([overlay, panel], { opacity: 0 }, { opacity: 1, duration: 0.15, overwrite: "auto" });
        } else {
          tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out", overwrite: "auto" }, 0)
            .fromTo(
              panel,
              { ...OFFSCREEN[side], x: 0, y: 0, opacity: 1 },
              { xPercent: 0, yPercent: 0, duration: 0.55, ease: "expo.out", overwrite: "auto" },
              0,
            );
          const items = panel.querySelectorAll("[data-drawer-stagger]");
          if (items.length) {
            tl.from(items, { y: 14, opacity: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity" }, 0.12);
          }
        }

        // Swipe to close, started only from handle/header ([data-drawer-drag])
        // so the scrollable body keeps scrolling normally.
        const triggers = Array.from(panel.querySelectorAll<HTMLElement>("[data-drawer-drag]"));
        if (swipe && triggers.length) {
          const axis = AXIS[side];
          const sign = SIGN[side];
          const size = axis === "y" ? panel.offsetHeight : panel.offsetWidth;
          let lastPos = 0;
          let lastT = 0;
          let velocity = 0;
          const bounds =
            axis === "y"
              ? sign > 0 ? { minY: 0, maxY: size } : { minY: -size, maxY: 0 }
              : sign > 0 ? { minX: 0, maxX: size } : { minX: -size, maxX: 0 };

          dragRef.current = Draggable.create(panel, {
            type: axis,
            trigger: triggers,
            bounds,
            edgeResistance: 0.9,
            minimumMovement: 4,
            zIndexBoost: false,
            onPress() {
              lastPos = 0;
              lastT = performance.now();
              velocity = 0;
            },
            onDrag(this: Draggable) {
              const pos = this[axis] * sign;
              const now = performance.now();
              velocity = (pos - lastPos) / Math.max(1, now - lastT);
              lastPos = pos;
              lastT = now;
              gsap.set(overlay, { opacity: 1 - Math.min(1, pos / size) * 0.9 });
            },
            onDragEnd(this: Draggable) {
              const pos = this[axis] * sign;
              if (pos > size * CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
                cb.current.onRequestClose();
              } else {
                gsap.to(panel, { [axis]: 0, duration: 0.35, ease: "power3.out" });
                gsap.to(overlay, { opacity: 1, duration: 0.25 });
              }
            },
          })[0];
        }
      } else if (dialog.open) {
        gsap
          .timeline({
            onComplete: () => {
              dialog.close();
              lock(false);
              cb.current.onClosed?.();
            },
          })
          .to(panel, reduce ? { opacity: 0, duration: 0.12, overwrite: "auto" } : { ...OFFSCREEN[side], duration: 0.32, ease: "power3.in", overwrite: "auto" }, 0)
          .to(overlay, { opacity: 0, duration: reduce ? 0.12 : 0.28, ease: "power1.in", overwrite: "auto" }, 0);
      } else {
        lock(false);
      }
    },
    { dependencies: [open, side, swipe], scope: dialogRef },
  );

  // Unmount: drop the drag instance and release the page scroll.
  useEffect(
    () => () => {
      dragRef.current?.kill();
      if (lockedRef.current) setScrollLock(false);
    },
    [],
  );

  return {
    /** Dialog closed without our animation (e.g. browser forced it): just release the lock. */
    onNativeClose: () => lock(false),
  };
}
