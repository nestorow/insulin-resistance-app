import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

// Stub the App Router. The component calls router.replace("/plan") when an
// onboarding result already exists; for the happy-path tests we just need
// the call surface to exist.
const replaceMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

// framer-motion's AnimatePresence/motion render fine in jsdom by default;
// no mock required.

beforeEach(() => {
  window.localStorage.clear();
  replaceMock.mockReset();
});

describe("OnboardingFlow — step order", () => {
  it("starts on welcome and advances to quiz on Започни", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    expect(screen.getByText(/Добре дошъл/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Започни/ }));

    // The quiz step renders 8 question rows, each with a "Да" button.
    expect(
      await screen.findByRole("heading", { name: /Тест за инсулинова резистентност/ })
    ).toBeInTheDocument();
    expect(await screen.findAllByRole("button", { name: /Да/ })).toHaveLength(8);
  });

  it("redirects to /plan when onboarding already exists", () => {
    window.localStorage.setItem(
      "ir-onboarding-v1",
      JSON.stringify({
        lens: "educational",
        quizAnswers: [],
        quizYesCount: 0,
        tier: "none",
        tgHdlRatio: null,
        whr: null,
        completedAt: new Date().toISOString(),
      })
    );
    render(<OnboardingFlow />);
    expect(replaceMock).toHaveBeenCalledWith("/plan");
  });
});

describe("OnboardingFlow — inferred lens pre-selection", () => {
  async function fillQuiz(yesCount: number) {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    // welcome → quiz (framer-motion AnimatePresence keeps both cards
    // briefly mounted during the exit animation, so we use findBy* to
    // wait for the quiz step's "Към профила" CTA to actually exist).
    await user.click(screen.getByRole("button", { name: /Започни/ }));
    await screen.findByRole("button", { name: /Към профила/ });

    // Answer N Да-s then (8-N) Не-s. Each question renders paired Да / Не
    // buttons in DOM order, so we grab them in pairs.
    const yes = await screen.findAllByRole("button", { name: /Да/ });
    const no = await screen.findAllByRole("button", { name: /Не/ });
    for (let i = 0; i < 8; i++) {
      await user.click(i < yesCount ? yes[i] : no[i]);
    }

    // Quiz → lens
    await user.click(screen.getByRole("button", { name: /Към профила/ }));
    // Wait for the lens cards to actually render (transition + state).
    await screen.findByText(/Кое те описва най-добре/);
  }

  it("5 Yes → 'medical' carries the Препоръчано badge", async () => {
    await fillQuiz(5);
    // The recommended badge sits inside the recommended lens card; find
    // the card by its title and assert the badge lives within it.
    const medicalTitle = screen.getByText(/Имам диагноза/);
    const card = medicalTitle.closest("button");
    expect(card).not.toBeNull();
    expect(card!.textContent).toMatch(/Препоръчано/);
  });

  it("3 Yes → 'educational' carries the Препоръчано badge", async () => {
    await fillQuiz(3);
    const eduTitle = screen.getByText(/Имам симптоми/);
    const card = eduTitle.closest("button");
    expect(card!.textContent).toMatch(/Препоръчано/);
  });

  it("0 Yes → 'biohacker' carries the Препоръчано badge", async () => {
    await fillQuiz(0);
    const bioTitle = screen.getByText(/Оптимизирам се/);
    const card = bioTitle.closest("button");
    expect(card!.textContent).toMatch(/Препоръчано/);
  });
});
