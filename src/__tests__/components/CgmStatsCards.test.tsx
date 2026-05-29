import { render, screen } from "@testing-library/react";
import CgmStatsCards from "@/components/cgm/CgmStatsCards";
import type { TirBreakdown, Variability } from "@/lib/cgm-stats";

function tir(over: Partial<TirBreakdown> = {}): TirBreakdown {
  return { veryLow: 0, low: 5, inRange: 80, high: 12, veryHigh: 3, tir: 80, ...over };
}
function vari(over: Partial<Variability> = {}): Variability {
  return { mean: 110, sd: 22, cv: 20, gmi: 5.9, count: 1200, ...over };
}

describe("CgmStatsCards", () => {
  it("renders the 4 stat values + units", () => {
    render(<CgmStatsCards tir={tir()} vari={vari()} />);
    expect(screen.getByText("80%")).toBeInTheDocument(); // TIR
    expect(screen.getByText("20%")).toBeInTheDocument(); // CV
    expect(screen.getByText("5.9%")).toBeInTheDocument(); // GMI
    expect(screen.getByText("1200")).toBeInTheDocument(); // count
  });

  it("renders the 5-zone TIR breakdown labels with percentages", () => {
    render(<CgmStatsCards tir={tir({ veryLow: 1, low: 4, inRange: 70, high: 15, veryHigh: 10, tir: 70 })} vari={vari()} />);
    expect(screen.getByText(/<54: 1%/)).toBeInTheDocument();
    expect(screen.getByText(/54–69: 4%/)).toBeInTheDocument();
    expect(screen.getByText(/70–180: 70%/)).toBeInTheDocument();
    expect(screen.getByText(/181–250: 15%/)).toBeInTheDocument();
    expect(screen.getByText(/>250: 10%/)).toBeInTheDocument();
  });

  // The accent class lives on the outer rounded-2xl wrapper, two levels
  // up from the title node (which sits inside its own inner <div>).
  function cardClass(titleNode: HTMLElement): string {
    // titleNode → inner div → card wrapper
    return titleNode.parentElement?.className ?? "";
  }

  it("color-codes TIR card green at ≥70%", () => {
    render(<CgmStatsCards tir={tir({ tir: 75 })} vari={vari()} />);
    expect(cardClass(screen.getByText("Time-in-Range"))).toMatch(/teal/);
  });

  it("color-codes TIR card rose when <50%", () => {
    render(<CgmStatsCards tir={tir({ tir: 35 })} vari={vari()} />);
    expect(cardClass(screen.getByText("Time-in-Range"))).toMatch(/rose/);
  });

  it("color-codes CV card amber in 36-45", () => {
    render(<CgmStatsCards tir={tir()} vari={vari({ cv: 40 })} />);
    expect(cardClass(screen.getByText("Вариативност"))).toMatch(/amber/);
  });
});
