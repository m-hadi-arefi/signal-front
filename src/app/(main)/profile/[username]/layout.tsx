import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { username: true, bio: true, role: true },
    });
    if (!user) {
      return { title: "User not found — SignalPro" };
    }
    const title = `${user.username} — SignalPro`;
    const desc = user.bio || `View ${user.username}'s crypto signals and analysis on SignalPro.`;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc, type: "profile" },
      twitter: { card: "summary", title, description: desc },
    };
  } catch {
    return { title: "Profile — SignalPro" };
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
