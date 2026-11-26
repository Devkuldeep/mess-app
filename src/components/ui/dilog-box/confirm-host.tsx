"use client";
// Renders the global confirm() from @/stores/confirm-store. Mount once (AppRuntime).
import { useShallow } from "zustand/react/shallow";
import { useConfirmStore } from "@/stores/confirm-store";
import { clientT } from "../shared/client-t";
import { ConfirmDialog } from "./confirm-dialog";

export function ConfirmHost() {
  const { open, request, answer, cleanup } = useConfirmStore(
    useShallow((s) => ({ open: s.open, request: s.request, answer: s.answer, cleanup: s.cleanup })),
  );
  if (!request) return null;
  const t = clientT();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) answer(false);
      }}
      onConfirm={() => answer(true)}
      onClosed={cleanup}
      title={request.title}
      description={request.description}
      tone={request.tone ?? "default"}
      icon={request.icon}
      confirmLabel={request.confirmLabel ?? t.confirmYes}
      cancelLabel={request.cancelLabel ?? t.cancel}
    />
  );
}
