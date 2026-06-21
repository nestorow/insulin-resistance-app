"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getMarkerLogs,
  addMarkerLog,
  removeMarkerLog,
  type MarkerEntry,
} from "@/lib/tracking-storage";
import { showToast } from "@/lib/toast";
import { clampedNum } from "@/lib/numbers";
import { SkeletonRows } from "@/components/ui/Skeleton";
import NumberField, { rangeError } from "@/components/ui/NumberField";
import { formatDateBg } from "@/lib/date-format";
import { FlaskConical } from "lucide-react";

// Physiological ranges for the marker fields (shared by the inline validator
// and the save-time clamp so a valid value is never dropped).
const RANGES = {
  homaIr: { min: 0, max: 50, unit: "" },
  fastingInsulin: { min: 0, max: 100, unit: "µU/mL" },
  hba1c: { min: 3, max: 15, unit: "%" },
  tg: { min: 0, max: 2000, unit: "mg/dL" },
  hdl: { min: 0, max: 200, unit: "mg/dL" },
} as const;

// Same lazy pattern as JournalTrendChart — defer recharts until after
// the form + entry list paint.
const MarkersTrendChart = dynamic(() => import("./MarkersTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full animate-pulse rounded-lg bg-teal-50/40" />
  ),
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function MarkersModule() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<MarkerEntry[]>([]);
  const [date, setDate] = useState(today());
  const [homaIr, setHomaIr] = useState("");
  const [fastingInsulin, setFastingInsulin] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [tg, setTg] = useState("");
  const [hdl, setHdl] = useState("");
  // Flips true on a blocked save so every out-of-range field lights up.
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLogs(getMarkerLogs());
    setMounted(true);
  }, []);

  function save() {
    // Block save on any out-of-range value and reveal the inline errors.
    const invalid =
      rangeError(homaIr, RANGES.homaIr.min, RANGES.homaIr.max) ||
      rangeError(
        fastingInsulin,
        RANGES.fastingInsulin.min,
        RANGES.fastingInsulin.max
      ) ||
      rangeError(hba1c, RANGES.hba1c.min, RANGES.hba1c.max) ||
      rangeError(tg, RANGES.tg.min, RANGES.tg.max) ||
      rangeError(hdl, RANGES.hdl.min, RANGES.hdl.max);
    if (invalid) {
      setSubmitted(true);
      showToast("Провери стойностите извън допустимия диапазон.");
      return;
    }
    setSubmitted(false);

    const entry: MarkerEntry = {
      date,
      homaIr: clampedNum(homaIr, RANGES.homaIr.min, RANGES.homaIr.max),
      fastingInsulin: clampedNum(
        fastingInsulin,
        RANGES.fastingInsulin.min,
        RANGES.fastingInsulin.max
      ),
      hba1c: clampedNum(hba1c, RANGES.hba1c.min, RANGES.hba1c.max),
      triglycerides: clampedNum(tg, RANGES.tg.min, RANGES.tg.max),
      hdl: clampedNum(hdl, RANGES.hdl.min, RANGES.hdl.max),
    };
    const previous = logs;
    const { local, pending } = addMarkerLog(entry);
    setLogs(local);
    showToast("Записано за " + date);

    pending.then((outcome) => {
      if (outcome === "rejected") {
        setLogs(removeMarkerLog(date));
        const prior = previous.find((e) => e.date === date);
        if (prior) {
          const restored = [...removeMarkerLog(date), prior].sort((a, b) =>
            a.date.localeCompare(b.date)
          );
          window.localStorage.setItem(
            "ir-marker-log-v1",
            JSON.stringify(restored)
          );
          setLogs(restored);
        }
        showToast("Сървърът отказа (твърде много заявки) — записът е върнат.");
      }
    });
  }

  const chartData = logs.map((l) => ({
    date: l.date.slice(5),
    "HOMA-IR": l.homaIr ?? null,
    "Инсулин": l.fastingInsulin ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Тракер на показатели</h1>
        <p className="mt-2 text-slate-600">
          Въвеждай кръвните си показатели месечно. Инсулинът на гладно и HOMA-IR
          реагират най-рано — често преди глюкозата.
        </p>
      </header>

      {/* Entry form */}
      <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
          </Field>
          <div />
          <NumberField
            label="HOMA-IR"
            value={homaIr}
            onChange={setHomaIr}
            min={RANGES.homaIr.min}
            max={RANGES.homaIr.max}
            step={0.1}
            forceShowError={submitted}
          />
          <NumberField
            label="Инсулин на гладно (µU/mL)"
            value={fastingInsulin}
            onChange={setFastingInsulin}
            min={RANGES.fastingInsulin.min}
            max={RANGES.fastingInsulin.max}
            unit={RANGES.fastingInsulin.unit}
            step={0.1}
            forceShowError={submitted}
          />
          <NumberField
            label="HbA1c (%)"
            value={hba1c}
            onChange={setHba1c}
            min={RANGES.hba1c.min}
            max={RANGES.hba1c.max}
            unit={RANGES.hba1c.unit}
            step={0.1}
            forceShowError={submitted}
          />
          <div />
          <NumberField
            label="Триглицериди (mg/dL)"
            value={tg}
            onChange={setTg}
            min={RANGES.tg.min}
            max={RANGES.tg.max}
            unit={RANGES.tg.unit}
            step={1}
            forceShowError={submitted}
          />
          <NumberField
            label="HDL (mg/dL)"
            value={hdl}
            onChange={setHdl}
            min={RANGES.hdl.min}
            max={RANGES.hdl.max}
            unit={RANGES.hdl.unit}
            step={1}
            forceShowError={submitted}
          />
        </div>
        <button
          onClick={save}
          className="mt-4 w-full rounded-xl bg-teal-500 py-3 font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Запиши показателите
        </button>
      </div>

      {/* Hydration placeholder — see Journal for the rationale. */}
      {!mounted && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Записи</h2>
          <SkeletonRows rows={3} />
        </div>
      )}

      {/* Empty / encouragement states (until chart is meaningful) */}
      {mounted && logs.length === 0 && (
        <div className="mb-8 flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-center text-sm text-slate-600">
          <FlaskConical className="h-6 w-6 text-teal-400" />
          <span>
            Въведи първите си показатели — обикновено месечно. Графиката се
            активира след втория запис.
          </span>
        </div>
      )}
      {mounted && logs.length === 1 && (
        <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-center text-sm text-slate-600">
          Имаш baseline. Запиши още един месец, за да видиш тренда.
        </div>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            HOMA-IR и инсулин на гладно
          </h2>
          <MarkersTrendChart data={chartData} />
        </div>
      )}

      {/* Recent entries */}
      {logs.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Записи</h2>
          <div className="space-y-2">
            {[...logs].reverse().map((l) => {
              const ratio =
                l.triglycerides && l.hdl ? l.triglycerides / l.hdl : null;
              return (
                <div
                  key={l.date}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-teal-100 bg-white p-3 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {formatDateBg(l.date)}
                  </span>
                  {l.homaIr != null && <span className="text-slate-500">HOMA {l.homaIr}</span>}
                  {l.fastingInsulin != null && (
                    <span className="text-slate-500">инсулин {l.fastingInsulin}</span>
                  )}
                  {l.hba1c != null && <span className="text-slate-500">HbA1c {l.hba1c}%</span>}
                  {ratio != null && (
                    <span
                      className={ratio < 2 ? "text-teal-600" : "text-rose-600"}
                    >
                      TG/HDL {ratio.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}

