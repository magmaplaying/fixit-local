"use client";

import { useEffect } from "react";

/**
 * Captures a `?ref=CODE` invite param into a cookie so a later signup (on a
 * different page) can attribute the referrer. Runs once on mount; renders
 * nothing.
 */
export function RefCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[A-Z0-9]{4,16}$/.test(ref)) {
      document.cookie = `podruka_ref=${ref}; path=/; max-age=2592000; SameSite=Lax`;
    }
  }, []);
  return null;
}
