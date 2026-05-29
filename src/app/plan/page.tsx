import type { Metadata } from "next";
import DailyPlanModule from "@/components/plan/DailyPlanModule";

export const metadata: Metadata = {
  title: "Дневен план — InsulinReset",
  description: "Ежедневен чеклист с навиците, които свалят инсулина, персонализиран според теста ти.",
};

export default function PlanPage() {
  return (
    <main className="min-h-dvh">
      <DailyPlanModule />
    </main>
  );
}
