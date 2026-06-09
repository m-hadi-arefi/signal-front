import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, createAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getServerT, zodIssueToMessage } from "@/lib/i18n-server";

export async function POST(req: NextRequest) {
  const t = getServerT(req);

  const rl = await rateLimit(req, "register", 5, 300);
  if (!rl.success) {
    return NextResponse.json({ error: t("too_many_requests") }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      // Translate the first Zod issue to a localized, user-safe message
      const msg = zodIssueToMessage(parsed.error.issues[0], t);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, username, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      const msg = existing.email === email ? t("email_taken") : t("username_taken");
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    });

    logger.info("auth_register", { userId: user.id, username: user.username });
    const token = await signToken({ sub: user.id, username: user.username, role: user.role });
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
    res.cookies.set(createAuthCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: t("registration_failed") }, { status: 500 });
  }
}
