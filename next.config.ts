import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // unauthorized() in app/admin/page.tsx. Gating there instead of in a proxy
  // file: on Next 16 the proxy is Node-only, and on OpenNext that drags the
  // whole app-page runtime into a second bundle — ~700 KB gzipped, which put
  // the Worker over Cloudflare's 3 MiB free-plan cap.
  experimental: { authInterrupts: true },
  // Browsers only act on WWW-Authenticate when the status is 401, so sending
  // it on every /admin response is harmless and saves a proxy.
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "WWW-Authenticate", value: 'Basic realm="admin", charset="UTF-8"' }],
      },
    ];
  },
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
