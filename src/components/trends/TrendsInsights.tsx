"use client";

import {
  AlertTriangle,
  Eye,
  LineChart,
  TrendingUp,
} from "lucide-react";
import type { TrendInsight, InsightKind } from "@/lib/trend-insights";

// Insight cards — color + icon pair signals the kind without reading
// the title. Compact list, no expand/collapse — each detail is short
// enough to render inline.

interface Props {
  insights: TrendInsight[];
}

const KIND_STYLE: Record<
  InsightKind,
  { bg: string; ring: string; icon: typeof TrendingUp; iconColor: string }
> = {
  improvement: {
    bg: "bg-teal-50",
    ring: "ring-teal-100",
    icon: TrendingUp,
    iconColor: "text-teal-600",
  },
  concern: {
    bg: "bg-rose-50",
    ring: "ring-rose-100",
    icon: AlertTriangle,
    iconColor: "text-rose-600",
  },
  correlation: {
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    icon: LineChart,
    iconColor: "text-amber-700",
  },
  observation: {
    bg: "bg-slate-50",
    ring: "ring-slate-100",
    icon: Eye,
    iconColor: "text-slate-500",
  },
};

export default function TrendsInsights({ insights }: Props) {
  if (insights.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Открити моменти
      </h2>
      <div className="space-y-2">
        {insights.map((ins) => {
          const s = KIND_STYLE[ins.kind];
          const Icon = s.icon;
          return (
            <div
              key={ins.id}
              className={`flex gap-3 rounded-2xl ${s.bg} p-4 ring-1 ${s.ring}`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${s.iconColor}`} />
              <div className="text-sm">
                <p className="font-semibold text-slate-800">{ins.title_bg}</p>
                {ins.detail_bg && (
                  <p className="mt-1 leading-relaxed text-slate-600">
                    {ins.detail_bg}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
