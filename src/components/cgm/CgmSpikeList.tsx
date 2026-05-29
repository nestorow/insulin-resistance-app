"use client";

import type { GlucoseSpike } from "@/lib/cgm-stats";

// Auto-detected glucose spikes (≥40 mg/dL rise from 60-min trough,
// 90-min cooldown). Sorted by peak time descending — newest first.
// Manual meal annotations land in a follow-up commit; for now the row
// shows the timestamp + rise so the user can correlate with memory.

interface Props {
  spikes: GlucoseSpike[];
}

function fmtTs(ts: string): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}`;
}

function severityClass(rise: number): string {
  if (rise >= 80) return "text-rose-700 bg-rose-50";
  if (rise >= 60) return "text-amber-700 bg-amber-50";
  return "text-teal-700 bg-teal-50";
}

export default function CgmSpikeList({ spikes }: Props) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Открити пикове ({spikes.length})
        </h2>
        <span className="text-[11px] text-slate-500">
          ≥40 mg/dL над 60-min baseline
        </span>
      </div>
      {spikes.length === 0 ? (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 text-center text-sm text-slate-600">
          🎯 Няма пикове ≥40 mg/dL в прозореца — индикатор за стабилна
          глюкоза, което Bikman свързва с по-добра insulin sensitivity.
        </div>
      ) : (
        <div className="space-y-2">
          {[...spikes].reverse().map((s) => (
            <div
              key={s.peakTs}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-teal-100 bg-white p-3 text-sm"
            >
              <span className="font-medium text-slate-700">
                {fmtTs(s.peakTs)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityClass(
                  s.riseMgdl
                )}`}
              >
                +{s.riseMgdl} mg/dL
              </span>
              <span className="text-slate-500">
                пик {s.peakMgdl} от baseline {s.baselineMgdl}
              </span>
              <span className="text-slate-400">
                за {s.riseDurationMin} мин
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
