import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import FastingModule from "@/components/fasting/FastingModule";

export const metadata: Metadata = pageMetadata({
  title: "Гладуване при инсулинова резистентност",
  description:
    "Интервално гладуване за по-нисък инсулин: какво се случва в тялото по часове и 90-дневна прогресия от 12 към 24 часа, с таймер на фазите.",
  path: "/fasting",
});

export default function FastingPage() {
  return (
    <main className="min-h-dvh">
      <FastingModule />
    </main>
  );
}
