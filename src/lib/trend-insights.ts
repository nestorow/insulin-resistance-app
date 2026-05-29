// Trend insight engine — pure functions over TrendDay[] that surface
// short, human-readable observations.
//
// Philosophy: each rule has to clear two bars before we display it:
//   1. enough samples to be non-random (per-rule minimum N below)
//   2. effect magnitude large enough that the user can act on it
// Below those thresholds the rule returns null and the UI just omits it
// — never show a "weak signal" framed as actionable, that erodes trust.
//
// All rules are local-data only — no external lookups, no medical
// thresholds beyond what the AGP consensus already establishes.

import type { TrendDay } from "./trends";

export type InsightKind =
  | "improvement"   // a metric moved in the desired direction
  | "concern"       // a metric moved in the wrong direction
  | "correlation"   // two metrics co-vary
  | "observation";  // factual, no implied valence

export interface TrendInsight {
  id: string; // stable for React keys
  kind: InsightKind;
  title_bg: string;
  detail_bg?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Small statistical helpers — kept inline so the file is self-contained.
// ─────────────────────────────────────────────────────────────────────

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function present<K extends keyof TrendDay>(
  days: TrendDay[],
  key: K
): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  for (const d of days) {
    const v = d[key];
    if (typeof v === "number") out.push({ date: d.date, value: v });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Rule: HOMA-IR direction over the window
// ─────────────────────────────────────────────────────────────────────

function homaIrTrend(days: TrendDay[]): TrendInsight | null {
  const xs = present(days, "homaIr");
  if (xs.length < 2) return null;
  const first = xs[0];
  const last = xs[xs.length - 1];
  const delta = last.value - first.value;
  const pct = (delta / first.value) * 100;
  // Threshold: 10% movement is the smallest change that's clinically
  // discussable for HOMA-IR (intra-assay CV is ~5-8%).
  if (Math.abs(pct) < 10) return null;
  if (delta < 0) {
    return {
      id: "homair-improving",
      kind: "improvement",
      title_bg: `HOMA-IR падна с ${Math.abs(Math.round(pct))}% за периода.`,
      detail_bg: `От ${first.value.toFixed(1)} (${fmt(first.date)}) до ${last.value.toFixed(
        1
      )} (${fmt(last.date)}). Това е директен сигнал за подобрена инсулинова чувствителност.`,
    };
  }
  return {
    id: "homair-rising",
    kind: "concern",
    title_bg: `HOMA-IR се покачи с ${Math.round(pct)}% за периода.`,
    detail_bg: `От ${first.value.toFixed(1)} (${fmt(first.date)}) до ${last.value.toFixed(
      1
    )} (${fmt(last.date)}). Преразгледай въглехидратите и графика на хранене.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Rule: weight delta over the window
// ─────────────────────────────────────────────────────────────────────

function weightTrend(days: TrendDay[]): TrendInsight | null {
  const xs = present(days, "weight");
  if (xs.length < 5) return null;
  const first = xs[0];
  const last = xs[xs.length - 1];
  const delta = Math.round((last.value - first.value) * 10) / 10;
  // 1 kg is the smallest movement that's robust to daily water variance.
  if (Math.abs(delta) < 1) return null;
  if (delta < 0) {
    return {
      id: "weight-down",
      kind: "improvement",
      title_bg: `${Math.abs(delta)} kg по-малко за периода.`,
      detail_bg: `Тегло пада постепенно — Bikman препоръчва да следиш и обиколка на талията: тя реагира преди везната когато горивото е мазнини, не вода.`,
    };
  }
  return {
    id: "weight-up",
    kind: "observation",
    title_bg: `Тегло +${delta} kg за периода.`,
    detail_bg: `Тегло варира с вода, гликоген и хормонална фаза. Ако в същия период обиколката на талията намалява, посоката е правилна.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Rule: CGM TIR average vs target (≥70%)
// ─────────────────────────────────────────────────────────────────────

function cgmTirRule(days: TrendDay[]): TrendInsight | null {
  const xs = present(days, "cgmTir");
  if (xs.length < 7) return null; // need at least a week of coverage
  const avg = Math.round(mean(xs.map((x) => x.value)));
  if (avg >= 70) {
    return {
      id: "tir-on-target",
      kind: "improvement",
      title_bg: `Средно TIR ${avg}% за ${xs.length} дни — над AGP target-а (≥70%).`,
      detail_bg: `Поддържаш глюкозата в зелената зона. Това е най-силният маркер за метаболитна стабилност в краткия времеви хоризонт.`,
    };
  }
  if (avg < 50) {
    return {
      id: "tir-low",
      kind: "concern",
      title_bg: `Средно TIR ${avg}% за ${xs.length} дни — под 50%.`,
      detail_bg: `Глюкозата прекарва повече от половината време извън 70–180 mg/dL. Качи CSV в /cgm, отвори AGP profile-а и потърси кои часове са най-проблемни (закуска? вечеря?).`,
    };
  }
  return {
    id: "tir-mid",
    kind: "observation",
    title_bg: `Средно TIR ${avg}% за ${xs.length} дни — в средната зона.`,
    detail_bg: `Target-ът е ≥70%. Виж кои пикове най-често пробиват 180 mg/dL в /cgm.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Rule: CGM TIR ↔ brain fog correlation
// ─────────────────────────────────────────────────────────────────────

function tirVsBrainFog(days: TrendDay[]): TrendInsight | null {
  const paired = days.filter(
    (d) => typeof d.cgmTir === "number" && typeof d.brainFog === "number"
  );
  if (paired.length < 10) return null; // need ≥10 paired days

  const heavy = paired.filter((d) => (d.brainFog as number) >= 7);
  const light = paired.filter((d) => (d.brainFog as number) <= 4);
  if (heavy.length < 3 || light.length < 3) return null;

  const tirHeavy = mean(heavy.map((d) => d.cgmTir as number));
  const tirLight = mean(light.map((d) => d.cgmTir as number));
  const diff = Math.round(tirLight - tirHeavy);
  // 10 pp difference is the smallest gap that's likely above noise for
  // 3-7 paired days per bucket.
  if (Math.abs(diff) < 10) return null;
  if (diff > 0) {
    return {
      id: "tir-vs-fog",
      kind: "correlation",
      title_bg: `В дни с brain fog ≥7 TIR-ът ти е средно ${diff} пр.п. по-нисък.`,
      detail_bg: `Сравнение: ${heavy.length} дни с тежък brain fog → TIR ${Math.round(
        tirHeavy
      )}%, срещу ${light.length} дни с лек brain fog → TIR ${Math.round(
        tirLight
      )}%. Колебанията в глюкозата често се усещат когнитивно първи.`,
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Rule: plan completion ↔ energy correlation
// ─────────────────────────────────────────────────────────────────────

function planVsEnergy(days: TrendDay[]): TrendInsight | null {
  const paired = days.filter(
    (d) =>
      typeof d.planCompletePct === "number" && typeof d.energy === "number"
  );
  if (paired.length < 10) return null;

  const high = paired.filter((d) => (d.planCompletePct as number) >= 80);
  const low = paired.filter((d) => (d.planCompletePct as number) < 50);
  if (high.length < 3 || low.length < 3) return null;

  const enHigh = mean(high.map((d) => d.energy as number));
  const enLow = mean(low.map((d) => d.energy as number));
  const diff = Math.round((enHigh - enLow) * 10) / 10;
  if (Math.abs(diff) < 1) return null;
  if (diff > 0) {
    return {
      id: "plan-vs-energy",
      kind: "correlation",
      title_bg: `В дни с план ≥80% изпълнен — енергията ти е средно +${diff} пункта.`,
      detail_bg: `Сравнение: ${high.length} дни с пълен план → енергия ${enHigh.toFixed(
        1
      )}/10, срещу ${low.length} дни с <50% → ${enLow.toFixed(1)}/10. Постоянството плаща.`,
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Rule: streak / consistency snapshot
// ─────────────────────────────────────────────────────────────────────

function activitySnapshot(days: TrendDay[]): TrendInsight | null {
  const active = days.filter((d) =>
    Object.keys(d).some((k) => k !== "date" && d[k as keyof TrendDay] != null)
  ).length;
  if (active === 0) return null;
  const pct = Math.round((active / days.length) * 100);
  return {
    id: "coverage",
    kind: "observation",
    title_bg: `Записани данни в ${active} от ${days.length} дни (${pct}%).`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Public — runs all rules, drops nulls.
// ─────────────────────────────────────────────────────────────────────

export function computeInsights(days: TrendDay[]): TrendInsight[] {
  return [
    homaIrTrend(days),
    weightTrend(days),
    cgmTirRule(days),
    tirVsBrainFog(days),
    planVsEnergy(days),
    activitySnapshot(days),
  ].filter((x): x is TrendInsight => x !== null);
}

function fmt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}
