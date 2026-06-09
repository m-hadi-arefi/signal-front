import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const t = getServerT(req);
  if (!req.headers.get("x-user-id")) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ error: t("user_not_found") }, { status: 404 });

  const signals = await prisma.signal.findMany({
    where: { authorId: user.id },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
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
    },
  });

  const hasNext = signals.length > limit;
  const data = signals.slice(0, limit).map((s) => ({
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
    isLiked: false,
  }));

  return NextResponse.json({ data, nextCursor: hasNext ? data[data.length - 1].id : null });
}
