import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GDPR right of access / portability: streams a JSON copy of everything tied to
// the signed-in account. The password hash is never included.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const [account, providerProfile, bookingsAsCustomer, reviews, messages, notifications, reports] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, name: true, role: true, emailNotifications: true, createdAt: true },
      }),
      prisma.providerProfile.findUnique({ where: { userId: user.id }, include: { listings: true } }),
      prisma.booking.findMany({ where: { customerId: user.id } }),
      prisma.review.findMany({ where: { authorId: user.id } }),
      prisma.message.findMany({ where: { senderId: user.id } }),
      prisma.notification.findMany({ where: { userId: user.id } }),
      prisma.report.findMany({ where: { reporterId: user.id } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account,
    providerProfile,
    bookingsAsCustomer,
    reviews,
    messages,
    notifications,
    reports,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="podruka-data.json"',
    },
  });
}
