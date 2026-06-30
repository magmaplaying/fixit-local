import { prisma } from "@/lib/db";
import { resolveReport } from "@/app/_actions/admin";

export default async function AdminReports() {
  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { name: true } } },
    take: 200,
  });

  if (reports.length === 0) {
    return <p className="text-black/50 dark:text-white/50">Няма отворени сигнали.</p>;
  }

  return (
    <ul className="space-y-2">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-black/5 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <div className="min-w-0">
            <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs dark:bg-white/10">{r.targetType}</span>{" "}
            <span className="font-mono text-xs text-black/40 dark:text-white/40">{r.targetId}</span>
            <p className="mt-1 text-black/70 dark:text-white/70">{r.reason}</p>
            <p className="mt-0.5 text-xs text-black/40 dark:text-white/40">
              от {r.reporter.name} · {r.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-1.5">
            <form action={resolveReport}>
              <input type="hidden" name="reportId" value={r.id} />
              <input type="hidden" name="dismiss" value="false" />
              <button className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50">
                Реши
              </button>
            </form>
            <form action={resolveReport}>
              <input type="hidden" name="reportId" value={r.id} />
              <input type="hidden" name="dismiss" value="true" />
              <button className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium text-black/60 transition hover:bg-black/[0.03] dark:border-white/15 dark:text-white/60">
                Отхвърли
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
