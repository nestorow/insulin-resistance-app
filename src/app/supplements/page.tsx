import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import SupplementsModule from "@/components/supplements/SupplementsModule";

export const metadata: Metadata = pageMetadata({
  title: "Добавки при инсулинова резистентност",
  description:
    "Берберин, магнезий, ALA, мио-инозитол, витамин D3, хром и омега-3, степенувани по доказателства за инсулиновата чувствителност. Не е медицински съвет.",
  path: "/supplements",
});

export default function SupplementsPage() {
  return (
    <main className="min-h-dvh">
      <SupplementsModule />
    </main>
  );
}
