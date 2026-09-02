import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import ExerciseModule from "@/components/exercise/ExerciseModule";

export const metadata: Metadata = pageMetadata({
  title: "Тренировки при инсулинова резистентност",
  description:
    "Силови тренировки, HIIT и разходки след хранене — как мускулите поглъщат глюкоза без много инсулин и как да ги подредиш през 90-те дни на протокола.",
  path: "/exercise",
});

export default function ExercisePage() {
  return (
    <main className="min-h-dvh">
      <ExerciseModule />
    </main>
  );
}
