import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogging } from "@/lib/logger-middleware";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { getServerT } from "@/lib/i18n-server";

export const DELETE = withLogging(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const t = getServerT(req);
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");
    if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true, signalId: true },
    });
    if (!comment) return NextResponse.json({ error: t("comment_not_found") }, { status: 404 });

    if (comment.authorId !== userId && role !== "ADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await prisma.comment.update({ where: { id }, data: { status: "DELETED" } });

    await publishMqttEvent(MQTT_TOPICS.COMMENTS(comment.signalId), {
      type: "COMMENT_DELETED",
      payload: { commentId: id },
    });

    return NextResponse.json({ success: true });
  }
);
