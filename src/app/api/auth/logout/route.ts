import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  logger.info("auth_logout", { userId: req.headers.get("x-user-id") ?? undefined });
  const res = NextResponse.json({ success: true });
  res.cookies.set(clearAuthCookie());
  return res;
}
