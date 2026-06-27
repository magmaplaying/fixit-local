import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { registerAction } from "../actions";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">Join FixIt Local to book trusted help or offer your services.</p>
      <AuthForm mode="register" action={registerAction} />
      <p className="mt-4 text-center text-sm text-black/60 dark:text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
