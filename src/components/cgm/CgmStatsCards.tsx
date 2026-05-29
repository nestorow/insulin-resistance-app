"use client";

import type { TirBreakdown, Variability } from "@/lib/cgm-stats";

// Stats summary cards: TIR (with 5-zone stacked bar) + variability
// numbers (mean, CV, GMI). Color thresholds follow the AGP consensus:
// TIR ≥70% green, 50–70% amber, <50% red. CV ≤36% green, ≤45% amber,
// otherwise red. GMI gets a passive teal — the implication is left to
// the educational copy below.

interface Props {
  tir: TirBreakdown;
  vari: Variability;
}

function tirColor(tir: number): string {
  if (tir >= 70) return "text-teal-700 bg-teal-50";
  if (tir >= 50) return "text-amber-700 bg-amber-50";
  return "text-rose-700 bg-rose-50";
}

function cvColor(cv: number): string {
  if (cv <= 36) return "text-teal-700 bg-teal-50";
  if (cv <= 45) return "text-amber-700 bg-amber-50";
  return "text-rose-700 bg-rose-50";
}

export default function CgmStatsCards({ tir, vari }: Props) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="Time-in-Range"
        value={`${tir.tir}%`}
        sub="70–180 mg/dL"
        accent={tirColor(tir.tir)}
      />
      <StatCard
        title="Вариативност"
        value={`${vari.cv}%`}
        sub={`CV · σ=${vari.sd} mg/dL`}
        accent={cvColor(vari.cv)}
      />
      <StatCard
        title="Среден GMI"
        value={`${vari.gmi}%`}
        sub={`mean=${vari.mean} mg/dL`}
        accent="text-teal-700 bg-teal-50"
      />
      <StatCard
        title="Стойности"
        value={String(vari.count)}
        sub="в прозореца"
        accent="text-slate-700 bg-slate-100"
      />

      {/* 5-zone TIR stacked bar — across all 4 cards on mobile. */}
      <div className="col-span-2 mt-1 md:col-span-4">
        <div className="overflow-hidden rounded-full">
          <div className="flex h-3 w-full">
            <Bar pct={tir.veryLow} cls="bg-rose-500" />
            <Bar pct={tir.low} cls="bg-amber-400" />
            <Bar pct={tir.inRange} cls="bg-teal-500" />
            <Bar pct={tir.high} cls="bg-amber-300" />
            <Bar pct={tir.veryHigh} cls="bg-rose-400" />
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>&lt;54: {tir.veryLow}%</span>
          <span>54–69: {tir.low}%</span>
          <span>70–180: {tir.inRange}%</span>
          <span>181–250: {tir.high}%</span>
          <span>&gt;250: {tir.veryHigh}%</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ${accent}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-[11px] opacity-70">{sub}</div>
    </div>
  );
}

function Bar({ pct, cls }: { pct: number; cls: string }) {
  if (pct <= 0) return null;
  return <div className={cls} style={{ width: `${pct}%` }} />;
}
