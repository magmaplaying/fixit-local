import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-center font-display text-2xl font-semibold tracking-tight">
        Под <span className="text-cobble-600">ръка</span>
      </Link>
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">{children}</div>
    </div>
  );
}
