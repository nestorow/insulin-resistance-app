import { render, screen } from "@testing-library/react";
import TrendsInsights from "@/components/trends/TrendsInsights";
import type { TrendInsight } from "@/lib/trend-insights";

function ins(over: Partial<TrendInsight>): TrendInsight {
  return {
    id: "x",
    kind: "observation",
    title_bg: "x",
    ...over,
  };
}

describe("TrendsInsights", () => {
  it("renders nothing when the list is empty", () => {
    const { container } = render(<TrendsInsights insights={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title + optional detail per insight", () => {
    render(
      <TrendsInsights
        insights={[
          ins({
            id: "a",
            title_bg: "HOMA-IR падна с 20%.",
            detail_bg: "От 4.0 до 3.2.",
            kind: "improvement",
          }),
        ]}
      />
    );
    expect(screen.getByText(/HOMA-IR падна с 20%/)).toBeInTheDocument();
    expect(screen.getByText(/От 4\.0 до 3\.2/)).toBeInTheDocument();
  });

  it("omits the detail paragraph when not provided", () => {
    const { container } = render(
      <TrendsInsights insights={[ins({ id: "a", title_bg: "Only title" })]} />
    );
    expect(container.querySelectorAll("p").length).toBe(1); // just the title
  });

  it("kind→color coding — improvement is teal", () => {
    render(
      <TrendsInsights insights={[ins({ kind: "improvement", id: "imp" })]} />
    );
    const wrapper = screen.getByText("x").closest("div")?.parentElement;
    expect(wrapper?.className).toMatch(/teal/);
  });

  it("kind→color coding — concern is rose", () => {
    render(
      <TrendsInsights insights={[ins({ kind: "concern", id: "c" })]} />
    );
    const wrapper = screen.getByText("x").closest("div")?.parentElement;
    expect(wrapper?.className).toMatch(/rose/);
  });

  it("kind→color coding — correlation is amber", () => {
    render(
      <TrendsInsights insights={[ins({ kind: "correlation", id: "cor" })]} />
    );
    const wrapper = screen.getByText("x").closest("div")?.parentElement;
    expect(wrapper?.className).toMatch(/amber/);
  });

  it("renders all entries in list order with stable React keys", () => {
    const list: TrendInsight[] = [
      ins({ id: "a", title_bg: "First" }),
      ins({ id: "b", title_bg: "Second" }),
      ins({ id: "c", title_bg: "Third" }),
    ];
    render(<TrendsInsights insights={list} />);
    const titles = screen.getAllByText(/First|Second|Third/);
    expect(titles.map((n) => n.textContent)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });
});
