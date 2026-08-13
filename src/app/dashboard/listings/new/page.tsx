import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createListing } from "@/app/_actions/listings";
import { ListingForm } from "@/components/listing/listing-form";
import { ensureCanPublish } from "@/lib/provider-gate";

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/listings/new");

  const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/provider");
  // Send unverified providers back rather than rendering a form the action
  // would reject; the dashboard explains what's missing and links to Stripe.
  if (!(await ensureCanPublish(profile))) redirect("/dashboard?verify=required");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-black/50 hover:text-cobble-600 dark:text-white/50">
        ← Обратно към таблото
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Нова обява</h1>
      <p className="mt-1 text-black/55 dark:text-white/55">Публикувайте услуга, за да могат клиентите да ви намерят и заявят.</p>

      <div className="mt-8">
        <ListingForm
          mode="create"
          action={createListing}
          categories={categories}
          defaults={{ city: profile.city, area: profile.area ?? undefined }}
        />
      </div>
    </div>
  );
}
