export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-black/50 sm:flex-row">
        <p className="font-display text-base">
          Под <span className="text-cobble-600">ръка</span> — доверена местна помощ в цяла България.
        </p>
        <p className="font-mono text-xs">© {new Date().getFullYear()} Под ръка · Демо</p>
      </div>
    </footer>
  );
}
