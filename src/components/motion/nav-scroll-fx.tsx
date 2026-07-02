"use client";

import { useEffect, useRef } from "react";

/**
 * Toggles `.nav-scrolled` on the enclosing <header> once the page scrolls,
 * so the translucent navbar solidifies and casts a shadow. Renders nothing.
 */
export function NavScrollFx() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = ref.current?.closest("header");
    if (!header) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        header.classList.toggle("nav-scrolled", window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={ref} hidden aria-hidden />;
}
