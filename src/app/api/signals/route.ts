import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signalSchema } from "@/lib/validations";
import { invalidateCache, getCache, setCache, CACHE_TTL } from "@/lib/redis";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { rateLimit } from "@/lib/rate-limit";
import { SignalData } from "@/types";

const SELECT_SIGNAL = {
  id: true,
  symbol: true,
  rawText: true,
  aiSummary: true,
  currentMarketPrice: true,
  source: true,
  status: true,
  createdAt: true,
  analyzedAt: true,
  author: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
  scenarios: {
    select: {
      id: true,
      direction: true,
      entryPoint: true,
      entryType: true,
      takeProfits: true,
      stopLoss: true,
      invalidation: true,
      confidence: true,
      reasoning: true,
      status: true,
      raw: true,
      createdAt: true,
      result: true,
    },
  },
  _count: { select: { comments: true, likes: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const parsedLimit = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;
  const symbol = searchParams.get("symbol");
  const official = searchParams.get("official") === "true";
  const direction = searchParams.get("direction");
  const sort = searchParams.get("sort") === "popular" ? "popular" : "latest";
  const parsedConf = parseInt(searchParams.get("minConfidence") || "0", 10);
  const minConfidence = Number.isFinite(parsedConf) ? Math.max(0, Math.min(100, parsedConf)) : 0;
  const following = searchParams.get("following") === "true";
  const userId = req.headers.get("x-user-id");

  const hasFilters =
    !!direction || sort === "popular" || minConfidence > 0 || following;

  // Only the simple (cacheable) anonymous case uses Redis.
  const cacheKey = `feed:${official}:${symbol || "all"}:${cursor || "start"}:${limit}`;
  if (!userId && !hasFilters) {
    const cached = await getCache<SignalData[]>(cacheKey);
    if (cached) return NextResponse.json({ data: cached, nextCursor: null });
  }

  const where: Record<string, unknown> = {};
  if (symbol) where.symbol = symbol.toUpperCase();
  if (official) where.author = { role: { in: ["ADMIN", "ANALYST"] } };

  const scenarioConditions: Record<string, unknown> = {};
  if (direction) scenarioConditions.direction = direction;
  if (minConfidence > 0) scenarioConditions.confidence = { gte: minConfidence };
  if (Object.keys(scenarioConditions).length > 0) {
    where.scenarios = { some: scenarioConditions };
  }

  if (following && userId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    where.authorId = { in: follows.map((f) => f.followingId) };
  }

  const orderBy =
    sort === "popular"
      ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
      : { createdAt: "desc" as const };

  const signals = await prisma.signal.findMany({
    where,
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy,
    select: SELECT_SIGNAL,
  });

  let likedIds = new Set<string>();
  if (userId) {
    const likes = await prisma.like.findMany({
      where: { userId, signalId: { in: signals.map((s) => s.id) } },
      select: { signalId: true },
    });
    likedIds = new Set(likes.map((l) => l.signalId!));
  }

  const hasNext = signals.length > limit;
  const data = signals.slice(0, limit).map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    analyzedAt: s.analyzedAt?.toISOString() ?? null,
    author: { ...s.author, createdAt: s.author.createdAt.toISOString() },
    scenarios: s.scenarios.map((sc) => ({
      ...sc,
      createdAt: sc.createdAt.toISOString(),
      takeProfits: sc.takeProfits as number[],
    })),
    isLiked: likedIds.has(s.id),
  }));

  const nextCursor = hasNext ? data[data.length - 1].id : null;
  if (!userId && !hasFilters) await setCache(cacheKey, data, CACHE_TTL.SIGNALS_FEED);

  return NextResponse.json({ data, nextCursor });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const username = req.headers.get("x-user-username");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(req, "signal-create", 10, 3600);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  try {
    const body = await req.json();
    const parsed = signalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { symbol, rawText, aiSummary, currentMarketPrice, source, scenarios } = parsed.data;

    const signal = await prisma.signal.create({
      data: {
        symbol: symbol.toUpperCase(),
        rawText,
        aiSummary,
        currentMarketPrice,
        source,
        authorId: userId,
        analyzedAt: new Date(),
        scenarios: {
          create: scenarios.map((sc) => ({
            direction: sc.direction,
            entryPoint: sc.entryPoint,
            entryType: sc.entryType,
            takeProfits: sc.takeProfits,
            stopLoss: sc.stopLoss,
            invalidation: sc.invalidation,
            confidence: sc.confidence,
            reasoning: sc.reasoning,
            raw: sc.raw,
          })),
        },
      },
      select: SELECT_SIGNAL,
    });

    const payload = {
      ...signal,
      createdAt: signal.createdAt.toISOString(),
      analyzedAt: signal.analyzedAt?.toISOString() ?? null,
      author: { ...signal.author, createdAt: signal.author.createdAt.toISOString() },
      scenarios: signal.scenarios.map((sc) => ({
        ...sc,
        createdAt: sc.createdAt.toISOString(),
        takeProfits: sc.takeProfits as number[],
      })),
      isLiked: false,
    };

    await Promise.all([
      publishMqttEvent(MQTT_TOPICS.SIGNALS_GLOBAL, { type: "NEW_SIGNAL", payload }),
      publishMqttEvent(MQTT_TOPICS.SIGNALS_SYMBOL(symbol), { type: "NEW_SIGNAL", payload }),
      invalidateCache(`feed:false:all:start:20`, `feed:true:all:start:20`),
    ]);

    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create signal" }, { status: 500 });
  }
}
