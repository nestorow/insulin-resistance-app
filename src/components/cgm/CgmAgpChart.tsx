"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourBand } from "@/lib/cgm-stats";
import { TIR_HIGH, TIR_LOW } from "@/lib/cgm";

// Ambulatory Glucose Profile chart (Battelino 2019 standard).
// Two overlaid ribbons + median line, against a shaded TIR band:
//   - outer ribbon: p10–p90 (light teal, 80% of days fall within)
//   - inner ribbon: p25–p75 (deeper teal, IQR)
//   - median line: p50 (solid teal)
//   - background band 70–180 mg/dL: visual TIR reference
//
// Hours with no data render with all percentiles=0; we skip those
// gaps by mapping them to nulls and using `connectNulls`.

interface Props {
  bands: HourBand[];
}

function fmtHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function CgmAgpChart({ bands }: Props) {
  // Recharts AreaChart wants stacked "bands" — to draw p10–p90 we plot
  // (p10) + (p90 - p10) as two stacked areas with the lower invisible.
  // Same trick for p25–p75. Empty hours → null so the line breaks.
  const data = bands.map((b) => {
    if (b.count === 0) {
      return { hour: fmtHour(b.hour), median: null };
    }
    return {
      hour: fmtHour(b.hour),
      p10: b.p10,
      p10to90: b.p90 - b.p10,
      p25: b.p25,
      p25to75: b.p75 - b.p25,
      median: b.p50,
    };
  });

  return (
    <div className="mt-6 rounded-2xl border border-teal-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          24-часов AGP профил
        </h2>
        <span className="text-[11px] text-slate-500">
          ribbon = p10–p90 (външен), p25–p75 (вътрешен), линия = медиана
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8F5F0" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10 }}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            domain={[40, "auto"]}
            label={{
              value: "mg/dL",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#64748b" },
            }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "median") return [`${value} mg/dL`, "медиана"];
              // Hide the helper area series from the tooltip — they're
              // visual ribbons, not user-facing data points.
              return ["", ""];
            }}
            labelFormatter={(l) => `Час ${l}`}
            contentStyle={{ fontSize: 12 }}
          />
          {/* TIR reference band 70–180. */}
          <ReferenceArea
            y1={TIR_LOW}
            y2={TIR_HIGH}
            fill="#1B7A6E"
            fillOpacity={0.05}
            strokeOpacity={0}
          />
          {/* Outer ribbon (p10–p90): invisible base + visible band. */}
          <Area
            type="monotone"
            dataKey="p10"
            stackId="outer"
            stroke="transparent"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="p10to90"
            stackId="outer"
            stroke="transparent"
            fill="#1B7A6E"
            fillOpacity={0.15}
            isAnimationActive={false}
          />
          {/* Inner ribbon (p25–p75). */}
          <Area
            type="monotone"
            dataKey="p25"
            stackId="inner"
            stroke="transparent"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="p25to75"
            stackId="inner"
            stroke="transparent"
            fill="#1B7A6E"
            fillOpacity={0.3}
            isAnimationActive={false}
          />
          {/* Median line on top. */}
          <Line
            type="monotone"
            dataKey="median"
            stroke="#1B7A6E"
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
