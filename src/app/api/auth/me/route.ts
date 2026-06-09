import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  const t = getServerT(req);
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true, email: true },
  });

  if (!user) return NextResponse.json({ error: t("not_found") }, { status: 404 });
  return NextResponse.json({ data: { ...user, createdAt: user.createdAt.toISOString() } });
}
