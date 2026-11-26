"use client";
// "×" on a payment row: asks with the global confirm(), deletes, then toasts.
import { useTransition } from "react";
import { deletePayment } from "@/app/actions/customers";
import { confirm } from "@/stores/confirm-store";
import { toast } from "@/stores/toast-store";

export function DeletePaymentButton({
  id, labels,
}: {
  id: string;
  labels: { delete: string; title: string; description: string; confirm: string; cancel: string; done: string };
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={labels.delete}
      disabled={pending}
      className="icon-btn text-xl disabled:opacity-40"
      onClick={async () => {
        const ok = await confirm({ title: labels.title, description: labels.description, tone: "danger", icon: "!", confirmLabel: labels.confirm, cancelLabel: labels.cancel });
        if (!ok) return;
        start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deletePayment(fd);
          toast.success(labels.done);
        });
      }}
    >
      {pending ? "…" : "×"}
    </button>
  );
}
