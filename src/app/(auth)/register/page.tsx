import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { registerAction } from "../actions";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const sp = await searchParams;
  const defaultRole = sp.role === "provider" ? "PROVIDER" : "CUSTOMER";
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Създайте акаунт</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">Присъединете се към „Под ръка“, за да заявите доверена помощ или да предлагате услуги.</p>
      <AuthForm mode="register" action={registerAction} defaultRole={defaultRole} />
      <p className="mt-4 text-center text-sm text-black/60 dark:text-white/60">
        Вече имате акаунт?{" "}
        <Link href="/login" className="font-medium text-cobble-600 hover:underline">
          Вход
        </Link>
      </p>
    </>
  );
}
