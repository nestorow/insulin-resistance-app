import { render, screen } from "@testing-library/react";
import DailyPlanModule from "@/components/plan/DailyPlanModule";
import type { OnboardingResult } from "@/lib/onboarding";

// Helper: seed localStorage with an onboarding result that places the user
// at a known day and tier. The component derives `dayNumber` from
// `completedAt`, so we backdate it to land on the chosen day.
function seedOnboarding(opts: {
  daysAgo: number;
  yesCount: number;
  lens?: OnboardingResult["lens"];
}) {
  const completedAt = new Date(
    Date.now() - opts.daysAgo * 86_400_000
  ).toISOString();
  const result: OnboardingResult = {
    lens: opts.lens ?? "educational",
    quizAnswers: Array(8)
      .fill(false)
      .map((_, i) => i < opts.yesCount),
    quizYesCount: opts.yesCount,
    tier: opts.yesCount <= 0 ? "none" : opts.yesCount === 1 ? "moderate" : "keto",
    tgHdlRatio: null,
    whr: null,
    completedAt,
  };
  window.localStorage.setItem("ir-onboarding-v1", JSON.stringify(result));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("DailyPlanModule — day / phase derivation", () => {
  it("shows Day 1 / Phase 1 immediately after onboarding", () => {
    seedOnboarding({ daysAgo: 0, yesCount: 2 });
    render(<DailyPlanModule />);

    expect(screen.getByText(/Ден 1 \/ 90/)).toBeInTheDocument();
    expect(screen.getByText(/Фаза 1 · Адаптация/)).toBeInTheDocument();
  });

  it("shows Phase 2 (Стесняване) on day 20", () => {
    seedOnboarding({ daysAgo: 19, yesCount: 2 }); // dayNumber = 20
    render(<DailyPlanModule />);

    expect(screen.getByText(/Ден 20 \/ 90/)).toBeInTheDocument();
    expect(screen.getByText(/Фаза 2 · Стесняване/)).toBeInTheDocument();
  });

  it("shows Phase 4 (Закотвяне) on day 90", () => {
    seedOnboarding({ daysAgo: 89, yesCount: 2 }); // dayNumber = 90
    render(<DailyPlanModule />);

    expect(screen.getByText(/Ден 90 \/ 90/)).toBeInTheDocument();
    expect(screen.getByText(/Фаза 4 · Закотвяне/)).toBeInTheDocument();
  });

  it("falls back to Phase 1 view for anonymous (no onboarding)", () => {
    render(<DailyPlanModule />);
    // No "Day N / 90" pill without onboarding, but phase explainer still
    // shows phase 1 as the safe default.
    expect(screen.getByText(/Фаза 1 · Адаптация/)).toBeInTheDocument();
    expect(screen.queryByText(/Ден \d+ \/ 90/)).not.toBeInTheDocument();
    // Prompt to take the test instead.
    expect(screen.getByText(/Започни теста/)).toBeInTheDocument();
  });
});

describe("DailyPlanModule — progression unlocks", () => {
  it("phase-1 view hides day-15+ items (post-meal walk)", () => {
    seedOnboarding({ daysAgo: 0, yesCount: 2 });
    render(<DailyPlanModule />);
    // post-meal walk has availableFromDay: 15
    expect(
      screen.queryByText(/разходка след обяд/)
    ).not.toBeInTheDocument();
  });

  it("phase-2 view shows the day-15 items (post-meal walk + fermented)", () => {
    seedOnboarding({ daysAgo: 14, yesCount: 2 }); // dayNumber = 15
    render(<DailyPlanModule />);
    expect(screen.getByText(/разходка след обяд/)).toBeInTheDocument();
    expect(screen.getByText(/Ферментирала храна/)).toBeInTheDocument();
  });

  it("phase-1 dinner reads 12-hour window; phase-4 reads 18:6", () => {
    seedOnboarding({ daysAgo: 0, yesCount: 2 });
    const { unmount } = render(<DailyPlanModule />);
    expect(
      screen.getByText(/12-часов прозорец без храна за нощта/)
    ).toBeInTheDocument();
    unmount();

    window.localStorage.clear();
    seedOnboarding({ daysAgo: 80, yesCount: 2 }); // dayNumber = 81 → phase 4
    render(<DailyPlanModule />);
    expect(screen.getByText(/18-часов прозорец — 18:6/)).toBeInTheDocument();
  });
});

describe("DailyPlanModule — tier filtering", () => {
  it("keto tier sees the berry-only fruit rule", () => {
    seedOnboarding({ daysAgo: 0, yesCount: 3 }); // keto
    render(<DailyPlanModule />);
    expect(screen.getByText(/Плодове — само горски/)).toBeInTheDocument();
  });

  it("none tier does NOT see the sweets cap or fruit/grain rules", () => {
    seedOnboarding({ daysAgo: 0, yesCount: 0 }); // none
    render(<DailyPlanModule />);
    expect(screen.queryByText(/Плодове — само горски/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Максимум 1 сладко\/десерт/)
    ).not.toBeInTheDocument();
  });

  it("moderate tier sees the grains rule, not the keto fruit rule", () => {
    seedOnboarding({ daysAgo: 0, yesCount: 1 }); // moderate
    render(<DailyPlanModule />);
    expect(screen.getByText(/Зърнени — само пълнозърнести/)).toBeInTheDocument();
    expect(screen.queryByText(/Плодове — само горски/)).not.toBeInTheDocument();
  });
});

describe("DailyPlanModule — milestone banner", () => {
  it("renders milestone copy on day 7", () => {
    seedOnboarding({ daysAgo: 6, yesCount: 2 }); // dayNumber = 7
    render(<DailyPlanModule />);
    expect(screen.getByText(/Първа седмица/)).toBeInTheDocument();
  });

  it("no milestone banner on non-milestone days", () => {
    seedOnboarding({ daysAgo: 5, yesCount: 2 }); // dayNumber = 6
    render(<DailyPlanModule />);
    expect(screen.queryByText(/Първа седмица/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Един месец/)).not.toBeInTheDocument();
  });
});
