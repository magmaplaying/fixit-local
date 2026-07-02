import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setEmailNotifications } from "@/app/_actions/settings";
import { deleteAccount } from "@/app/_actions/account";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ delete?: string }>;
}) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login?next=/settings");
  const sp = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { emailNotifications: true },
  });
  const enabled = user?.emailNotifications ?? true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-medium">Известия по имейл</h2>
            <p className="mt-1 max-w-sm text-sm text-black/55">
              Получавайте имейл при нови заявки, съобщения и плащания. Известията в приложението остават
              включени независимо от тази настройка.
            </p>
            <p className={`mt-2 text-xs font-medium ${enabled ? "text-emerald-600" : "text-black/45"}`}>
              {enabled ? "Включени" : "Изключени"}
            </p>
          </div>

          {/* Server-action toggle — posts the opposite value, no client JS. */}
          <form action={setEmailNotifications}>
            <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
            <button
              type="submit"
              role="switch"
              aria-checked={enabled}
              aria-label="Превключи имейл известията"
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                enabled ? "bg-cobble-600" : "bg-black/20"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </form>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="font-medium">Вашите данни</h2>
        <p className="mt-1 max-w-md text-sm text-black/55">
          Изтеглете копие на всички данни, свързани с вашия акаунт, във формат JSON.
        </p>
        <a
          href="/api/account/export"
          download
          className="mt-3 inline-flex items-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 transition hover:border-cobble-500/50 hover:text-cobble-800"
        >
          Изтегли данните ми
        </a>
      </section>

      <section className="mt-4 rounded-2xl border border-red-200 bg-red-50/40 p-6">
        <h2 className="font-medium text-red-700">Изтриване на акаунт</h2>
        <p className="mt-1 max-w-md text-sm text-black/60">
          Това действие е необратимо. Профилът и свързаните с него данни ще бъдат изтрити за постоянно.
        </p>

        {sp.delete === "active" && (
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-red-700">
            Имате активни заявки. Първо ги завършете или откажете.
          </p>
        )}
        {sp.delete === "confirm" && (
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-red-700">
            За потвърждение въведете „ИЗТРИЙ“.
          </p>
        )}

        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-red-700 hover:underline">
            Искам да изтрия акаунта си
          </summary>
          <form action={deleteAccount} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              name="confirm"
              autoComplete="off"
              placeholder="Въведете ИЗТРИЙ"
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
            />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
              Изтрий акаунта завинаги
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
