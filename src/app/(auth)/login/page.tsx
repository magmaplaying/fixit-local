import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "../actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Welcome back</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">Sign in to manage your services and bookings.</p>
      <AuthForm mode="login" action={loginAction} />
      <p className="mt-5 rounded-lg bg-black/[0.03] px-3 py-2 text-center text-xs text-black/55 dark:bg-white/5 dark:text-white/55">
        Demo account: <span className="font-medium">maria@demo.bg</span> / <span className="font-medium">password123</span>
      </p>
      <p className="mt-4 text-center text-sm text-black/60 dark:text-white/60">
        New here?{" "}
        <Link href="/register" className="font-medium text-teal-600 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
