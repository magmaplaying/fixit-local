import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Tutoring", slug: "tutoring", icon: "📚" },
  { name: "Cleaning", slug: "cleaning", icon: "🧹" },
  { name: "Handyman", slug: "handyman", icon: "🔧" },
  { name: "Moving", slug: "moving", icon: "📦" },
  { name: "Plumbing", slug: "plumbing", icon: "🚰" },
  { name: "Electrical", slug: "electrical", icon: "💡" },
];

const PROVIDERS = [
  { name: "Maria Ivanova", email: "maria@demo.bg", cat: "cleaning", title: "Professional Home Cleaning", price: 25, priceType: "HOURLY", area: "Lozenets", bio: "10 years of sparkling homes.", desc: "Deep cleaning, regular cleaning, and move-in/out service. Eco-friendly products available on request." },
  { name: "Georgi Petrov", email: "georgi@demo.bg", cat: "handyman", title: "Handyman & Small Repairs", price: 30, priceType: "HOURLY", area: "Mladost", bio: "Your go-to fixer.", desc: "Furniture assembly, TV mounting, drilling, and minor repairs around the home. Same-week availability." },
  { name: "Ivan Dimitrov", email: "ivan@demo.bg", cat: "plumbing", title: "Licensed Plumber — Fast Response", price: 40, priceType: "HOURLY", area: "Center", bio: "Licensed plumber, 15 years experience.", desc: "Leaks, installations, boilers, and emergencies. Fast response across central Sofia." },
  { name: "Elena Koleva", email: "elena@demo.bg", cat: "tutoring", title: "Math & Physics Tutor", price: 20, priceType: "HOURLY", area: "Studentski grad", bio: "MSc Physics, patient teacher.", desc: "High-school and university math & physics. Exam prep and clear, patient explanations." },
  { name: "Dimitar Stoyanov", email: "dimitar@demo.bg", cat: "moving", title: "Two Men + Van Moving", price: 120, priceType: "FIXED", area: "Citywide", bio: "We move you stress-free.", desc: "Apartment and office moves within Sofia. Packing materials and careful handling included." },
  { name: "Svetlin Marinov", email: "svetlin@demo.bg", cat: "electrical", title: "Certified Electrician", price: 35, priceType: "HOURLY", area: "Nadezhda", bio: "Certified electrician.", desc: "Wiring, sockets, lighting, and panel upgrades. Safety inspections for older apartments." },
  { name: "Petya Hristova", email: "petya@demo.bg", cat: "cleaning", title: "Office & After-Party Cleaning", price: 28, priceType: "HOURLY", area: "Center", bio: "Reliable and thorough.", desc: "Office cleaning contracts and one-off deep cleans. Flexible evening and weekend slots." },
];

async function main() {
  // Re-runnable: clear in dependency order.
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const catIdBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    catIdBySlug[c.slug] = cat.id;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  for (const p of PROVIDERS) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash,
        role: "PROVIDER",
        provider: {
          create: { city: "Sofia", area: p.area, bio: p.bio, phone: "+359 88 000 0000", verified: true },
        },
      },
      include: { provider: true },
    });
    await prisma.listing.create({
      data: {
        providerId: user.provider!.id,
        categoryId: catIdBySlug[p.cat],
        title: p.title,
        description: p.desc,
        priceType: p.priceType,
        price: p.price,
        city: "Sofia",
        area: p.area,
        active: true,
      },
    });
  }

  // A demo customer for testing the booking flow.
  await prisma.user.create({
    data: { name: "Demo Customer", email: "customer@demo.bg", passwordHash, role: "CUSTOMER" },
  });

  console.log(`Seeded ${CATEGORIES.length} categories, ${PROVIDERS.length} providers/listings, 1 customer.`);
  console.log("Demo login password for all accounts: password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
