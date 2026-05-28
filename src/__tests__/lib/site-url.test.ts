import { siteUrl } from "@/lib/site-url";

const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;
const ORIGINAL_AUTH = process.env.NEXTAUTH_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXTAUTH_URL;
});

afterAll(() => {
  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;
  if (ORIGINAL_AUTH === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = ORIGINAL_AUTH;
});

describe("siteUrl resolution order", () => {
  it("NEXT_PUBLIC_SITE_URL wins when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://insulin-reset.bg";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    expect(siteUrl()).toBe("https://insulin-reset.bg");
  });

  it("falls back to NEXTAUTH_URL when public is unset", () => {
    process.env.NEXTAUTH_URL = "http://localhost:3001";
    expect(siteUrl()).toBe("http://localhost:3001");
  });

  it("falls back to vercel.app default when both are unset", () => {
    expect(siteUrl()).toBe("https://insulin-resistance-app.vercel.app");
  });
});

describe("siteUrl normalization", () => {
  it("strips a single trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://insulin-reset.bg/";
    expect(siteUrl()).toBe("https://insulin-reset.bg");
  });

  it("strips multiple trailing slashes (defensive)", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://insulin-reset.bg///";
    expect(siteUrl()).toBe("https://insulin-reset.bg");
  });

  it("leaves a path-less URL untouched", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://insulin-reset.bg";
    expect(siteUrl()).toBe("https://insulin-reset.bg");
  });

  it("safe for callers doing `${siteUrl()}/path`", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://insulin-reset.bg/";
    expect(`${siteUrl()}/sitemap.xml`).toBe(
      "https://insulin-reset.bg/sitemap.xml"
    );
  });
});
