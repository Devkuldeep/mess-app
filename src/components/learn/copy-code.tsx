"use client";
import { useState } from "react";

/** Small "Copy" button in the corner of a code block. */
export function CopyCode({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="code-copy"
      aria-label={done ? "Copy ho gaya" : "Code copy karo"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked (http, old browser): nothing to do */
        }
      }}
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}
