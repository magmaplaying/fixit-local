import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/stripe";

export default async function AdminOverview() {
  const [users, providers, listings, openReports, byStatus, paid] = await Promise.all([
    prisma.user.count(),
    prisma.providerProfile.count(),
    prisma.listing.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true, commissionAmount: true } }),
  ]);
  const bookings = byStatus.reduce((s, r) => s + r._count._all, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Потребители" value={String(users)} />
        <Stat label="Специалисти" value={String(providers)} />
        <Stat label="Обяви" value={String(listings)} />
        <Stat label="Заявки" value={String(bookings)} />
        <Stat label="Сигнали" value={String(openReports)} accent={openReports > 0} />
        <Stat label="Комисиона" value={formatMoney(paid._sum.commissionAmount ?? 0)} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-black/60 dark:text-white/60">Заявки по статус</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {byStatus.map((r) => (
            <span key={r.status} className="rounded-lg bg-black/[0.04] px-3 py-1.5 text-sm dark:bg-white/5">
              {r.status}: <span className="font-semibold">{r._count._all}</span>
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-black/45 dark:text-white/45">
        Оборот от платени заявки: {formatMoney(paid._sum.amount ?? 0)}
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? "bg-red-50 dark:bg-red-950/30" : "bg-black/[0.03] dark:bg-white/5"}`}>
      <div className="text-xs text-black/45 dark:text-white/45">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
