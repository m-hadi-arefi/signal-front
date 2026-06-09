import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogging } from "@/lib/logger-middleware";
import { getServerT } from "@/lib/i18n-server";

export const POST = withLogging(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const t = getServerT(req);
    const { id: signalId } = await params;
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const signal = await prisma.signal.findUnique({ where: { id: signalId }, select: { id: true } });
    if (!signal) return NextResponse.json({ error: t("signal_not_found") }, { status: 404 });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_signalId: { userId, signalId } },
    });

    let bookmarked: boolean;
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } }).catch(() => {});
      bookmarked = false;
    } else {
      try {
        await prisma.bookmark.create({ data: { userId, signalId } });
        bookmarked = true;
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
        bookmarked = true;
      }
    }

    return NextResponse.json({ bookmarked });
  }
);
