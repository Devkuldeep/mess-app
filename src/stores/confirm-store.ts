"use client";
// Global "are you sure?" as a Promise (zustand).
//
//   import { confirm } from "@/stores/confirm-store";
//   if (await confirm({ title: "यह पेमेंट हटाएं?", tone: "danger" })) { … }
//
// <ConfirmHost /> (mounted once in AppRuntime) renders the ConfirmDialog.
// For a dialog that runs async work with a spinner, use <ConfirmDialog onConfirm>
// directly instead. Browser-only UI state.
import { create } from "zustand";
import type { ReactNode } from "react";
import type { DialogTone } from "@/components/ui/dilog-box/dialog-variants";

export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  tone?: DialogTone;
  icon?: ReactNode;
  /** Defaults: "हाँ"/"Yes" and "रद्द करें"/"Cancel" in the current language. */
  confirmLabel?: string;
  cancelLabel?: string;
};

type Request = ConfirmOptions & { resolve: (ok: boolean) => void; settled: boolean };

type ConfirmState = {
  open: boolean;
  request: Request | null;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  answer: (ok: boolean) => void;
  /** After the close animation: drop the finished request. */
  cleanup: () => void;
};

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  open: false,
  request: null,
  ask: (opts) => {
    // A new question cancels one that's still open.
    get().request?.resolve(false);
    return new Promise<boolean>((resolve) => set({ open: true, request: { ...opts, resolve, settled: false } }));
  },
  answer: (ok) => {
    const r = get().request;
    if (!r || r.settled) return;
    r.settled = true;
    r.resolve(ok);
    set({ open: false });
  },
  cleanup: () => {
    if (!get().open) set({ request: null });
  },
}));

/** Ask the user to confirm. Resolves true for "yes", false for "no"/dismiss. */
export const confirm = (opts: ConfirmOptions) => useConfirmStore.getState().ask(opts);
