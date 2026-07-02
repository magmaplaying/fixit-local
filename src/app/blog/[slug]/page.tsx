import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/content/articles";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: `${a.title} | ${SITE_NAME}`,
      description: a.description,
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: a.date,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.date,
    inLanguage: "bg",
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${a.slug}`,
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <JsonLd data={articleLd} />

      <nav aria-label="Навигация" className="text-sm text-black/45">
        <Link href="/blog" className="hover:text-cobble-700">
          Полезно
        </Link>{" "}
        / <span className="text-black/70">{a.title}</span>
      </nav>

      <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">{a.title}</h1>
      <p className="mt-2 font-mono text-xs text-black/40">
        {formatDate(a.date)} · {a.readMinutes} мин четене
      </p>

      <div className="mt-8 space-y-6">
        {a.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="font-display text-xl font-semibold">{s.heading}</h2>}
            {s.paragraphs.map((p, j) => (
              <p key={j} className="mt-2 text-[15px] leading-relaxed text-black/70">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      {a.related.length > 0 && (
        <div className="mt-10 rounded-2xl border border-black/5 bg-white p-5">
          <p className="text-sm font-medium">Свързани услуги</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {a.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/70 transition hover:border-cobble-500/50 hover:text-cobble-800"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
