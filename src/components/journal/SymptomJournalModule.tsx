"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getSymptomLogs,
  addSymptomLog,
  type SymptomEntry,
} from "@/lib/tracking-storage";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SymptomJournalModule() {
  const [logs, setLogs] = useState<SymptomEntry[]>([]);
  const [date, setDate] = useState(today());
  const [energy, setEnergy] = useState(5);
  const [brainFog, setBrainFog] = useState(5);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");

  useEffect(() => {
    setLogs(getSymptomLogs());
  }, []);

  function save() {
    const entry: SymptomEntry = {
      date,
      energy,
      brainFog,
      weight: weight ? parseFloat(weight) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      bloodSugar: bloodSugar ? parseFloat(bloodSugar) : undefined,
    };
    setLogs(addSymptomLog(entry));
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
          <Num label="Тегло (кг)" value={weight} onChange={setWeight} />
          <Num label="Талия (см)" value={waist} onChange={setWaist} />
          <Num label="Кръвна захар (mmol/L)" value={bloodSugar} onChange={setBloodSugar} />
        </div>
        <button
          onClick={save}
          className="mt-4 w-full rounded-xl bg-teal-500 py-3 font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Запиши деня
        </button>
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Енергия и brain fog (1-10)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Енергия" stroke="#1B7A6E" strokeWidth={2} />
              <Line type="monotone" dataKey="Brain fog" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
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
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-teal-100 bg-white p-3 text-sm"
              >
                <span className="font-medium text-slate-700">{l.date}</span>
                <span className="text-slate-500">Енергия {l.energy}</span>
                <span className="text-slate-500">Фог {l.brainFog}</span>
                {l.weight != null && <span className="text-slate-500">{l.weight} кг</span>}
                {l.waist != null && <span className="text-slate-500">талия {l.waist}</span>}
                {l.bloodSugar != null && (
                  <span className="text-slate-500">захар {l.bloodSugar}</span>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
