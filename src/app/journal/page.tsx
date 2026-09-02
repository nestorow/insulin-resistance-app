import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import SymptomJournalModule from "@/components/journal/SymptomJournalModule";

export const metadata: Metadata = privateMetadata("Дневник на симптомите");

export default function JournalPage() {
  return (
    <main className="min-h-dvh">
      <SymptomJournalModule />
    </main>
  );
}
