import { prisma } from "@/lib/db";

export type UnreadCounts = { customer: number; provider: number; total: number };

function tally(rows: { readAt: Date | null; createdAt: Date; messages: { createdAt: Date }[] }[]): number {
  return rows.reduce((sum, b) => {
    const since = b.readAt ?? b.createdAt;
    return sum + b.messages.filter((m) => m.createdAt > since).length;
  }, 0);
}

/** Total unread messages for a user, split by the side they're on. */
export async function getUnreadCounts(userId: string): Promise<UnreadCounts> {
  const [asCustomer, asProvider] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: userId },
      select: {
        customerReadAt: true,
        createdAt: true,
        messages: { where: { senderId: { not: userId } }, select: { createdAt: true } },
      },
    }),
    prisma.booking.findMany({
      where: { listing: { provider: { userId } } },
      select: {
        providerReadAt: true,
        createdAt: true,
        messages: { where: { senderId: { not: userId } }, select: { createdAt: true } },
      },
    }),
  ]);

  const customer = tally(asCustomer.map((b) => ({ readAt: b.customerReadAt, createdAt: b.createdAt, messages: b.messages })));
  const provider = tally(asProvider.map((b) => ({ readAt: b.providerReadAt, createdAt: b.createdAt, messages: b.messages })));
  return { customer, provider, total: customer + provider };
}

/** Unread count for a single booking's messages, given the viewer's last-read time. */
export function unreadInBooking(messages: { createdAt: Date }[], readAt: Date | null, createdAt: Date): number {
  const since = readAt ?? createdAt;
  return messages.filter((m) => m.createdAt > since).length;
}
