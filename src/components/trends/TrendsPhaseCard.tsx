"use client";

import { useEffect, useState } from "react";
import {
  PROGRAM_PHASES,
  PROTOCOL_LENGTH_DAYS,
  protocolDay,
  type ProtocolPosition,
} from "@/lib/protocol-day";
import { loadOnboarding } from "@/lib/onboarding-storage";

// "Day X of 90" card — anchors the trends view in the protocol journey.
// Reads onboarding's completedAt from localStorage so the card works
// for both signed-in (server-synced) and anonymous users. Hidden when
// the user hasn't completed onboarding.

export default function TrendsPhaseCard() {
  const [pos, setPos] = useState<ProtocolPosition | null>(null);

  useEffect(() => {
    const ob = loadOnboarding();
    if (!ob?.completedAt) return;
    setPos(protocolDay(ob.completedAt));
  }, []);

  if (!pos) return null;

  const phaseIdx = pos.phase.index;
  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      {/* Day count + phase label */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ден
          </span>
          <span className="ml-2 text-2xl font-bold text-teal-700">
            {pos.day}
          </span>
          <span className="ml-1 text-sm text-slate-500">
            от {PROTOCOL_LENGTH_DAYS}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Фаза {phaseIdx}
          </span>
          <span className="ml-2 text-sm font-semibold text-slate-800">
            {pos.phase.name_bg}
          </span>
          <span className="ml-1 text-xs text-slate-500">
            ({pos.phase.range_bg})
          </span>
        </div>
      </div>

      {/* 4-segment phase bar — each phase a separate filled or empty
          segment so the user sees both progress and where boundaries
          live. The fill within the current segment is the in-phase
          progress percentage. */}
      <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-teal-50">
        {PROGRAM_PHASES.map((ph) => {
          const phaseSpan = ph.to - ph.from + 1;
          const completedInPhase =
            pos.day < ph.from
              ? 0
              : pos.day > ph.to
              ? phaseSpan
              : pos.day - ph.from + 1;
          const fillPct = (completedInPhase / phaseSpan) * 100;
          return (
            <div key={ph.index} className="relative flex-1 bg-teal-50">
              <div
                className="h-full bg-teal-500 transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Phase goal copy */}
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        {pos.phase.goal_bg}
      </p>

      {/* Milestone proximity */}
      {pos.nextMilestone !== null && pos.daysToNextMilestone !== null && (
        <p className="mt-2 text-xs text-teal-700">
          Следващ етап: <strong>ден {pos.nextMilestone}</strong> · след{" "}
          {pos.daysToNextMilestone}{" "}
          {pos.daysToNextMilestone === 1 ? "ден" : "дни"}
        </p>
      )}
      {pos.milestoneCrossedToday && (
        <p className="mt-2 text-xs font-semibold text-teal-700">
          Днес е ден {pos.milestoneCrossedToday} — етап достигнат.
        </p>
      )}
    </section>
  );
}
