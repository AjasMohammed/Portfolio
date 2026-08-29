import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first (~20% smaller than WebP), WebP fallback. Slower first encode
    // per size bucket, cached after.
    formats: ["image/avif", "image/webp"],
    // Project screenshots rendered on demand for sheet rows with no Preview
    // file. See shotUrl() in src/lib/projects.ts.
    remotePatterns: [{ protocol: "https", hostname: "api.microlink.io" }],
    // 30 days. The screenshots only change when the sites are redesigned, and
    // a long TTL keeps us far inside microlink's free tier: the optimizer
    // fetches each one about once a month rather than once an hour.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
