import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getServerT, zodIssueToMessage } from "@/lib/i18n-server";

export async function POST(req: NextRequest) {
  const t = getServerT(req);

  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const rl = await rateLimit(req, "change-password", 5, 300);
  if (!rl.success) {
    return NextResponse.json({ error: t("too_many_requests") }, { status: 429 });
  }

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const msg = zodIssueToMessage(parsed.error.issues[0], t);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: t("not_found") }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    logger.warn("auth_change_password_failed", { userId });
    return NextResponse.json({ error: t("password_incorrect") }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  logger.info("auth_change_password", { userId });
  return NextResponse.json({ success: true });
}
