import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";

const SEARCH_TTL = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type") === "users" ? "users" : "signals";

  if (q.length < 1) {
    return NextResponse.json({ data: [], type });
  }

  const cacheKey = `search:${type}:${q.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return NextResponse.json({ data: cached, type });

  if (type === "users") {
    const users = await prisma.user.findMany({
      where: { username: { contains: q, mode: "insensitive" } },
      take: 10,
      select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true },
      orderBy: { username: "asc" },
    });
    const data = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
    await setCache(cacheKey, data, SEARCH_TTL);
    return NextResponse.json({ data, type });
  }

  const signals = await prisma.signal.findMany({
    where: {
      OR: [
        { symbol: { contains: q, mode: "insensitive" } },
        { rawText: { contains: q, mode: "insensitive" } },
        { aiSummary: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 15,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      symbol: true,
      aiSummary: true,
      rawText: true,
      createdAt: true,
      author: { select: { id: true, username: true, avatar: true, role: true } },
    },
  });
  const data = signals.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));
  await setCache(cacheKey, data, SEARCH_TTL);
  return NextResponse.json({ data, type });
}
