export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-black/50 sm:flex-row dark:text-white/50">
        <p>
          Fix<span className="font-semibold text-cobble-600">It</span> Local — доверена местна помощ в София.
        </p>
        <p>© {new Date().getFullYear()} FixIt Local. Демо.</p>
      </div>
    </footer>
  );
}
