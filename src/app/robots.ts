import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// robots.txt — allow all crawlers on public content, block auth + API
// (no useful indexable content there, and prevents crawler noise on
// callback URLs). Sitemap pointer ensures discovery.

const BASE_URL = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/journal", "/markers", "/plan", "/onboarding"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
