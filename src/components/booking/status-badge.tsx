const STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  ACCEPTED: "bg-cobble-50 text-cobble-700 dark:bg-cobble-950/40 dark:text-cobble-300",
  DECLINED: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50",
};

const LABELS: Record<string, string> = {
  REQUESTED: "Заявена",
  ACCEPTED: "Приета",
  DECLINED: "Отказана",
  COMPLETED: "Завършена",
  CANCELLED: "Анулирана",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? STYLES.CANCELLED}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
