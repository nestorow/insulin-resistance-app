import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt — user-data pages (/plan, /journal, /markers, /trends, /settings,
// /onboarding, /trends/print) are kept out of the index with a meta robots
// noindex (privateMetadata in src/lib/site.ts) rather than a Disallow here,
// so crawlers can actually read the directive. Only the non-HTML API surface
// is blocked. The sitemap pointer ensures discovery.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
