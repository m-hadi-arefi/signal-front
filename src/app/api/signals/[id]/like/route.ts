import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { invalidateCache } from "@/lib/redis";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: signalId } = await params;
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.like.findUnique({
    where: { userId_signalId: { userId, signalId } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } }).catch(() => {});
    liked = false;
  } else {
    try {
      await prisma.like.create({ data: { userId, signalId } });
      liked = true;
    } catch (e: any) {
      // P2002: concurrent like — treat as already liked
      if (e?.code !== "P2002") throw e;
      liked = true;
    }
  }

  const count = await prisma.like.count({ where: { signalId } });

  await Promise.all([
    publishMqttEvent(MQTT_TOPICS.SIGNAL_DETAIL(signalId), { type: "LIKE_UPDATE", payload: { signalId, count, liked, userId } }),
    invalidateCache(`signal:${signalId}`),
  ]);

  return NextResponse.json({ liked, count });
}
