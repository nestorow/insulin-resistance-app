"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { TrendsData } from "@/lib/trends";
import { loadOnboarding } from "@/lib/onboarding-storage";
import { computeInsights } from "@/lib/trend-insights";
import { protocolDay } from "@/lib/protocol-day";
import type { OnboardingResult } from "@/lib/onboarding";
import { LENSES } from "@/lib/onboarding";

// Print-friendly trends view — single-column, A4-shaped, no nav.
// Composes the same data as /trends but laid out for paper: latest
// values up top, summary chart-less, insights enumerated, sparkgrid
// (lazy-loaded) below if the user wants a quick visual.

export default function TrendsPrintView() {
  const { status } = useSession();
  const [data, setData] = useState<TrendsData | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOnboarding(loadOnboarding());
    if (status !== "authenticated") {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { getTrendsAction } = await import("@/lib/actions/trends");
        const result = await getTrendsAction();
        if (!cancelled) setData(result);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-slate-500">
        Зареждам данните…
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-slate-500">
        Влез в системата, за да отвориш този печатен изглед.
      </div>
    );
  }

  if (!data || data.summary.activeDays === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-slate-500">
        Няма записани данни за този период.
      </div>
    );
  }

  const insights = computeInsights(data.days);
  const lens =
    onboarding && LENSES.find((l) => l.id === onboarding.lens)?.title_bg;
  const pos =
    onboarding?.completedAt ? protocolDay(onboarding.completedAt) : null;

  const printedOn = new Date().toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-6 py-8 text-[12pt] text-slate-900 print:py-2 print:text-[10pt]">
      {/* Print-only screen affordance: a "Print" button at the top, hidden
          when actually printing. */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
        <a
          href="/trends"
          className="text-sm text-teal-700 underline-offset-2 hover:underline"
        >
          ← Назад към интерактивния изглед
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          Печат / Запази като PDF
        </button>
      </div>

      {/* Header */}
      <header className="mb-6 border-b-2 border-teal-600 pb-4">
        <h1 className="text-2xl font-bold text-teal-700">
          InsulinReset · Тренд за лекар
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Период: {data.summary.windowStart} — {data.summary.windowEnd} ·
          Отпечатано: {printedOn}
        </p>
        {pos && (
          <p className="mt-1 text-sm text-slate-600">
            Ден {pos.day} от 90 · Фаза {pos.phase.index}: {pos.phase.name_bg}
            {lens && ` · Профил: ${lens}`}
          </p>
        )}
      </header>

      {/* Key numbers — laid out as a 4-column grid for paper */}
      <section className="mb-6">
        <h2 className="mb-3 text-base font-bold text-slate-800">
          Ключови показатели
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left">
              <th className="py-1.5 font-semibold">Показател</th>
              <th className="py-1.5 font-semibold">Последно</th>
              <th className="py-1.5 font-semibold">Дата</th>
              <th className="py-1.5 font-semibold">Δ за периода</th>
            </tr>
          </thead>
          <tbody>
            <Row
              label="HOMA-IR"
              latest={data.summary.latest.homaIr?.value.toFixed(1)}
              date={data.summary.latest.homaIr?.date}
              delta={
                data.summary.delta.homaIr
                  ? `${data.summary.delta.homaIr.pctChange > 0 ? "+" : ""}${
                      data.summary.delta.homaIr.pctChange
                    }%`
                  : undefined
              }
            />
            <Row
              label="HbA1c"
              latest={
                data.summary.latest.hba1c
                  ? `${data.summary.latest.hba1c.value.toFixed(1)}%`
                  : undefined
              }
              date={data.summary.latest.hba1c?.date}
            />
            <Row
              label="CGM TIR (70–180 mg/dL)"
              latest={
                data.summary.latest.cgmTir
                  ? `${data.summary.latest.cgmTir.value}%`
                  : undefined
              }
              date={data.summary.latest.cgmTir?.date}
            />
            <Row
              label="Тегло"
              latest={
                data.summary.latest.weight
                  ? `${data.summary.latest.weight.value.toFixed(1)} kg`
                  : undefined
              }
              date={data.summary.latest.weight?.date}
              delta={
                data.summary.delta.weight
                  ? `${
                      data.summary.delta.weight.deltaKg > 0 ? "+" : ""
                    }${data.summary.delta.weight.deltaKg} kg`
                  : undefined
              }
            />
          </tbody>
        </table>
      </section>

      {/* Insights */}
      {insights.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-base font-bold text-slate-800">
            Открити моменти
          </h2>
          <ul className="space-y-2">
            {insights.map((ins) => (
              <li key={ins.id} className="text-sm">
                <span className="font-medium text-slate-800">
                  {kindLabel(ins.kind)} · {ins.title_bg}
                </span>
                {ins.detail_bg && (
                  <p className="mt-0.5 text-slate-600">{ins.detail_bg}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Coverage / methodology */}
      <section className="mb-6">
        <h2 className="mb-3 text-base font-bold text-slate-800">
          Покритие на данните
        </h2>
        <p className="text-sm text-slate-700">
          Записани показатели в {data.summary.activeDays} от{" "}
          {data.days.length} дни ({" "}
          {Math.round((data.summary.activeDays / data.days.length) * 100)}% от
          прозореца).
        </p>
        <p className="mt-2 text-[10pt] text-slate-500">
          Методология: HOMA-IR и HbA1c са кръвни маркери от лаборатория. CGM
          стойностите идват от FreeStyle Libre / Dexcom Clarity. TIR (Time in
          Range) се изчислява по AGP консенсуса (Battelino 2019). GMI се
          изчислява по Bergenstal 2018 (3.31 + 0.02392 × средна глюкоза в
          mg/dL). Spike detection: ≥40 mg/dL над 60-min trough.
        </p>
      </section>

      <footer className="border-t border-slate-200 pt-3 text-[9pt] text-slate-500">
        Този отчет е генериран от InsulinReset (insulin-resistance-app.vercel.app).
        Образователно средство — не замества медицински съвет или диагноза.
      </footer>
    </article>
  );
}

function Row({
  label,
  latest,
  date,
  delta,
}: {
  label: string;
  latest?: string;
  date?: string;
  delta?: string;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1.5">{label}</td>
      <td className="py-1.5 font-medium">{latest ?? "—"}</td>
      <td className="py-1.5 text-slate-500">{date ?? "—"}</td>
      <td className="py-1.5">{delta ?? "—"}</td>
    </tr>
  );
}

function kindLabel(k: string): string {
  switch (k) {
    case "improvement":
      return "Подобрение";
    case "concern":
      return "За преглед";
    case "correlation":
      return "Корелация";
    default:
      return "Наблюдение";
  }
}
