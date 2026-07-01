import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications, markNotificationsRead } from "@/lib/notify";
import { timeAgo } from "@/lib/format";

// A small dot colour per notification family, so the feed is scannable.
function dotColor(type: string): string {
  if (type.startsWith("BOOKING")) return "bg-cobble-500";
  if (type === "NEW_MESSAGE") return "bg-sky-500";
  if (type === "PAYMENT_RECEIVED") return "bg-emerald-500";
  return "bg-black/30";
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  // Fetch first (capturing unread state for this render), then mark all read so
  // the bell clears — the same read-on-view pattern the chat page uses.
  const notifications = await getNotifications(user.id);
  await markNotificationsRead(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Известия</h1>

      {notifications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/10 p-12 text-center dark:border-white/15">
          <p className="text-lg font-medium">Нямате известия.</p>
          <p className="mt-1 text-sm text-black/50">Тук ще се появяват заявки, съобщения и плащания.</p>
          <Link href="/services" className="mt-3 inline-block text-sm font-medium text-cobble-600 hover:underline">
            Разгледай услуги →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {notifications.map((n) => {
            const unread = n.readAt === null;
            const inner = (
              <div
                className={
                  unread
                    ? "flex gap-3 rounded-xl border border-cobble-200 bg-cobble-50/70 p-4"
                    : "flex gap-3 rounded-xl border border-black/5 bg-white p-4"
                }
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? dotColor(n.type) : "bg-black/15"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={unread ? "font-semibold" : "font-medium text-black/80"}>{n.title}</p>
                    <time className="shrink-0 text-xs text-black/40">{timeAgo(n.createdAt)}</time>
                  </div>
                  <p className="mt-0.5 text-sm text-black/60">{n.body}</p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className="block transition hover:opacity-80">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-black/40">
        Управлявайте имейл известията в{" "}
        <Link href="/settings" className="font-medium text-cobble-600 hover:underline">
          настройки
        </Link>
        .
      </p>
    </div>
  );
}
