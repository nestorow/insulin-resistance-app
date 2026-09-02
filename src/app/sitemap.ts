import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Only publicly readable, indexable URLs belong here. The user-data modules
// (/plan, /journal, /markers, /trends, /settings), the onboarding funnel and
// the print view render an empty shell for crawlers and are noindex, so they
// are deliberately left out.
//
// lastModified is pinned per page instead of `new Date()` at build time: a
// timestamp that changes on every deploy is ignored by search engines. Bump
// CONTENT_UPDATED when the copy of the content pages changes substantively.
const CONTENT_UPDATED = new Date("2026-09-02");
const PRIVACY_UPDATED = new Date("2026-06-10"); // keep in sync with LAST_UPDATED in privacy/page.tsx
const TERMS_UPDATED = new Date("2026-05-28"); // keep in sync with LAST_UPDATED in terms/page.tsx

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/education"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/foods"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/exercise"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/fasting"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/supplements"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/cgm"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/privacy"), lastModified: PRIVACY_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: TERMS_UPDATED, changeFrequency: "yearly", priority: 0.3 },
  ];
}
