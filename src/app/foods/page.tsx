import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import FoodsModule from "@/components/foods/FoodsModule";

export const metadata: Metadata = pageMetadata({
  title: "Храни при инсулинова резистентност",
  description:
    "Гликемичен товар и макроси на често срещани храни — кои да ядеш свободно, умерено или да избягваш при инсулинова резистентност, вкл. подсладители и мазнини.",
  path: "/foods",
});

export default function FoodsPage() {
  return (
    <main className="min-h-dvh">
      <FoodsModule />
    </main>
  );
}
