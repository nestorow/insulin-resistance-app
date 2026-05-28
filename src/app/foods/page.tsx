import type { Metadata } from "next";
import FoodsModule from "@/components/foods/FoodsModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "Хранителен справочник — InsulinReset",
  description:
    "Гликемичен товар и макроси за често срещани храни, ферментирали продукти, подсладители и мазнини.",
};

export default function FoodsPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/foods" />
      <FoodsModule />
    </main>
  );
}
