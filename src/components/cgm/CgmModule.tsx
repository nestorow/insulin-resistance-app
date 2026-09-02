"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { LineChart } from "lucide-react";
import CgmStatsCards from "./CgmStatsCards";
import CgmSpikeList from "./CgmSpikeList";
import CgmUploader from "./CgmUploader";
import CgmManualEntry from "./CgmManualEntry";

// AGP chart is the heaviest piece on /cgm (recharts stacked-area + the
// p10-p90 ribbon arithmetic). Dynamic-import it so the uploader, stats
// cards, and spike list stream in first — recharts arrives after.
const CgmAgpChart = dynamic(() => import("./CgmAgpChart"), {
  ssr: false,
  loading: () => (
    <div className="mt-6 h-[300px] rounded-2xl border border-teal-100 bg-white p-4">
      <div className="h-4 w-40 animate-pulse rounded bg-teal-50" />
      <div className="mt-4 h-[230px] w-full animate-pulse rounded-lg bg-teal-50/60" />
    </div>
  ),
});

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

  function onUpload(
    parsed: CgmReading[],
    opts: { skipServer?: boolean } = {}
  ) {
    if (!parsed.length) {
      showToast("Не открих CGM редове във файла.");
      return;
    }
    const { local } = addCgmReadings(parsed, opts);
    setReadings(local);
    if (!opts.skipServer) {
      showToast(`Добавени ${parsed.length} стойности.`);
    }
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

  // "Demo mode" = ALL current readings come from the synthetic dataset.
  // We don't flag a partial mix (real upload + demo) because once real
  // data exists the user is committed; we just stop showing the banner.
  const isDemo = useMemo(
    () => readings.length > 0 && readings.every((r) => r.source === "demo"),
    [readings]
  );

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
        <p className="mt-2 text-xs text-slate-600">
          За по-задълбочен анализ. Профилът на глюкозата се пази криптиран в
          покой (AES-256-GCM) — виж{" "}
          <a className="underline" href="/privacy">политиката за поверителност</a>.
        </p>
      </header>

      <CgmUploader onParsed={onUpload} />

      <CgmManualEntry onSubmit={(r) => onUpload([r])} />

      {!mounted && (
        <div className="mt-8">
          <SkeletonRows rows={3} />
        </div>
      )}

      {mounted && readings.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-center text-sm text-slate-600">
          <LineChart className="h-6 w-6 text-teal-400" />
          <span>
            Качи export от CGM-а си, за да видиш TIR + AGP. Поне 14 дни
            данни дават клинично значимо ниво — 30 дни е стандартът за
            доклади.
          </span>
        </div>
      )}

      {mounted && readings.length > 0 && (
        <>
          {isDemo && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <span>
                <span className="font-semibold">Демо данни.</span> 14 синтетични
                дни — показват как изглежда анализът. Изтрий, преди да качиш
                реален CSV.
              </span>
              <button
                onClick={onClear}
                className="ml-3 rounded-full border border-amber-300 px-3 py-1 font-medium hover:bg-amber-100"
              >
                Изтрий демо
              </button>
            </div>
          )}

          <div className="mt-2 mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              {windowed.length} стойности · {coverageDays} дни (последните{" "}
              {WINDOW_DAYS})
            </span>
            {!isDemo && (
              <button
                onClick={onClear}
                className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 hover:bg-rose-50"
              >
                Изтрий
              </button>
            )}
          </div>

          <CgmStatsCards tir={tir} vari={vari} />

          <CgmAgpChart bands={agp} />

          <CgmSpikeList spikes={spikes} />
        </>
      )}
    </div>
  );
}
