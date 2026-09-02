import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import TrendsModule from "@/components/trends/TrendsModule";

export const metadata: Metadata = privateMetadata("Тренд");

export default function TrendsPage() {
  return (
    <main className="min-h-dvh">
      <TrendsModule />
    </main>
  );
}
