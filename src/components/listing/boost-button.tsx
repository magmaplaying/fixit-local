"use client";

import { useState, useTransition } from "react";
import { startBoostCheckout } from "@/app/_actions/payments";

/**
 * "Топ обява" button. Calls the server action, then navigates client-side to
 * the returned Stripe Checkout URL — an in-action redirect to an external URL
 * doesn't navigate reliably in this Next fork, so we do it here.
 */
export function BoostButton({ listingId }: { listingId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function boost() {
    setError(null);
    start(async () => {
      const res = await startBoostCheckout(listingId);
      if (res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error ?? "Възникна грешка.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={boost}
        disabled={pending}
        className="btn-press rounded-lg border border-cobble-500/40 px-3 py-1 text-xs font-medium text-cobble-700 transition hover:bg-cobble-50 disabled:opacity-60 dark:text-cobble-300 dark:hover:bg-cobble-950/30"
      >
        {pending ? "Момент…" : "Топ обява"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}
