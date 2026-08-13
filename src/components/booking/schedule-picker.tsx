"use client";

import { useState } from "react";
import type { ScheduleDay } from "@/lib/schedule";

/**
 * Hour grid for picking a booking slot. Taken hours render as disabled radios
 * so the schedule visibly fills up as the provider gets booked.
 *
 * The slots are real radio inputs named `scheduledFor`, carrying the same
 * "YYYY-MM-DDTHH:mm" value the old datetime-local field submitted — so the
 * server action and parseSchedule stay untouched, and the form still posts
 * natively. Only switching days needs JavaScript.
 */
export function SchedulePicker({ days }: { days: ScheduleDay[] }) {
  const [dayIndex, setDayIndex] = useState(0);

  if (days.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/15 px-3 py-4 text-sm text-black/50 dark:border-white/20 dark:text-white/50">
        Няма свободни часове в следващите две седмици. Пишете на изпълнителя, за да се разберете за друг период.
      </p>
    );
  }

  const day = days[Math.min(dayIndex, days.length - 1)];
  const allTaken = day.slots.every((s) => s.taken);

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {days.map((d, i) => {
          const free = d.slots.filter((s) => !s.taken).length;
          const active = i === Math.min(dayIndex, days.length - 1);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setDayIndex(i)}
              aria-pressed={active}
              className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-center text-xs transition ${
                active
                  ? "border-cobble-600 bg-cobble-600 text-white"
                  : "border-black/10 text-black/70 hover:border-cobble-500/50 dark:border-white/15 dark:text-white/70"
              }`}
            >
              <span className="block font-medium capitalize">{d.weekday}</span>
              <span className="block opacity-80">{d.dayLabel}</span>
              <span className={`block text-[10px] ${active ? "opacity-90" : "opacity-60"}`}>
                {free > 0 ? `${free} свободни` : "заето"}
              </span>
            </button>
          );
        })}
      </div>

      {allTaken ? (
        <p className="rounded-lg bg-black/[0.03] px-3 py-3 text-sm text-black/55 dark:bg-white/5 dark:text-white/55">
          Този ден е изцяло зает. Изберете друг от лентата отгоре.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {day.slots.map((s) => (
            <label
              key={s.key}
              className={
                s.taken
                  ? "cursor-not-allowed rounded-lg border border-black/5 bg-black/[0.04] px-2 py-2 text-center text-sm text-black/30 line-through dark:border-white/10 dark:bg-white/5 dark:text-white/30"
                  : "cursor-pointer rounded-lg border border-black/10 px-2 py-2 text-center text-sm transition hover:border-cobble-500/60 has-[:checked]:border-cobble-600 has-[:checked]:bg-cobble-600 has-[:checked]:text-white dark:border-white/15"
              }
            >
              <input
                type="radio"
                name="scheduledFor"
                value={s.key}
                disabled={s.taken}
                className="sr-only"
              />
              {s.label}
              {s.taken && <span className="sr-only"> — зает</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
