"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, createSession, type Role } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";

/** Toggle whether the current user receives transactional emails. */
export async function setEmailNotifications(formData: FormData): Promise<void> {
  const user = await requireUser("/settings");
  const enabled = String(formData.get("enabled")) === "true";
  await prisma.user.update({ where: { id: user.id }, data: { emailNotifications: enabled } });
  revalidatePath("/settings");
}

/** Update the signed-in user's display name and login email. */
export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireUser("/settings");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) redirect("/settings?profile=invalid");

  const { name, email } = parsed.data;
  if (email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) redirect("/settings?profile=taken");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
  });

  // The session JWT carries name/email, so re-issue it or the navbar keeps
  // greeting the old name until the cookie expires.
  await createSession({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role as Role,
  });

  revalidatePath("/settings");
  redirect("/settings?profile=saved");
}
