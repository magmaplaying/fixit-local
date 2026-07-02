"use client";

import { useEffect, useRef } from "react";

/**
 * Thin ochre bar along the top edge that fills as the reader scrolls — the
 * article "paves itself" as you read. Decorative: hidden from assistive tech,
 * static (invisible) under reduced motion or without JS.
 */
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        el.style.transform = `scaleX(${max > 0 ? doc.scrollTop / max : 0})`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-cobble-500"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
