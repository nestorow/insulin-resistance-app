import type { Metadata } from "next";
import EducationModule from "@/components/education/EducationModule";
import ModuleNav from "@/components/ModuleNav";
import { educationJsonLd } from "@/lib/education-schema";

export const metadata: Metadata = {
  title: "Образование — InsulinReset",
  description:
    "Заболявания, свързани с инсулинова резистентност, и 4-те стълба по д-р Benjamin Bikman.",
};

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
      <ModuleNav active="/education" />
      <EducationModule />
    </main>
  );
}
