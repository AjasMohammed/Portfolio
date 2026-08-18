import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first (~20% smaller than WebP), WebP fallback. Slower first encode
    // per size bucket, cached after.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
