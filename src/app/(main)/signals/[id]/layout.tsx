import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const signal = await prisma.signal.findUnique({
      where: { id },
      select: { symbol: true, aiSummary: true, rawText: true, author: { select: { username: true } } },
    });
    if (!signal) {
      return { title: "Signal not found — SignalPro" };
    }
    const desc = (signal.aiSummary || signal.rawText || "").slice(0, 160);
    const title = `${signal.symbol} signal by ${signal.author.username} — SignalPro`;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc, type: "article" },
      twitter: { card: "summary", title, description: desc },
    };
  } catch {
    return { title: "Signal — SignalPro" };
  }
}

export default function SignalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
