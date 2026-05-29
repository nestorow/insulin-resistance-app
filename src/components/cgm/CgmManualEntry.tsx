"use client";

import { useState } from "react";
import type { CgmReading } from "@/lib/cgm";
import { MGDL_MAX, MGDL_MIN, mmolToMgdl } from "@/lib/cgm";
import { showToast } from "@/lib/toast";

// Ad-hoc single-reading entry. Useful for users without a CGM who run
// occasional fingerstick checks (e.g., 1h or 2h post-meal). Goes through
// the same storage seam as CSV upload — the reading lands as `source:
// "manual"` and syncs to Turso for signed-in users.

interface Props {
  onSubmit: (reading: CgmReading) => void;
}

function nowLocalDatetimeValue(): string {
  // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in LOCAL time
  // — Date#toISOString returns UTC, so we offset to the user's TZ first.
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function CgmManualEntry({ onSubmit }: Props) {
  const [when, setWhen] = useState<string>(nowLocalDatetimeValue());
  const [valueStr, setValueStr] = useState("");
  const [unit, setUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");

  function submit() {
    const numeric = Number(valueStr.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      showToast("Невалидна стойност.");
      return;
    }
    const mgdl = unit === "mmol/L" ? mmolToMgdl(numeric) : numeric;
    if (mgdl < MGDL_MIN || mgdl > MGDL_MAX) {
      showToast(`Стойността е извън диапазона (${MGDL_MIN}–${MGDL_MAX} mg/dL).`);
      return;
    }
    // Treat the picker value as local — convert to UTC ISO for storage.
    const ts = new Date(when).toISOString();
    onSubmit({ ts, mgdl: Math.round(mgdl * 10) / 10, source: "manual" });

    // Reset value but keep the timestamp at "now" for quick repeated logging.
    setValueStr("");
    setWhen(nowLocalDatetimeValue());
    showToast(`Записано: ${Math.round(mgdl)} mg/dL.`);
  }

  return (
    <div className="mt-4 rounded-2xl border border-teal-100 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        Ръчно въвеждане
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        За фингерстик измервания между upload-ите — напр. 1h след хранене.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Кога</span>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">
            Стойност
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              step="0.1"
              placeholder={unit === "mg/dL" ? "напр. 110" : "напр. 6.1"}
              className="w-full flex-1 rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as "mg/dL" | "mmol/L")}
              aria-label="Единица за стойността"
              className="rounded-lg border border-teal-200 bg-white px-2 py-2 text-sm outline-none focus:border-teal-400"
            >
              <option value="mg/dL">mg/dL</option>
              <option value="mmol/L">mmol/L</option>
            </select>
          </div>
        </label>
      </div>
      <button
        onClick={submit}
        disabled={!valueStr}
        className="mt-4 w-full rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-200"
      >
        Запиши стойност
      </button>
    </div>
  );
}
