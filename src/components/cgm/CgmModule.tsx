"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addCgmReadings,
  clearCgmReadings,
  getCgmReadings,
} from "@/lib/cgm-storage";
import {
  agpProfile,
  detectSpikes,
  timeInRange,
  variability,
} from "@/lib/cgm-stats";
import type { CgmReading } from "@/lib/cgm";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { showToast } from "@/lib/toast";
import CgmStatsCards from "./CgmStatsCards";
import CgmAgpChart from "./CgmAgpChart";
import CgmSpikeList from "./CgmSpikeList";
import CgmUploader from "./CgmUploader";

// Filter readings to the last N days — keeps stats clinically meaningful.
// The AGP consensus calls for ≥14 days of data; 30 covers a typical
// LibreView export window. User can clear and reload anytime.
const WINDOW_DAYS = 30;

function windowedReadings(all: CgmReading[]): CgmReading[] {
  if (!all.length) return all;
  const lastTs = Date.parse(all[all.length - 1].ts);
  const cutoff = lastTs - WINDOW_DAYS * 24 * 60 * 60_000;
  return all.filter((r) => Date.parse(r.ts) >= cutoff);
}

export default function CgmModule() {
  const [mounted, setMounted] = useState(false);
  const [readings, setReadings] = useState<CgmReading[]>([]);

  useEffect(() => {
    setReadings(getCgmReadings());
    setMounted(true);
  }, []);

  const windowed = useMemo(() => windowedReadings(readings), [readings]);
  const tir = useMemo(() => timeInRange(windowed), [windowed]);
  const vari = useMemo(() => variability(windowed), [windowed]);
  const agp = useMemo(() => agpProfile(windowed), [windowed]);
  const spikes = useMemo(() => detectSpikes(windowed), [windowed]);

  function onUpload(parsed: CgmReading[]) {
    if (!parsed.length) {
      showToast("Не открих CGM редове във файла.");
      return;
    }
    const { local } = addCgmReadings(parsed);
    setReadings(local);
    showToast(`Добавени ${parsed.length} стойности.`);
  }

  function onClear() {
    if (!confirm("Изтриване на всички CGM данни? Това не може да се върне.")) {
      return;
    }
    clearCgmReadings();
    setReadings([]);
    // Server clear is best-effort — fire and forget.
    void import("@/lib/actions/cgm").then((m) =>
      m.clearCgmReadingsAction().catch(() => undefined)
    );
    showToast("CGM данните са изчистени.");
  }

  const coverageDays = useMemo(() => {
    const days = new Set(windowed.map((r) => r.ts.slice(0, 10)));
    return days.size;
  }, [windowed]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">
          CGM — Time-in-Range & AGP
        </h1>
        <p className="mt-2 text-slate-600">
          Качи CSV export от{" "}
          <span className="font-medium">FreeStyle LibreView</span> или{" "}
          <span className="font-medium">Dexcom Clarity</span>. Получаваш
          стандартния AGP анализ за последните {WINDOW_DAYS} дни — TIR,
          вариативност (CV%), 24-часов профил, и автоматично откриване на
          постпрандиални пикове.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          За biohacker lens-а. Glucose pattern-ите се пазят AES-256-GCM
          enkriptirani at rest — виж <a className="underline" href="/privacy">политиката за поверителност</a>.
        </p>
      </header>

      <CgmUploader onParsed={onUpload} />

      {!mounted && (
        <div className="mt-8">
          <SkeletonRows rows={3} />
        </div>
      )}

      {mounted && readings.length === 0 && (
        <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-center text-sm text-slate-600">
          📈 Качи export от CGM-а си, за да видиш TIR + AGP. Поне 14 дни
          данни дават клинично значимо ниво — 30 дни е стандартът за
          доклади.
        </div>
      )}

      {mounted && readings.length > 0 && (
        <>
          <div className="mt-2 mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              {windowed.length} стойности · {coverageDays} дни (последните{" "}
              {WINDOW_DAYS})
            </span>
            <button
              onClick={onClear}
              className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 hover:bg-rose-50"
            >
              Изтрий
            </button>
          </div>

          <CgmStatsCards tir={tir} vari={vari} />

          <CgmAgpChart bands={agp} />

          <CgmSpikeList spikes={spikes} />
        </>
      )}
    </div>
  );
}
