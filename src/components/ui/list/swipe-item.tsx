"use client";
// A list row with swipe actions (GSAP Draggable).
//   • Swipe LEFT  → reveals `actions` on the right ("कॉल", "हटाएं"); tap one.
//   • Swipe RIGHT → past ~40% runs `primary` ("डिलीवर") straight away.
// The actions are real <button>s: Tab/screen-reader users reach them directly
// (focusing one slides the row open), so swiping is a shortcut, never the only way.
// Vertical page scrolling keeps working (Draggable type "x" + native touch scroll).
//
//   <List>
//     <SwipeItem title="Aman" subtitle="Sector 5" href="/customers/1"
//       primary={{ label: "डिलीवर", tone: "ok", onAction: markDelivered }}
//       actions={[{ label: "कॉल", tone: "brand", onAction: call }, { label: "हटाएं", tone: "bad", onAction: remove }]} />
//   </List>
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Draggable, gsap, prefersReducedMotion, useGSAP } from "../gsap";
import { ItemInner, type ItemContent } from "./list";
import { listItemVariants, swipeActionVariants, type ListItemVariants, type SwipeTone } from "./list-variants";

export type SwipeAction = {
  label: string;
  icon?: ReactNode;
  tone?: SwipeTone;
  onAction: () => void | Promise<unknown>;
};

export type SwipeItemProps = ItemContent &
  Pick<ListItemVariants, "density"> & {
    href?: string;
    onClick?: () => void;
    /** Revealed by swiping left. Keep to 1–3. */
    actions?: SwipeAction[];
    /** Runs on a long swipe right. */
    primary?: SwipeAction;
    disabled?: boolean;
    className?: string;
  };

const ACTION_W = 76; // px per revealed button
const FULL_SWIPE = 0.4; // fraction of row width that triggers `primary`

export function SwipeItem({ href, onClick, actions = [], primary, density, disabled, className, ...content }: SwipeItemProps) {
  const rootRef = useRef<HTMLLIElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const rightW = actions.length * ACTION_W;

  const { contextSafe } = useGSAP({ scope: rootRef });

  const slideTo = useCallback(
    (x: number) => {
      const run = contextSafe(() => {
        const row = rowRef.current;
        if (!row) return;
        gsap.to(row, { x, duration: prefersReducedMotion() ? 0 : 0.28, ease: "power3.out", overwrite: true });
        setOpen(x !== 0);
      });
      run();
    },
    [contextSafe],
  );

  const run = useCallback(
    async (action: SwipeAction) => {
      setBusy(true);
      try {
        await action.onAction();
      } finally {
        setBusy(false);
        slideTo(0);
      }
    },
    [slideTo],
  );

  useGSAP(
    () => {
      const row = rowRef.current;
      const root = rootRef.current;
      if (!row || !root || disabled || (!actions.length && !primary)) return;
      const [d] = Draggable.create(row, {
        type: "x",
        allowNativeTouchScrolling: true,
        dragClickables: true,
        minimumMovement: 8,
        edgeResistance: 0.85,
        bounds: { minX: -rightW, maxX: primary ? root.offsetWidth : 0 },
        onPress() {
          draggedRef.current = false;
          this.applyBounds({ minX: -rightW, maxX: primary ? root.offsetWidth : 0 });
        },
        onDragStart() {
          draggedRef.current = true;
        },
        onDragEnd() {
          const x = this.x as number;
          if (primary && x > root.offsetWidth * FULL_SWIPE) {
            gsap.to(row, { x: root.offsetWidth, duration: 0.18, ease: "power2.in", overwrite: true, onComplete: () => void run(primary) });
          } else if (rightW && x < -rightW / 2) {
            slideTo(-rightW);
          } else {
            slideTo(0);
          }
        },
      });
      return () => d.kill();
    },
    { scope: rootRef, dependencies: [rightW, !!primary, disabled] },
  );

  // Tap anywhere else closes an open row (like native lists).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) slideTo(0);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, slideTo]);

  // A drag must not also count as a tap on the link/button underneath.
  const swallowClickAfterDrag = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    } else if (open) {
      e.preventDefault();
      slideTo(0);
    }
  };

  const interactive = !!(href || onClick);
  const cls = cn(listItemVariants({ density, disabled, interactive }), "bg-card");
  const inner = <ItemInner {...content} chevron={!!href && !content.trailing} />;

  return (
    <li
      ref={rootRef}
      className={cn("relative overflow-hidden bg-card", className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) slideTo(0);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) slideTo(0);
      }}
    >
      {primary && (
        <div className="absolute inset-y-0 left-0 flex w-full">
          <button
            type="button"
            disabled={busy}
            onFocus={() => slideTo(ACTION_W)}
            onClick={() => void run(primary)}
            className={cn(swipeActionVariants({ tone: primary.tone }), "w-full items-start pl-5")}
          >
            <span className="flex w-14 flex-col items-center gap-0.5">
              {primary.icon && <span aria-hidden className="text-lg leading-none">{primary.icon}</span>}
              {primary.label}
            </span>
          </button>
        </div>
      )}
      {actions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex" style={{ width: rightW }}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              disabled={busy}
              onFocus={() => slideTo(-rightW)}
              onClick={() => void run(a)}
              className={cn(swipeActionVariants({ tone: a.tone }), "flex-1")}
            >
              {a.icon && <span aria-hidden className="text-lg leading-none">{a.icon}</span>}
              {a.label}
            </button>
          ))}
        </div>
      )}
      <div ref={rowRef} className="relative bg-card touch-pan-y" onClickCapture={swallowClickAfterDrag}>
        {href ? (
          <Link href={href} className={cls} draggable={false}>
            {inner}
          </Link>
        ) : onClick ? (
          <button type="button" onClick={onClick} disabled={!!disabled} className={cls}>
            {inner}
          </button>
        ) : (
          <div className={cls}>{inner}</div>
        )}
      </div>
    </li>
  );
}
