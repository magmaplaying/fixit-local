"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared logic for horizontal rails with paging arrows: tracks whether the
 * rail sits at its start/end (to disable the arrows) and pages by ~90% of the
 * visible width. Smooth scroll unless the user prefers reduced motion.
 */
export function usePager() {
  const railRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setPos({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  return { railRef, pos, page };
}
