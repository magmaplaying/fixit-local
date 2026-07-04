import Link from "next/link";

// A row of pavé stones with one missing — the page that isn't paved yet.
// Static spans (not .pave-stone, which stays hidden until a Reveal fires).
const TONES = ["bg-cobble-300", "bg-cobble-500", "bg-cobble-700"];
const MISSING_INDEX = 5;

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="flex items-center gap-2.5" aria-hidden>
        {Array.from({ length: 9 }, (_, i) =>
          i === MISSING_INDEX ? (
            <span key={i} className="h-2.5 w-2.5 rotate-45 rounded-[1px] border border-dashed border-cobble-600/60" />
          ) : (
            <span key={i} className={`h-2.5 w-2.5 rotate-45 rounded-[1px] ${TONES[i % TONES.length]}`} />
          ),
        )}
      </div>

      <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-cobble-600">Грешка 404</p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Тук още няма паваж.</h1>
      <p className="mt-3 text-black/60 dark:text-white/60">
        Страницата не е намерена — линкът може да е остарял или услугата вече да я няма.
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
