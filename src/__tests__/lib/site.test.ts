// SEO single source of truth (src/lib/site.ts): origin, default copy and the
// per-page metadata helpers. The origin is resolved at module load, so each
// group re-imports the module in isolation with a controlled env.

const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;
const ORIGINAL_AUTH = process.env.NEXTAUTH_URL;

type SiteModule = typeof import("@/lib/site");

async function loadSite(publicUrl: string | undefined): Promise<SiteModule> {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXTAUTH_URL;
  if (publicUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = publicUrl;
  let mod: SiteModule | undefined;
  await jest.isolateModulesAsync(async () => {
    mod = await import("@/lib/site");
  });
  return mod!;
}

afterAll(() => {
  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;
  if (ORIGINAL_AUTH === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = ORIGINAL_AUTH;
});

describe("SITE_URL + absoluteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL without a trailing slash", async () => {
    const site = await loadSite("https://insulin-reset.bg/");
    expect(site.SITE_URL).toBe("https://insulin-reset.bg");
  });

  it("absoluteUrl joins a leading-slash path", async () => {
    const site = await loadSite("https://insulin-reset.bg");
    expect(site.absoluteUrl("/foods")).toBe("https://insulin-reset.bg/foods");
  });

  it("absoluteUrl tolerates a path without a leading slash", async () => {
    const site = await loadSite("https://insulin-reset.bg");
    expect(site.absoluteUrl("foods")).toBe("https://insulin-reset.bg/foods");
  });

  it("absoluteUrl defaults to the site root", async () => {
    const site = await loadSite("https://insulin-reset.bg");
    expect(site.absoluteUrl()).toBe("https://insulin-reset.bg/");
  });
});

describe("default SEO copy", () => {
  let site: SiteModule;
  beforeAll(async () => {
    site = await loadSite("https://insulin-reset.bg");
  });

  it("title carries the lay keyword and fits a SERP title", () => {
    expect(site.SITE_TITLE.toLowerCase()).toContain("инсулинова резистентност");
    expect(site.SITE_TITLE.length).toBeLessThanOrEqual(65);
  });

  it("description carries the lay keyword and fits a SERP snippet", () => {
    expect(site.SITE_DESCRIPTION.toLowerCase()).toContain("инсулинова");
    expect(site.SITE_DESCRIPTION.length).toBeGreaterThanOrEqual(70);
    expect(site.SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it("OG image is the static share card", () => {
    expect(site.OG_IMAGE).toMatchObject({ url: "/og-image.png", width: 1200, height: 630 });
    expect(site.OG_IMAGE.alt.length).toBeGreaterThan(0);
  });
});

describe("pageMetadata (public, indexable page)", () => {
  let meta: import("next").Metadata;
  beforeAll(async () => {
    const site = await loadSite("https://insulin-reset.bg");
    meta = site.pageMetadata({
      title: "Храни при инсулинова резистентност",
      description: "Гликемичен товар и макроси.",
      path: "/foods",
    });
  });

  it("sets the canonical to the page path (resolved against metadataBase)", () => {
    expect(meta.alternates?.canonical).toBe("/foods");
  });

  it("explicitly allows indexing", () => {
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("passes title + description through", () => {
    expect(meta.title).toBe("Храни при инсулинова резистентност");
    expect(meta.description).toBe("Гликемичен товар и макроси.");
  });

  it("gives Open Graph the page url + description (not the root's)", () => {
    const og = meta.openGraph as { url?: string; description?: string; siteName?: string };
    expect(og.url).toBe("/foods");
    expect(og.description).toBe("Гликемичен товар и макроси.");
    expect(og.siteName).toBe("InsulinReset");
  });
});

describe("privateMetadata (user-data pages)", () => {
  let site: SiteModule;
  beforeAll(async () => {
    site = await loadSite("https://insulin-reset.bg");
  });

  it("marks the page noindex but lets crawlers follow links", () => {
    expect(site.privateMetadata("Дневен план").robots).toEqual({ index: false, follow: true });
  });

  it("keeps the title when given", () => {
    expect(site.privateMetadata("Дневен план").title).toBe("Дневен план");
  });

  it("omits the title key when not given (falls back to the layout default)", () => {
    expect("title" in site.privateMetadata()).toBe(false);
  });
});
