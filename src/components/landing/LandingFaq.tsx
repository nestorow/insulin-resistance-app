import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { LANDING_FAQ } from "@/data/landing-faq";

// FAQ section — server component. Native <details>/<summary> keeps every
// answer in the HTML (crawlable, works without JS) while staying collapsed
// by default; the chevron rotates via the `open` state (group-open). The
// same Q&A pairs are emitted as FAQPage structured data.

export default function LandingFaq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="w-full scroll-mt-8 bg-white px-4 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-title"
          className="mb-2 text-center text-2xl font-bold text-teal-700 sm:text-3xl"
        >
          Често задавани въпроси
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          Какво е инсулинова резистентност, как се измерва и бързи отговори на
          най-честите опасения.
        </p>
        <div className="space-y-3">
          {LANDING_FAQ.map((item) => (
            <details
              key={item.q}
              className="group overflow-hidden rounded-xl border border-teal-100 bg-teal-50/30"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 text-left hover:bg-teal-50 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold text-slate-800 sm:text-base">
                  {item.q}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-teal-100 bg-white px-4 py-3">
                <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                {item.link && (
                  <p className="mt-2 text-sm">
                    <Link
                      href={item.link.href}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {item.link.label} →
                    </Link>
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        // schema.org JSON-LD — static content from data/landing-faq.ts.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
