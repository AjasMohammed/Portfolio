import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * Cloudflare Workers adapter config.
 *
 * `incrementalCache` backs the ISR store: `revalidate = 60` on the home page,
 * `unstable_cache` around the visit counter, and the `next: { revalidate }`
 * fetches to Google Sheets and GitHub. Without it every request would refetch
 * both sheets and the GitHub API — and the unauthenticated GitHub limit is
 * 60/hr, so the contributions calendar would start failing under any traffic.
 *
 * `tagCache` is what makes `revalidateTag()` in /api/testimonials/revalidate
 * actually invalidate anything. Drop it and that endpoint returns ok and does
 * nothing.
 *
 * ponytail: no `queue` override — the default in-memory queue dedupes only
 * per-isolate, so a hot page can trigger a few redundant background
 * revalidations. Fine at portfolio traffic. If that ever shows up as sheet
 * fetch volume, add `queue: doQueue` from
 * "@opennextjs/cloudflare/overrides/queue/do-queue" plus the
 * NEXT_CACHE_DO_QUEUE durable object binding + migration in wrangler.jsonc.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
});
