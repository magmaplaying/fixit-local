"use server";

import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/log";
import {
  isAllowedImageType,
  isStorageConfigured,
  MAX_UPLOAD_BYTES,
  putImage,
} from "@/lib/storage";

export type UploadResult = { url?: string; error?: string };

const KIND_PREFIX: Record<string, string> = { listing: "listings", avatar: "avatars" };

/**
 * Authenticated image upload: validates type/size, normalizes orientation,
 * strips metadata, downscales, re-encodes to webp, and stores in Vercel Blob.
 * Returns a public URL or a Bulgarian error (so the uploader can show it).
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Трябва да сте влезли, за да качвате снимки." };

  if (!isStorageConfigured()) {
    return { error: "Качването на снимки не е настроено. Можете да поставите URL вместо това." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Изберете файл със снимка." };
  }
  if (!isAllowedImageType(file.type)) {
    return { error: "Поддържат се само JPEG, PNG и WebP." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Снимката е твърде голяма (макс. 8 MB)." };
  }

  const kind = String(formData.get("kind") ?? "listing");
  const prefix = KIND_PREFIX[kind] ?? KIND_PREFIX.listing;

  try {
    const input = Buffer.from(await file.arrayBuffer());
    // rotate() applies EXIF orientation; sharp drops metadata by default → EXIF stripped.
    const processed = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const key = `${prefix}/${user.id}/${randomUUID()}.webp`;
    const url = await putImage(key, processed, "image/webp");
    return { url };
  } catch (err) {
    logger.error("upload.failed", { userId: user.id, kind, message: String(err) });
    return { error: "Качването не бе успешно. Опитайте отново." };
  }
}
