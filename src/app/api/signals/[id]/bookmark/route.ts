import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogging } from "@/lib/logger";

export const POST = withLogging(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: signalId } = await params;
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const signal = await prisma.signal.findUnique({ where: { id: signalId }, select: { id: true } });
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_signalId: { userId, signalId } },
    });

    let bookmarked: boolean;
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      bookmarked = false;
    } else {
      await prisma.bookmark.create({ data: { userId, signalId } });
      bookmarked = true;
    }

    return NextResponse.json({ bookmarked });
  }
);
