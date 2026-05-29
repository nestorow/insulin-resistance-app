"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Recharts-only chart, extracted from MarkersModule so the form + entry
// list render before the ~80kB chart bundle arrives. connectNulls keeps
// the line continuous across months that didn't log every metric.

interface Point {
  date: string;
  "HOMA-IR": number | null;
  Инсулин: number | null;
}

interface Props {
  data: Point[];
}

export default function MarkersTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F5F0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="HOMA-IR" stroke="#1B7A6E" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="Инсулин" stroke="#06b6d4" strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
