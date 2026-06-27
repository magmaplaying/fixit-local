import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createListing } from "@/app/_actions/listings";
import { ListingForm } from "@/components/listing/listing-form";

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/listings/new");

  const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/provider");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-black/50 hover:text-teal-600 dark:text-white/50">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">New listing</h1>
      <p className="mt-1 text-black/55 dark:text-white/55">Publish a service so customers can find and book you.</p>

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
