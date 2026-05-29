import { render, screen } from "@testing-library/react";
import TrendsPhaseCard from "@/components/trends/TrendsPhaseCard";

beforeEach(() => {
  window.localStorage.clear();
  // Anchor "today" so the protocol-day math is deterministic.
  jest.useFakeTimers().setSystemTime(new Date("2026-01-08T00:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

function seedOnboarding(completedAt = "2026-01-01T08:00:00.000Z") {
  window.localStorage.setItem(
    "ir-onboarding-v1",
    JSON.stringify({
      lens: "medical",
      quizAnswers: [],
      quizYesCount: 2,
      tier: "keto",
      tgHdlRatio: null,
      whr: null,
      completedAt,
    })
  );
}

describe("TrendsPhaseCard", () => {
  it("renders nothing when onboarding is missing", () => {
    const { container } = render(<TrendsPhaseCard />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Day X of 90 + phase 1 in the adaptation window", () => {
    seedOnboarding("2026-01-01T08:00:00.000Z");
    render(<TrendsPhaseCard />);
    // Day 8 — phase 1 ends at day 14.
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/от 90/)).toBeInTheDocument();
    expect(screen.getByText(/Фаза 1/)).toBeInTheDocument();
    expect(screen.getByText(/Адаптация/)).toBeInTheDocument();
  });

  it("shows next milestone proximity", () => {
    seedOnboarding("2026-01-01T08:00:00.000Z");
    render(<TrendsPhaseCard />);
    // The line is split across a <strong> tag, so match by combining the
    // text content of the surrounding paragraph rather than a single node.
    expect(screen.getByText(/Следващ etap:/)).toBeInTheDocument();
    expect(screen.getByText(/ден 14/)).toBeInTheDocument();
    // 8 → 14 = 6 days away
    expect(screen.getByText(/след 6 дни/)).toBeInTheDocument();
  });

  it("celebrates milestone days", () => {
    seedOnboarding("2025-12-25T08:00:00.000Z"); // 2026-01-08 = day 15? recompute
    // Actually want day 14 on 2026-01-08 → start 2025-12-26
    seedOnboarding("2025-12-26T08:00:00.000Z");
    render(<TrendsPhaseCard />);
    expect(screen.getByText(/Днес е ден 14.*milestone/i)).toBeInTheDocument();
  });

  it("crosses into phase 2 on day 15", () => {
    // 2026-01-08 should be day 15 from a 2025-12-25 start
    seedOnboarding("2025-12-25T08:00:00.000Z");
    render(<TrendsPhaseCard />);
    expect(screen.getByText(/Фаза 2/)).toBeInTheDocument();
    expect(screen.getByText(/Стесняване/)).toBeInTheDocument();
  });
});
