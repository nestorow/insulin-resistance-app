import type { Metadata } from "next";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Начало — InsulinReset",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-dvh">
      <OnboardingFlow />
    </main>
  );
}
