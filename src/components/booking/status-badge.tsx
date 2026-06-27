const STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  ACCEPTED: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  DECLINED: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? STYLES.CANCELLED}`}>
      {label}
    </span>
  );
}
