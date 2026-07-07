// Anti-disintermediation guard: while a booking still has an unpaid online
// payment (or hasn't been accepted yet), phone numbers and emails in chat are
// masked so the deal can't be taken off-platform ("ще се разберем на ръка").
// Once the booking is paid — or when no online payment is possible at all —
// contacts flow freely: the platform can't demand a payment it can't process.

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// 8+ digits allowing spaces/dashes/dots/parens between them (BG numbers are
// 9-10 digits; prices and short dates stay under the threshold).
const PHONE = /\+?\d(?:[\s\-().]?\d){7,}/g;
// dd.mm.yyyy dates trip the digit counter — spare them.
const DATE = /^\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}$/;

export const MASK_PLACEHOLDER = "[контакт — вижда се след плащане]";

/** Replace phone numbers and emails with a placeholder. */
export function maskContacts(body: string): { text: string; masked: boolean } {
  let masked = false;
  let text = body.replace(EMAIL, () => {
    masked = true;
    return MASK_PLACEHOLDER;
  });
  text = text.replace(PHONE, (m) => {
    if (DATE.test(m.trim())) return m;
    masked = true;
    return MASK_PLACEHOLDER;
  });
  return { text, masked };
}

/**
 * Should contacts be hidden on this booking?
 * - before acceptance: always (nothing agreed yet, no reason to swap numbers);
 * - after acceptance with a pending online payment: yes — pay first;
 * - after successful payment, or when no online payment exists: no.
 */
export function shouldMaskContacts(booking: {
  status: string;
  payment: { status: string } | null;
}): boolean {
  if (booking.status === "REQUESTED") return true;
  if (booking.payment && booking.payment.status !== "SUCCEEDED" && booking.payment.status !== "REFUNDED") {
    return true;
  }
  return false;
}
