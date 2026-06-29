import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateListing } from "@/app/_actions/listings";
import { ListingForm } from "@/components/listing/listing-form";
import { parsePhotos } from "@/lib/format";

type Params = Promise<{ id: string }>;

export default async function EditListingPage({ params }: { params: Params }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/dashboard/listings/${id}/edit`);

  const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/provider");

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.providerId !== profile.id) notFound();

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-black/50 hover:text-cobble-600 dark:text-white/50">
        ← Обратно към таблото
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Редактиране на обява</h1>

      <div className="mt-8">
        <ListingForm
          mode="edit"
          action={updateListing}
          categories={categories}
          defaults={{
            id: listing.id,
            title: listing.title,
            categoryId: listing.categoryId,
            description: listing.description,
            priceType: listing.priceType,
            price: listing.price,
            city: listing.city,
            area: listing.area,
            photos: parsePhotos(listing.photos),
            active: listing.active,
          }}
        />
      </div>
    </div>
  );
}
