import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { CITIES, citySlug } from "@/lib/cities";

// Regenerated hourly (crawlers don't need per-request freshness).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, providers, categories] = await Promise.all([
    prisma.listing.findMany({ where: { active: true }, select: { id: true, updatedAt: true } }),
    prisma.providerProfile.findMany({ select: { id: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/services`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Category and city landing pages — the organic-traffic workhorses.
  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/services/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const cityPages: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${SITE_URL}/services/${citySlug(c)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const listingPages: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${SITE_URL}/listing/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const providerPages: MetadataRoute.Sitemap = providers.map((p) => ({
    url: `${SITE_URL}/providers/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...categoryPages, ...cityPages, ...listingPages, ...providerPages];
}
