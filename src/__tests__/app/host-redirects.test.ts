// next.config host redirects: the Vercel-issued *.vercel.app production
// alias must 308 to the apex so search engines see one origin. The redirect
// must NOT touch /api/ (Vercel cron + NextAuth callbacks hit the deployment
// host directly) or /_next/ assets.

import nextConfig from "../../../next.config";

type Redirect = {
  source: string;
  destination: string;
  permanent: boolean;
  has?: { type: string; value: string }[];
};

async function loadRedirects(): Promise<Redirect[]> {
  const fn = nextConfig.redirects;
  if (!fn) return [];
  return (await fn()) as Redirect[];
}

describe("legacy host redirects", () => {
  it("sends the vercel.app production alias to the apex, permanently", async () => {
    const redirects = await loadRedirects();
    const vercel = redirects.find((r) =>
      r.has?.some((h) => h.type === "host" && h.value === "insulin-resistance-app.vercel.app"),
    );
    expect(vercel).toBeDefined();
    expect(vercel!.destination).toBe("https://insulin-reset.bg/:path");
    expect(vercel!.permanent).toBe(true);
  });

  it("excludes /api/ and /_next/ from every host redirect", async () => {
    const redirects = await loadRedirects();
    const hostRedirects = redirects.filter((r) => r.has?.some((h) => h.type === "host"));
    expect(hostRedirects.length).toBeGreaterThan(0);
    for (const r of hostRedirects) {
      expect(r.source).toContain("(?!api/|_next/)");
    }
  });
});
