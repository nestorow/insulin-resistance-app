"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Download } from "lucide-react";
import { showToast } from "@/lib/toast";

// GDPR Article 20 affordance — one click downloads everything we hold
// for the user as a single JSON file. The action is fire-and-forget on
// the network side; the browser's Save dialog is the user's commit
// step. No server-side storage of the export itself.

export default function DataExportCard() {
  const { status } = useSession();
  const [busy, setBusy] = useState(false);

  if (status !== "authenticated") return null;

  async function onExport() {
    setBusy(true);
    try {
      const { exportUserDataAction } = await import("@/lib/actions/export");
      const data = await exportUserDataAction();
      if (!data) {
        showToast("Не успях да изтегля данните — опитай отново.");
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `insulinreset-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Експортът свален.");
    } catch {
      showToast("Грешка при експорта.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">
        Изтегли данните си
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        Един JSON файл с всичко, което пазим за теб — отговори от въпросника,
        дневник, кръвни маркери, измервания от CGM, анотации, прогрес и значки.
        Това е твоето право на преносимост на данните (GDPR чл. 20).
      </p>
      <button
        onClick={onExport}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-200"
      >
        <Download className="h-4 w-4" />
        {busy ? "Подготвям…" : "Изтегли JSON експорт"}
      </button>
      <p className="mt-2 text-xs text-slate-400">
        Файлът се прави и сваля в браузъра — не качваме никъде копие.
      </p>
    </section>
  );
}
