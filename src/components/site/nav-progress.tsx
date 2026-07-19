"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Global top-of-page progress bar for route transitions.
 *
 * `loading.tsx` / Suspense route fallbacks are broken in this Next.js fork
 * (see AGENTS.md — the streamed page parks in a hidden container and never
 * swaps in), so this tracks navigation independently: a same-origin link
 * click starts the bar, and the resulting pathname/search-param change ends
 * it. No route-level Suspense involved.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentKey = `${pathname}?${searchParams.toString()}`;
  const prevKeyRef = useRef(currentKey);

  useEffect(() => {
    function clearTick() {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    function start() {
      clearTick();
      setVisible(true);
      setProgress(12);
      tickRef.current = setInterval(() => {
        setProgress((p) => (p < 88 ? p + (88 - p) * 0.1 : p));
      }, 150);
    }

    function onClick(e: MouseEvent) {
      // Next.js's <Link> already calls preventDefault() on its own anchor
      // click handler before this bubbles up, so defaultPrevented can't be
      // used to filter this out — that would skip every real Link click.
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (href === currentKey || href === pathname) return;
      start();
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTick();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, pathname]);

  useEffect(() => {
    if (prevKeyRef.current === currentKey) return;
    prevKeyRef.current = currentKey;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(t);
  }, [currentKey]);

  if (!visible) return null;

  return (
    <div aria-hidden className="fixed left-0 top-0 z-[100] h-0.5 w-full">
      <div
        className="h-full bg-cobble-500 transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
