"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Asks the browser for the visitor's location and reloads `/services` with a
 * `near=lat,lng` param, which the page uses to sort results by proximity.
 * `params` carries the current filters (q/category/city/radius) so they survive.
 */
export function NearMeButton({ params }: { params: Record<string, string> }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        const next = new URLSearchParams(params);
        next.set("near", `${lat},${lng}`);
        router.push(`/services?${next.toString()}`);
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <button
      type="button"
      onClick={locate}
      disabled={status === "locating"}
      title="Подреди услугите по близост до вас"
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-cobble-500/40 disabled:opacity-60 dark:border-white/15 dark:bg-white/5"
    >
      <span aria-hidden>📍</span>
      {status === "locating"
        ? "Определяне…"
        : status === "error"
          ? "Няма достъп до локация"
          : "Близо до мен"}
    </button>
  );
}
