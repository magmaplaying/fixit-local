import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveProviderProfile } from "./actions";

export default async function ProviderOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding/provider");

  const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });

  const inputClass =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-cobble-500 focus:ring-2 focus:ring-cobble-500/20 dark:border-white/15 dark:bg-white/5";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Създайте профил на специалист</h1>
      <p className="mt-1 text-black/60 dark:text-white/60">
        Разкажете накратко за себе си. След това можете да добавите обяви за услуги.
      </p>

      <form action={saveProviderProfile} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Град</span>
          <input name="city" defaultValue={profile?.city ?? "София"} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Квартал</span>
          <input name="area" defaultValue={profile?.area ?? ""} placeholder="напр. Лозенец" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Телефон</span>
          <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="+359 …" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Кратко описание</span>
          <textarea
            name="bio"
            rows={3}
            defaultValue={profile?.bio ?? ""}
            placeholder="С какво се занимавате и защо клиентите да ви се доверят?"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-cobble-600 px-4 py-2.5 font-medium text-white transition hover:bg-cobble-700"
        >
          {profile ? "Запази профила" : "Създай профил"}
        </button>
      </form>
    </div>
  );
}
