"use client";

import { useEffect, useRef } from "react";

/**
 * Count-up number. Server-renders the final value (SEO/no-JS safe); when it
 * scrolls into view it rewinds to 0 and counts up once with an ease-out.
 * Reduced-motion users just see the final value.
 */
export function Counter({ value, duration = 1300 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = new Intl.NumberFormat("bg-BG");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt.format(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt.format(Math.round(eased * value));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return <span ref={ref}>{new Intl.NumberFormat("bg-BG").format(value)}</span>;
}
