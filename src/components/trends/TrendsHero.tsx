"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { TrendsSummary } from "@/lib/trends";

// Hero strip — the 4 numbers a returning user cares about most:
//   latest HOMA-IR, latest HbA1c, latest CGM TIR, latest weight.
// Each card pairs the value with a delta arrow when we have a first→last
// pair available (HOMA-IR, weight). HbA1c + TIR show the date the latest
// reading came from, since they're often stale by days/weeks.
//
// "Better direction" is metric-aware: lower HOMA-IR is better; higher
// TIR is better; weight movement is colored only when the user has set
// a goal (we don't yet, so weight gets a neutral arrow with magnitude).

interface Props {
  summary: TrendsSummary;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}

export default function TrendsHero({ summary }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card
        title="HOMA-IR"
        value={summary.latest.homaIr?.value.toFixed(1) ?? "—"}
        sub={
          summary.delta.homaIr
            ? `${summary.delta.homaIr.pctChange > 0 ? "+" : ""}${
                summary.delta.homaIr.pctChange
              }% спрямо ${fmtDate(summary.latest.homaIr?.date)}`
            : summary.latest.homaIr
            ? `последен ${fmtDate(summary.latest.homaIr.date)}`
            : "няма данни"
        }
        delta={summary.delta.homaIr?.pctChange}
        betterDir="down"
      />
      <Card
        title="HbA1c"
        value={
          summary.latest.hba1c
            ? `${summary.latest.hba1c.value.toFixed(1)}%`
            : "—"
        }
        sub={
          summary.latest.hba1c
            ? `последен ${fmtDate(summary.latest.hba1c.date)}`
            : "няма данни"
        }
      />
      <Card
        title="CGM TIR"
        value={
          summary.latest.cgmTir ? `${summary.latest.cgmTir.value}%` : "—"
        }
        sub={
          summary.latest.cgmTir
            ? `последен ${fmtDate(summary.latest.cgmTir.date)}`
            : "няма данни"
        }
      />
      <Card
        title="Тегло"
        value={
          summary.latest.weight
            ? `${summary.latest.weight.value.toFixed(1)} kg`
            : "—"
        }
        sub={
          summary.delta.weight
            ? `${summary.delta.weight.deltaKg > 0 ? "+" : ""}${
                summary.delta.weight.deltaKg
              } kg за 90 дни`
            : summary.latest.weight
            ? `последно ${fmtDate(summary.latest.weight.date)}`
            : "няма данни"
        }
        delta={summary.delta.weight?.deltaKg}
        betterDir="down"
      />
    </div>
  );
}

function Card({
  title,
  value,
  sub,
  delta,
  betterDir,
}: {
  title: string;
  value: string;
  sub: string;
  delta?: number;
  betterDir?: "up" | "down";
}) {
  let DeltaIcon = Minus;
  let deltaColor = "text-slate-400";
  if (typeof delta === "number" && delta !== 0 && betterDir) {
    const isImprovement =
      (betterDir === "down" && delta < 0) ||
      (betterDir === "up" && delta > 0);
    DeltaIcon = delta > 0 ? ArrowUpRight : ArrowDownRight;
    deltaColor = isImprovement ? "text-teal-600" : "text-rose-500";
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {title}
        </div>
        {typeof delta === "number" && (
          <DeltaIcon className={`h-4 w-4 ${deltaColor}`} />
        )}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}
