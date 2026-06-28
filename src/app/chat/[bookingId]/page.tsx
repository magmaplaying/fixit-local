import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendMessage } from "@/app/_actions/messages";
import { ChatPoller } from "@/components/chat/chat-poller";
import { initials } from "@/lib/format";

type Params = Promise<{ bookingId: string }>;

export default async function ChatPage({ params }: { params: Params }) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/chat/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { include: { provider: { include: { user: true } } } },
      customer: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) notFound();

  const isCustomer = booking.customerId === user.id;
  const isProvider = booking.listing.provider.userId === user.id;
  if (!isCustomer && !isProvider) notFound();

  const other = isCustomer ? booking.listing.provider.user : booking.customer;
  const backHref = isProvider ? "/dashboard" : "/bookings";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col px-4 py-8">
      <ChatPoller />

      <Link href={backHref} className="text-sm text-black/50 hover:text-cobble-600">
        ← Назад
      </Link>

      {/* Header */}
      <div className="mt-3 flex items-center gap-3 border-b border-black/5 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cobble-100 font-semibold text-cobble-700">
          {initials(other.name)}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{other.name}</p>
          <Link href={`/listing/${booking.listingId}`} className="text-sm text-black/55 hover:text-cobble-600">
            {booking.listing.title}
          </Link>
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col gap-3 py-6">
        {booking.messages.length === 0 ? (
          <p className="my-auto text-center text-sm text-black/45">Още няма съобщения. Напишете първото.</p>
        ) : (
          booking.messages.map((m) => {
            const mine = m.senderId === user.id;
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
                    {m.createdAt.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form action={sendMessage} className="sticky bottom-4 flex gap-2 border-t border-black/5 bg-background pt-4">
        <input type="hidden" name="bookingId" value={booking.id} />
        <input
          name="body"
          autoComplete="off"
          placeholder="Напишете съобщение…"
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-cobble-500"
        />
        <button className="rounded-xl bg-cobble-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cobble-700">
          Изпрати
        </button>
      </form>
    </div>
  );
}
