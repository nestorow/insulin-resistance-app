"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sunrise, Sun, Moon, CalendarDays, CalendarRange, Target, Check } from "lucide-react";
import { checklistItems, itemText, type ChecklistItem } from "@/data/protocol";
import { tierFromYesCount } from "@/lib/onboarding";
import { loadOnboarding } from "@/lib/onboarding-storage";
import type { OnboardingResult } from "@/lib/onboarding";
import { getDayChecks, toggleDayCheck, todayKey } from "@/lib/daily-plan-storage";
import { programPhase, milestoneMessage } from "@/lib/program-phases";
import ProgressCard from "@/components/plan/ProgressCard";

const DAILY = [
  { key: "morning", label: "Сутрин", Icon: Sunrise },
  { key: "day", label: "През деня", Icon: Sun },
  { key: "evening", label: "Вечер", Icon: Moon },
] as const;

const PERIODIC = [
  { key: "weekly", label: "Седмично", Icon: CalendarDays },
  { key: "monthly", label: "Месечно", Icon: CalendarRange },
] as const;

export default function DailyPlanModule() {
  const [mounted, setMounted] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingResult | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const date = todayKey();

  useEffect(() => {
    setOnboarding(loadOnboarding());
    setChecks(getDayChecks(date));
    setMounted(true);
  }, [date]);

  const tier = useMemo(
    () => (onboarding ? tierFromYesCount(onboarding.quizYesCount) : null),
    [onboarding]
  );

  const dayNumber = useMemo(() => {
    if (!onboarding) return null;
    const start = new Date(onboarding.completedAt).getTime();
    const n = Math.floor((Date.now() - start) / 86_400_000) + 1;
    return Math.min(Math.max(n, 1), 90);
  }, [onboarding]);

  // Anonymous / pre-onboarding visitors see the day-1 view (phase 1).
  const effectiveDay = dayNumber ?? 1;
  const phase = programPhase(effectiveDay);
  const milestone = dayNumber !== null ? milestoneMessage(dayNumber) : null;

  // Apply progression + tier restriction:
  // - drop items not yet unlocked (availableFromDay > today)
  // - drop tier-specific items that don't match the user's tier
  //   (no tier yet = anonymous; treat as "none" for visibility purposes)
  const effectiveTier = tier?.tier ?? "none";
  function visibleItems(category: ChecklistItem["category"]) {
    return checklistItems.filter(
      (i) =>
        i.category === category &&
        (i.availableFromDay ?? 1) <= effectiveDay &&
        (i.tiers === undefined || i.tiers.includes(effectiveTier))
    );
  }

  const dailyItems = useMemo(
    () =>
      checklistItems.filter(
        (i) =>
          ["morning", "day", "evening"].includes(i.category) &&
          (i.availableFromDay ?? 1) <= effectiveDay &&
          (i.tiers === undefined || i.tiers.includes(effectiveTier))
      ),
    [effectiveDay, effectiveTier]
  );
  const doneCount = dailyItems.filter((i) => checks[i.id]).length;

  function onToggle(id: string) {
    setChecks(toggleDayCheck(date, id));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Дневен план</h1>
        <p className="mt-2 text-slate-600">
          Ежедневните навици, които свалят инсулина. Отмятай ги през деня.
        </p>
      </header>

      {/* Status strip */}
      {mounted && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {dayNumber !== null && (
            <span className="rounded-full bg-teal-500 px-3 py-1 text-sm font-semibold text-white">
              Ден {dayNumber} / 90
            </span>
          )}
          <span className="rounded-full bg-teal-700 px-3 py-1 text-sm font-semibold text-white">
            Фаза {phase.index} · {phase.name_bg}
          </span>
          {tier && tier.carbCap && (
            <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
              Въглехидрати: под {tier.carbCap} г/ден
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {doneCount} / {dailyItems.length} изпълнени днес
          </span>
        </div>
      )}

      {/* Phase explainer — sets expectation for this 14-30-day window */}
      {mounted && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-teal-100 bg-white p-4">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
          <div className="text-sm text-slate-700">
            <div className="font-semibold text-teal-700">
              {phase.range_bg} · {phase.name_bg}
            </div>
            <p className="mt-1 leading-relaxed text-slate-600">{phase.goal_bg}</p>
          </div>
        </div>
      )}

      {/* Gamification — streak / level / badges (signed-in only) */}
      <ProgressCard />

      {/* Milestone celebration — only on the exact day */}
      {mounted && milestone && (
        <div className="mb-6 rounded-2xl border border-warm/40 bg-warm-light/40 p-4 text-sm font-medium text-slate-800">
          {milestone}
        </div>
      )}

      {/* No onboarding yet */}
      {mounted && !onboarding && (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
          Направи краткия тест, за да персонализираме плана според нивото ти.{" "}
          <Link href="/onboarding" className="font-semibold text-teal-700 underline">
            Започни теста
          </Link>
        </div>
      )}

      {/* Daily checklist */}
      <div className="space-y-5">
        {DAILY.map(({ key, label, Icon }) => {
          const items = visibleItems(key);
          if (items.length === 0) return null;
          return (
            <section key={key}>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Icon className="h-4 w-4 text-teal-500" />
                {label}
              </div>
              <ul className="space-y-2">
                {items.map((i) => {
                  const done = !!checks[i.id];
                  const text = itemText(i, phase.index);
                  return (
                    <li key={i.id}>
                      <button
                        onClick={() => onToggle(i.id)}
                        aria-pressed={done}
                        className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                          done
                            ? "border-teal-300 bg-teal-50 text-slate-500 line-through"
                            : "border-teal-100 bg-white text-slate-700 hover:border-teal-200"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                            done
                              ? "border-teal-500 bg-teal-500 text-white"
                              : "border-teal-300"
                          }`}
                        >
                          {done && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                        <span className="flex-1">{text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Periodic reference */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERIODIC.map(({ key, label, Icon }) => {
          const items = visibleItems(key);
          if (items.length === 0) return null;
          return (
            <section key={key} className="rounded-2xl border border-teal-100 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Icon className="h-4 w-4 text-teal-500" />
                {label}
              </div>
              <ul className="space-y-1.5">
                {items.map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                    {itemText(i, phase.index)}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
