import type { Metadata } from "next";
import EducationModule from "@/components/education/EducationModule";

export const metadata: Metadata = {
  title: "Образование — Инсулинова резистентност",
  description:
    "Заболявания, свързани с инсулинова резистентност, и 4-те стълба по д-р Benjamin Bikman.",
};

export default function EducationPage() {
  return (
    <main className="min-h-dvh">
      <EducationModule />
    </main>
  );
}
