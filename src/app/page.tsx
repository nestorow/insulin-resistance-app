import type { Metadata } from "next";
import Logo from "@/components/Logo";
import LandingCTA from "@/components/LandingCTA";
import InstallAppCTA from "@/components/InstallAppCTA";
import FourPillars from "@/components/landing/FourPillars";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureGrid from "@/components/landing/FeatureGrid";
import TrustStrip from "@/components/landing/TrustStrip";
import LandingFaq from "@/components/landing/LandingFaq";
import { Clock } from "lucide-react";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
  pageMetadata,
} from "@/lib/site";

// Landing page — mirrors thyroidrehab.bg structure but with conversion
// scaffolding: punchier hero + trust strip, the 4 pillars (WHAT), a
// 3-step path (HOW), the 8 modules grid (WHERE), FAQ (objections),
// then CTA + disclaimer. Server component: all SEO copy is in the HTML.

export const metadata: Metadata = pageMetadata({
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  path: "/",
});

// JSON-LD MedicalWebPage schema — helps Google understand the site is a
// medical educational resource (not a product / shop). Conservative
// claims only, with the "based on" attribution to Bikman's published work.
const medicalWebPage = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "@id": absoluteUrl("/#webpage"),
  name: SITE_TITLE,
  url: SITE_URL,
  inLanguage: "bg-BG",
  isPartOf: { "@id": absoluteUrl("/#website") },
  about: {
    "@type": "MedicalCondition",
    name: "Insulin resistance",
    alternateName: "Инсулинова резистентност",
  },
  audience: {
    "@type": "MedicalAudience",
    audienceType: "Patient",
  },
  citation: {
    "@type": "Book",
    name: "Why We Get Sick",
    author: { "@type": "Person", name: "Benjamin Bikman, PhD" },
  },
  publisher: { "@id": absoluteUrl("/#organization") },
};

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        // schema.org JSON-LD — safe; static content from a constant above.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalWebPage) }}
      />

      {/* Hero — concrete promise, not generic "personalized assistant" */}
      <section
        aria-labelledby="hero-title"
        className="flex flex-col items-center px-4 pb-10 pt-16 text-center sm:pt-20"
      >
        <Logo size={120} className="mb-6 drop-shadow-sm" />

        {/* One H1 carrying brand + the lay keyword; visual hierarchy unchanged. */}
        <h1 id="hero-title" className="mb-3">
          <span className="block text-4xl font-bold text-teal-700 md:text-5xl">
            {SITE_NAME}
          </span>
          <span className="mt-2 block text-base font-medium text-teal-600 sm:text-lg">
            {SITE_TAGLINE}
          </span>
        </h1>
        <p className="mb-3 max-w-2xl text-2xl font-semibold text-slate-800 md:text-3xl">
          Свали инсулина си — преди да стане диабет
        </p>
        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          90-дневен протокол по д-р Benjamin Bikman, преведен в дневен
          чеклист. Започваш с 3-минутен тест за инсулинова резистентност,
          получаваш персонален план и следиш напредъка обективно — HOMA-IR и
          инсулин на гладно, CGM или просто симптоми.
        </p>

        <LandingCTA />
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-600">
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
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-600 sm:text-base">
          8 модула — натисни всеки, за да видиш какво включва.
        </p>
        <FeatureGrid />

        <div className="mt-10">
          <LandingCTA />
        </div>
      </section>

      {/* FAQ — what IR is, how it is measured, and the most common objections */}
      <LandingFaq />

      {/* Final closing CTA */}
      <section className="flex flex-col items-center px-4 pb-16 pt-4">
        <LandingCTA />
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5" /> Тестът отнема около 3 минути
        </p>

        {/* Secondary CTA — install the PWA (self-hides if not installable,
            already installed, or previously dismissed). */}
        <InstallAppCTA />
      </section>
    </main>
  );
}
