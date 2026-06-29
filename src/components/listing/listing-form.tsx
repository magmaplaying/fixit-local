"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PRICE_TYPES } from "@/lib/validations";
import { PhotoUploader } from "@/components/listing/photo-uploader";

type State = { error?: string };
type Category = { id: string; name: string; icon: string | null };

export type ListingDefaults = {
  id?: string;
  title?: string;
  categoryId?: string;
  description?: string;
  priceType?: string;
  price?: number | null;
  city?: string;
  area?: string | null;
  photos?: string[];
  active?: boolean;
};

const PRICE_LABELS: Record<string, string> = {
  HOURLY: "На час",
  FIXED: "Фиксирана цена",
  QUOTE: "По договаряне",
};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cobble-500 focus:ring-2 focus:ring-cobble-500/20 dark:border-white/15 dark:bg-white/5";

export function ListingForm({
  mode,
  action,
  categories,
  defaults,
}: {
  mode: "create" | "edit";
  action: (prev: State, formData: FormData) => Promise<State>;
  categories: Category[];
  defaults?: ListingDefaults;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});
  const d = defaults ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && d.id && <input type="hidden" name="id" value={d.id} />}

      <Field label="Заглавие">
        <input name="title" defaultValue={d.title ?? ""} placeholder="напр. Професионално почистване на дома" className={inputClass} />
      </Field>

      <Field label="Категория">
        <select name="categoryId" defaultValue={d.categoryId ?? ""} className={inputClass}>
          <option value="" disabled>
            Изберете категория…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Описание">
        <textarea
          name="description"
          rows={4}
          defaultValue={d.description ?? ""}
          placeholder="Какво включва, вашият опит, наличност…"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ценообразуване">
          <select name="priceType" defaultValue={d.priceType ?? "HOURLY"} className={inputClass}>
            {PRICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {PRICE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Цена (€)">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={d.price ?? ""}
            placeholder="Празно за договаряне"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Град">
          <input name="city" defaultValue={d.city ?? "София"} className={inputClass} />
        </Field>
        <Field label="Квартал (по избор)">
          <input name="area" defaultValue={d.area ?? ""} placeholder="напр. Лозенец" className={inputClass} />
        </Field>
      </div>

      <Field label="Снимки (по избор)">
        <PhotoUploader name="photos" kind="listing" max={6} defaultUrls={d.photos ?? []} />
      </Field>

      {mode === "edit" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={d.active ?? true} className="h-4 w-4 accent-cobble-600" />
          Активна (видима за клиенти)
        </label>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-cobble-600 px-5 py-2.5 font-medium text-white transition hover:bg-cobble-700 disabled:opacity-60"
        >
          {pending ? "Запазване…" : mode === "create" ? "Публикувай обявата" : "Запази промените"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-black/10 px-5 py-2.5 text-sm font-medium text-black/60 transition hover:bg-black/[0.03] dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
        >
          Откажи
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-black/70 dark:text-white/70">{label}</span>
      {children}
    </label>
  );
}
