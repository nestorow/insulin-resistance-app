import type { Metadata } from "next";
import CgmModule from "@/components/cgm/CgmModule";
import ModuleNav from "@/components/ModuleNav";

export const metadata: Metadata = {
  title: "CGM анализ — InsulinReset",
  description:
    "Качи export от FreeStyle LibreView или Dexcom Clarity. Получаваш Time-in-Range, вариативност, 24-часов AGP профил и автоматично откриване на пикове.",
};

export default function CgmPage() {
  return (
    <main className="min-h-dvh">
      <ModuleNav active="/cgm" />
      <CgmModule />
    </main>
  );
}
