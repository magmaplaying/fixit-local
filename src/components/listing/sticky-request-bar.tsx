"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only sticky bar with the price and the booking CTA. On phones the
 * booking ticket sits below the photos, description, map and reviews — a long
 * scroll nobody finishes; this keeps the action one thumb-tap away (sticky
 * mobile CTAs are among the highest win-rate ecommerce patterns). Slides out
 * of the way while the real booking form is on screen.
 */
export function StickyRequestBar({
  priceLabel,
  ctaHref,
  ctaLabel,
}: {
  priceLabel: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  const [formVisible, setFormVisible] = useState(false);

  // Same IntersectionObserver pattern as <Reveal/>; if the observer never
  // fires (headless embeds), the bar simply stays visible — safe default.
  useEffect(() => {
    const target = document.getElementById("booking");
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), {
      rootMargin: "0px 0px -20% 0px",
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 lg:hidden ${
        formVisible ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">Цена</p>
          <p className="truncate font-mono text-lg font-bold text-espresso">{priceLabel}</p>
        </div>
        <a
          href={ctaHref}
          className="btn-press shrink-0 rounded-lg bg-cobble-600 px-5 py-2.5 font-medium text-white transition hover:bg-cobble-700"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
