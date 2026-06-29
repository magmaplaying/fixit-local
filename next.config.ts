import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
