import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const t = getServerT(req);
  if (!req.headers.get("x-user-id")) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  const { username } = await params;
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: t("user_not_found") }, { status: 404 });

  const follows = await prisma.follow.findMany({
    where: { followerId: target.id },
    orderBy: { createdAt: "desc" },
    select: {
      following: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
    },
  });

  const data = follows.map((f) => ({ ...f.following, createdAt: f.following.createdAt.toISOString() }));
  return NextResponse.json({ data });
}
