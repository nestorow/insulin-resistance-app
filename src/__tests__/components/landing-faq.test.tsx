// Landing FAQ must be server-rendered: the answers have to be in the HTML for
// crawlers (native <details>), and the same Q&A pairs go out as FAQPage JSON-LD.

import { render, screen } from "@testing-library/react";
import LandingFaq from "@/components/landing/LandingFaq";
import { LANDING_FAQ } from "@/data/landing-faq";

describe("LandingFaq", () => {
  it("renders every answer in the HTML without a click", () => {
    render(<LandingFaq />);
    for (const item of LANDING_FAQ) {
      expect(screen.getByText(item.q)).toBeInTheDocument();
      expect(screen.getByText(item.a)).toBeInTheDocument();
    }
  });

  it("uses native <details> so the answers stay collapsed but crawlable", () => {
    const { container } = render(<LandingFaq />);
    const details = container.querySelectorAll("details");
    expect(details.length).toBe(LANDING_FAQ.length);
    for (const d of details) expect(d.hasAttribute("open")).toBe(false);
  });

  it("emits FAQPage structured data mirroring the visible Q&A", () => {
    const { container } = render(<LandingFaq />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const schema = JSON.parse(script!.textContent || "{}");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(LANDING_FAQ.length);
    expect(schema.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: LANDING_FAQ[0].q,
      acceptedAnswer: { "@type": "Answer", text: LANDING_FAQ[0].a },
    });
  });

  it("answers the lay search queries (what IR is, how it is measured)", () => {
    const questions = LANDING_FAQ.map((i) => i.q.toLowerCase());
    expect(questions.some((q) => q.includes("какво е инсулинова резистентност"))).toBe(true);
    const text = LANDING_FAQ.map((i) => i.a).join(" ");
    expect(text).toContain("HOMA-IR");
    // Bulgarian definite forms: „инсулинът/инсулина на гладно“.
    expect(text.toLowerCase()).toMatch(/инсулин(ът|а)? на гладно/);
  });
});
