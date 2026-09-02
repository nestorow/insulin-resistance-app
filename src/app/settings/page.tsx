import type { Metadata } from "next";
import { privateMetadata } from "@/lib/site";
import SettingsModule from "@/components/settings/SettingsModule";

export const metadata: Metadata = privateMetadata("Настройки");

export default function SettingsPage() {
  return (
    <main className="min-h-dvh">
      <SettingsModule />
    </main>
  );
}
