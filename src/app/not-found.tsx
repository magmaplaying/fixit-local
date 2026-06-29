import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-600">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Страницата не е намерена.</h1>
      <p className="mt-3 text-black/60 dark:text-white/60">
        Линкът може да е остарял или услугата вече да я няма.
      </p>
      <div className="mt-7 flex gap-3">
        <Link
          href="/services"
          className="rounded-xl bg-cobble-600 px-5 py-2.5 font-medium text-white transition hover:bg-cobble-700"
        >
          Разгледай услуги
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-black/10 px-5 py-2.5 font-medium text-black/70 transition hover:bg-black/[0.03] dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
        >
          Към началото
        </Link>
      </div>
    </div>
  );
}
