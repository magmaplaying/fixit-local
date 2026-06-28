"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the server component periodically so new messages appear without a manual refresh. */
export function ChatPoller({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
