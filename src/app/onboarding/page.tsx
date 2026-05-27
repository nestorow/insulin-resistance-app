import type { Metadata } from "next";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Начало — Инсулинова резистентност",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-dvh">
      <OnboardingFlow />
    </main>
  );
}
