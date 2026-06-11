import { Redis } from "@upstash/redis";

const COUNT_KEY = "visits:count";
const LOG_KEY = "visits:log";
const LOG_CAP = 1000;

let cached: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cached = null;
    return null;
  }
  cached = new Redis({ url, token });
  return cached;
}

export async function getVisitCount(): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const v = await redis.get<number>(COUNT_KEY);
    return v ?? 0;
  } catch (e) {
    console.error("[visits] redis read threw", e);
    return null;
  }
}

export async function logVisit(
  meta: Record<string, string>,
): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const pipe = redis.pipeline();
    pipe.incr(COUNT_KEY);
    pipe.lpush(LOG_KEY, JSON.stringify(meta));
    pipe.ltrim(LOG_KEY, 0, LOG_CAP - 1);
    const [count] = (await pipe.exec()) as [number, number, string];
    return count;
  } catch (e) {
    console.error("[visits] redis write threw", e);
    return null;
  }
}

export async function getRecentVisits(limit = 50): Promise<unknown[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const items = await redis.lrange(LOG_KEY, 0, Math.max(0, limit - 1));
    return items
      .map((raw) => {
        if (typeof raw !== "string") return raw;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      })
      .filter(Boolean);
  } catch (e) {
    console.error("[visits] redis lrange threw", e);
    return [];
  }
}
