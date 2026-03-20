'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Play, Square, Clock, Flame, Calendar, TrendingUp } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FastingPhase {
  minHours: number;
  maxHours: number;
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FASTING_PHASES: FastingPhase[] = [
  { minHours: 0,  maxHours: 4,  label: 'Хранене — инсулинът е повишен',                         color: 'text-orange-400', bgColor: 'bg-orange-500',  ringColor: '#f97316' },
  { minHours: 4,  maxHours: 8,  label: 'Ранно гладуване — инсулинът намалява',                   color: 'text-yellow-400', bgColor: 'bg-yellow-500',  ringColor: '#eab308' },
  { minHours: 8,  maxHours: 12, label: 'Гладуване — мазнините се мобилизират',                   color: 'text-lime-400',   bgColor: 'bg-lime-500',    ringColor: '#84cc16' },
  { minHours: 12, maxHours: 16, label: 'Оптимално гладуване — глюкагонът доминира',               color: 'text-teal-400',   bgColor: 'bg-teal-500',    ringColor: '#14b8a6' },
  { minHours: 16, maxHours: 18, label: 'Удължено гладуване — засилена автофагия',                  color: 'text-cyan-400',   bgColor: 'bg-cyan-500',    ringColor: '#06b6d4' },
  { minHours: 18, maxHours: 24, label: 'Дълбоко гладуване — максимална инсулинова чувствителност', color: 'text-emerald-400', bgColor: 'bg-emerald-500', ringColor: '#10b981' },
];

const TARGET_OPTIONS = [12, 16, 18, 24];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPhase(hours: number): FastingPhase {
  for (const phase of FASTING_PHASES) {
    if (hours < phase.maxHours) return phase;
  }
  return FASTING_PHASES[FASTING_PHASES.length - 1];
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0 = Sunday => shift so Monday = 0
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function FastingModule() {
  const { activeFasting, fastingSessions, startFasting, stopFasting } = useStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState(16);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // ── Timer tick ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeFasting) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(activeFasting.startTime).getTime()) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeFasting]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const elapsedHours = elapsedSeconds / 3600;
  const targetHours = activeFasting?.targetHours ?? selectedTarget;
  const targetSeconds = targetHours * 3600;
  const progress = Math.min(elapsedSeconds / targetSeconds, 1);
  const currentPhase = getPhase(elapsedHours);

  // SVG circle math
  const SIZE = 280;
  const STROKE = 14;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    startFasting(selectedTarget);
  }, [startFasting, selectedTarget]);

  const handleStop = useCallback(() => {
    stopFasting();
  }, [stopFasting]);

  // ── Statistics ─────────────────────────────────────────────────────────────

  const completedSessions = fastingSessions.filter((s) => s.endTime);

  const getSessionDurationHours = (s: { startTime: string; endTime?: string }): number => {
    if (!s.endTime) return 0;
    return (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday-based
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekSessions = completedSessions.filter((s) => new Date(s.startTime) >= startOfWeek);
  const totalHoursThisWeek = weekSessions.reduce((sum, s) => sum + getSessionDurationHours(s), 0);

  const last7Days = completedSessions.filter(
    (s) => new Date(s.startTime).getTime() > Date.now() - 7 * 86400000
  );
  const avgDailyFast = last7Days.length > 0 ? last7Days.reduce((sum, s) => sum + getSessionDurationHours(s), 0) / 7 : 0;

  const longestFast = completedSessions.reduce((max, s) => {
    const h = getSessionDurationHours(s);
    return h > max ? h : max;
  }, 0);

  // Streak: consecutive days with 12h+ fast counting backwards from today
  const getStreak = (): number => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const daySessions = completedSessions.filter((s) => {
        const d = new Date(s.startTime);
        return isSameDay(d, day);
      });
      const totalForDay = daySessions.reduce((sum, s) => sum + getSessionDurationHours(s), 0);
      if (totalForDay >= 12) {
        streak++;
      } else {
        // Allow today to be missing if no session yet
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  };
  const streak = getStreak();

  // ── Calendar data ──────────────────────────────────────────────────────────

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const monthNames = [
    'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
    'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември',
  ];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  /** Hours fasted for a given calendar day */
  const getFastHoursForDay = (day: number): number => {
    const target = new Date(calYear, calMonth, day);
    const matched = completedSessions.filter((s) => isSameDay(new Date(s.startTime), target));
    return matched.reduce((sum, s) => sum + getSessionDurationHours(s), 0);
  };

  const getDayCellColor = (hours: number): string => {
    if (hours === 0) return 'bg-gray-800/40';
    if (hours < 12) return 'bg-orange-500/30';
    if (hours < 16) return 'bg-teal-500/30';
    if (hours < 18) return 'bg-teal-500/50';
    if (hours < 24) return 'bg-cyan-500/50';
    return 'bg-emerald-500/60';
  };

  // ── Seesaw derived angle ──────────────────────────────────────────────────

  // Ranges from -25 deg (insulin high) to +25 deg (glucagon high)
  const seesawAngle = Math.min(25, Math.max(-25, (elapsedHours / 12) * 25 - 12.5));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-8">
      {/* ─── Section: Timer ───────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-teal-400" />
          Таймер за гладуване
        </h2>

        {/* Target selection */}
        {!activeFasting && (
          <div className="flex gap-3">
            {TARGET_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTarget(t)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedTarget === t
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {t}ч
              </button>
            ))}
          </div>
        )}

        {/* SVG Timer Circle */}
        <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="transform -rotate-90">
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={currentPhase.ringColor} />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Background ring */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#1f2937"
              strokeWidth={STROKE}
            />
            {/* Progress ring */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold text-white tracking-wider">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-sm text-gray-400 mt-1">
              / {targetHours}:00:00
            </span>
            {activeFasting && (
              <span className={`text-xs mt-2 font-medium ${currentPhase.color}`}>
                {Math.round(progress * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Start / Stop button */}
        {activeFasting ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-red-500/20 text-red-400 font-bold text-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
          >
            <Square className="w-5 h-5" />
            Спри
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-teal-500/20 text-teal-400 font-bold text-lg hover:bg-teal-500/30 transition-colors border border-teal-500/30"
          >
            <Play className="w-5 h-5" />
            Започни
          </button>
        )}
      </section>

      {/* ─── Section: Fasting Phases ──────────────────────────────────────── */}
      <section className="bg-gray-900/60 rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Фази на гладуване
        </h3>

        {/* Current phase highlight */}
        {activeFasting && (
          <div className={`rounded-xl px-4 py-3 border ${currentPhase.color} border-current/20 bg-gray-800/60`}>
            <p className="font-semibold text-sm">{currentPhase.label}</p>
          </div>
        )}

        {/* Phase timeline */}
        <div className="space-y-1.5">
          {FASTING_PHASES.map((phase, i) => {
            const phaseStart = phase.minHours;
            const phaseDuration = phase.maxHours - phase.minHours;
            const phaseProgress = activeFasting
              ? Math.min(1, Math.max(0, (elapsedHours - phaseStart) / phaseDuration))
              : 0;
            const isActive = activeFasting ? elapsedHours >= phase.minHours && elapsedHours < phase.maxHours : false;
            const isPast = activeFasting ? elapsedHours >= phase.maxHours : false;

            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8 text-right shrink-0">{phase.minHours}ч</span>
                <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${phase.bgColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: isPast ? '100%' : `${phaseProgress * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ opacity: isPast ? 0.6 : 1 }}
                  />
                  {isActive && (
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] font-semibold text-white truncate drop-shadow">
                        {phase.label.split(' — ')[0]}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 w-8 shrink-0">{phase.maxHours}ч</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Section: Insulin / Glucagon Seesaw ──────────────────────────── */}
      <section className="bg-gray-900/60 rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Баланс инсулин / глюкагон</h3>

        <div className="flex justify-center">
          <svg width="300" height="160" viewBox="0 0 300 160">
            {/* Pivot */}
            <polygon points="150,155 140,130 160,130" fill="#4b5563" />

            {/* Beam */}
            <motion.g
              animate={{ rotate: seesawAngle }}
              transition={{ type: 'spring', stiffness: 60, damping: 14 }}
              style={{ originX: '150px', originY: '125px' }}
            >
              <line x1="30" y1="125" x2="270" y2="125" stroke="#6b7280" strokeWidth="6" strokeLinecap="round" />

              {/* Insulin side (left) */}
              <circle cx="50" cy="110" r="22" fill="#f97316" fillOpacity="0.25" stroke="#f97316" strokeWidth="2" />
              <text x="50" y="115" textAnchor="middle" fill="#fb923c" fontSize="9" fontWeight="bold">
                Инсулин
              </text>

              {/* Glucagon side (right) */}
              <circle cx="250" cy="110" r="22" fill="#14b8a6" fillOpacity="0.25" stroke="#14b8a6" strokeWidth="2" />
              <text x="250" y="115" textAnchor="middle" fill="#5eead4" fontSize="8" fontWeight="bold">
                Глюкагон
              </text>
            </motion.g>

            {/* Labels below */}
            <text x="50" y="152" textAnchor="middle" fill="#9ca3af" fontSize="10">▲ висок</text>
            <text x="250" y="152" textAnchor="middle" fill="#9ca3af" fontSize="10">▲ висок</text>
          </svg>
        </div>
        <p className="text-center text-xs text-gray-500">
          {elapsedHours < 8
            ? 'Инсулинът все още доминира — тялото използва глюкоза.'
            : elapsedHours < 16
              ? 'Глюкагонът расте — мазнините се мобилизират.'
              : 'Глюкагонът доминира — максимално изгаряне на мазнини.'}
        </p>
      </section>

      {/* ─── Section: Calendar ────────────────────────────────────────────── */}
      <section className="bg-gray-900/60 rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Календар
        </h3>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
            className="text-gray-400 hover:text-white px-2 py-1 text-lg"
          >
            ‹
          </button>
          <span className="text-white font-medium">
            {monthNames[calMonth]} {calYear}
          </span>
          <button
            onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
            className="text-gray-400 hover:text-white px-2 py-1 text-lg"
          >
            ›
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((d) => (
            <span key={d} className="text-xs text-gray-500 font-medium">{d}</span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1 relative">
          {/* Empty spacers for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hours = getFastHoursForDay(day);
            const cellColor = getDayCellColor(hours);
            const isToday = isSameDay(new Date(calYear, calMonth, day), new Date());

            return (
              <div
                key={day}
                className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-medium cursor-default transition-colors ${cellColor} ${
                  isToday ? 'ring-1 ring-teal-400' : ''
                }`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <span className={hours > 0 ? 'text-white' : 'text-gray-500'}>{day}</span>

                {/* Tooltip */}
                {hoveredDay === day && hours > 0 && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 border border-gray-700">
                    {hours.toFixed(1)}ч гладуване
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-gray-800/40 inline-block" /> 0ч</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-orange-500/30 inline-block" /> &lt;12ч</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-teal-500/30 inline-block" /> 12-16ч</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-cyan-500/50 inline-block" /> 16-18ч</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-emerald-500/60 inline-block" /> 18ч+</span>
        </div>
      </section>

      {/* ─── Section: Statistics ──────────────────────────────────────────── */}
      <section className="bg-gray-900/60 rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Статистика
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Часове тази седмица" value={`${totalHoursThisWeek.toFixed(1)}ч`} color="text-teal-400" />
          <StatCard label="Средно на ден" value={`${avgDailyFast.toFixed(1)}ч`} color="text-cyan-400" />
          <StatCard label="Поредни дни (12ч+)" value={`${streak}`} color="text-emerald-400" />
          <StatCard label="Най-дълго гладуване" value={`${longestFast.toFixed(1)}ч`} color="text-orange-400" />
        </div>
      </section>
    </div>
  );
}

// ── Sub-component ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800/60 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
