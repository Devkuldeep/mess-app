"use client";
import { useState } from "react";
import { IconCopy } from "./icons";

export function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary flex-1"
      onClick={async () => {
        await navigator.clipboard?.writeText(text).catch(() => {});
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      <IconCopy className="size-5" /> {ok ? done : label}
    </button>
  );
}
