// robots.txt + sitemap.xml route handlers — the crawl surface must list
// exactly the public content pages on the canonical apex origin, with
// pinned lastModified dates (a "now" timestamp is ignored by search engines).

process.env.NEXT_PUBLIC_SITE_URL = "https://insulin-reset.bg";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const ORIGIN = "https://insulin-reset.bg";

const PUBLIC_PATHS = [
  "/",
  "/education",
  "/foods",
  "/exercise",
  "/fasting",
  "/supplements",
  "/cgm",
  "/privacy",
  "/terms",
];

const PRIVATE_PATHS = ["/plan", "/journal", "/markers", "/trends", "/settings", "/onboarding", "/trends/print"];

describe("sitemap.xml", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists every public content page exactly once", () => {
    expect(urls.sort()).toEqual(PUBLIC_PATHS.map((p) => `${ORIGIN}${p}`).sort());
  });

  it("stays on the canonical apex origin", () => {
    for (const url of urls) expect(url.startsWith(`${ORIGIN}/`)).toBe(true);
  });

  it("leaves user-data and funnel pages out", () => {
    for (const p of PRIVATE_PATHS) expect(urls).not.toContain(`${ORIGIN}${p}`);
  });

  it("pins lastModified to a calendar date instead of build time", () => {
    for (const e of entries) {
      const d = e.lastModified as Date;
      expect(d).toBeInstanceOf(Date);
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
      expect(d.getUTCSeconds()).toBe(0);
      expect(d.getUTCMilliseconds()).toBe(0);
    }
  });
});

describe("robots.txt", () => {
  const out = robots();
  const rules = Array.isArray(out.rules) ? out.rules : [out.rules];
  const disallow = rules.flatMap((r) => {
    const d = r.disallow;
    return d === undefined ? [] : Array.isArray(d) ? d : [d];
  });

  it("blocks only the non-HTML API surface", () => {
    expect(disallow).toContain("/api/");
  });

  it("does not block noindex pages (crawlers must be able to read the meta robots)", () => {
    for (const p of PRIVATE_PATHS) expect(disallow).not.toContain(p);
  });

  it("points at the sitemap on the canonical origin", () => {
    expect(out.sitemap).toBe(`${ORIGIN}/sitemap.xml`);
  });
});
