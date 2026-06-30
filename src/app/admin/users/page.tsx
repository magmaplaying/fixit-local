import { prisma } from "@/lib/db";
import { setUserStatus } from "@/app/_actions/admin";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsers({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <form action="/admin/users" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Търси по име или имейл…"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-cobble-500 dark:border-white/15 dark:bg-white/5"
        />
        <button className="rounded-lg bg-cobble-600 px-4 py-2 text-sm font-medium text-white">Търси</button>
      </form>

      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/5 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
          >
            <div>
              <span className="font-medium">{u.name}</span>{" "}
              <span className="text-black/45 dark:text-white/45">· {u.email}</span>
              <span className="ml-2 rounded bg-black/[0.05] px-1.5 py-0.5 text-xs dark:bg-white/10">{u.role}</span>
              {u.status === "SUSPENDED" && (
                <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  спрян
                </span>
              )}
            </div>
            {u.role !== "ADMIN" && (
              <form action={setUserStatus}>
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="suspend" value={u.status === "SUSPENDED" ? "false" : "true"} />
                <button
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                    u.status === "SUSPENDED"
                      ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      : "border-red-300 text-red-700 hover:bg-red-50"
                  }`}
                >
                  {u.status === "SUSPENDED" ? "Възстанови" : "Спри"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
