"use client";
// Global toast notifications (zustand).
//
//   import { toast } from "@/stores/toast-store";
//   toast.success("पेमेंट सेव हो गया");
//   toast.error("इंटरनेट नहीं है", { description: "बाद में कोशिश करें" });
//
// Works from anywhere in browser code — components, event handlers, the
// offline outbox — no hook needed. <Toaster /> (mounted once in AppRuntime) shows them.
// Browser-only UI state: never read/write this during server rendering.
import { create } from "zustand";

export type ToastTone = "default" | "success" | "danger" | "warning";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** ms before it hides itself; 0 = stays until dismissed. */
  duration: number;
  action?: { label: string; onClick: () => void };
};

export type ToastInput = Partial<Omit<Toast, "id" | "title">>;

type ToastState = {
  toasts: Toast[];
  push: (title: string, opts?: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

/** At most this many on screen; the oldest goes first. */
const MAX_VISIBLE = 3;
let seq = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (title, opts = {}) => {
    const id = `t${++seq}`;
    const item: Toast = { id, title, tone: "default", duration: opts.tone === "danger" ? 6000 : 3500, ...opts };
    set((s) => ({ toasts: [...s.toasts, item].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

const push = (tone: ToastTone) => (title: string, opts?: Omit<ToastInput, "tone">) => useToastStore.getState().push(title, { ...opts, tone });

/** Show a toast from anywhere. Returns its id (for toast.dismiss). */
export const toast = Object.assign((title: string, opts?: ToastInput) => useToastStore.getState().push(title, opts), {
  success: push("success"),
  error: push("danger"),
  warning: push("warning"),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
});
