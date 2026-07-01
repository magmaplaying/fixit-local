import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setEmailNotifications } from "@/app/_actions/settings";

export default async function SettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login?next=/settings");

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
    </div>
  );
}
