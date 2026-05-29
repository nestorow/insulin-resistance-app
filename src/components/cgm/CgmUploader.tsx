"use client";

import { useState } from "react";
import { parseCgm } from "@/lib/cgm-parser";
import type { CgmReading } from "@/lib/cgm";
import { showToast } from "@/lib/toast";

// CSV upload card. Lives outside CgmModule so the heavier chart bundle
// doesn't block the file picker — the picker is the first thing a new
// user sees on /cgm.

interface Props {
  onParsed: (readings: CgmReading[]) => void;
}

export default function CgmUploader({ onParsed }: Props) {
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      showToast("Файлът е твърде голям (>20MB).");
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const { format, readings } = parseCgm(text);
      if (format === "unknown") {
        showToast(
          "Неразпознат формат. Поддържат се FreeStyle LibreView и Dexcom Clarity CSV."
        );
        return;
      }
      onParsed(readings);
    } catch {
      showToast("Грешка при четенето на файла.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        Качи CGM export
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        FreeStyle LibreView: <em>Доклади → Изтегли данните</em>. Dexcom:{" "}
        <em>Clarity → Reports → CSV export</em>. И двата формата (mg/dL и
        mmol/L) се обработват автоматично.
      </p>
      <label
        className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors ${
          busy
            ? "border-slate-200 bg-slate-50 text-slate-400"
            : "border-teal-200 bg-teal-50/40 text-teal-700 hover:bg-teal-50"
        }`}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            // reset so the same file can be re-uploaded after a parse fix
            e.target.value = "";
          }}
          className="hidden"
        />
        {busy ? "Чета файла…" : "Избери CSV файл"}
      </label>
    </div>
  );
}
