import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureReferralCode, getReferralCount } from "@/lib/referrals";
import { SITE_URL } from "@/lib/site";
import { CopyLink } from "@/components/growth/copy-link";
import { ShareButtons } from "@/components/share/share-buttons";

export const metadata: Metadata = {
  title: "Поканете приятел",
  description: "Поканете приятели в „Под ръка“ и разраствайте общността от доверени майстори.",
};

export default async function InvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/invite");

  const code = await ensureReferralCode(user.id);
  const count = await getReferralCount(user.id);
  const link = `${SITE_URL}/?ref=${code}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">Поканете приятел</h1>
      <p className="mt-2 text-black/60">
        Споделете „Под ръка“ с приятели и познати. Всеки, който се регистрира през вашата покана, се брои към вас.
      </p>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6">
        <p className="text-sm font-medium">Вашата покана</p>
        <div className="mt-2">
          <CopyLink value={link} />
        </div>
        <div className="mt-4">
          <ShareButtons url={link} title="Открий доверени майстори в „Под ръка“" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
        <p className="text-sm text-black/55">Поканени до момента</p>
        <p className="mt-1 font-display text-4xl font-bold text-cobble-700">{count}</p>
        <p className="mt-2 max-w-md text-sm text-black/50">
          Благодарим, че разраствате общността. Скоро планираме бонуси за най-активните поканващи.
        </p>
      </div>
    </div>
  );
}
