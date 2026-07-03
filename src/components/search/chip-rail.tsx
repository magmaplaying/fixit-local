"use client";

import { usePager } from "@/components/motion/use-pager";

/**
 * The category filter rail: server-rendered chips flow through a scrollable
 * row flanked by paging arrows that disable at the ends. Arrows appear from
 * `sm:` up (and only while the row actually overflows); on touch widths the
 * rail swipes, with the edge fades as the affordance.
 */
export function ChipRail({ children }: { children: React.ReactNode }) {
  const { railRef, pos, page } = usePager();
  const scrollable = !(pos.start && pos.end);

  const arrowClass =
    "hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition hover:border-cobble-500/50 hover:text-cobble-800 disabled:pointer-events-none disabled:opacity-30 sm:flex";

  return (
    <div className="flex items-center gap-1.5">
      {scrollable && (
        <button type="button" onClick={() => page(-1)} disabled={pos.start} aria-label="Предишни категории" className={arrowClass}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}

      <div ref={railRef} className="chip-rail flex min-w-0 flex-1 gap-2 overflow-x-auto p-1">
        {children}
      </div>

      {scrollable && (
        <button type="button" onClick={() => page(1)} disabled={pos.end} aria-label="Следващи категории" className={arrowClass}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
