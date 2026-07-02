"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations";
import { ensureReferralCode, attributeReferral } from "@/lib/referrals";

export type AuthState = { error?: string };

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "CUSTOMER",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Невалидни данни" };
  }

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Вече съществува акаунт с този имейл." };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
  });

  // Give the new user their own invite code, and attribute the inviter (if a
  // ?ref cookie was captured on an earlier page visit).
  await ensureReferralCode(user.id);
  const cookieStore = await cookies();
  const ref = cookieStore.get("podruka_ref")?.value;
  if (ref) {
    await attributeReferral(user.id, ref);
    cookieStore.delete("podruka_ref");
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role });

  redirect(role === "PROVIDER" ? "/onboarding/provider" : "/");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Невалидни данни" };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Грешен имейл или парола." };
  }
  if (user.status === "SUSPENDED") {
    return { error: "Този акаунт е спрян. Свържете се с поддръжката." };
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "CUSTOMER" | "PROVIDER" | "ADMIN",
  });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
