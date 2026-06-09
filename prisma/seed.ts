import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@signal.pro";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
  const adminUsername = process.env.ADMIN_USERNAME || "signal_admin";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: "ADMIN",
      bio: "Official SignalPro analyst. Verified signals with expert analysis.",
      avatar: null,
    },
  });

  await prisma.signal.create({
    data: {
      symbol: "BTC",
      rawText: "Bitcoin is forming a strong ascending triangle on the 4H chart. Volume is increasing with each touch of resistance at $68,500. RSI divergence shows bullish momentum. Looking for a breakout above $68,500 with volume confirmation.",
      aiSummary: "BTC forming bullish ascending triangle near $68,500 resistance. Breakout expected with strong volume confirmation.",
      createdPrice: 67800,
      source: "Internal Analysis",
      authorId: admin.id,
      analyzedAt: new Date(),
      scenarios: {
        create: [{
          direction: "LONG",
          entryPoint: 67500,
          entryType: "LIMIT",
          takeProfits: [68500, 70000, 72500],
          stopLoss: 66000,
          invalidation: "Close below $66,000 on 4H",
          confidence: 82,
          reasoning: "Ascending triangle with increasing volume, RSI bullish divergence, and strong support at $67,000. Market structure remains bullish above $65,000.",
        }],
      },
    },
  });

  console.log("Admin and sample signal created:", admin.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
