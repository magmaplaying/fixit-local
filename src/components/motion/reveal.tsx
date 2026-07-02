"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Transition delay in ms — use for staggering siblings. */
  delay?: number;
  variant?: "up" | "fade" | "scale";
};

/**
 * Scroll-triggered reveal. Renders hidden (CSS `.rv`, motion-safe only) and
 * adds `.is-visible` when the element enters the viewport. Reduced-motion
 * users and no-JS visitors always see the content — the hidden state lives
 * behind prefers-reduced-motion and a <noscript> override in the layout.
 */
export function Reveal({ children, className = "", delay = 0, variant = "up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      // Trigger slightly before the element fully enters, so the settle
      // happens in view rather than after.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variantClass = variant === "up" ? "rv-up" : variant === "scale" ? "rv-scale" : "";
  return (
    <div
      ref={ref}
      className={`rv ${variantClass} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
