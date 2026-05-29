"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarCheck, Gauge, Award, type LucideIcon } from "lucide-react";

interface Snapshot {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  badgesEarned: string[];
}

// Renders a compact streak + level card under the phase explainer on
// /plan. Anonymous users get nothing (gamification needs signed-in
// continuous history). The component fetches via dynamic import to
// keep the gamification chunk out of anonymous-visitor cold loads.

export default function ProgressCard() {
  const { status } = useSession();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { getProgressAction } = await import(
          "@/lib/actions/gamification"
        );
        const result = await getProgressAction();
        if (!cancelled) {
          setSnap(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status !== "authenticated") return null;
  if (loading || !snap) return null;
  if (snap.totalXp === 0 && snap.currentStreak === 0) return null;

  const xpInLevel = snap.totalXp - snap.xpForCurrentLevel;
  const xpRange = snap.xpForNextLevel - snap.xpForCurrentLevel;
  const pct = Math.min(100, Math.max(0, Math.round((xpInLevel / xpRange) * 100)));

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {/* Streak */}
      <Stat
        Icon={CalendarCheck}
        label="Поредни дни"
        primary={`${snap.currentStreak}`}
        secondary={
          snap.longestStreak > snap.currentStreak
            ? `Рекорд: ${snap.longestStreak}`
            : "Това е твоят рекорд"
        }
        accent="warm"
      />

      {/* Level + XP */}
      <Stat
        Icon={Gauge}
        label={`Ниво ${snap.level}`}
        primary={`${snap.totalXp} XP`}
        secondary={
          snap.xpForNextLevel > snap.totalXp
            ? `${snap.xpForNextLevel - snap.totalXp} XP до ниво ${snap.level + 1}`
            : "Максимално ниво"
        }
        bar={pct}
        accent="teal"
      />

      {/* Badges count */}
      <Stat
        Icon={Award}
        label="Значки"
        primary={`${snap.badgesEarned.length}`}
        secondary="Виж в Настройки"
        accent="teal"
      />
    </div>
  );
}

function Stat({
  Icon,
  label,
  primary,
  secondary,
  bar,
  accent,
}: {
  Icon: LucideIcon;
  label: string;
  primary: string;
  secondary: string;
  bar?: number;
  accent: "teal" | "warm";
}) {
  const ring = accent === "warm" ? "ring-warm-light" : "ring-teal-100";
  const iconBg = accent === "warm" ? "bg-warm-light text-warning" : "bg-teal-50 text-teal-600";
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ring-1 ${ring} border-transparent`}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-800">{primary}</div>
      <div className="mt-1 text-xs text-slate-500">{secondary}</div>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-teal-500 transition-[width] duration-500"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}
