import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const signals = await prisma.signal.findMany({
    where: { authorId: user.id },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, symbol: true, rawText: true, aiSummary: true,
      currentMarketPrice: true, status: true, createdAt: true, analyzedAt: true,
      author: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
      scenarios: { select: { id: true, direction: true, confidence: true, entryPoint: true, stopLoss: true, takeProfits: true, entryType: true, reasoning: true, status: true, raw: true, invalidation: true, createdAt: true, result: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  const hasNext = signals.length > limit;
  const data = signals.slice(0, limit).map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    analyzedAt: s.analyzedAt?.toISOString() ?? null,
    author: { ...s.author, createdAt: s.author.createdAt.toISOString() },
    scenarios: s.scenarios.map((sc) => ({ ...sc, createdAt: sc.createdAt.toISOString(), takeProfits: sc.takeProfits as number[] })),
    isLiked: false,
  }));

  return NextResponse.json({ data, nextCursor: hasNext ? data[data.length - 1].id : null });
}
