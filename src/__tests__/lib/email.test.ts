import { sendDigest, _internal, type DigestData } from "@/lib/email";

const ORIGINAL_KEY = process.env.RESEND_API_KEY;
const ORIGINAL_FROM = process.env.DIGEST_FROM_EMAIL;

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.DIGEST_FROM_EMAIL;
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = ORIGINAL_KEY;
  if (ORIGINAL_FROM === undefined) delete process.env.DIGEST_FROM_EMAIL;
  else process.env.DIGEST_FROM_EMAIL = ORIGINAL_FROM;
});

const sample = (over: Partial<DigestData> = {}): DigestData => ({
  to: "u@example.com",
  name: "Нестор",
  currentStreak: 5,
  longestStreak: 10,
  totalXp: 120,
  level: 3,
  symptomEntriesLast7d: 4,
  newBadges: [],
  appUrl: "https://insulin-resistance-app.vercel.app",
  ...over,
});

describe("sendDigest — config gate", () => {
  it("skips silently when RESEND_API_KEY is missing", async () => {
    const r = await sendDigest(sample());
    expect(r.ok).toBe(false);
    expect(r).toMatchObject({ skipped: true, reason: "no-config" });
  });

  it("skips when only DIGEST_FROM_EMAIL is set", async () => {
    process.env.DIGEST_FROM_EMAIL = "x@example.com";
    const r = await sendDigest(sample());
    expect(r).toMatchObject({ skipped: true, reason: "no-config" });
  });
});

describe("digestSubject — chooses the most-interesting fact", () => {
  it("badge week wins when newBadges present", () => {
    const s = _internal.digestSubject(sample({ newBadges: ["7 дни в ред"] }));
    expect(s).toMatch(/Нова значка/);
  });

  it("plural form for multiple badges", () => {
    const s = _internal.digestSubject(
      sample({ newBadges: ["7 дни", "Първа кръв"] })
    );
    expect(s).toMatch(/Нови значки/);
  });

  it("streak week when streak ≥ 7 and no badges", () => {
    const s = _internal.digestSubject(sample({ currentStreak: 9 }));
    expect(s).toMatch(/9 дни в ред/);
  });

  it("default subject otherwise", () => {
    const s = _internal.digestSubject(sample({ currentStreak: 3 }));
    expect(s).toMatch(/седмичен преглед/);
  });
});

describe("digestHtml — content + escaping", () => {
  it("includes the recipient name in the greeting", () => {
    const html = _internal.digestHtml(sample({ name: "Нестор" }));
    expect(html).toContain("Здравей, Нестор");
  });

  it("falls back to bare 'Здравей' when name is null", () => {
    const html = _internal.digestHtml(sample({ name: null }));
    expect(html).toContain("Здравей 👋");
  });

  it("renders the streak + level + entry counts", () => {
    const html = _internal.digestHtml(
      sample({ currentStreak: 7, level: 4, symptomEntriesLast7d: 6 })
    );
    expect(html).toContain(">7</div>");
    expect(html).toContain(">4</div>");
    expect(html).toContain(">6</div>");
  });

  it("renders the badge row only when newBadges present", () => {
    const empty = _internal.digestHtml(sample({ newBadges: [] }));
    expect(empty).not.toContain("Нови значки");
    const withBadges = _internal.digestHtml(
      sample({ newBadges: ["7 дни в ред"] })
    );
    expect(withBadges).toContain("Нови значки");
  });

  it("escapes HTML in the name (defense-in-depth)", () => {
    const html = _internal.digestHtml(
      sample({ name: "<script>alert(1)</script>" })
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("links to the configured site URL", () => {
    const html = _internal.digestHtml(
      sample({ appUrl: "https://example.test" })
    );
    expect(html).toContain('href="https://example.test/plan"');
    expect(html).toContain('href="https://example.test/settings"');
  });
});

describe("escapeHtml", () => {
  it("converts <, >, &, \", ' to entities", () => {
    expect(_internal.escapeHtml("<a href=\"&'\">x</a>")).toBe(
      "&lt;a href=&quot;&amp;&#39;&quot;&gt;x&lt;/a&gt;"
    );
  });
});
