"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { TrendsData } from "@/lib/trends";
import { computeInsights } from "@/lib/trend-insights";
import { SkeletonRows } from "@/components/ui/Skeleton";
import TrendsHero from "./TrendsHero";
import TrendsInsights from "./TrendsInsights";
import TrendsSparkGrid from "./TrendsSparkGrid";

// Top-level container — handles auth gating, data fetch, loading + empty
// states. The page itself is sign-in-required (the underlying data lives
// on the server). Anonymous viewers see a sign-in nudge instead of an
// empty chart grid.

export default function TrendsModule() {
  const { status } = useSession();
  const [data, setData] = useState<TrendsData | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Hoisted above the early returns to satisfy rules-of-hooks; it's a
  // cheap pure call so the wasted work on the unauth/loading paths is
  // negligible.
  const insights = useMemo(
    () => (data ? computeInsights(data.days) : []),
    [data]
  );

  useEffect(() => {
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
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <SkeletonRows rows={6} />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-teal-700">Тренд</h1>
          <p className="mt-2 text-slate-600">
            Един view върху всичките ти модули — HOMA-IR, HbA1c, CGM, симптоми
            и дневна изпълняемост за последните 90 дни.
          </p>
        </header>
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-6 text-center">
          <p className="text-sm text-slate-700">
            Влез през Google, за да видиш тренда на показателите си.
          </p>
        </div>
      </div>
    );
  }

  const isEmpty = !data || data.summary.activeDays === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Тренд</h1>
        <p className="mt-2 text-slate-600">
          90-дневна времева линия на всички модули. Маркерите идват редки и
          точкови; симптомите ежедневни; CGM подава дневна агрегация (TIR /
          средно / вариативност); планът — % изпълнение за деня.
        </p>
      </header>

      {isEmpty ? (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-6 text-center text-sm text-slate-600">
          📊 Тук ще се появи тренд след първите ти записи. Започни от{" "}
          <a className="underline" href="/journal">
            Дневник
          </a>{" "}
          или{" "}
          <a className="underline" href="/markers">
            Показатели
          </a>
          .
        </div>
      ) : (
        <>
          <TrendsHero summary={data!.summary} />
          <TrendsInsights insights={insights} />
          <TrendsSparkGrid days={data!.days} />
        </>
      )}
    </div>
  );
}
