'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { checklistItems } from '@/data/protocol';
import { Sun, Moon, Sunrise, Calendar, Trophy, ChevronLeft, ChevronRight, Check, Target } from 'lucide-react';
import { format, subDays, addDays, startOfDay } from 'date-fns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAILY_CATEGORIES = ['morning', 'day', 'evening'] as const;

const SECTION_META: Record<
  string,
  { label: string; icon: React.ReactNode; accent: string; bg: string }
> = {
  morning: {
    label: 'Сутрин',
    icon: <Sunrise className="w-5 h-5" />,
    accent: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  day: {
    label: 'През деня',
    icon: <Sun className="w-5 h-5" />,
    accent: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  evening: {
    label: 'Вечер',
    icon: <Moon className="w-5 h-5" />,
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
};

function dateKey(d: Date): string {
  return format(startOfDay(d), 'yyyy-MM-dd');
}

function completionPct(
  checkedItems: Record<string, boolean> | undefined,
  ids: string[],
): number {
  if (!checkedItems || ids.length === 0) return 0;
  const done = ids.filter((id) => checkedItems[id]).length;
  return Math.round((done / ids.length) * 100);
}

function heatColor(pct: number): string {
  if (pct === 0) return 'bg-zinc-800';
  if (pct < 25) return 'bg-emerald-900/60';
  if (pct < 50) return 'bg-emerald-700/60';
  if (pct < 75) return 'bg-emerald-500/60';
  return 'bg-emerald-400/80';
}

// ---------------------------------------------------------------------------
// Circular progress ring
// ---------------------------------------------------------------------------

function ProgressRing({ pct }: { pct: number }) {
  const radius = 40;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={100} height={100} className="-rotate-90">
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-zinc-700"
        />
        <motion.circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-teal-400"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <span className="absolute text-lg font-bold text-zinc-100">
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkbox item
// ---------------------------------------------------------------------------

function CheckItem({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-start gap-3 w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      <motion.div
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-teal-500 border-teal-500'
            : 'border-zinc-600 bg-transparent'
        }`}
        whileTap={{ scale: 0.85 }}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Check className="w-3.5 h-3.5 text-white" />
          </motion.div>
        )}
      </motion.div>
      <span
        className={`text-sm leading-snug transition-all ${
          checked ? 'line-through text-zinc-500' : 'text-zinc-200'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProtocolModule() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  const dailyChecklists = useStore((s) => s.dailyChecklists);
  const toggleChecklistItem = useStore((s) => s.toggleChecklistItem);

  const currentKey = dateKey(selectedDate);
  const currentChecklist = dailyChecklists.find((c) => c.date === currentKey);
  const checkedItems = currentChecklist?.items ?? {};

  // ---- derived data -------------------------------------------------------

  const dailyItemIds = useMemo(
    () => checklistItems.filter((i) => DAILY_CATEGORIES.includes(i.category as typeof DAILY_CATEGORIES[number])).map((i) => i.id),
    [],
  );

  const weeklyItems = useMemo(
    () => checklistItems.filter((i) => i.category === 'weekly'),
    [],
  );

  const monthlyItems = useMemo(
    () => checklistItems.filter((i) => i.category === 'monthly'),
    [],
  );

  const dailyPct = completionPct(checkedItems, dailyItemIds);

  // 7-day rolling average
  const rollingAvg = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = dateKey(subDays(selectedDate, i));
      const cl = dailyChecklists.find((c) => c.date === d);
      total += completionPct(cl?.items, dailyItemIds);
    }
    return Math.round(total / 7);
  }, [dailyChecklists, selectedDate, dailyItemIds]);

  // Streak (consecutive days > 70%)
  const streak = useMemo(() => {
    let count = 0;
    // Start from yesterday (today is in-progress)
    let d = subDays(startOfDay(new Date()), 1);
    while (true) {
      const k = dateKey(d);
      const cl = dailyChecklists.find((c) => c.date === k);
      const pct = completionPct(cl?.items, dailyItemIds);
      if (pct > 70) {
        count++;
        d = subDays(d, 1);
      } else {
        break;
      }
    }
    return count;
  }, [dailyChecklists, dailyItemIds]);

  // Last 30 days heatmap data
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i);
      const k = dateKey(d);
      const cl = dailyChecklists.find((c) => c.date === k);
      const pct = completionPct(cl?.items, dailyItemIds);
      return { date: d, key: k, pct };
    });
  }, [dailyChecklists, dailyItemIds]);

  // ---- sections -----------------------------------------------------------

  const sections = useMemo(
    () =>
      DAILY_CATEGORIES.map((cat) => ({
        category: cat,
        items: checklistItems.filter((i) => i.category === cat),
        meta: SECTION_META[cat],
      })),
    [],
  );

  // ---- handlers -----------------------------------------------------------

  const goPrev = () => setSelectedDate((d) => subDays(d, 1));
  const goNext = () => setSelectedDate((d) => addDays(d, 1));

  const toggle = (itemId: string) => toggleChecklistItem(currentKey, itemId);

  // ---- render -------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* ---- Date selector ---- */}
      <div className="flex items-center justify-between bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
        <button onClick={goPrev} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          <span className="text-zinc-100 font-semibold">
            {format(selectedDate, 'dd MMM yyyy')}
          </span>
        </div>
        <button onClick={goNext} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* ---- Progress + Streak row ---- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Progress ring */}
        <div className="flex flex-col items-center bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <ProgressRing pct={dailyPct} />
          <p className="mt-2 text-xs text-zinc-400">Дневен напредък</p>
          <p className="text-xs text-zinc-500">
            7-дневна средна: <span className="text-teal-400 font-medium">{rollingAvg}%</span>
          </p>
        </div>

        {/* Streak counter */}
        <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <Trophy className="w-8 h-8 text-amber-400 mb-2" />
          <span className="text-3xl font-bold text-zinc-100">{streak}</span>
          <p className="text-xs text-zinc-400 mt-1 text-center">
            Поредни дни &gt;70%
          </p>
        </div>
      </div>

      {/* ---- Calendar Heatmap ---- */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-400" />
          Последни 30 дни
        </h3>
        <div className="grid grid-cols-10 gap-1.5">
          {heatmapData.map((cell) => (
            <div key={cell.key} className="group relative">
              <div
                className={`w-full aspect-square rounded-sm ${heatColor(cell.pct)} transition-colors`}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-zinc-700 text-zinc-100 text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                  {format(cell.date, 'dd MMM')} — {cell.pct}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Daily Checklist sections ---- */}
      {sections.map(({ category, items, meta }) => (
        <div
          key={category}
          className={`rounded-2xl p-4 border ${meta.bg}`}
        >
          <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${meta.accent}`}>
            {meta.icon}
            {meta.label}
          </h3>
          <div className="space-y-0.5">
            {items.map((item) => (
              <CheckItem
                key={item.id}
                label={item.text_bg}
                checked={!!checkedItems[item.id]}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ---- Weekly Goals ---- */}
      <div className="rounded-2xl p-4 border bg-teal-500/10 border-teal-500/20">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-teal-400">
          <Calendar className="w-5 h-5" />
          Седмични цели
        </h3>
        <div className="space-y-0.5">
          {weeklyItems.map((item) => (
            <CheckItem
              key={item.id}
              label={item.text_bg}
              checked={!!checkedItems[item.id]}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>

      {/* ---- Monthly Goals ---- */}
      <div className="rounded-2xl p-4 border bg-purple-500/10 border-purple-500/20">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-400">
          <Target className="w-5 h-5" />
          Месечни цели
        </h3>
        <div className="space-y-0.5">
          {monthlyItems.map((item) => (
            <CheckItem
              key={item.id}
              label={item.text_bg}
              checked={!!checkedItems[item.id]}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
