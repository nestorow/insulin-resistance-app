import type { Metadata } from "next";
import TrendsModule from "@/components/trends/TrendsModule";

export const metadata: Metadata = {
  title: "Тренд — InsulinReset",
  description:
    "Всичките ти показатели на една времева линия — HOMA-IR, HbA1c, CGM TIR, симптоми и дневна изпълняемост за последните 90 дни.",
};

export default function TrendsPage() {
  return (
    <main className="min-h-dvh">
      <TrendsModule />
    </main>
  );
}
