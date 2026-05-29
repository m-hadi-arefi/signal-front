import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const follows = await prisma.follow.findMany({
    where: { followingId: target.id },
    orderBy: { createdAt: "desc" },
    select: {
      follower: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
    },
  });

  const data = follows.map((f) => ({ ...f.follower, createdAt: f.follower.createdAt.toISOString() }));
  return NextResponse.json({ data });
}
