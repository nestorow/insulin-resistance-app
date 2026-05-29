import type { Metadata } from "next";
import SettingsModule from "@/components/settings/SettingsModule";

export const metadata: Metadata = {
  title: "Настройки — InsulinReset",
  description:
    "Преоцени теста, виж текущия си tier и lens, управлявай локалните данни.",
};

export default function SettingsPage() {
  return (
    <main className="min-h-dvh">
      <SettingsModule />
    </main>
  );
}
