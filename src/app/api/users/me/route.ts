import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";
import { invalidateCache } from "@/lib/redis";
import { withLogging } from "@/lib/logger";

export const PATCH = withLogging(async (req: NextRequest) => {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { bio, avatar } = parsed.data;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(bio !== undefined ? { bio } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
    select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true, email: true },
  });

  await invalidateCache(`profile:${user.username}`);

  return NextResponse.json({ data: { ...user, createdAt: user.createdAt.toISOString() } });
});
