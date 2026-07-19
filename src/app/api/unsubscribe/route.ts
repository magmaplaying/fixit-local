import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

// One-click email opt-out. GET renders a confirmation page (so link scanners /
// email-client prefetch can't silently unsubscribe someone); the POST from that
// page actually flips `emailNotifications` off. Both verify the signed token.

const OCHRE = "#c98a12";
const CREAM = "#faf5ea";
const ESPRESSO = "#211a13";

function shell(inner: string): string {
  return `<!doctype html><html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Отписване — Под ръка</title></head>
<body style="margin:0;background:${CREAM};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${ESPRESSO}">
  <div style="max-width:480px;margin:0 auto;padding:56px 24px;text-align:center">
    <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:28px">Под <span style="color:${OCHRE}">ръка</span></div>
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:32px 24px">${inner}</div>
  </div>
</body></html>`;
}

function html(body: string, status: number): Response {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

const invalid = shell(
  `<h1 style="margin:0 0 8px;font-size:19px">Невалиден линк</h1><p style="margin:0;color:#4a4036;font-size:15px;line-height:1.55">Линкът за отписване е невалиден или изтекъл. Можете да управлявате известията си от настройките на профила.</p>`,
);

export async function GET(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = await verifyUnsubscribeToken(token);
  if (!userId) return html(invalid, 400);
  return html(
    shell(
      `<h1 style="margin:0 0 8px;font-size:19px">Отписване от имейли</h1>
       <p style="margin:0 0 20px;color:#4a4036;font-size:15px;line-height:1.55">Наистина ли искате да спрете имейлите от „Под ръка“? Пак ще виждате известията в приложението.</p>
       <form method="post">
         <input type="hidden" name="token" value="${token}">
         <button type="submit" style="background:${OCHRE};color:#fff;border:0;border-radius:12px;padding:12px 22px;font-weight:600;font-size:15px;cursor:pointer">Да, отпиши ме</button>
       </form>`,
    ),
    200,
  );
}

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const userId = await verifyUnsubscribeToken(token);
  if (!userId) return html(invalid, 400);
  await prisma.user
    .update({ where: { id: userId }, data: { emailNotifications: false } })
    .catch(() => {});
  return html(
    shell(
      `<h1 style="margin:0 0 8px;font-size:19px">Готово ✓</h1><p style="margin:0;color:#4a4036;font-size:15px;line-height:1.55">Отписахте се успешно. Повече няма да получавате имейли от „Под ръка“. Можете да ги включите отново по всяко време от настройките.</p>`,
    ),
    200,
  );
}
