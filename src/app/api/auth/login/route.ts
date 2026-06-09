import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, createAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getServerT } from "@/lib/i18n-server";

export async function POST(req: NextRequest) {
  const t = getServerT(req);

  const rl = await rateLimit(req, "login", 10, 60);
  if (!rl.success) {
    return NextResponse.json({ error: t("too_many_requests") }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    // Return generic message — never leak which field failed for login
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalid_input") }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      logger.warn("auth_login_failed", { email });
      return NextResponse.json({ error: t("invalid_credentials") }, { status: 401 });
    }

    logger.info("auth_login", { userId: user.id, username: user.username });
    const token = await signToken({ sub: user.id, username: user.username, role: user.role });
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, avatar: user.avatar },
    });
    res.cookies.set(createAuthCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: t("login_failed") }, { status: 500 });
  }
}
