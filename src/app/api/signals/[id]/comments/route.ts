import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";
import { publishMqttEvent, MQTT_TOPICS } from "@/lib/mqtt-server";
import { rateLimit } from "@/lib/rate-limit";
import { getServerT } from "@/lib/i18n-server";

const SELECT_COMMENT = {
  id: true,
  content: true,
  createdAt: true,
  parentId: true,
  author: { select: { id: true, username: true, avatar: true, role: true, createdAt: true, bio: true } },
  _count: { select: { likes: true } },
  replies: {
    where: { status: "ACTIVE" as const },
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      content: true,
      createdAt: true,
      parentId: true,
      author: { select: { id: true, username: true, avatar: true, role: true, createdAt: true, bio: true } },
      _count: { select: { likes: true } },
    },
  },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = getServerT(req);
  const { id: signalId } = await params;
  // Defense-in-depth: middleware already enforces auth, but double-check here.
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const comments = await prisma.comment.findMany({
    where: { signalId, status: "ACTIVE", parentId: null },
    orderBy: { createdAt: "asc" },
    select: SELECT_COMMENT,
  });

  let likedIds = new Set<string>();
  if (userId) {
    const allIds = comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]);
    const likes = await prisma.like.findMany({
      where: { userId, commentId: { in: allIds } },
      select: { commentId: true },
    });
    likedIds = new Set(likes.map((l) => l.commentId!));
  }

  const data = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    author: { ...c.author, createdAt: c.author.createdAt.toISOString() },
    isLiked: likedIds.has(c.id),
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      author: { ...r.author, createdAt: r.author.createdAt.toISOString() },
      isLiked: likedIds.has(r.id),
    })),
  }));

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = getServerT(req);
  const { id: signalId } = await params;
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const rl = await rateLimit(req, "comment", 20, 60);
  if (!rl.success) return NextResponse.json({ error: t("too_many_requests") }, { status: 429 });

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("invalid_input") }, { status: 400 });

  const { content, parentId } = parsed.data;

  const signal = await prisma.signal.findUnique({ where: { id: signalId }, select: { id: true, authorId: true } });
  if (!signal) return NextResponse.json({ error: t("signal_not_found") }, { status: 404 });

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { signalId: true, parentId: true, status: true },
    });
    if (!parent || parent.signalId !== signalId || parent.status !== "ACTIVE" || parent.parentId !== null) {
      return NextResponse.json({ error: t("invalid_parent_comment") }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: { signalId, authorId: userId, content, parentId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      parentId: true,
      author: { select: { id: true, username: true, avatar: true, role: true, createdAt: true, bio: true } },
      _count: { select: { likes: true } },
    },
  });

  const data = {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    author: { ...comment.author, createdAt: comment.author.createdAt.toISOString() },
    isLiked: false,
    replies: [],
  };

  await publishMqttEvent(MQTT_TOPICS.COMMENTS(signalId), { type: "NEW_COMMENT", payload: data });

  if (signal.authorId !== userId) {
    await prisma.notification.create({
      data: {
        userId: signal.authorId,
        type: "COMMENT",
        payload: { signalId, commentId: comment.id, username: comment.author.username },
      },
    });
    await publishMqttEvent(MQTT_TOPICS.NOTIFICATIONS(signal.authorId), {
      type: "NEW_NOTIFICATION",
      payload: { type: "COMMENT", signalId, username: comment.author.username },
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}
