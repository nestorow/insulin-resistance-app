import type { Metadata } from "next";
import FoodsModule from "@/components/foods/FoodsModule";

export const metadata: Metadata = {
  title: "Хранителен справочник — InsulinReset",
  description:
    "Гликемичен товар и макроси за често срещани храни, ферментирали продукти, подсладители и мазнини.",
};

export default function FoodsPage() {
  return (
    <main className="min-h-dvh">
      <FoodsModule />
    </main>
  );
}
