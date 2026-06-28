export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-black/50 sm:flex-row">
        <p className="font-display text-base">
          Fix<span className="text-cobble-600">It</span> Local — доверена местна помощ в цяла България.
        </p>
        <p className="font-mono text-xs">© {new Date().getFullYear()} FixIt Local · Демо</p>
      </div>
    </footer>
  );
}
