import { chapters } from "@/data/knowledge";
import { diseases, bodySystemNames } from "@/data/diseases";

// JSON-LD generator for /education — emits a schema.org @graph that
// declares each Bikman chapter as a MedicalScholarlyArticle and each
// disease as a MedicalCondition. Helps Google cluster the page in
// Knowledge Graph alongside the canonical health entities (e.g. type
// 2 diabetes, PCOS, NAFLD) — important for an educational health
// resource competing with mainstream content.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "https://insulin-resistance-app.vercel.app";

const BIKMAN_BOOK = {
  "@type": "Book",
  "@id": `${SITE_URL}/education#why-we-get-sick`,
  name: "Why We Get Sick",
  author: {
    "@type": "Person",
    name: "Benjamin Bikman, PhD",
    affiliation: "Brigham Young University",
  },
  inLanguage: "en",
  isbn: "978-1953295774",
};

export function educationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      // Page-level reference to the source book
      BIKMAN_BOOK,

      // Each chapter → MedicalScholarlyArticle (Bulgarian summary of an
      // English-language scholarly book chapter)
      ...chapters.map((c) => ({
        "@type": "MedicalScholarlyArticle",
        "@id": `${SITE_URL}/education#chapter-${c.number}`,
        headline: c.title_bg,
        abstract: c.takeaways.join(" · "),
        inLanguage: "bg-BG",
        isPartOf: { "@id": BIKMAN_BOOK["@id"] },
        position: c.number,
        about: {
          "@type": "MedicalCondition",
          name: "Insulin resistance",
        },
      })),

      // Each disease → MedicalCondition (with bilingual names and the body
      // system for context).
      ...diseases.map((d) => ({
        "@type": "MedicalCondition",
        "@id": `${SITE_URL}/education#disease-${d.id}`,
        name: d.name_en,
        alternateName: d.name_bg,
        description: d.description_bg,
        category: bodySystemNames[d.bodySystem] ?? d.bodySystem,
        riskFactor: {
          "@type": "MedicalRiskFactor",
          name: "Insulin resistance",
        },
        inLanguage: "bg-BG",
      })),
    ],
  };
}
