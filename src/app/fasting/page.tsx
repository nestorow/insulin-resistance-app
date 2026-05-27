import type { Metadata } from "next";
import FastingModule from "@/components/fasting/FastingModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Гладуване — Инсулинова резистентност",
  description: "Интервално гладуване: фазите в тялото и 90-дневна прогресия от 12ч към 24ч.",
};

export default function FastingPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/fasting" />
      <FastingModule />
    </main>
  );
}
