import "server-only";
import { prisma } from "@/lib/db";

/**
 * Booking slots. A slot is one hour — "запазвам час" is literally that — and
 * occupancy belongs to the *provider*, not the listing: one person can't clean
 * a flat and fix a boiler at 10:00 just because those are two listings.
 *
 * There is no availability table. A slot is taken when the provider has an
 * ACCEPTED booking starting on it, so the schedule is derived from bookings
 * that already exist. Pending requests deliberately do not hold a slot —
 * otherwise an unanswered request could block a provider's whole week.
 *
 * Times follow the app-wide convention set by parseSchedule/formatSchedule:
 * the Bulgarian wall clock is pinned to UTC, so every hour here is read and
 * written with the UTC accessors. Mixing in local-time accessors would shift
 * slots by the server's offset and silently mismatch stored bookings.
 */
export const SLOT_START_HOUR = 8; // first slot begins 08:00
export const SLOT_END_HOUR = 18; // last slot begins 17:00
export const DAYS_AHEAD = 14;

export type Slot = { key: string; label: string; taken: boolean };
export type ScheduleDay = { key: string; weekday: string; dayLabel: string; slots: Slot[] };

/** Stable slot id, in the exact shape parseSchedule expects. */
export function slotKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())}T${p(
    date.getUTCHours(),
  )}:${p(date.getUTCMinutes())}`;
}

/** Midnight (UTC-pinned) `offset` days from today. */
function dayStart(offset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, 0, 0, 0, 0),
  );
}

/** Slot keys the provider already has an accepted booking on, within a window. */
async function takenSlotKeys(providerId: string, from: Date, to: Date): Promise<Set<string>> {
  const booked = await prisma.booking.findMany({
    where: {
      status: "ACCEPTED",
      scheduledFor: { gte: from, lt: to },
      listing: { providerId },
    },
    select: { scheduledFor: true },
  });
  return new Set(booked.map((b) => slotKey(b.scheduledFor as Date)));
}

/**
 * The next DAYS_AHEAD days of slots for a provider, each marked free or taken.
 * Slots already in the past are omitted rather than shown disabled — a grid
 * whose first row is always dead weight teaches customers to skip the top.
 */
export async function getSchedule(providerId: string): Promise<ScheduleDay[]> {
  const from = dayStart(0);
  const to = dayStart(DAYS_AHEAD);
  const taken = await takenSlotKeys(providerId, from, to);
  const now = Date.now();

  const days: ScheduleDay[] = [];
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const base = dayStart(d);
    const slots: Slot[] = [];

    for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
      const at = new Date(base.getTime() + h * 3600_000);
      if (at.getTime() <= now) continue;
      const key = slotKey(at);
      slots.push({
        key,
        label: `${String(h).padStart(2, "0")}:00`,
        taken: taken.has(key),
      });
    }
    if (slots.length === 0) continue;

    days.push({
      key: slotKey(base).slice(0, 10),
      weekday: base.toLocaleDateString("bg-BG", { weekday: "short", timeZone: "UTC" }),
      dayLabel: base.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }),
      slots,
    });
  }
  return days;
}

/**
 * Whether `when` collides with an accepted booking for this provider.
 * `exceptBookingId` lets a booking being accepted ignore itself.
 *
 * The UI hides taken slots, but a server action is callable directly, so this
 * is the check that actually prevents a double booking.
 */
export async function isSlotTaken(
  providerId: string,
  when: Date,
  exceptBookingId?: string,
): Promise<boolean> {
  const clash = await prisma.booking.findFirst({
    where: {
      status: "ACCEPTED",
      scheduledFor: when,
      listing: { providerId },
      ...(exceptBookingId ? { id: { not: exceptBookingId } } : {}),
    },
    select: { id: true },
  });
  return clash !== null;
}
