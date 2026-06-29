"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-600">Грешка</p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Нещо се обърка.</h1>
      <p className="mt-3 text-black/60 dark:text-white/60">
        Възникна неочаквана грешка. Опитайте отново или се върнете към началото.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-black/35 dark:text-white/35">код: {error.digest}</p>
      )}
      <div className="mt-7 flex gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-xl bg-cobble-600 px-5 py-2.5 font-medium text-white transition hover:bg-cobble-700"
        >
          Опитай отново
        </button>
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
