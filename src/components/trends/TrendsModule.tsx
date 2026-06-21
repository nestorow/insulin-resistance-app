"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import type { TrendsData } from "@/lib/trends";
import { buildTrendsFromLocal } from "@/lib/trends-local";
import { computeInsights } from "@/lib/trend-insights";
import type { AnnotationMap } from "@/lib/day-annotations";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { LineChart, FileText } from "lucide-react";
import TrendsAnnotationsEditor from "./TrendsAnnotationsEditor";
import TrendsHero from "./TrendsHero";
import TrendsInsights from "./TrendsInsights";
import TrendsPhaseCard from "./TrendsPhaseCard";

// SparkGrid loads recharts (~80kB). Splitting it out keeps the initial
// /trends paint cheap — hero + insights stream first, the chart grid
// drops in once recharts arrives.
const TrendsSparkGrid = dynamic(() => import("./TrendsSparkGrid"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[126px] rounded-2xl border border-teal-100 bg-white p-4"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-teal-50" />
          <div className="mt-4 h-16 w-full animate-pulse rounded bg-teal-50/60" />
        </div>
      ))}
    </div>
  ),
});

// Top-level container — handles auth gating, data fetch, loading + empty
// states. The page itself is sign-in-required (the underlying data lives
// on the server). Anonymous viewers see a sign-in nudge instead of an
// empty chart grid.

export default function TrendsModule() {
  const { status } = useSession();
  const [data, setData] = useState<TrendsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationMap>({});

  // Hoisted above the early returns to satisfy rules-of-hooks; it's a
  // cheap pure call so the wasted work on the unauth/loading paths is
  // negligible.
  const insights = useMemo(
    () => (data ? computeInsights(data.days) : []),
    [data]
  );

  useEffect(() => {
    // Wait for the session to resolve so the (authenticated-only) server
    // fallback can run; the local read itself works offline / anonymous.
    if (status === "loading") return;
    let cancelled = false;
    (async () => {
      try {
        // Primary source: whatever the user has actually recorded locally.
        // This is what fixes the "empty trends despite data" bug — the data
        // lives in localStorage and may not have synced to the server yet.
        let result = buildTrendsFromLocal();
        // Fallback: a freshly signed-in device with an empty local cache can
        // still hydrate the timeline from the server.
        if (result.summary.activeDays === 0 && status === "authenticated") {
          try {
            const { getTrendsAction } = await import("@/lib/actions/trends");
            const server = await getTrendsAction();
            if (server && server.summary.activeDays > 0) result = server;
          } catch {
            // keep the (empty) local result — offline / server error
          }
        }
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

  const isEmpty = !data || data.summary.activeDays === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-teal-700">Тренд</h1>
          <p className="mt-2 text-slate-600">
            90-дневна времева линия на всички модули. Маркерите идват редки и
            точкови; симптомите ежедневни; CGM подава дневна агрегация (TIR /
            средно / вариативност); планът — % изпълнение за деня.
          </p>
        </div>
        {!isEmpty && (
          <a
            href="/trends/print"
            className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50"
          >
            <FileText className="h-3.5 w-3.5" /> PDF за лекар
          </a>
        )}
      </header>

      {isEmpty ? (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-6 text-center text-sm text-slate-600">
          <LineChart className="mr-1 inline h-4 w-4 text-teal-400" /> Тук ще се появи тренд след първите ти записи. Започни от{" "}
          <a className="underline" href="/journal">
            Дневник
          </a>{" "}
          или{" "}
          <a className="underline" href="/markers">
            Показатели
          </a>
          .
          {status !== "authenticated" && (
            <p className="mt-3 text-xs text-slate-500">
              Влез през Google, за да синхронизираш записите си между устройства.
            </p>
          )}
        </div>
      ) : (
        <>
          <TrendsPhaseCard />
          <TrendsHero summary={data!.summary} />
          <TrendsInsights insights={insights} />
          <TrendsAnnotationsEditor onChange={setAnnotations} />
          <TrendsSparkGrid days={data!.days} annotations={annotations} />
        </>
      )}
    </div>
  );
}
