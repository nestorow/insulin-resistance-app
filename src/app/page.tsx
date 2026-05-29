import Logo from "@/components/Logo";
import LandingCTA from "@/components/LandingCTA";
import FourPillars from "@/components/landing/FourPillars";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureGrid from "@/components/landing/FeatureGrid";
import TrustStrip from "@/components/landing/TrustStrip";
import LandingFaq from "@/components/landing/LandingFaq";
import { Clock } from "lucide-react";

// Landing page — mirrors thyroidrehab.bg structure but with conversion
// scaffolding: punchier hero + trust strip, the 4 pillars (WHAT), a
// 3-step path (HOW), the 8 modules grid (WHERE), FAQ (objections),
// then CTA + disclaimer.

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      {/* Hero — concrete promise, not generic "personalized assistant" */}
      <section className="flex flex-col items-center px-4 pb-10 pt-16 text-center sm:pt-20">
        <Logo size={120} className="mb-6 drop-shadow-sm" />

        <h1 className="mb-3 text-4xl font-bold text-teal-700 md:text-5xl">
          InsulinReset
        </h1>
        <p className="mb-3 max-w-2xl text-2xl font-semibold text-slate-800 md:text-3xl">
          Свали инсулина си — преди да стане диабет
        </p>
        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          90-дневен протокол по д-р Benjamin Bikman, преведен в дневен
          чеклист. Започваш с 3-минутен тест, получаваш персонален план,
          следиш напредъка обективно с кръвни маркери, CGM или просто симптоми.
        </p>

        <LandingCTA />
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" /> Тестът отнема около 3 минути
        </p>

        <TrustStrip />
      </section>

      {/* The 4 pillars — answer to "what do you actually do?" */}
      <FourPillars />

      {/* 3-step path — answer to "how does this work for me?" */}
      <HowItWorks />

      {/* Module preview — answer to "what's inside the app?" */}
      <section className="flex flex-col items-center px-4 pb-16 pt-4">
        <h2 className="mb-2 text-center text-2xl font-bold text-teal-700 sm:text-3xl">
          Какво има в приложението
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          8 модула — натисни всеки, за да видиш какво включва.
        </p>
        <FeatureGrid />

        <div className="mt-10">
          <LandingCTA />
        </div>
      </section>

      {/* FAQ — direct answers to the 5 most common objections */}
      <LandingFaq />

      {/* Final closing CTA */}
      <section className="flex flex-col items-center px-4 pb-16 pt-4">
        <LandingCTA />
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" /> Тестът отнема около 3 минути
        </p>
      </section>
    </main>
  );
}
