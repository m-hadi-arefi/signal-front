import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCache, setCache, CACHE_TTL, invalidateCache } from "@/lib/redis";
import { signalUpdateSchema } from "@/lib/validations";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { withLogging } from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");

  const cacheKey = `signal:${id}`;
  const cached = await getCache(cacheKey);
  if (cached && !userId) return NextResponse.json({ data: cached });

  const signal = await prisma.signal.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatar: true, bio: true, role: true, createdAt: true } },
      scenarios: { include: { result: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!signal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let isLiked = false;
  if (userId) {
    const like = await prisma.like.findUnique({ where: { userId_signalId: { userId, signalId: id } } });
    isLiked = !!like;
  }

  const data = {
    ...signal,
    createdAt: signal.createdAt.toISOString(),
    analyzedAt: signal.analyzedAt?.toISOString() ?? null,
    updatedAt: signal.updatedAt.toISOString(),
    author: { ...signal.author, createdAt: signal.author.createdAt.toISOString() },
    scenarios: signal.scenarios.map((sc) => ({
      ...sc,
      createdAt: sc.createdAt.toISOString(),
      updatedAt: sc.updatedAt.toISOString(),
      takeProfits: sc.takeProfits as number[],
    })),
    isLiked,
  };

  if (!userId) await setCache(cacheKey, data, CACHE_TTL.SIGNAL_DETAIL);
  return NextResponse.json({ data });
}

export const PATCH = withLogging(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const signal = await prisma.signal.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!signal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (signal.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = signalUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { rawText, aiSummary } = parsed.data;
    const updated = await prisma.signal.update({
      where: { id },
      data: {
        ...(rawText !== undefined ? { rawText } : {}),
        ...(aiSummary !== undefined ? { aiSummary } : {}),
      },
      select: { id: true, rawText: true, aiSummary: true },
    });

    await invalidateCache(`signal:${id}`);
    await publishMqttEvent(MQTT_TOPICS.SIGNAL_DETAIL(id), {
      type: "SIGNAL_UPDATED",
      payload: updated,
    });

    return NextResponse.json({ data: updated });
  }
);

export const DELETE = withLogging(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const signal = await prisma.signal.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!signal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (signal.authorId !== userId && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.signal.delete({ where: { id } });
    await invalidateCache(`signal:${id}`, "feed:false:all:start:20", "feed:true:all:start:20");
    await publishMqttEvent(MQTT_TOPICS.SIGNALS_GLOBAL, {
      type: "SIGNAL_DELETED",
      payload: { id },
    });

    return NextResponse.json({ success: true });
  }
);
