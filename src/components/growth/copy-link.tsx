"use client";

import { useState } from "react";

/** A read-only field + button that copies the given value to the clipboard. */
export function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Вашата покана"
        className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/70"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — the field is selectable as a fallback */
          }
        }}
        className="shrink-0 rounded-lg bg-cobble-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cobble-700"
      >
        {copied ? "Копирано!" : "Копирай"}
      </button>
    </div>
  );
}
