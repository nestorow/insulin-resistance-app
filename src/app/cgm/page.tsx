import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import CgmModule from "@/components/cgm/CgmModule";

export const metadata: Metadata = pageMetadata({
  title: "CGM анализ: Time-in-Range и AGP",
  description:
    "Качи CSV от FreeStyle LibreView или Dexcom Clarity и получи Time-in-Range, вариативност, 24-часов AGP профил и автоматично откриване на пикове след хранене.",
  path: "/cgm",
});

export default function CgmPage() {
  return (
    <main className="min-h-dvh">
      <CgmModule />
    </main>
  );
}
