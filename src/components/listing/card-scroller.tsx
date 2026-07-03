"use client";

import { usePager } from "@/components/motion/use-pager";

/**
 * Horizontal card scroller: scroll-snap rail with edge fades, swipe on touch,
 * and paging arrow buttons on desktop that disable at the ends. The rail is a
 * labelled, focusable region, so keyboard users can scroll it with arrow keys.
 * Slides come in as server-rendered children.
 */
export function CardScroller({
  label,
  header,
  children,
}: {
  label: string;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { railRef, pos, page } = usePager();

  const arrowClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-background transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        {/* Static wrapper: a bare `{header}` array-sibling of the arrows div
            trips React 19's key validation during hydration. */}
        <div className="min-w-0">{header}</div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" onClick={() => page(-1)} disabled={pos.start} aria-label="Предишни" className={arrowClass}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button type="button" onClick={() => page(1)} disabled={pos.end} aria-label="Следващи" className={arrowClass}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="edge-fade-x no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
      >
        {children}
      </div>
    </div>
  );
}
