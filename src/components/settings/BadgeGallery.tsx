"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Footprints,
  TestTube,
  CalendarCheck,
  Trophy,
  Award,
  type LucideIcon,
} from "lucide-react";

interface Snapshot {
  badgesEarned: string[];
}

// Static mirror of BADGES from src/lib/gamification.ts — kept here so
// the client doesn't import the server module (which pulls in db).
const BADGE_DISPLAY: {
  id: string;
  name_bg: string;
  description_bg: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "first_check",
    name_bg: "Първа крачка",
    description_bg: "Първа отметка в дневния план.",
    Icon: Footprints,
  },
  {
    id: "first_marker",
    name_bg: "Първа кръв",
    description_bg: "Първи запис на кръвни маркери.",
    Icon: TestTube,
  },
  {
    id: "week_streak",
    name_bg: "7 дни в ред",
    description_bg: "Една седмица без прекъсване.",
    Icon: CalendarCheck,
  },
  {
    id: "month_streak",
    name_bg: "30 дни в ред",
    description_bg: "Един месец постоянство.",
    Icon: Trophy,
  },
  {
    id: "ninety_streak",
    name_bg: "Финал",
    description_bg: "Цял 90-дневен протокол.",
    Icon: Award,
  },
];

export default function BadgeGallery() {
  const { status } = useSession();
  const [earned, setEarned] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const { getProgressAction } = await import(
          "@/lib/actions/gamification"
        );
        const snap = (await getProgressAction()) as Snapshot | null;
        if (!cancelled) {
          setEarned(new Set(snap?.badgesEarned ?? []));
        }
      } catch {
        if (!cancelled) setEarned(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Значки</h2>
      <p className="mb-4 text-sm text-slate-500">
        Покажи постоянство. Спечелените грейват в teal; останалите чакат
        своя ред.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {BADGE_DISPLAY.map((b) => {
          const isEarned = earned?.has(b.id) ?? false;
          return (
            <div
              key={b.id}
              className={`flex flex-col items-center rounded-xl border p-3 text-center transition-colors ${
                isEarned
                  ? "border-teal-200 bg-teal-50"
                  : "border-slate-100 bg-slate-50/50"
              }`}
              title={b.description_bg}
            >
              <b.Icon
                className={`mb-2 h-7 w-7 ${
                  isEarned ? "text-teal-600" : "text-slate-300"
                }`}
              />
              <span
                className={`text-xs font-medium leading-tight ${
                  isEarned ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {b.name_bg}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
