import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogging } from "@/lib/logger-middleware";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { invalidateCache } from "@/lib/redis";
import { getServerT } from "@/lib/i18n-server";

export const POST = withLogging(
  async (req: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
    const t = getServerT(req);
    const { username } = await params;
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) return NextResponse.json({ error: t("user_not_found") }, { status: 404 });
    if (target.id === userId) {
      return NextResponse.json({ error: t("cannot_follow_yourself") }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: target.id } },
    });

    let following: boolean;
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } }).catch(() => {});
      following = false;
    } else {
      try {
        await prisma.follow.create({ data: { followerId: userId, followingId: target.id } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
        // concurrent follow — already followed
      }
      following = true;
      await prisma.notification.create({
        data: { userId: target.id, type: "FOLLOW", payload: { followerId: userId } },
      });
      await publishMqttEvent(MQTT_TOPICS.NOTIFICATIONS(target.id), {
        type: "NEW_NOTIFICATION",
        payload: { type: "FOLLOW", followerId: userId },
      });
    }

    const followers = await prisma.follow.count({ where: { followingId: target.id } });
    await invalidateCache(`profile:${username}`);
    return NextResponse.json({ following, followers });
  }
);
