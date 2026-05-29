import type { Metadata } from "next";
import SupplementsModule from "@/components/supplements/SupplementsModule";

export const metadata: Metadata = {
  title: "Добавки — InsulinReset",
  description: "Evidence-graded справочник за добавки, подпомагащи инсулиновата чувствителност. Не е медицински съвет.",
};

export default function SupplementsPage() {
  return (
    <main className="min-h-dvh">
      <SupplementsModule />
    </main>
  );
}
