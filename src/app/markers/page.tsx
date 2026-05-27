import type { Metadata } from "next";
import MarkersModule from "@/components/markers/MarkersModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Тракер на показатели — Инсулинова резистентност",
  description: "HOMA-IR, инсулин на гладно, HbA1c и TG/HDL през 90-те дни.",
};

export default function MarkersPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/markers" />
      <MarkersModule />
    </main>
  );
}
