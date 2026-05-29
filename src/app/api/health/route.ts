import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  let db = false;
  let redisOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  try {
    const pong = await redis.ping();
    redisOk = pong === "PONG";
  } catch {
    redisOk = false;
  }

  const status = db && redisOk ? "ok" : "degraded";
  return NextResponse.json(
    { status, db, redis: redisOk, timestamp: new Date().toISOString() },
    { status: status === "ok" ? 200 : 503 }
  );
}
