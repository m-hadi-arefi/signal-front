import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/feed", "/official", "/signals/", "/profile/"],
      disallow: ["/api/", "/login", "/register", "/bookmarks"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
