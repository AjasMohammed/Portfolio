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

/**
 * Best-effort client IP.
 *
 * cf-connecting-ip first: on Cloudflare it is set by the edge and cannot be
 * forged by the client, whereas x-forwarded-for arrives as whatever the
 * caller appended to it. The rest are fallbacks for other hosts and local dev.
 */
export function clientIp(h: Headers): string {
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
