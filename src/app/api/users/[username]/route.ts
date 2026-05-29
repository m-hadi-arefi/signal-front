import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache, setCache, CACHE_TTL } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const cacheKey = `profile:${username}`;
  const cached = await getCache(cacheKey);
  if (cached) return NextResponse.json({ data: cached });

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
      role: true,
      createdAt: true,
      _count: { select: { signals: true, likes: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data = { ...user, createdAt: user.createdAt.toISOString() };
  await setCache(cacheKey, data, CACHE_TTL.USER_PROFILE);
  return NextResponse.json({ data });
}
