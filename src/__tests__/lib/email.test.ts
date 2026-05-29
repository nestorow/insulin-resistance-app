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
    expect(html).toContain("Здравей");
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

describe("digestHtml — CGM block", () => {
  const withCgm = (tirPct: number, over: Partial<DigestData> = {}) =>
    sample({
      cgm: {
        tirPct,
        meanMgdl: 110,
        cvPct: 28,
        spikeCount: 3,
        daysCovered: 5,
      },
      ...over,
    });

  it("omits the CGM row when cgm is undefined", () => {
    const html = _internal.digestHtml(sample({ cgm: undefined }));
    expect(html).not.toContain("CGM ·");
    expect(html).not.toContain("TIR");
  });

  it("renders the CGM row when cgm is present", () => {
    const html = _internal.digestHtml(withCgm(72));
    expect(html).toContain("CGM · последните 7 дни");
    expect(html).toContain("TIR 72%");
    expect(html).toContain("CV 28%");
    expect(html).toContain("3 пика");
    expect(html).toContain("5/7 дни");
  });

  it("singular 'пик' when spikeCount is 1", () => {
    const html = _internal.digestHtml(
      sample({
        cgm: {
          tirPct: 80,
          meanMgdl: 105,
          cvPct: 25,
          spikeCount: 1,
          daysCovered: 7,
        },
      })
    );
    expect(html).toContain("1 пик ·");
  });

  it("color-codes background green when TIR ≥ 70", () => {
    const html = _internal.digestHtml(withCgm(75));
    expect(html).toContain("#E8F5F0");
  });

  it("color-codes background amber when 50 ≤ TIR < 70", () => {
    const html = _internal.digestHtml(withCgm(60));
    expect(html).toContain("#FEF3C7");
  });

  it("color-codes background rose when TIR < 50", () => {
    const html = _internal.digestHtml(withCgm(40));
    expect(html).toContain("#FFE4E6");
  });
});

describe("digestSubject — CGM-aware", () => {
  it("prefers TIR-framed subject when CGM TIR ≥ 80 and no badges", () => {
    const s = _internal.digestSubject(
      sample({
        currentStreak: 9,
        cgm: {
          tirPct: 84,
          meanMgdl: 105,
          cvPct: 24,
          spikeCount: 2,
          daysCovered: 7,
        },
      })
    );
    expect(s).toMatch(/TIR 84%/);
  });

  it("badges still win over CGM TIR", () => {
    const s = _internal.digestSubject(
      sample({
        newBadges: ["7 дни в ред"],
        cgm: {
          tirPct: 85,
          meanMgdl: 105,
          cvPct: 24,
          spikeCount: 2,
          daysCovered: 7,
        },
      })
    );
    expect(s).toMatch(/Нова значка/);
  });

  it("ignores CGM when TIR < 80", () => {
    const s = _internal.digestSubject(
      sample({
        currentStreak: 9,
        cgm: {
          tirPct: 65,
          meanMgdl: 130,
          cvPct: 38,
          spikeCount: 6,
          daysCovered: 7,
        },
      })
    );
    expect(s).toMatch(/9 дни в ред/);
  });
});

describe("escapeHtml", () => {
  it("converts <, >, &, \", ' to entities", () => {
    expect(_internal.escapeHtml("<a href=\"&'\">x</a>")).toBe(
      "&lt;a href=&quot;&amp;&#39;&quot;&gt;x&lt;/a&gt;"
    );
  });
});
