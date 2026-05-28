import type { Metadata } from "next";
import ExerciseModule from "@/components/exercise/ExerciseModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Тренировки — InsulinReset",
  description: "Силови тренировки, HIIT и разходки след хранене за подобряване на инсулиновата чувствителност.",
};

export default function ExercisePage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/exercise" />
      <ExerciseModule />
    </main>
  );
}
