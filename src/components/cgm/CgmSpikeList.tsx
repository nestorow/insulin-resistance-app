"use client";

import { useEffect, useState } from "react";
import type { GlucoseSpike } from "@/lib/cgm-stats";
import {
  AnnotationMap,
  MAX_NOTE_LEN,
  getCgmAnnotations,
  setCgmAnnotation,
} from "@/lib/cgm-annotations";
import { showToast } from "@/lib/toast";
import { ShieldCheck, Utensils } from "lucide-react";

// Auto-detected glucose spikes (>=40 mg/dL rise from 60-min trough,
// 90-min cooldown). Each row has an inline editor for a short label
// the user can attach ("банан", "пица + бира"), which lets the
// biohacker correlate food with peaks over time.

interface Props {
  spikes: GlucoseSpike[];
}

function fmtTs(ts: string): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  // ДД.ММ ЧЧ:ММ — Bulgarian day-first order.
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}`;
}

function severityClass(rise: number): string {
  if (rise >= 80) return "text-rose-700 bg-rose-50";
  if (rise >= 60) return "text-amber-700 bg-amber-50";
  return "text-teal-700 bg-teal-50";
}

export default function CgmSpikeList({ spikes }: Props) {
  const [annotations, setAnnotations] = useState<AnnotationMap>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setAnnotations(getCgmAnnotations());
  }, []);

  function startEdit(peakTs: string) {
    setEditing(peakTs);
    setDraft(annotations[peakTs] ?? "");
  }

  function commitEdit() {
    if (editing === null) return;
    const { local, pending } = setCgmAnnotation(editing, draft);
    setAnnotations(local);
    setEditing(null);
    setDraft("");
    showToast(draft.trim() ? "Запазено." : "Изтрита.");

    // Rollback on rate-limit — re-fetch from local (server didn't land).
    pending.then((outcome) => {
      if (outcome === "rejected") {
        showToast("Сървърът отказа (твърде много заявки).");
      }
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Открити пикове ({spikes.length})
        </h2>
        <span className="text-xs text-slate-500">
          ≥40 mg/dL над 60-min baseline · кликни за бележка
        </span>
      </div>
      {spikes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/40 p-4 text-center text-sm text-slate-600">
          <ShieldCheck className="h-6 w-6 text-teal-400" />
          <span>
            Няма пикове ≥40 mg/dL в прозореца — индикатор за стабилна
            глюкоза, което Bikman свързва с по-добра insulin sensitivity.
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {[...spikes].reverse().map((s) => {
            const note = annotations[s.peakTs];
            const isEditing = editing === s.peakTs;
            return (
              <div
                key={s.peakTs}
                className="rounded-xl border border-teal-100 bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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

                {isEditing ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={draft}
                      maxLength={MAX_NOTE_LEN}
                      placeholder="Какво яде? (банан, пица, кафе с мляко…)"
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") {
                          setEditing(null);
                          setDraft("");
                        }
                      }}
                      className="flex-1 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
                    />
                    <button
                      onClick={commitEdit}
                      className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                    >
                      Запази
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(s.peakTs)}
                    className="mt-2 block w-full rounded-lg border border-dashed border-teal-100 px-3 py-1.5 text-left text-xs text-slate-500 hover:border-teal-300 hover:bg-teal-50/50"
                  >
                    {note ? (
                      <span className="text-slate-700">
                        <Utensils className="mr-1 inline h-3.5 w-3.5" />
                        {note}{" "}
                        <span className="text-teal-600 underline">редактирай</span>
                      </span>
                    ) : (
                      "+ добави бележка (храна / контекст)"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
