import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = privateMetadata("Тест за инсулинова резистентност");

export default function OnboardingPage() {
  return (
    <main className="min-h-dvh">
      <OnboardingFlow />
    </main>
  );
}
