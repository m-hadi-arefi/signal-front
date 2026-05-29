import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache, setCache, CACHE_TTL } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");

  const cacheKey = `signal:${id}`;
  const cached = await getCache(cacheKey);
  if (cached && !userId) return NextResponse.json({ data: cached });

  const signal = await prisma.signal.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
      scenarios: { include: { result: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!signal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let isLiked = false;
  if (userId) {
    const like = await prisma.like.findUnique({ where: { userId_signalId: { userId, signalId: id } } });
    isLiked = !!like;
  }

  const data = {
    ...signal,
    createdAt: signal.createdAt.toISOString(),
    analyzedAt: signal.analyzedAt?.toISOString() ?? null,
    updatedAt: signal.updatedAt.toISOString(),
    author: { ...signal.author, createdAt: signal.author.createdAt.toISOString() },
    scenarios: signal.scenarios.map((sc) => ({
      ...sc,
      createdAt: sc.createdAt.toISOString(),
      updatedAt: sc.updatedAt.toISOString(),
      takeProfits: sc.takeProfits as number[],
    })),
    isLiked,
  };

  if (!userId) await setCache(cacheKey, data, CACHE_TTL.SIGNAL_DETAIL);
  return NextResponse.json({ data });
}
