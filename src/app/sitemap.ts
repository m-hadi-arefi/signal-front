import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/feed`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/official`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ];

  let signalRoutes: MetadataRoute.Sitemap = [];
  try {
    const signals = await prisma.signal.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { id: true, updatedAt: true },
    });
    signalRoutes = signals.map((s) => ({
      url: `${BASE}/signals/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable at build time — return static routes only.
  }

  return [...staticRoutes, ...signalRoutes];
}
