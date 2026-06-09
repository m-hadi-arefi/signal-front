import Redis from "ioredis";
import { logger } from "./logger";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Attempt an explicit connection at startup so failures are surfaced immediately
// instead of silently degrading on the first cache/rate-limit call.
redis.connect().catch((err: unknown) => {
  logger.error("redis_connect_failed", {
    error: err instanceof Error ? err.message : String(err),
    url: (process.env.REDIS_URL ?? "redis://localhost:6379").replace(/\/\/.*@/, "//<redacted>@"),
  });
});

redis.on("error", (err: Error) => {
  logger.error("redis_error", { error: err.message });
});

export const CACHE_TTL = {
  SIGNALS_FEED: 30,
  SIGNAL_DETAIL: 60,
  USER_PROFILE: 120,
  OFFICIAL_SIGNALS: 60,
} as const;

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch (err) {
    logger.warn("redis_get_error", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.warn("redis_set_error", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn("redis_invalidate_error", {
      keys,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
