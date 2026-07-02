import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { PaveDivider } from "@/components/site/pave-divider";

export const metadata: Metadata = {
  title: "Станете изпълнител",
  description:
    "Присъединете се към „Под ръка“ като изпълнител — получавайте заявки от клиенти в целия град, определяте цените си, без месечни такси.",
  alternates: { canonical: "/become-provider" },
};

const BENEFITS = [
  { title: "Нови клиенти", body: "Показвайте се пред хора, които активно търсят вашата услуга — по категория и град." },
  { title: "Без месечна такса", body: "Създаването на профил и обяви е безплатно. Плащате само комисиона при реална заявка." },
  { title: "Вие определяте цените", body: "Сами задавате часова или фиксирана цена и приемате само заявките, които ви устройват." },
  { title: "Изградете репутация", body: "Събирайте реални отзиви и оценки, които печелят доверието на следващите клиенти." },
];

const STEPS = [
  "Регистрирайте се като изпълнител за минута.",
  "Създайте профил и добавете услугите си.",
  "Получавайте заявки и потвърждавайте удобните за вас.",
];

export default function BecomeProviderPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Под ръка", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Станете изпълнител", item: `${SITE_URL}/become-provider` },
    ],
  };

  return (
    <div>
      <JsonLd data={breadcrumb} />

      <section className="bg-espresso text-background">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
          <p className="hero-i1 font-mono text-xs uppercase tracking-[0.22em] text-cobble-300">За майстори и специалисти</p>
          <h1 className="hero-i2 mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Печелете повече с <span className="text-cobble-400">Под ръка</span>
          </h1>
          <p className="hero-i3 mt-6 max-w-xl text-lg text-background/75">
            Свържете се с клиенти в целия си град. Без месечни такси — плащате само когато получите работа.
          </p>
          <div className="hero-i4">
            <Link
              href="/register?role=provider"
              className="mt-8 inline-block rounded-xl bg-cobble-600 px-7 py-3 font-medium text-white transition hover:bg-cobble-700"
            >
              Станете изпълнител
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 2) * 90} className="h-full">
              <div className="h-full rounded-2xl border border-black/5 bg-white p-6">
                <h2 className="font-display text-xl font-semibold">{b.title}</h2>
                <p className="mt-2 text-black/60">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <PaveDivider className="mt-16" />
        <Reveal>
          <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Как да започнете</h2>
        </Reveal>
        <ol className="mt-6 space-y-4">
          {STEPS.map((s, i) => (
            <li key={i}>
              <Reveal delay={i * 110} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cobble-100 font-semibold text-cobble-700">
                  {i + 1}
                </span>
                <p className="pt-1 text-black/70">{s}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <Link
            href="/register?role=provider"
            className="inline-block rounded-xl bg-cobble-600 px-7 py-3 font-medium text-white transition hover:bg-cobble-700"
          >
            Създайте безплатен профил
          </Link>
        </div>
      </section>
    </div>
  );
}
