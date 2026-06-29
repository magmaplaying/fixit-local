"use client";

import { useRef, useState, useTransition, type ChangeEvent, type DragEvent } from "react";
import { uploadImage } from "@/app/_actions/uploads";

/**
 * Multi-image uploader. Uploads files via the `uploadImage` server action and
 * keeps an ordered list of URLs, emitting one hidden `<input name={name}>` per
 * URL so the surrounding form submits them. Also accepts pasted URLs (backward
 * compatible with existing URL-based photos). `max={1}` makes it a single-image
 * (avatar) picker.
 */
export function PhotoUploader({
  name = "photos",
  kind = "listing",
  max = 6,
  defaultUrls = [],
}: {
  name?: string;
  kind?: "listing" | "avatar";
  max?: number;
  defaultUrls?: string[];
}) {
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = max - urls.length;

  async function handleFiles(files: File[]) {
    setError(null);
    for (const file of files) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", kind);
      const res = await uploadImage(fd);
      if (res.error) {
        setError(res.error);
        break;
      }
      if (res.url) setUrls((prev) => (prev.length < max ? [...prev, res.url as string] : prev));
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files).slice(0, remaining) : [];
    e.target.value = "";
    if (files.length) startTransition(() => handleFiles(files));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (files.length) startTransition(() => handleFiles(files));
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (urls.length >= max) {
      setError(`Максимум ${max} ${max === 1 ? "снимка" : "снимки"}.`);
      return;
    }
    setUrls((prev) => [...prev, url]);
    setUrlDraft("");
    setError(null);
  }

  const remove = (i: number) => setUrls((prev) => prev.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) =>
    setUrls((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      {urls.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
            >
              {/* Client-side preview only; cards/detail render via next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <input type="hidden" name={name} value={url} />
              {i === 0 && max > 1 && (
                <span className="absolute left-1 top-1 rounded bg-cobble-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Корица
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-espresso/75 px-1 py-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  className="px-1.5 text-sm text-background disabled:opacity-30"
                  disabled={i === 0}
                  aria-label="Премести наляво"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="px-1.5 text-sm text-background"
                  aria-label="Премахни снимката"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  className="px-1.5 text-sm text-background disabled:opacity-30"
                  disabled={i === urls.length - 1}
                  aria-label="Премести надясно"
                >
                  ▶
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-xl border border-dashed border-black/15 p-4 text-center dark:border-white/20"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={max > 1}
            onChange={onPick}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="rounded-lg bg-cobble-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cobble-700 disabled:opacity-60"
          >
            {pending ? "Качване…" : max > 1 ? "Качи снимки" : "Качи снимка"}
          </button>
          <p className="mt-2 text-xs text-black/45 dark:text-white/45">
            или пуснете файл тук · JPEG/PNG/WebP до 8 MB · остават {remaining}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="или поставете URL на снимка…"
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-cobble-500 dark:border-white/15 dark:bg-white/5"
            />
            <button
              type="button"
              onClick={addUrl}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/5"
            >
              Добави
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
