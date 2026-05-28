import type { Metadata } from "next";
import DailyPlanModule from "@/components/plan/DailyPlanModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Дневен план — InsulinReset",
  description: "Ежедневен чеклист с навиците, които свалят инсулина, персонализиран според теста ти.",
};

export default function PlanPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/plan" />
      <DailyPlanModule />
    </main>
  );
}
