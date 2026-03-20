'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore, ExerciseLog } from '@/store/useStore';
import { Dumbbell, Zap, Wind, Snowflake, Plus, Trash2, Info, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PRINCIPLES = [
  'Минута по минута, силовите тренировки може да са по-ефективни от аеробните за подобряване на ИР',
  'Интензивността е по-важна от продължителността',
  'HIIT за 20 мин е поне толкова ефективно, колкото 45+ мин умерено',
  'Работа до отказ (failure) на всеки сет при силови',
  'НЕ пийте спортни напитки след тренировка',
  'Прекъсвайте седенето на всеки 20-30 минути',
];

const WEEKLY_PLAN = [
  { day: 'Понеделник', activity: 'Силови — горна част (до отказ)', icon: Dumbbell, color: 'text-orange-400' },
  { day: 'Вторник', activity: 'HIIT — 20 мин интервали', icon: Zap, color: 'text-yellow-400' },
  { day: 'Сряда', activity: 'Почивка или лека разходка', icon: Wind, color: 'text-green-400' },
  { day: 'Четвъртък', activity: 'Силови — долна част (до отказ)', icon: Dumbbell, color: 'text-orange-400' },
  { day: 'Петък', activity: 'HIIT или аеробна', icon: Zap, color: 'text-yellow-400' },
  { day: 'Събота', activity: 'Силови — цяло тяло', icon: Dumbbell, color: 'text-orange-400' },
  { day: 'Неделя', activity: 'Почивка, студова експозиция', icon: Snowflake, color: 'text-cyan-400' },
];

const EXERCISE_TYPES = [
  { value: 'aerobic' as const, label: 'Аеробна', icon: Wind, color: 'bg-green-500' },
  { value: 'resistance' as const, label: 'Силова', icon: Dumbbell, color: 'bg-orange-500' },
  { value: 'hiit' as const, label: 'HIIT', icon: Zap, color: 'bg-yellow-500' },
  { value: 'cold' as const, label: 'Студова експозиция', icon: Snowflake, color: 'bg-cyan-500' },
];

const COLD_TYPES = ['Студен душ', 'На открито', 'Ледена вана'];

const PIE_COLORS = ['#22c55e', '#f97316', '#eab308', '#06b6d4'];

function getTypeBadge(type: ExerciseLog['type']) {
  const found = EXERCISE_TYPES.find((t) => t.value === type);
  return found ?? EXERCISE_TYPES[0];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export default function ExerciseModule() {
  const { exerciseLogs, addExerciseLog, removeExerciseLog } = useStore();

  // --- Exercise Logger State ---
  const [logType, setLogType] = useState<ExerciseLog['type']>('resistance');
  const [logName, setLogName] = useState('');
  const [logDuration, setLogDuration] = useState(30);
  const [logIntensity, setLogIntensity] = useState(7);
  const [logSets, setLogSets] = useState<{ reps: number; weight: number }[]>([]);
  const [logNotes, setLogNotes] = useState('');

  // --- Cold Exposure State ---
  const [coldDuration, setColdDuration] = useState(3);
  const [coldType, setColdType] = useState(COLD_TYPES[0]);

  // --- Helpers ---
  const weekStart = startOfWeek(todayStr());
  const weekLogs = useMemo(
    () => exerciseLogs.filter((l) => l.date >= weekStart),
    [exerciseLogs, weekStart],
  );

  const weeklyStats = useMemo(() => {
    const totalMinutes = weekLogs.reduce((s, l) => s + l.duration, 0);
    const avgIntensity =
      weekLogs.length > 0
        ? Math.round((weekLogs.reduce((s, l) => s + l.intensity, 0) / weekLogs.length) * 10) / 10
        : 0;
    const byType = EXERCISE_TYPES.map((t) => ({
      name: t.label,
      value: weekLogs.filter((l) => l.type === t.value).length,
    }));
    return { totalMinutes, avgIntensity, byType };
  }, [weekLogs]);

  // --- Handlers ---
  function handleAddSet() {
    setLogSets((prev) => [...prev, { reps: 10, weight: 20 }]);
  }

  function handleRemoveSet(idx: number) {
    setLogSets((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSetChange(idx: number, field: 'reps' | 'weight', value: number) {
    setLogSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function handleSaveLog() {
    if (!logName.trim()) return;
    const log: ExerciseLog = {
      id: generateId(),
      date: todayStr(),
      type: logType,
      name: logName.trim(),
      duration: logDuration,
      intensity: logIntensity,
      ...(logType === 'resistance' && logSets.length > 0 ? { sets: logSets } : {}),
      ...(logNotes.trim() ? { notes: logNotes.trim() } : {}),
    };
    addExerciseLog(log);
    setLogName('');
    setLogDuration(30);
    setLogIntensity(7);
    setLogSets([]);
    setLogNotes('');
  }

  function handleSaveCold() {
    const log: ExerciseLog = {
      id: generateId(),
      date: todayStr(),
      type: 'cold',
      name: coldType,
      duration: coldDuration,
      intensity: 8,
    };
    addExerciseLog(log);
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ===================== KEY PRINCIPLES ===================== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Info className="h-5 w-5 text-blue-400" />
          Ключови принципи
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600">
          {PRINCIPLES.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="min-w-[260px] max-w-[300px] flex-shrink-0 rounded-xl border border-slate-700 bg-slate-800/70 p-4 backdrop-blur"
            >
              <p className="text-sm leading-relaxed text-slate-200">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===================== WEEKLY PLAN ===================== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Dumbbell className="h-5 w-5 text-orange-400" />
          Седмичен план
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600">
          {WEEKLY_PLAN.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="min-w-[130px] flex-shrink-0 rounded-xl border border-slate-700 bg-slate-800/70 p-3 text-center backdrop-blur"
              >
                <Icon className={`mx-auto mb-1 h-5 w-5 ${item.color}`} />
                <p className="text-xs font-bold text-white">{item.day}</p>
                <p className="mt-1 text-[11px] leading-tight text-slate-400">{item.activity}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===================== EXERCISE LOGGER ===================== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Plus className="h-5 w-5 text-emerald-400" />
          Запиши тренировка
        </h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 backdrop-blur">
          {/* Type selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {EXERCISE_TYPES.map((t) => {
              const Icon = t.icon;
              const active = logType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setLogType(t.value)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? `${t.color} text-white`
                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Name */}
          <input
            type="text"
            placeholder="Име / описание на упражнението"
            value={logName}
            onChange={(e) => setLogName(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />

          {/* Duration + Intensity */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Продължителност (мин)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={logDuration}
                onChange={(e) => setLogDuration(Number(e.target.value) || 1)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Интензивност: {logIntensity}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={logIntensity}
                onChange={(e) => setLogIntensity(Number(e.target.value))}
                className="mt-2 w-full accent-blue-500"
              />
            </div>
          </div>

          {/* Sets (resistance only) */}
          {logType === 'resistance' && (
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Серии</span>
                <button
                  onClick={handleAddSet}
                  className="flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600"
                >
                  <Plus className="h-3 w-3" /> Добави серия
                </button>
              </div>
              {logSets.map((set, idx) => (
                <div key={idx} className="mb-1.5 flex items-center gap-2">
                  <span className="w-6 text-right text-xs text-slate-500">{idx + 1}.</span>
                  <input
                    type="number"
                    min={1}
                    value={set.reps}
                    onChange={(e) => handleSetChange(idx, 'reps', Number(e.target.value) || 1)}
                    className="w-20 rounded border border-slate-600 bg-slate-900/60 px-2 py-1 text-xs text-white outline-none"
                    placeholder="Повт."
                  />
                  <span className="text-xs text-slate-500">x</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={set.weight}
                    onChange={(e) => handleSetChange(idx, 'weight', Number(e.target.value) || 0)}
                    className="w-20 rounded border border-slate-600 bg-slate-900/60 px-2 py-1 text-xs text-white outline-none"
                    placeholder="кг"
                  />
                  <span className="text-xs text-slate-500">кг</span>
                  <button
                    onClick={() => handleRemoveSet(idx)}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <textarea
            placeholder="Бележки (по избор)"
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />

          {/* Save */}
          <button
            onClick={handleSaveLog}
            disabled={!logName.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Запази
          </button>
        </div>
      </section>

      {/* ===================== EXERCISE HISTORY ===================== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <ChevronRight className="h-5 w-5 text-purple-400" />
          История
        </h2>
        {exerciseLogs.length === 0 ? (
          <p className="text-sm text-slate-500">Няма записани тренировки.</p>
        ) : (
          <div className="space-y-2">
            {[...exerciseLogs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((log) => {
                const badge = getTypeBadge(log.type);
                const BadgeIcon = badge.icon;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3 backdrop-blur"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${badge.color}`}
                    >
                      <BadgeIcon className="h-4 w-4 text-white" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">{log.name}</p>
                      <p className="text-xs text-slate-400">
                        {log.date} &middot; {log.duration} мин &middot; Инт. {log.intensity}/10
                        {log.sets && log.sets.length > 0 && ` · ${log.sets.length} серии`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeExerciseLog(log.id)}
                      className="text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
          </div>
        )}
      </section>

      {/* ===================== COLD EXPOSURE TRACKER ===================== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Snowflake className="h-5 w-5 text-cyan-400" />
          Студова експозиция
        </h2>
        <div className="rounded-xl border border-cyan-800/40 bg-slate-800/70 p-4 backdrop-blur">
          <p className="mb-3 text-sm leading-relaxed text-cyan-200/80">
            <Info className="mr-1 inline h-4 w-4 text-cyan-400" />
            Активира кафявата мастна тъкан (BAT), която изгаря глюкоза за топлина.
          </p>
          <p className="mb-4 text-xs text-slate-500">
            Цел: температура на кожата ~18°C
          </p>

          {/* Cold type */}
          <div className="mb-3 flex flex-wrap gap-2">
            {COLD_TYPES.map((ct) => (
              <button
                key={ct}
                onClick={() => setColdType(ct)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  coldType === ct
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>

          {/* Duration */}
          <div className="mb-3">
            <label className="mb-1 block text-xs text-slate-400">
              Продължителност (мин): {coldDuration}
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={coldDuration}
              onChange={(e) => setColdDuration(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <button
            onClick={handleSaveCold}
            className="w-full rounded-lg bg-cyan-600 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            Запази студова сесия
          </button>
        </div>
      </section>

      {/* ===================== WEEKLY SUMMARY ===================== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Zap className="h-5 w-5 text-yellow-400" />
          Седмичен преглед
        </h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 backdrop-blur">
          {weekLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Няма данни за тази седмица.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Stats column */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Общо минути</p>
                  <p className="text-2xl font-bold text-white">{weeklyStats.totalMinutes}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Сесии тази седмица</p>
                  <p className="text-2xl font-bold text-white">{weekLogs.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Средна интензивност</p>
                  <p className="text-2xl font-bold text-white">{weeklyStats.avgIntensity}/10</p>
                </div>
              </div>

              {/* Pie chart column */}
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={weeklyStats.byType.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      stroke="none"
                    >
                      {weeklyStats.byType
                        .filter((d) => d.value > 0)
                        .map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              PIE_COLORS[
                                EXERCISE_TYPES.findIndex(
                                  (t) =>
                                    t.label ===
                                    weeklyStats.byType.filter((d) => d.value > 0)[idx]?.name,
                                )
                              ] ?? PIE_COLORS[0]
                            }
                          />
                        ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {weeklyStats.byType
                    .filter((d) => d.value > 0)
                    .map((d, i) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[EXERCISE_TYPES.findIndex((t) => t.label === d.name)] ??
                              PIE_COLORS[0],
                          }}
                        />
                        {d.name} ({d.value})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
