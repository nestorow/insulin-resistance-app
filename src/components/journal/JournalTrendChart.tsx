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

// Recharts-only chart, extracted from SymptomJournalModule so the form +
// list can render before the ~80kB chart bundle arrives.

interface Point {
  date: string;
  Енергия: number;
  "Brain fog": number;
}

interface Props {
  data: Point[];
}

export default function JournalTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F5F0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="Енергия" stroke="#1B7A6E" strokeWidth={2} />
        <Line type="monotone" dataKey="Brain fog" stroke="#f97316" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
