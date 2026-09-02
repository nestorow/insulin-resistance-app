import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import EducationModule from "@/components/education/EducationModule";
import { educationJsonLd } from "@/lib/education-schema";

export const metadata: Metadata = pageMetadata({
  title: "Какво е инсулинова резистентност",
  description:
    "Инсулинова резистентност, обяснена по д-р Benjamin Bikman: 4-те стълба на протокола и болестите зад високия инсулин — преддиабет, диабет тип 2, PCOS.",
  path: "/education",
});

export default function EducationPage() {
  const jsonLd = educationJsonLd();
  return (
    <main className="min-h-dvh">
      {/* Per-page schema.org @graph — chapters as MedicalScholarlyArticle,
          diseases as MedicalCondition. Static content from data/, no risk. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EducationModule />
    </main>
  );
}
