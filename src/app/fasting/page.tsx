import type { Metadata } from "next";
import FastingModule from "@/components/fasting/FastingModule";

export const metadata: Metadata = {
  title: "Гладуване — InsulinReset",
  description: "Интервално гладуване: фазите в тялото и 90-дневна прогресия от 12ч към 24ч.",
};

export default function FastingPage() {
  return (
    <main className="min-h-dvh">
      <FastingModule />
    </main>
  );
}
