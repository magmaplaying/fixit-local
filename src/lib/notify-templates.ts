import type { NotifyContent } from "@/lib/notify";

// Bulgarian, on-brand copy for every notification the app raises. Kept in one
// place so wording stays consistent across the in-app center and the emails.

/** Which side the *recipient* is on — decides where the notification links. */
export type Side = "CUSTOMER" | "PROVIDER";

const home = (side: Side) => (side === "PROVIDER" ? "/dashboard" : "/bookings");

/** New booking request → notifies the provider. */
export function bookingRequested(opts: { listingTitle: string; customerName: string }): NotifyContent {
  return {
    type: "BOOKING_REQUESTED",
    title: `Нова заявка за „${opts.listingTitle}“`,
    body: `${opts.customerName} изпрати нова заявка. Отворете таблото, за да я приемете или откажете.`,
    href: "/dashboard",
  };
}

export type StatusEvent = "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";

/** Booking status change → notifies the counterparty (whose side is `recipient`). */
export function bookingStatus(
  event: StatusEvent,
  opts: { listingTitle: string; recipient: Side; paid?: boolean },
): NotifyContent {
  const href = home(opts.recipient);
  const t = opts.listingTitle;
  switch (event) {
    case "ACCEPTED":
      return {
        type: "BOOKING_ACCEPTED",
        title: "Заявката ви е приета",
        body: opts.paid
          ? `Заявката за „${t}“ беше приета. Остава да платите, за да потвърдите.`
          : `Заявката за „${t}“ беше приета. Свържете се с изпълнителя, за да уточните детайлите.`,
        href,
      };
    case "DECLINED":
      return {
        type: "BOOKING_DECLINED",
        title: "Заявката ви е отказана",
        body: `За съжаление заявката за „${t}“ беше отказана. Разгледайте други изпълнители.`,
        href,
      };
    case "COMPLETED":
      return {
        type: "BOOKING_COMPLETED",
        title: "Услугата е завършена",
        body: `„${t}“ е отбелязана като завършена. Оставете отзив, за да помогнете на други клиенти.`,
        href,
      };
    case "CANCELLED":
      return {
        type: "BOOKING_CANCELLED",
        title: "Заявката е отменена",
        body: `Заявката за „${t}“ беше отменена.`,
        href,
      };
  }
}

/** New chat message → notifies the other participant. */
export function newMessage(opts: { senderName: string; body: string; bookingId: string }): NotifyContent {
  const preview = opts.body.length > 120 ? `${opts.body.slice(0, 120)}…` : opts.body;
  return {
    type: "NEW_MESSAGE",
    title: `Ново съобщение от ${opts.senderName}`,
    body: preview,
    href: `/chat/${opts.bookingId}`,
  };
}

/** Successful payment → notifies the provider they've been paid. */
export function paymentReceived(opts: { listingTitle: string; amountLabel: string }): NotifyContent {
  return {
    type: "PAYMENT_RECEIVED",
    title: "Получихте плащане",
    body: `Клиент плати ${opts.amountLabel} за „${opts.listingTitle}“. Сумата ще бъде преведена по вашата сметка.`,
    href: "/dashboard",
  };
}
