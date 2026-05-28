import type { Metadata } from "next";
import EducationModule from "@/components/education/EducationModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Образование — InsulinReset",
  description:
    "Заболявания, свързани с инсулинова резистентност, и 4-те стълба по д-р Benjamin Bikman.",
};

export default function EducationPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/education" />
      <EducationModule />
    </main>
  );
}
