"use client";

import { useState } from "react";

function withUtm(url: string, source: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=${source}&utm_medium=share`;
}

/**
 * Share a URL to the channels popular in Bulgaria (WhatsApp, Viber, Facebook)
 * plus native share / copy, each tagged with a UTM source for attribution.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${withUtm(url, "whatsapp")}`)}`;
  const viber = `viber://forward?text=${encodeURIComponent(`${title} ${withUtm(url, "viber")}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm(url, "facebook"))}`;

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: withUtm(url, "native") });
      } catch {
        /* user dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(withUtm(url, "copy"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const cls =
    "inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black/70 transition hover:border-cobble-500/50 hover:text-cobble-800";

  return (
    <div className="flex flex-wrap gap-2">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={cls}>
        WhatsApp
      </a>
      <a href={viber} className={cls}>
        Viber
      </a>
      <a href={facebook} target="_blank" rel="noopener noreferrer" className={cls}>
        Facebook
      </a>
      <button type="button" onClick={share} className={cls}>
        {copied ? "Копирано!" : "Сподели"}
      </button>
    </div>
  );
}
