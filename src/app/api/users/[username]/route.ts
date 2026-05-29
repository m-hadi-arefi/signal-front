import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache, setCache, CACHE_TTL } from "@/lib/redis";

interface CachedProfile {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
  _count: { signals: number; likes: number; followers: number; following: number };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const viewerId = req.headers.get("x-user-id");
  const cacheKey = `profile:${username}`;
  let data = await getCache<CachedProfile>(cacheKey);

  if (!data) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: { select: { signals: true, likes: true, followers: true, following: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    data = { ...user, createdAt: user.createdAt.toISOString() };
    await setCache(cacheKey, data, CACHE_TTL.USER_PROFILE);
  }

  let isFollowing = false;
  if (viewerId && viewerId !== data.id) {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: data.id } },
    });
    isFollowing = !!f;
  }

  return NextResponse.json({ data: { ...data, isFollowing, isSelf: viewerId === data.id } });
}
