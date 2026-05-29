// Days-into-protocol math — derives the user's current day-of-90 from
// onboarding completion date. Used by the trends "phase progress" card
// and by anywhere else we frame the journey on the 90-day timeline.
//
// Onboarding can be cleared and re-taken (re-test flow in /settings) —
// when that happens the count restarts from day 1. The OnboardingResult
// already exposes `completedAt` as an ISO timestamp, so this helper is
// pure: input the timestamp + an optional "now", get the day number.

import { MILESTONE_DAYS, PROGRAM_PHASES, programPhase } from "./program-phases";
import type { ProgramPhase } from "./program-phases";

export const PROTOCOL_LENGTH_DAYS = 90;

export interface ProtocolPosition {
  /** 1..PROTOCOL_LENGTH_DAYS, clamped to the range. */
  day: number;
  /** Calendar days since onboarding (un-clamped — can exceed 90). */
  rawDays: number;
  phase: ProgramPhase;
  /** Percentage of total protocol completed (0..100). */
  pct: number;
  /** Day in [1..14, 30, 60, 90] that the user just crossed today, if any. */
  milestoneCrossedToday: number | null;
  /** Next upcoming milestone day (or null if past 90). */
  nextMilestone: number | null;
  /** Days until `nextMilestone` (or null). */
  daysToNextMilestone: number | null;
}

/**
 * Day 1 is the calendar day of onboarding completion (UTC). Each
 * 86_400_000ms boundary bumps the day count. We accept the simpler UTC
 * model (rather than per-user timezone) because the trends/plan view
 * works in UTC days throughout — switching to local-tz here would
 * desynchronize from the daily plan checkbox grid.
 */
export function protocolDay(
  completedAtIso: string,
  now: Date = new Date()
): ProtocolPosition {
  const start = new Date(completedAtIso);
  const startMidnight = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const nowMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const rawDays = Math.floor((nowMidnight - startMidnight) / 86_400_000) + 1;
  const day = Math.max(1, Math.min(PROTOCOL_LENGTH_DAYS, rawDays));

  const phase = programPhase(day);
  const pct = Math.round((day / PROTOCOL_LENGTH_DAYS) * 100);

  // Milestones — find the next one after today and how far away.
  const sortedMilestones = [...MILESTONE_DAYS].sort((a, b) => a - b);
  const next = sortedMilestones.find((m) => m > day) ?? null;
  const crossed = sortedMilestones.includes(day) ? day : null;

  return {
    day,
    rawDays,
    phase,
    pct,
    milestoneCrossedToday: crossed,
    nextMilestone: next,
    daysToNextMilestone: next === null ? null : next - day,
  };
}

// Re-exported so the UI never reaches into program-phases directly.
export { PROGRAM_PHASES, type ProgramPhase };
