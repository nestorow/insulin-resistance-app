import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import DailyPlanModule from "@/components/plan/DailyPlanModule";

export const metadata: Metadata = privateMetadata("Дневен план");

export default function PlanPage() {
  return (
    <main className="min-h-dvh">
      <DailyPlanModule />
    </main>
  );
}
