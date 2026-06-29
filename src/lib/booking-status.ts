// Booking lifecycle: the single source of truth for valid status transitions
// and their Bulgarian labels. Used by server actions (to enforce the state
// machine) and by the status badge (to label statuses).

export const BOOKING_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "DECLINED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingActor = "CUSTOMER" | "PROVIDER";

// Bulgarian labels (moved here from status-badge so actions + UI agree).
export const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Заявена",
  ACCEPTED: "Приета",
  DECLINED: "Отказана",
  COMPLETED: "Завършена",
  CANCELLED: "Анулирана",
};

// Allowed transitions: from-status → list of { to, who-may-do-it }.
// Anything not listed (incl. all transitions out of a terminal status) is denied.
const TRANSITIONS: Record<BookingStatus, { to: BookingStatus; by: BookingActor[] }[]> = {
  REQUESTED: [
    { to: "ACCEPTED", by: ["PROVIDER"] },
    { to: "DECLINED", by: ["PROVIDER"] },
    { to: "CANCELLED", by: ["CUSTOMER", "PROVIDER"] },
  ],
  ACCEPTED: [
    { to: "COMPLETED", by: ["PROVIDER"] },
    { to: "CANCELLED", by: ["CUSTOMER", "PROVIDER"] },
  ],
  DECLINED: [],
  COMPLETED: [],
  CANCELLED: [],
};

/** True only if `actor` is allowed to move a booking from `from` to `to`. */
export function canTransitionBooking(from: string, to: string, actor: BookingActor): boolean {
  const rules = TRANSITIONS[from as BookingStatus];
  if (!rules) return false;
  return rules.some((r) => r.to === to && r.by.includes(actor));
}
