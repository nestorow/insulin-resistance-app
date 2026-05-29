"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getSymptomLogs,
  addSymptomLog,
  removeSymptomLog,
  type SymptomEntry,
} from "@/lib/tracking-storage";
import { showToast } from "@/lib/toast";
import { clampedNum } from "@/lib/numbers";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { LineChart } from "lucide-react";

// Trend chart pulls ~80kB of recharts — dynamic-import so the form +
// recent-entries list paint first.
const JournalTrendChart = dynamic(() => import("./JournalTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full animate-pulse rounded-lg bg-teal-50/40" />
  ),
});

const NOTES_MAX = 280;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SymptomJournalModule() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<SymptomEntry[]>([]);
  const [date, setDate] = useState(today());
  const [energy, setEnergy] = useState(5);
  const [brainFog, setBrainFog] = useState(5);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setLogs(getSymptomLogs());
    setMounted(true);
  }, []);

  function save() {
    const trimmed = notes.trim().slice(0, NOTES_MAX);
    const entry: SymptomEntry = {
      date,
      energy,
      brainFog,
      weight: clampedNum(weight, 20, 400),
      waist: clampedNum(waist, 30, 300),
      bloodSugar: clampedNum(bloodSugar, 0, 30),
      notes: trimmed.length > 0 ? trimmed : undefined,
    };

    // Capture previous list for potential rollback before the optimistic
    // write replaces it.
    const previous = logs;
    const { local, pending } = addSymptomLog(entry);
    setLogs(local);
    showToast("Записано за " + date);

    // If the server explicitly refused (rate-limited), reverse the
    // optimistic write so the chart + list match what's actually
    // persisted server-side.
    pending.then((outcome) => {
      if (outcome === "rejected") {
        setLogs(removeSymptomLog(date));
        // If the date had a prior entry, restore it. (Edge case for
        // re-saves: the rate-limit kicked in on an UPDATE, so the
        // earlier version is still on server.)
        const prior = previous.find((e) => e.date === date);
        if (prior) {
          const restored = [...removeSymptomLog(date), prior].sort((a, b) =>
            a.date.localeCompare(b.date)
          );
          window.localStorage.setItem(
            "ir-symptom-log-v1",
            JSON.stringify(restored)
          );
          setLogs(restored);
        }
        showToast("Сървърът отказа (твърде много заявки) — записът е върнат.");
      }
    });
  }

  const chartData = logs.map((l) => ({
    date: l.date.slice(5),
    Енергия: l.energy,
    "Brain fog": l.brainFog,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Дневник на симптомите</h1>
        <p className="mt-2 text-slate-600">
          Следи как се чувстваш през 90-те дни. Енергията се качва, brain fog-ът
          пада — това са едни от първите признаци, че инсулинът спада.
        </p>
      </header>

      {/* Entry form */}
      <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
          </Field>
          <div />
          <Slider label={`Енергия: ${energy}`} value={energy} onChange={setEnergy} />
          <Slider label={`Brain fog: ${brainFog}`} value={brainFog} onChange={setBrainFog} />
          <Num
            label="Тегло (кг)"
            value={weight}
            onChange={setWeight}
            min={20}
            max={400}
            step={0.1}
          />
          <Num
            label="Талия (см)"
            value={waist}
            onChange={setWaist}
            min={30}
            max={300}
            step={0.5}
          />
          <Num
            label="Кръвна захар (mmol/L)"
            value={bloodSugar}
            onChange={setBloodSugar}
            min={0}
            max={30}
            step={0.1}
          />
        </div>

        {/* Notes — free text context for outliers */}
        <div className="mt-4">
          <label className="block">
            <span className="mb-1 flex items-baseline justify-between text-xs text-slate-500">
              <span>Бележка за деня (по избор)</span>
              <span className="text-slate-400">
                {notes.length} / {NOTES_MAX}
              </span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
              placeholder="напр. късна вечеря, стресна седмица, тренировка отпаднала…"
              rows={2}
              className="w-full resize-none rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
          </label>
        </div>

        <button
          onClick={save}
          className="mt-4 w-full rounded-xl bg-teal-500 py-3 font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Запиши деня
        </button>
      </div>

      {/* Hydration placeholder — bridges the gap before the localStorage
          read completes (and, for signed-in users, before SyncOnLogin
          pulls history from Turso). Prevents the "blank → full" flash. */}
      {!mounted && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Записи</h2>
          <SkeletonRows rows={3} />
        </div>
      )}

      {/* Empty / encouragement states (until chart is meaningful) */}
      {mounted && logs.length === 0 && (
        <div className="mb-8 flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-center text-sm text-slate-600">
          <LineChart className="h-6 w-6 text-teal-400" />
          <span>
            Запиши първия си ден отгоре — графиката на тренда ще се появи след
            втория запис.
          </span>
        </div>
      )}
      {mounted && logs.length === 1 && (
        <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-center text-sm text-slate-600">
          Чудесно начало! Запиши още поне един ден, за да видиш тренда.
        </div>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Енергия и brain fog (1-10)
          </h2>
          <JournalTrendChart data={chartData} />
        </div>
      )}

      {/* Recent entries */}
      {logs.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Записи</h2>
          <div className="space-y-2">
            {[...logs].reverse().map((l) => (
              <div
                key={l.date}
                className="rounded-xl border border-teal-100 bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-medium text-slate-700">{l.date}</span>
                  <span className="text-slate-500">Енергия {l.energy}</span>
                  <span className="text-slate-500">Фог {l.brainFog}</span>
                  {l.weight != null && <span className="text-slate-500">{l.weight} кг</span>}
                  {l.waist != null && <span className="text-slate-500">талия {l.waist}</span>}
                  {l.bloodSugar != null && (
                    <span className="text-slate-500">захар {l.bloodSugar}</span>
                  )}
                </div>
                {l.notes && (
                  <p className="mt-1.5 border-t border-teal-50 pt-1.5 text-xs italic leading-relaxed text-slate-500">
                    {l.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
      />
    </Field>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-500"
      />
    </Field>
  );
}
