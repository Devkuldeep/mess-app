---
name: mobile-ui
description: Mobile-first UI/UX rules for the mess app (Next.js + Tailwind v4). Use when building or changing any screen, component, form, list or navigation in src/app or src/components, or when asked to make the UI look better on phones.
---

# Mobile-first UI for Mess Manager

Users are mess owners, cooks and delivery staff on budget Android phones
(360×640 to 412×915 CSS px), often one-handed, outdoors, on flaky 3G, and
many are more comfortable in Hindi than English. Design for that person first;
desktop is a stretched phone layout, not a separate design.

## Layout

- Design at **360px wide first**. Add `sm:`/`md:` only to cap width (`max-w-md mx-auto`) — never to *add* core features.
- Owner screens use the shell in `src/app/(app)/layout.tsx`: sticky top bar (title + context), scrollable content, **fixed bottom tab bar** (5 tabs max) with `pb-[env(safe-area-inset-bottom)]`.
- Content gets bottom padding so the tab bar never covers the last row (`pb-28`).
- One primary action per screen. Put it where the thumb is: bottom-right FAB or a full-width button at the end of the content.
- Lists are **cards/rows, never tables**. One row = one tap target; secondary actions are icon buttons on the right.
- Tabular data (bills, reports): use `DataTable` — it renders cards on phones and a table only from `sm` up. Give it `mobile` roles: one `title`, a `subtitle`, the key number as `meta`.
- No horizontal scroll, ever (except deliberate chip rows with `overflow-x-auto snap-x`).

## Touch & input

- Minimum touch target **48×48px** (`min-h-12`, `size-12` for icon buttons). Spacing between targets ≥ 8px.
- Inputs: `text-base` (16px) minimum so iOS doesn't zoom; height ≥ 48px.
- Set the right keyboard: `inputMode="numeric"` + `pattern` for money/phone, `type="tel"`, `type="date"`, `autoComplete` on login fields.
- Prefer **segmented buttons, chips and toggles** over dropdowns and typing (owners should finish daily entry in ~30 seconds).
- Destructive actions: confirm with a second tap or undo, not `window.confirm()`.
- Every interactive element has a visible `:active` state (`active:scale-[.98]` or bg change) — touch has no hover.

## Visual system (tokens live in `src/app/globals.css`)

- Use semantic tokens: `bg-surface`, `bg-card`, `text-ink`, `text-muted`, `border-line`, `bg-brand`, `text-on-brand`, `bg-ok`/`bg-warn`/`bg-bad` (+ `-soft` variants). Don't hard-code hex in components.
- Dark mode works automatically via tokens; check both.
- Type scale: page title `text-xl font-semibold`, section `text-sm font-semibold uppercase tracking-wide text-muted`, body `text-base`, meta `text-sm text-muted`. **Big numbers** (counts, money) `text-4xl font-bold tabular-nums`.
- Radius: cards `rounded-2xl`, buttons/inputs `rounded-xl`, chips `rounded-full`.
- Colour carries meaning: green = done/paid, amber = pending, red = due/overdue, brand orange = primary action. Never rely on colour alone — pair with an icon or word.
- Devanagari needs room: line-height ≥ 1.5, don't truncate Hindi labels to one short line; test both languages (`lang` cookie / toggle in More).

## States

- Every list has an **empty state** (one line + the primary action).
- Every async boundary has a skeleton or `ConnectivityFallback` (shows "waiting for internet" when offline).
- Show offline/pending-sync status via `SyncBar` — never silently drop a tap.
- Optimistic UI for frequent taps (delivered, skip): update instantly, sync in background (see `src/components/outbox.ts`).

## Accessibility

- Real `<button>`/`<a>`/`<label>`; icon-only buttons need `aria-label`.
- Contrast ≥ 4.5:1 for text (tokens already meet this).
- `aria-current="page"` on the active tab; `role="status"` on toasts/banners.

## Performance on cheap phones

- Server Components by default; `"use client"` only for interactive leaves.
- No UI libraries or icon fonts — inline SVG icons from `src/components/icons.tsx`.
- No layout shift: fixed heights for skeletons, `tabular-nums` for changing numbers.

## Checklist before finishing a screen

1. Looks right at 360px wide in Chrome DevTools device mode, both light and dark.
2. Works in Hindi (longer strings wrap, nothing clipped).
3. All targets ≥ 48px; primary action reachable by thumb.
4. Empty, loading, offline and error states exist.
5. Works after toggling DevTools → Network → Offline (for delivery/payments).
