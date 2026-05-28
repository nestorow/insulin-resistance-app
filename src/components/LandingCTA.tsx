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
    <>
      <Link
        href={isDone ? "/plan" : "/onboarding"}
        className="w-full rounded-xl bg-teal-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600 sm:w-auto"
      >
        {isDone ? "Към дневния план" : "Започни теста (1-2 мин)"}
      </Link>
      <Link
        href="/education"
        className="w-full rounded-xl px-8 py-3.5 font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-50 sm:w-auto"
      >
        Научи повече
      </Link>
    </>
  );
}
