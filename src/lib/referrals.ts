import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";

// Unambiguous alphabet (no O/0, I/1) for human-shareable codes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 7): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** The user's referral code, generating and persisting one on first use. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (existing?.referralCode) return existing.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      // Unique collision (extremely unlikely) → retry with a fresh code.
    }
  }
  throw new Error("could not generate a unique referral code");
}

/** Attribute a new signup to the inviter identified by `code`. Best-effort. */
export async function attributeReferral(newUserId: string, code: string): Promise<void> {
  try {
    const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!referrer || referrer.id === newUserId) return; // unknown code or self-referral
    await prisma.user.update({ where: { id: newUserId }, data: { referredById: referrer.id } });
    logger.info("referral.attributed", { newUserId, referrerId: referrer.id });
  } catch (err) {
    logger.error("referral.attribute_failed", { newUserId, message: String(err) });
  }
}

/** How many users this user has invited. */
export function getReferralCount(userId: string): Promise<number> {
  return prisma.user.count({ where: { referredById: userId } });
}
