import type { Metadata } from "next";
import MarkersModule from "@/components/markers/MarkersModule";

export const metadata: Metadata = {
  title: "Тракер на показатели — InsulinReset",
  description: "HOMA-IR, инсулин на гладно, HbA1c и TG/HDL през 90-те дни.",
};

export default function MarkersPage() {
  return (
    <main className="min-h-dvh">
      <MarkersModule />
    </main>
  );
}
