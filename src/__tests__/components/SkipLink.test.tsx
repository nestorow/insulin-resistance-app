import { render, screen } from "@testing-library/react";
import SkipLink from "@/components/SkipLink";

describe("SkipLink", () => {
  it("renders an anchor that targets #main-content", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /Към съдържанието/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("starts visually hidden (sr-only)", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /Към съдържанието/i });
    expect(link.className).toMatch(/sr-only/);
  });

  it("gains visible classes on focus state", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /Към съдържанието/i });
    // Tailwind's focus: utilities show up in the className list even before
    // the element is actually focused — the browser applies them on focus.
    expect(link.className).toMatch(/focus:not-sr-only/);
    expect(link.className).toMatch(/focus:bg-teal/);
  });
});
