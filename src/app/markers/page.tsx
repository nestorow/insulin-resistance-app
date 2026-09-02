import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import MarkersModule from "@/components/markers/MarkersModule";

export const metadata: Metadata = privateMetadata("Тракер на показатели");

export default function MarkersPage() {
  return (
    <main className="min-h-dvh">
      <MarkersModule />
    </main>
  );
}
