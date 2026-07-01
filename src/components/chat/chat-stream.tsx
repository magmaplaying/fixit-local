"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type ChatMessage = { id: string; body: string; senderId: string; createdAt: number };

/**
 * Renders the chat thread and keeps it live via Server-Sent Events, appending
 * new messages without a full page refresh. If SSE is unavailable or stays
 * disconnected, it falls back to periodic `router.refresh()` polling — the old
 * behaviour, as a safety net.
 */
export function ChatThread({
  bookingId,
  currentUserId,
  initial,
}: {
  bookingId: string;
  currentUserId: string;
  initial: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const seen = useRef<Set<string>>(new Set(initial.map((m) => m.id)));
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Merge any newly server-rendered messages (e.g. after a polling refresh or
  // the sender's own send) into state; `seen` dedupes against SSE appends.
  useEffect(() => {
    setMessages((prev) => {
      const merged = prev.slice();
      let added = false;
      for (const m of initial) {
        if (!seen.current.has(m.id)) {
          seen.current.add(m.id);
          merged.push(m);
          added = true;
        }
      }
      if (!added) return prev;
      merged.sort((a, b) => a.createdAt - b.createdAt);
      return merged;
    });
  }, [initial]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const since = messages.length ? messages[messages.length - 1].createdAt : Date.now();
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let errorTimer: ReturnType<typeof setTimeout> | null = null;

    const startPolling = () => {
      if (!pollTimer) pollTimer = setInterval(() => router.refresh(), 5000);
    };
    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    if (typeof EventSource !== "undefined") {
      es = new EventSource(`/api/chat/${bookingId}/stream?since=${since}`);
      es.onopen = () => {
        if (errorTimer) {
          clearTimeout(errorTimer);
          errorTimer = null;
        }
        stopPolling();
      };
      es.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data) as ChatMessage;
          if (seen.current.has(m.id)) return;
          seen.current.add(m.id);
          setMessages((prev) => [...prev, m]);
        } catch {
          /* ignore malformed frame */
        }
      };
      es.onerror = () => {
        // Transient drops auto-reconnect; only fall back to polling if we stay
        // disconnected for a few seconds.
        if (!errorTimer && !pollTimer) errorTimer = setTimeout(startPolling, 6000);
      };
    } else {
      startPolling();
    }

    return () => {
      es?.close();
      stopPolling();
      if (errorTimer) clearTimeout(errorTimer);
    };
    // Subscribe once per booking; message updates flow through state, not deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  return (
    <div className="flex flex-1 flex-col gap-3 py-6">
      {messages.length === 0 ? (
        <p className="my-auto text-center text-sm text-black/45">Още няма съобщения. Напишете първото.</p>
      ) : (
        messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  mine
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-cobble-600 px-4 py-2 text-sm text-white"
                    : "max-w-[80%] rounded-2xl rounded-bl-sm border border-black/5 bg-white px-4 py-2 text-sm"
                }
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={mine ? "mt-1 text-[11px] text-white/60" : "mt-1 text-[11px] text-black/35"}>
                  {new Date(m.createdAt).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
