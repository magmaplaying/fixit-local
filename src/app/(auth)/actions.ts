"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations";

export type AuthState = { error?: string };

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "CUSTOMER",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
  });
  await createSession({ id: user.id, email: user.email, name: user.name, role });

  redirect(role === "PROVIDER" ? "/onboarding/provider" : "/");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
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
