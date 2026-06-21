import { render, screen } from "@testing-library/react";
import TrendsHero from "@/components/trends/TrendsHero";
import type { TrendsSummary } from "@/lib/trends";

function summary(over: Partial<TrendsSummary> = {}): TrendsSummary {
  return {
    windowStart: "2026-01-01",
    windowEnd: "2026-03-31",
    latest: {},
    delta: {},
    activeDays: 0,
    ...over,
  };
}

describe("TrendsHero", () => {
  it("renders em-dashes for every empty metric", () => {
    render(<TrendsHero summary={summary()} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("shows the latest HOMA-IR value formatted to 1 decimal", () => {
    render(
      <TrendsHero
        summary={summary({
          latest: { homaIr: { value: 3.82, date: "2026-03-01" } },
        })}
      />
    );
    expect(screen.getByText("3.8")).toBeInTheDocument();
  });

  it("renders HbA1c with the percent suffix", () => {
    render(
      <TrendsHero
        summary={summary({
          latest: { hba1c: { value: 5.6, date: "2026-03-01" } },
        })}
      />
    );
    expect(screen.getByText("5.6%")).toBeInTheDocument();
  });

  it("renders CGM TIR with percent suffix and the date", () => {
    render(
      <TrendsHero
        summary={summary({
          latest: { cgmTir: { value: 75, date: "2026-03-15" } },
        })}
      />
    );
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText(/последен 15\.03/)).toBeInTheDocument();
  });

  it("shows HOMA-IR delta as a percentage with sign", () => {
    render(
      <TrendsHero
        summary={summary({
          latest: { homaIr: { value: 3.2, date: "2026-03-01" } },
          delta: { homaIr: { from: 4.0, to: 3.2, pctChange: -20 } },
        })}
      />
    );
    expect(screen.getByText(/-20% спрямо 01\.03/)).toBeInTheDocument();
  });

  it("shows weight delta in kg with sign and unit", () => {
    render(
      <TrendsHero
        summary={summary({
          latest: { weight: { value: 78, date: "2026-03-01" } },
          delta: { weight: { from: 82, to: 78, deltaKg: -4 } },
        })}
      />
    );
    expect(screen.getByText(/-4 kg за 90 дни/)).toBeInTheDocument();
  });
});
