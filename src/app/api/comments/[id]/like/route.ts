import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { getServerT } from "@/lib/i18n-server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = getServerT(req);
  const { id: commentId } = await params;
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, signalId: true } });
  if (!comment) return NextResponse.json({ error: t("comment_not_found") }, { status: 404 });

  const existing = await prisma.like.findUnique({ where: { userId_commentId: { userId, commentId } } });
  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { userId, commentId } });
    liked = true;
  }

  const count = await prisma.like.count({ where: { commentId } });
  await publishMqttEvent(MQTT_TOPICS.COMMENTS(comment.signalId), {
    type: "COMMENT_LIKE_UPDATE",
    payload: { commentId, count, liked, userId },
  });

  return NextResponse.json({ liked, count });
}
