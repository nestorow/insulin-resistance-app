import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Sitemap — lists the public read-only routes Google should crawl.
// Excludes /journal, /markers, /plan (user-data dependent) and /onboarding
// (entry-flow funnel, not content). API and auth routes also excluded.

const BASE_URL = siteUrl();

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/education", priority: 0.9, changeFrequency: "monthly" },
  { path: "/foods", priority: 0.8, changeFrequency: "monthly" },
  { path: "/exercise", priority: 0.7, changeFrequency: "monthly" },
  { path: "/fasting", priority: 0.7, changeFrequency: "monthly" },
  { path: "/supplements", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
