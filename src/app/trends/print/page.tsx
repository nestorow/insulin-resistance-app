import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import TrendsPrintView from "@/components/trends/TrendsPrintView";

export const metadata: Metadata = privateMetadata("Тренд за лекар");

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
