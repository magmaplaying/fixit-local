import "server-only";
import { put, del } from "@vercel/blob";
import { env } from "@/lib/env";

// Thin wrapper over Vercel Blob with guards. Centralizes the token + the
// content-type/size policy so the upload action stays small.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB (pre-processing)

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** True only when a Blob store is configured (lets the UI/action degrade gracefully). */
export function isStorageConfigured(): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

/** Hostname suffix of Vercel Blob public URLs — used to scope cleanup. */
export const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export async function putImage(key: string, data: Buffer, contentType: string): Promise<string> {
  const blob = await put(key, data, {
    access: "public",
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });
  return blob.url;
}

/** Best-effort delete; only touches blobs we host, never crashes the caller. */
export async function deleteImage(url: string): Promise<void> {
  if (!env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const host = new URL(url).hostname;
    if (!host.endsWith(BLOB_HOST_SUFFIX)) return;
    await del(url, { token: env.BLOB_READ_WRITE_TOKEN });
  } catch {
    // ignore — orphaned blob is harmless
  }
}
