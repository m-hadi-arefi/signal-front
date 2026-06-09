import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";
import { getServerT } from "@/lib/i18n-server";

const SEARCH_TTL = 30;
const MAX_QUERY_LENGTH = 100;

export async function GET(req: NextRequest) {
  const t = getServerT(req);
  // Defense-in-depth: middleware already enforces auth, but double-check here.
  if (!req.headers.get("x-user-id")) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const rl = await rateLimit(req, "search", 30, 60);
  if (!rl.success) return NextResponse.json({ error: t("too_many_requests") }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().slice(0, MAX_QUERY_LENGTH);
  const type = searchParams.get("type") === "users" ? "users" : "signals";

  if (q.length < 2) {
    return NextResponse.json({ data: [], type });
  }

  // Query is already capped at MAX_QUERY_LENGTH chars above; use it directly as key.
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
