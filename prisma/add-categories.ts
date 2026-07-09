import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Idempotently adds work/service categories (upsert by unique slug — safe to
// re-run, generates cuids on create). Works local or Turso via env:
//   npx tsx prisma/add-categories.ts
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"; npx tsx prisma/add-categories.ts
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

export const NEW_CATEGORIES = [
  { name: "Дърводелство", slug: "carpentry", icon: "🪚" },
  { name: "Плочки и облицовки", slug: "tiling", icon: "🧱" },
  { name: "Покриви", slug: "roofing", icon: "🏠" },
  { name: "Дограма и стъкло", slug: "glazing", icon: "🪟" },
  { name: "Ремонт на техника", slug: "appliance-repair", icon: "🔌" },
  { name: "Заваряване", slug: "welding", icon: "🔥" },
  { name: "ДДД и дезинсекция", slug: "pest-control", icon: "🐜" },
  { name: "Пране на килими и мебели", slug: "upholstery", icon: "🛋️" },
  { name: "Домашни любимци", slug: "pet-care", icon: "🐕" },
  { name: "Фотография", slug: "photography", icon: "📷" },
  { name: "Кетъринг", slug: "catering", icon: "🍽️" },
  { name: "Масаж", slug: "massage", icon: "💆" },
];

async function main() {
  for (const c of NEW_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: c,
    });
    console.log(`✓ ${c.slug} (${c.name})`);
  }
  const total = await prisma.category.count();
  console.log(`Done. ${NEW_CATEGORIES.length} ensured; ${total} categories total.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
