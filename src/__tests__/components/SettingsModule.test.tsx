import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsModule from "@/components/settings/SettingsModule";
import type { OnboardingResult } from "@/lib/onboarding";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
}));

// The settings module calls `clearOnboardingAction` fire-and-forget; mock
// it so tests neither hit the (mocked) DB stack nor depend on timing.
const clearActionMock = jest.fn(async () => ({ ok: true }));
jest.mock("@/lib/actions/onboarding", () => ({
  saveOnboardingAction: jest.fn(async () => ({ ok: true })),
  loadOnboardingAction: jest.fn(async () => null),
  clearOnboardingAction: () => clearActionMock(),
}));

function seedOnboarding(yesCount = 2): OnboardingResult {
  const result: OnboardingResult = {
    lens: "medical",
    quizAnswers: Array(8)
      .fill(false)
      .map((_, i) => i < yesCount),
    quizYesCount: yesCount,
    tier: yesCount <= 0 ? "none" : yesCount === 1 ? "moderate" : "keto",
    tgHdlRatio: null,
    whr: null,
    completedAt: "2026-01-15T00:00:00.000Z",
  };
  window.localStorage.setItem("ir-onboarding-v1", JSON.stringify(result));
  return result;
}

beforeEach(() => {
  window.localStorage.clear();
  pushMock.mockReset();
  clearActionMock.mockClear();
});

describe("SettingsModule — current profile", () => {
  it("renders lens, tier, and start date when onboarding exists", async () => {
    seedOnboarding(2);
    render(<SettingsModule />);

    expect(await screen.findByText(/Имам диагноза/)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 8 положителни/)).toBeInTheDocument();
    expect(screen.getByText(/Почти сигурна/)).toBeInTheDocument();
    // bg-BG date locale; year is enough to anchor
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("nudges to /onboarding when no onboarding exists", async () => {
    render(<SettingsModule />);
    expect(
      await screen.findByText(/Още не си направил теста/)
    ).toBeInTheDocument();
    // Re-test button is disabled when there's nothing to re-test.
    const btn = screen.getByRole("button", { name: /Преоцени теста/ });
    expect(btn).toBeDisabled();
  });
});

describe("SettingsModule — re-test flow", () => {
  it("clears local + calls server action + redirects on confirm", async () => {
    const user = userEvent.setup();
    seedOnboarding(2);
    render(<SettingsModule />);

    // Wait for the mount effect to load the onboarding (button enables).
    const btn = await screen.findByRole("button", { name: /Преоцени теста/ });
    await waitFor(() => expect(btn).not.toBeDisabled());

    await user.click(btn);

    // Confirm dialog opens
    expect(await screen.findByText(/Сигурен ли си\?/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Да, преоцени/ }));

    await waitFor(() => {
      expect(window.localStorage.getItem("ir-onboarding-v1")).toBeNull();
      expect(clearActionMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("does nothing on cancel (Отказ)", async () => {
    const user = userEvent.setup();
    seedOnboarding(2);
    render(<SettingsModule />);

    const btn = await screen.findByRole("button", { name: /Преоцени теста/ });
    await waitFor(() => expect(btn).not.toBeDisabled());
    await user.click(btn);

    await user.click(screen.getByRole("button", { name: /Отказ/ }));

    // Local storage still has the onboarding row, no redirect happened.
    expect(window.localStorage.getItem("ir-onboarding-v1")).not.toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
    expect(clearActionMock).not.toHaveBeenCalled();
  });
});
