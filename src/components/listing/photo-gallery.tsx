"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Listing photos with a click-to-enlarge lightbox. Built on the native
 * <dialog showModal()>, which gives focus trapping, inertness of the page
 * behind it and Esc-to-close for free — only arrow-key paging is ours.
 *
 * The grid below the hero shot keeps the server-rendered layout it replaces;
 * the only visual addition is a hover affordance, since the previous static
 * images gave no hint that a bigger version existed.
 */
export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + photos.length) % photos.length),
    [photos.length],
  );

  const restoreScroll = useCallback(() => {
    document.documentElement.style.overflow = "";
  }, []);

  const open = (i: number) => {
    setIndex(i);
    setIsOpen(true);
    dialogRef.current?.showModal();
    // showModal() blocks interaction but not scrolling of the page behind.
    document.documentElement.style.overflow = "hidden";
  };

  /** Every close path routes through here rather than through the dialog's
   *  `close` event alone — if that event is missed the page would be left
   *  permanently unscrollable, which is far worse than unlocking twice. */
  const close = useCallback(() => {
    setIsOpen(false);
    restoreScroll();
    dialogRef.current?.close();
  }, [restoreScroll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!dialogRef.current?.open) return;
      // Esc closing is native <dialog> behaviour, but it is cheap to guarantee
      // rather than depend on — close() is a no-op if the UA got there first.
      if (e.key === "Escape") {
        close();
        return;
      }
      if (photos.length < 2) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, close, photos.length]);

  // A route change can unmount us with the dialog still open.
  useEffect(() => restoreScroll, [restoreScroll]);

  if (photos.length === 0) return null;

  const ctrl =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        onClick={() => open(0)}
        aria-label={`Уголеми снимка 1 от ${photos.length}`}
        className="group relative block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-cobble-50 ring-1 ring-black/5"
      >
        <Image
          src={photos[0]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-cover transition duration-500 motion-safe:group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-espresso/75 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
          </svg>
          Уголеми
        </span>
      </button>

      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.slice(1).map((p, i) => (
            <button
              key={`${p}-${i}`}
              type="button"
              onClick={() => open(i + 1)}
              aria-label={`Уголеми снимка ${i + 2} от ${photos.length}`}
              className="group relative block aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-cobble-50"
            >
              <Image
                src={p}
                alt={`${title} — снимка ${i + 2}`}
                fill
                sizes="180px"
                className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        onClose={close}
        aria-label={`${title} — снимки`}
        className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-espresso/90 backdrop:backdrop-blur-sm"
      >
        {/* Clicking the empty space around the photo dismisses; the controls and
            the image itself stop the event so they stay clickable. */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 sm:p-8"
        >
          {/* Mounted only while open: a <dialog> is display:none until then, and
              a lazy <img> inside one is never scheduled for fetch — it would open
              to an empty frame. Mounting on demand lets `eager` fetch it at the
              moment it's needed, without preloading full-size shots on page load. */}
          <div className="pointer-events-none relative h-full w-full flex-1">
            {isOpen && (
              <Image
                key={photos[index]}
                src={photos[index]}
                alt={`${title} — снимка ${index + 1} от ${photos.length}`}
                fill
                sizes="100vw"
                quality={90}
                loading="eager"
                className="object-contain"
              />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Предишна снимка" className={ctrl}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <span className="min-w-[4ch] text-center font-mono text-sm text-white/70">
                  {index + 1} / {photos.length}
                </span>
                <button type="button" onClick={() => step(1)} aria-label="Следваща снимка" className={ctrl}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Затвори"
          className={`absolute right-4 top-4 bg-espresso/50 backdrop-blur sm:right-6 sm:top-6 ${ctrl}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </dialog>
    </div>
  );
}
