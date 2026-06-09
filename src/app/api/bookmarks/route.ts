import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";

const SELECT_SIGNAL = {
  id: true,
  symbol: true,
  rawText: true,
  aiSummary: true,
  latestPrice: true,
  createdPrice: true,
  active: true,
  activeExternalScenarioId: true,
  source: true,
  status: true,
  fromService: true,
  createdAt: true,
  analyzedAt: true,
  author: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
  scenarios: {
    select: {
      id: true,
      externalId: true,
      direction: true,
      entryPoint: true,
      entryType: true,
      takeProfits: true,
      stopLoss: true,
      invalidation: true,
      confidence: true,
      reasoning: true,
      status: true,
      active: true,
      expiresAt: true,
      raw: true,
      createdAt: true,
      performance: true,
    },
  },
  _count: { select: { comments: true, likes: true } },
};

export async function GET(req: NextRequest) {
  const t = getServerT(req);
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, signal: { select: SELECT_SIGNAL } },
  });

  const hasNext = bookmarks.length > limit;
  const page = bookmarks.slice(0, limit);

  const signalIds = page.map((b) => b.signal.id);
  const likes = await prisma.like.findMany({
    where: { userId, signalId: { in: signalIds } },
    select: { signalId: true },
  });
  const likedIds = new Set(likes.map((l) => l.signalId!));

  const data = page.map((b) => {
    const s = b.signal;
    return {
      ...s,
      createdAt: s.createdAt.toISOString(),
      analyzedAt: s.analyzedAt?.toISOString() ?? null,
      author: { ...s.author, createdAt: s.author.createdAt.toISOString() },
      scenarios: s.scenarios.map((sc) => ({
        ...sc,
        createdAt: sc.createdAt.toISOString(),
        expiresAt: sc.expiresAt?.toISOString() ?? null,
        takeProfits: sc.takeProfits as number[],
        performance: sc.performance
          ? {
              ...sc.performance,
              activationTime: sc.performance.activationTime?.toISOString() ?? null,
              stopLossHitAt: sc.performance.stopLossHitAt?.toISOString() ?? null,
              updatedAt: sc.performance.updatedAt.toISOString(),
            }
          : null,
      })),
      isLiked: likedIds.has(s.id),
      isBookmarked: true,
    };
  });

  const nextCursor = hasNext ? page[page.length - 1].id : null;
  return NextResponse.json({ data, nextCursor });
}
