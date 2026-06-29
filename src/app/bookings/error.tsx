"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function BookingsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold tracking-tight">Заявките не се заредиха.</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Възникна грешка при зареждане на вашите заявки. Опитайте отново.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-xl bg-cobble-600 px-5 py-2.5 font-medium text-white transition hover:bg-cobble-700"
        >
          Опитай отново
        </button>
        <Link
          href="/services"
          className="rounded-xl border border-black/10 px-5 py-2.5 font-medium text-black/70 transition hover:bg-black/[0.03] dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
        >
          Разгледай услуги
        </Link>
      </div>
    </div>
  );
}
