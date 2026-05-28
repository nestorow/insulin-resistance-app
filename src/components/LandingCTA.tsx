"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadOnboarding } from "@/lib/onboarding-storage";

// Adapts the landing's primary CTA to onboarding state:
// - never done -> "Започни теста" (goes to /onboarding)
// - already done -> "Към дневния план" (goes to /plan)
export default function LandingCTA() {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    setDone(loadOnboarding() !== null);
  }, []);

  // SSR / pre-hydration: render the safe default (the test CTA) so the
  // markup is non-empty and accessible without JS.
  const isDone = done === true;

  return (
    <Link
      href={isDone ? "/plan" : "/onboarding"}
      className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105 hover:bg-teal-600"
    >
      {isDone ? "Към дневния план" : "Започни 90-дневния протокол"}
      <span className="text-xl">→</span>
    </Link>
  );
}
