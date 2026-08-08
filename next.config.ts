import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 requires an explicit allowlist (default [75]); an unlisted
    // `quality` prop silently snaps to the nearest entry. 90 is for the
    // full-screen photo lightbox — thumbnails and hero shots stay at 75.
    qualities: [75, 90],
    remotePatterns: [
      // Uploaded images (Vercel Blob)
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      // Seed / pasted external images
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
