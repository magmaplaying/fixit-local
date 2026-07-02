"use client";

import { useEffect, useRef } from "react";

/**
 * Slow scroll parallax for the hero backdrop: the wrapped media drifts down
 * at a fraction of scroll speed, giving the photo depth without any library.
 * Inert under prefers-reduced-motion.
 */
export function HeroParallax({
  children,
  className = "",
  strength = 0.22,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // Only matters while the hero is on screen — clamp to one viewport.
        const y = Math.min(window.scrollY, window.innerHeight);
        el.style.transform = `translate3d(0, ${Math.round(y * strength)}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
