import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Server-Sent Events stream of new chat messages for one booking.
//
// Trade-off: libSQL/SQLite has no LISTEN/NOTIFY, so this polls the DB every
// POLL_MS and pushes only the *delta* to connected participants — far lighter
// than the old whole-page `router.refresh()` every 5s, with ~1-2s latency. Each
// open stream holds a serverless function for up to MAX_MS (Vercel duration
// limit), then closes; the browser's EventSource auto-reconnects and resumes
// from Last-Event-ID. At real scale, swap this for a hosted pub/sub (Pusher /
// Ably) or a persistent socket server — the client contract stays the same.
export const dynamic = "force-dynamic";

const POLL_MS = 2000;
const MAX_MS = 50_000; // stay under the platform function limit; client reconnects

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { provider: true } } },
  });
  if (!booking) return new Response("not found", { status: 404 });

  const isCustomer = booking.customerId === user.id;
  const isProvider = booking.listing.provider.userId === user.id;
  if (!isCustomer && !isProvider) return new Response("forbidden", { status: 403 });

  // Resume point: Last-Event-ID (set on reconnect) wins over the initial ?since.
  const lastEventId = req.headers.get("last-event-id");
  const sinceParam = new URL(req.url).searchParams.get("since");
  let since = new Date(
    lastEventId ? Number(lastEventId) : sinceParam ? Number(sinceParam) : Date.now(),
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          open = false;
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", close);

      send(": connected\n\n");
      const started = Date.now();

      while (open && Date.now() - started < MAX_MS) {
        // Only the OTHER participant's messages — the sender sees their own via
        // the composer's page reload, so this avoids echoing duplicates back.
        const msgs = await prisma.message.findMany({
          where: { bookingId, createdAt: { gt: since }, senderId: { not: user.id } },
          orderBy: { createdAt: "asc" },
          select: { id: true, body: true, senderId: true, createdAt: true },
        });
        if (!open) break;

        if (msgs.length > 0) {
          for (const m of msgs) {
            const t = m.createdAt.getTime();
            const data = JSON.stringify({ id: m.id, body: m.body, senderId: m.senderId, createdAt: t });
            send(`id: ${t}\ndata: ${data}\n\n`);
          }
          since = msgs[msgs.length - 1].createdAt;
          // The participant is actively viewing → keep their side marked read.
          await prisma.booking.update({
            where: { id: bookingId },
            data: isCustomer ? { customerReadAt: new Date() } : { providerReadAt: new Date() },
          });
        } else {
          send(": ping\n\n"); // heartbeat keeps the connection alive through proxies
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
