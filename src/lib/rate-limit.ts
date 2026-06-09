import { redis } from "./redis";
import { logger } from "./logger";
import { NextRequest } from "next/server";

/** Basic IPv4/IPv6 validation — prevents fake headers being used as Redis keys. */
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/;

function extractIp(req: NextRequest): string {
  // x-forwarded-for may contain a comma-separated chain (client, proxy1, proxy2…).
  // Only the first entry is the original client IP; the rest are proxies we trust less.
  const forwarded = req.headers.get("x-forwarded-for");
  const firstForwarded = forwarded ? forwarded.split(",")[0].trim() : null;

  const candidates = [
    firstForwarded,
    req.headers.get("x-real-ip"),
  ];

  for (const ip of candidates) {
    if (ip && IP_RE.test(ip)) return ip;
  }

  // Fall back to a static bucket so rate-limiting still works even when headers
  // are absent or invalid (unknown clients cannot bypass limits).
  return "unknown";
}

export async function rateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ success: boolean; remaining: number }> {
  const ip = extractIp(req);
  const redisKey = `rl:${key}:${ip}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) await redis.expire(redisKey, windowSecs);
    const remaining = Math.max(0, limit - current);
    return { success: current <= limit, remaining };
  } catch (err) {
    // Redis unavailable — fail open but log so ops knows
    logger.warn("rate_limit_redis_error", {
      key,
      ip,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: true, remaining: limit };
  }
}
