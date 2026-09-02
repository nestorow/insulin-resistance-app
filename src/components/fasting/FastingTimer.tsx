"use client";

import { useEffect, useState } from "react";
import { Play, Square, Check } from "lucide-react";
import { FASTING_PHASES } from "@/data/training";

// Active fasting timer. The start timestamp is persisted to localStorage so
// the count survives reloads / app re-opens (the most common case — you start
// a fast, close the PWA, and check back hours later). Elapsed hours map onto
// the FASTING_PHASES table so the user always sees which phase they're in.

const KEY = "ir-fasting-start-v1";

function readStart(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Index of the phase whose [minHours, maxHours) contains `hours`. 24h+ stays
 *  in the deepest phase. */
function currentPhaseIndex(hours: number): number {
  const i = FASTING_PHASES.findIndex(
    (p) => hours >= p.minHours && hours < p.maxHours
  );
  return i === -1 ? FASTING_PHASES.length - 1 : i;
}

export default function FastingTimer() {
  const [startTs, setStartTs] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStartTs(readStart());
    setNow(Date.now());
    setMounted(true);
  }, []);

  // Tick once a second while a fast is active so the elapsed time and the
  // active phase stay current.
  useEffect(() => {
    if (startTs === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTs]);

  function start() {
    const ts = Date.now();
    try {
      window.localStorage.setItem(KEY, String(ts));
    } catch {
      // ignore — timer still runs in-memory for this session
    }
    setStartTs(ts);
    setNow(ts);
  }

  function stop() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setStartTs(null);
  }

  const running = startTs !== null;
  const elapsedMs = running ? Math.max(0, now - startTs) : 0;
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const activeIdx = running ? currentPhaseIndex(elapsedMs / 3_600_000) : -1;

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-bold text-teal-700">
        Какво се случва в тялото
      </h2>

      {/* Timer control card */}
      <div className="mb-4 rounded-2xl border border-teal-100 bg-white p-5">
        {!mounted ? (
          <div className="h-12 animate-pulse rounded-lg bg-teal-50/60" />
        ) : !running ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Стартирай таймер, за да следиш изминалите часове и текущата фаза
              на гладуването.
            </p>
            <button
              type="button"
              onClick={start}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
            >
              <Play className="h-4 w-4" /> Старт
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                Гладуване от{" "}
                {new Date(startTs).toLocaleTimeString("bg-BG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-4xl font-extrabold tabular-nums text-teal-600">
                {hours}ч {String(minutes).padStart(2, "0")}м
              </p>
            </div>
            <button
              type="button"
              onClick={stop}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Square className="h-4 w-4" /> Стоп
            </button>
          </div>
        )}
      </div>

      {/* Phase table — the active row is highlighted while a fast is running */}
      <div className="space-y-2">
        {FASTING_PHASES.map((p, i) => {
          const active = i === activeIdx;
          return (
            <div
              key={p.minHours}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-3 rounded-xl border bg-white p-3.5 transition-all ${
                active
                  ? "border-teal-400 ring-2 ring-teal-200"
                  : "border-teal-100"
              }`}
            >
              <span
                className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-slate-900"
                style={{ backgroundColor: p.color }}
              >
                {p.minHours}-{p.maxHours}ч
              </span>
              <p className="flex-1 text-sm text-slate-700">{p.label_bg}</p>
              {active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <Check className="h-3 w-3" /> Сега
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
