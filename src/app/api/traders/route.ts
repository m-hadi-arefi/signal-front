import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  const t = getServerT(req);
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

  // One aggregation query — no N+1
  // Group signals by author, count total and active (OPEN) ones,
  // then join user fields and follower count via a single raw query.
  const rows = await prisma.$queryRaw<
    {
      id: string;
      username: string;
      avatar: string | null;
      role: string;
      totalSignals: bigint;
      activeSignals: bigint;
      followerCount: bigint;
    }[]
  >`
    SELECT
      u.id,
      u.username,
      u.avatar,
      u.role,
      COUNT(s.id)                                              AS "totalSignals",
      COUNT(s.id) FILTER (WHERE s.status = 'OPEN')            AS "activeSignals",
      (SELECT COUNT(*) FROM "Follow" f WHERE f."followingId" = u.id) AS "followerCount"
    FROM "User" u
    INNER JOIN "Signal" s ON s."authorId" = u.id
    GROUP BY u.id, u.username, u.avatar, u.role
    ORDER BY "activeSignals" DESC, "totalSignals" DESC
    LIMIT ${limit}
  `;

  const data = rows.map((r, i) => ({
    rank: i + 1,
    id: r.id,
    username: r.username,
    avatar: r.avatar,
    role: r.role,
    totalSignals: Number(r.totalSignals),
    activeSignals: Number(r.activeSignals),
    followerCount: Number(r.followerCount),
  }));

  return NextResponse.json({ data });
}
