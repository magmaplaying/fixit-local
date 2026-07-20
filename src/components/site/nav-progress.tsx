"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Bar stays up at least this long once shown, so a fast client-side
// transition still registers as "something happened" instead of flashing by
// in under a frame.
const MIN_VISIBLE_MS = 450;

/**
 * Global top-of-page progress bar for route transitions.
 *
 * `loading.tsx` / Suspense route fallbacks are broken in this Next.js fork
 * (see AGENTS.md — the streamed page parks in a hidden container and never
 * swaps in), so this tracks navigation independently:
 *  - a same-origin <Link> click starts the bar, and the resulting
 *    pathname/search-param change ends it (client-side transition).
 *  - a plain <form action="/..."> submit (the search/filter bars, which do a
 *    real GET navigation, not a server action) starts the bar too. There's no
 *    "end" for that path — the whole document unloads and this component
 *    remounts fresh on the new page — but that's fine, the bar staying put
 *    until the browser swaps the page is exactly the feedback we want.
 * No route-level Suspense involved.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef(0);
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
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      shownAtRef.current = Date.now();
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

    function onSubmit(e: SubmitEvent) {
      if (e.defaultPrevented) return;
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      // A React server-action form (`<form action={fn}>`) never renders a
      // literal `action="..."` attribute — React intercepts it via JS and
      // there's no real page navigation to signal. Only plain GET/POST
      // forms (search bars, filters) that do a real browser navigation have
      // a string action here, which is exactly the case loading.tsx can't
      // cover.
      const action = form.getAttribute("action");
      if (!action || !action.startsWith("/") || action.startsWith("//")) return;
      if (form.target && form.target !== "_self") return;
      start();
    }

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
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
    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, wait + 150);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [currentKey]);

  if (!visible) return null;

  return (
    <div aria-hidden className="fixed left-0 top-0 z-[100] h-px w-full bg-cobble-950/10">
      <div
        className="h-full bg-gradient-to-r from-cobble-400 via-cobble-500 to-cobble-600 transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
