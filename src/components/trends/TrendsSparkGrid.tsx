"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendDay } from "@/lib/trends";

// Small-multiples grid — one mini chart per metric on a shared 90-day
// X-axis. Pattern: lots of context at a glance, no comparison needed
// between rows (each one has its own Y-scale). recharts' `connectNulls`
// stitches gappy series cleanly, so HOMA-IR with 2-3 data points still
// renders a meaningful line.

interface Props {
  days: TrendDay[];
}

interface MetricDef {
  key: keyof TrendDay;
  title: string;
  unit: string;
  color: string;
  /** Optional formatter for the tooltip number. */
  fmt?: (v: number) => string;
}

const METRICS: MetricDef[] = [
  {
    key: "homaIr",
    title: "HOMA-IR",
    unit: "",
    color: "#1B7A6E",
    fmt: (v) => v.toFixed(1),
  },
  {
    key: "hba1c",
    title: "HbA1c",
    unit: "%",
    color: "#06b6d4",
    fmt: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "cgmTir",
    title: "CGM TIR",
    unit: "%",
    color: "#1B7A6E",
    fmt: (v) => `${Math.round(v)}%`,
  },
  {
    key: "cgmMean",
    title: "CGM средно",
    unit: "mg/dL",
    color: "#06b6d4",
    fmt: (v) => `${Math.round(v)}`,
  },
  {
    key: "energy",
    title: "Енергия",
    unit: "/10",
    color: "#F5D060",
    fmt: (v) => `${v}/10`,
  },
  {
    key: "brainFog",
    title: "Brain fog",
    unit: "/10 ↑=по-зле",
    color: "#f97316",
    fmt: (v) => `${v}/10`,
  },
  {
    key: "weight",
    title: "Тегло",
    unit: "kg",
    color: "#1B7A6E",
    fmt: (v) => `${v.toFixed(1)} kg`,
  },
  {
    key: "planCompletePct",
    title: "Изпълнен план",
    unit: "%",
    color: "#1B7A6E",
    fmt: (v) => `${Math.round(v)}%`,
  },
];

export default function TrendsSparkGrid({ days }: Props) {
  // Drop metrics that have zero data — keeps the grid focused on what
  // the user actually tracks. (A first-week user with only plan checks
  // sees just the plan sparkline, not 7 empty boxes.)
  const visible = METRICS.filter((m) =>
    days.some((d) => typeof d[m.key] === "number")
  );

  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {visible.map((m) => (
        <Spark key={String(m.key)} metric={m} days={days} />
      ))}
    </div>
  );
}

function Spark({ metric, days }: { metric: MetricDef; days: TrendDay[] }) {
  // Recharts wants `null` (not undefined) for gaps when connectNulls is
  // on. We also strip the leading-zero gap by emitting the date label
  // only — the line component reads the metric.
  const data = days.map((d) => {
    const v = d[metric.key];
    return {
      date: d.date.slice(5), // MM-DD
      value: typeof v === "number" ? v : null,
    };
  });

  // Latest non-null value for the "current" badge on the top right.
  let latest: number | null = null;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].value !== null) {
      latest = data[i].value as number;
      break;
    }
  }

  // X-tick density: show ~6 evenly spaced labels (every 15 of 90 days).
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-700">
            {metric.title}
          </span>
          {metric.unit && (
            <span className="ml-1 text-[11px] text-slate-400">
              {metric.unit}
            </span>
          )}
        </div>
        {latest != null && (
          <span className="text-sm font-bold text-slate-800">
            {metric.fmt ? metric.fmt(latest) : latest}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval={14}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => {
              if (typeof v !== "number") return ["—", metric.title];
              return [metric.fmt ? metric.fmt(v) : String(v), metric.title];
            }}
            labelFormatter={(l) => `Дата ${l}`}
            contentStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={metric.color}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
