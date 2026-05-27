import type { Metadata } from "next";
import SupplementsModule from "@/components/supplements/SupplementsModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Добавки — Инсулинова резистентност",
  description: "Evidence-graded справочник за добавки, подпомагащи инсулиновата чувствителност. Не е медицински съвет.",
};

export default function SupplementsPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/supplements" />
      <SupplementsModule />
    </main>
  );
}
