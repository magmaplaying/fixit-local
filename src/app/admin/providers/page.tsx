import { prisma } from "@/lib/db";
import { setProviderVerified } from "@/app/_actions/admin";

export default async function AdminProviders() {
  const providers = await prisma.providerProfile.findMany({
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    include: { user: true, _count: { select: { listings: true } } },
    take: 200,
  });

  return (
    <ul className="space-y-2">
      {providers.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/5 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <div>
            <span className="font-medium">{p.user.name}</span>{" "}
            <span className="text-black/45 dark:text-white/45">· {p.city} · {p._count.listings} обяви</span>
            {p.verified && (
              <span className="ml-2 rounded bg-cobble-100 px-1.5 py-0.5 text-xs text-cobble-800 dark:bg-cobble-900/50 dark:text-cobble-300">
                ✓ Проверен
              </span>
            )}
          </div>
          <form action={setProviderVerified}>
            <input type="hidden" name="profileId" value={p.id} />
            <input type="hidden" name="verified" value={p.verified ? "false" : "true"} />
            <button className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium transition hover:border-cobble-500/40 dark:border-white/15">
              {p.verified ? "Премахни проверка" : "Провери"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
