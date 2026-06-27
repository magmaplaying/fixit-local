import { submitReview } from "@/app/_actions/reviews";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  return (
    <form action={submitReview} className="mt-3 space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex items-center gap-2">
        <label htmlFor={`rating-${bookingId}`} className="text-sm font-medium">
          Leave a review
        </label>
        <select
          id={`rating-${bookingId}`}
          name="rating"
          defaultValue="5"
          className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm outline-none focus:border-teal-500 dark:border-white/15 dark:bg-white/5"
        >
          <option value="5">★★★★★ (5)</option>
          <option value="4">★★★★ (4)</option>
          <option value="3">★★★ (3)</option>
          <option value="2">★★ (2)</option>
          <option value="1">★ (1)</option>
        </select>
      </div>
      <textarea
        name="comment"
        rows={2}
        placeholder="How was it? (optional)"
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-white/15 dark:bg-white/5"
      />
      <button className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-teal-700">
        Submit review
      </button>
    </form>
  );
}
