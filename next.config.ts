import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // ponytail: unoptimized. The Workers runtime has no sharp, so next/image
    // optimization would have to route through the paid Cloudflare Images
    // binding — which also doesn't honour `minimumCacheTTL`, the one knob that
    // kept the microlink screenshot fetches inside its free tier.
    //
    // The cost of turning it off is small here: everything under
    // public/images is already WebP and 1.1MB total, the largest single file
    // 295KB. What's lost is responsive srcset, not format conversion.
    //
    // To turn optimization back on: drop `unoptimized`, add
    // `"images": { "binding": "IMAGES" }` to wrangler.jsonc, and expect a
    // Cloudflare Images bill.
    unoptimized: true,
    // Kept for the day optimization comes back — ignored while unoptimized.
    // Project screenshots rendered on demand for sheet rows with no Preview
    // file. See shotUrl() in src/lib/projects.ts.
    remotePatterns: [{ protocol: "https", hostname: "api.microlink.io" }],
  },
};

// Lets `next dev` reach the Cloudflare bindings and the request `cf` object.
initOpenNextCloudflareForDev();

export default nextConfig;
