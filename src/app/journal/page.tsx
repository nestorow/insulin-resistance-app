import type { Metadata } from "next";
import SymptomJournalModule from "@/components/journal/SymptomJournalModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Дневник на симптомите — InsulinReset",
  description: "Проследявай енергия, brain fog, тегло, талия и кръвна захар през 90-те дни.",
};

export default function JournalPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/journal" />
      <SymptomJournalModule />
    </main>
  );
}
