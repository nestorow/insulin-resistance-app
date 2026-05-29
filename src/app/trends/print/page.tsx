import type { Metadata } from "next";
import TrendsPrintView from "@/components/trends/TrendsPrintView";

export const metadata: Metadata = {
  title: "Тренд за лекар — InsulinReset",
  description: "Print-friendly преглед на показателите за последните 90 дни.",
  robots: { index: false, follow: false }, // private view, never indexed
};

// Print-friendly /trends — no ModuleNav, no global footer, no toasts,
// minimal interactivity. Designed to render cleanly via the browser's
// "Print" dialog or "Save as PDF". User flow: clicks "PDF за лекар" on
// /trends → lands here → File > Print → PDF.

export default function TrendsPrintPage() {
  return (
    <main className="bg-white">
      <TrendsPrintView />
    </main>
  );
}
