import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/content/articles";

export const metadata: Metadata = {
  title: "Полезно",
  description: "Съвети и ръководства за наемане на майстори, цени на услуги и поддръжка на дома.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const articles = [...ARTICLES].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">Полезно</h1>
      <p className="mt-2 text-black/60">Съвети и ръководства за дома, цените и избора на майстор.</p>

      <ul className="mt-8 space-y-6">
        {articles.map((a) => (
          <li key={a.slug} className="border-b border-black/5 pb-6">
            <p className="font-mono text-xs text-black/40">
              {new Date(a.date).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
              {a.readMinutes} мин
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              <Link href={`/blog/${a.slug}`} className="hover:text-cobble-700">
                {a.title}
              </Link>
            </h2>
            <p className="mt-1 text-black/60">{a.description}</p>
            <Link href={`/blog/${a.slug}`} className="mt-2 inline-block text-sm font-medium text-cobble-700 hover:underline">
              Прочети →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
