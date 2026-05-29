import { redis } from "./redis";
import { NextRequest } from "next/server";

export async function rateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ success: boolean; remaining: number }> {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const redisKey = `rl:${key}:${ip}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) await redis.expire(redisKey, windowSecs);
    const remaining = Math.max(0, limit - current);
    return { success: current <= limit, remaining };
  } catch {
    return { success: true, remaining: limit };
  }
}
