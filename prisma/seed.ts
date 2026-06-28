import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Уроци", slug: "tutoring", icon: "📚" },
  { name: "Почистване", slug: "cleaning", icon: "🧹" },
  { name: "Майстор", slug: "handyman", icon: "🔧" },
  { name: "Преместване", slug: "moving", icon: "📦" },
  { name: "Водопровод", slug: "plumbing", icon: "🚰" },
  { name: "Електро", slug: "electrical", icon: "💡" },
  { name: "Боядисване", slug: "painting", icon: "🎨" },
  { name: "Климатици", slug: "ac", icon: "❄️" },
  { name: "Градинарство", slug: "gardening", icon: "🌿" },
  { name: "Детегледач", slug: "childcare", icon: "👶" },
  { name: "Красота", slug: "beauty", icon: "💇" },
  { name: "IT помощ", slug: "it", icon: "💻" },
  { name: "Автосервиз", slug: "auto", icon: "🚗" },
  { name: "Ключар", slug: "locksmith", icon: "🔑" },
];

const PROVIDERS = [
  { name: "Мария Иванова", email: "maria@demo.bg", cat: "cleaning", title: "Професионално почистване на дома", price: 25, priceType: "HOURLY", city: "София", area: "Лозенец", bio: "10 години блестящи домове.", desc: "Основно и поддържащо почистване, нанасяне и изнасяне. Еко препарати при заявка." },
  { name: "Георги Петров", email: "georgi@demo.bg", cat: "handyman", title: "Майстор за дребни ремонти", price: 30, priceType: "HOURLY", city: "Пловдив", area: "Кючук Париж", bio: "Вашият майстор за всичко.", desc: "Сглобяване на мебели, окачване на телевизори, пробиване и дребни ремонти вкъщи. Свободен в рамките на седмицата." },
  { name: "Иван Димитров", email: "ivan@demo.bg", cat: "plumbing", title: "Лицензиран водопроводчик — бърза реакция", price: 40, priceType: "HOURLY", city: "Варна", area: "Гръцка махала", bio: "Лицензиран водопроводчик с 15 г. опит.", desc: "Течове, монтажи, бойлери и аварии. Бърза реакция в целия град." },
  { name: "Елена Колева", email: "elena@demo.bg", cat: "tutoring", title: "Учител по математика и физика", price: 20, priceType: "HOURLY", city: "София", area: "Студентски град", bio: "Магистър по физика, търпелив учител.", desc: "Математика и физика за ученици и студенти. Подготовка за изпити и ясни обяснения. Възможни и онлайн уроци." },
  { name: "Димитър Стоянов", email: "dimitar@demo.bg", cat: "moving", title: "Преместване — двама с бус", price: 120, priceType: "FIXED", city: "Бургас", area: "Център", bio: "Местим ви без стрес.", desc: "Преместване на апартаменти и офиси. Опаковъчни материали и внимателно пренасяне." },
  { name: "Светлин Маринов", email: "svetlin@demo.bg", cat: "electrical", title: "Сертифициран електротехник", price: 35, priceType: "HOURLY", city: "Русе", area: "Център", bio: "Сертифициран електротехник.", desc: "Окабеляване, контакти, осветление и табла. Проверки на безопасността за стари апартаменти." },
  { name: "Петя Христова", email: "petya@demo.bg", cat: "cleaning", title: "Почистване на офиси и след партита", price: 28, priceType: "HOURLY", city: "Пловдив", area: "Център", bio: "Надеждна и старателна.", desc: "Договори за почистване на офиси и еднократно основно почистване. Гъвкави вечерни и съботно-неделни часове." },
  { name: "Николай Колев", email: "nikolay@demo.bg", cat: "painting", title: "Бояджийски услуги — апартаменти и офиси", price: 18, priceType: "HOURLY", city: "Пловдив", area: "Тракия", bio: "Чисто и бързо боядисване.", desc: "Латекс, гипсокартон, шпакловка и декоративни мазилки. Без прах и безпорядък." },
  { name: "Стефан Ангелов", email: "stefan@demo.bg", cat: "ac", title: "Монтаж и профилактика на климатици", price: 50, priceType: "FIXED", city: "София", area: "Младост", bio: "Оторизиран техник.", desc: "Доставка, монтаж, зареждане и профилактика на климатици. Гаранция на труда." },
  { name: "Виктория Тодорова", email: "viktoria@demo.bg", cat: "gardening", title: "Поддръжка на градини и дворове", price: 22, priceType: "HOURLY", city: "Варна", area: "Виница", bio: "Зелено и подредено.", desc: "Косене, оформяне на жив плет, засаждане и сезонна поддръжка на дворове." },
  { name: "Мартин Иванов", email: "martin@demo.bg", cat: "it", title: "Компютърна помощ и настройки", price: 25, priceType: "HOURLY", city: "София", area: "Лозенец", bio: "IT помощ за дома и офиса.", desc: "Почистване от вируси, преинсталация, мрежи и Wi-Fi, настройка на устройства. Възможно и онлайн." },
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

  const listings: { id: string }[] = [];
  for (const p of PROVIDERS) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash,
        role: "PROVIDER",
        provider: {
          create: { city: p.city, area: p.area, bio: p.bio, phone: "+359 88 000 0000", verified: true },
        },
      },
      include: { provider: true },
    });
    const listing = await prisma.listing.create({
      data: {
        providerId: user.provider!.id,
        categoryId: catIdBySlug[p.cat],
        title: p.title,
        description: p.desc,
        priceType: p.priceType,
        price: p.price,
        city: p.city,
        area: p.area,
        photos: JSON.stringify([`https://picsum.photos/seed/podruka-${p.email.split("@")[0]}/800/600`]),
        active: true,
      },
    });
    listings.push(listing);
  }

  // Демо клиент за тестване на процеса по заявка и отзив.
  const customer = await prisma.user.create({
    data: { name: "Демо клиент", email: "customer@demo.bg", passwordHash, role: "CUSTOMER" },
  });

  // Завършени заявки с отзиви → зарежда рейтинги в целия сайт.
  const reviewed: Array<{ idx: number; rating: number; comment: string }> = [
    { idx: 0, rating: 5, comment: "Безупречно и точно навреме — горещо препоръчвам!" },
    { idx: 2, rating: 4, comment: "Поправи течта бързо. Професионално и любезно." },
    { idx: 3, rating: 5, comment: "Страхотен учител — оценките на дъщеря ми скочиха." },
  ];
  for (const r of reviewed) {
    const booking = await prisma.booking.create({
      data: { listingId: listings[r.idx].id, customerId: customer.id, status: "COMPLETED" },
    });
    await prisma.review.create({
      data: { bookingId: booking.id, listingId: listings[r.idx].id, authorId: customer.id, rating: r.rating, comment: r.comment },
    });
  }

  // Завършена заявка, която клиентът още може да оцени (за демонстрация на формата).
  await prisma.booking.create({
    data: { listingId: listings[1].id, customerId: customer.id, status: "COMPLETED" },
  });
  // Чакаща заявка (показва се в таблото на специалиста).
  await prisma.booking.create({
    data: {
      listingId: listings[5].id,
      customerId: customer.id,
      status: "REQUESTED",
      message: "Може ли да наминете този уикенд?",
    },
  });

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${PROVIDERS.length} providers/listings, 1 customer, ${reviewed.length} reviews, 2 extra bookings.`,
  );
  console.log("Demo login password for all accounts: password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
