"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PRICE_TYPES } from "@/lib/validations";

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
  imageUrl?: string;
  active?: boolean;
};

const PRICE_LABELS: Record<string, string> = {
  HOURLY: "Per hour",
  FIXED: "Fixed price",
  QUOTE: "Quote on request",
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

      <Field label="Title">
        <input name="title" defaultValue={d.title ?? ""} placeholder="e.g. Professional Home Cleaning" className={inputClass} />
      </Field>

      <Field label="Category">
        <select name="categoryId" defaultValue={d.categoryId ?? ""} className={inputClass}>
          <option value="" disabled>
            Choose a category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={4}
          defaultValue={d.description ?? ""}
          placeholder="What's included, your experience, availability…"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pricing">
          <select name="priceType" defaultValue={d.priceType ?? "HOURLY"} className={inputClass}>
            {PRICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {PRICE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (€)">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={d.price ?? ""}
            placeholder="Leave blank for quote"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <input name="city" defaultValue={d.city ?? "Sofia"} className={inputClass} />
        </Field>
        <Field label="Area (optional)">
          <input name="area" defaultValue={d.area ?? ""} placeholder="e.g. Lozenets" className={inputClass} />
        </Field>
      </div>

      <Field label="Image URL (optional)">
        <input name="imageUrl" defaultValue={d.imageUrl ?? ""} placeholder="https://…" className={inputClass} />
      </Field>

      {mode === "edit" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={d.active ?? true} className="h-4 w-4 accent-cobble-600" />
          Active (visible to customers)
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
          {pending ? "Saving…" : mode === "create" ? "Publish listing" : "Save changes"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-black/10 px-5 py-2.5 text-sm font-medium text-black/60 transition hover:bg-black/[0.03] dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
        >
          Cancel
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
