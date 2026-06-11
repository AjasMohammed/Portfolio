import { getRedis } from "@/lib/visits";

/**
 * Fixed-window rate limit on the shared Upstash client.
 * Returns true when the request is allowed. Fails open — if Redis is
 * unconfigured or errors, the endpoint keeps working unthrottled rather
 * than going down with the limiter.
 */
export async function rateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;
  try {
    const key = `rl:${bucket}:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    return count <= limit;
  } catch (e) {
    console.error("[rate-limit] redis threw", e);
    return true;
  }
}

/** Best-effort client IP — first hop of x-forwarded-for, set by Vercel/CDNs. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
