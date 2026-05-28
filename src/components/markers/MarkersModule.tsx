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
  getMarkerLogs,
  addMarkerLog,
  type MarkerEntry,
} from "@/lib/tracking-storage";
import { showToast } from "@/lib/toast";
import { clampedNum } from "@/lib/numbers";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function MarkersModule() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<MarkerEntry[]>([]);
  const [date, setDate] = useState(today());
  const [homaIr, setHomaIr] = useState("");
  const [fastingInsulin, setFastingInsulin] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [tg, setTg] = useState("");
  const [hdl, setHdl] = useState("");

  useEffect(() => {
    setLogs(getMarkerLogs());
    setMounted(true);
  }, []);

  function save() {
    const entry: MarkerEntry = {
      date,
      homaIr: clampedNum(homaIr, 0, 50),
      fastingInsulin: clampedNum(fastingInsulin, 0, 500),
      hba1c: clampedNum(hba1c, 3, 20),
      triglycerides: clampedNum(tg, 0, 2000),
      hdl: clampedNum(hdl, 0, 200),
    };
    setLogs(addMarkerLog(entry));
    showToast("Записано за " + date);
  }

  const chartData = logs.map((l) => ({
    date: l.date.slice(5),
    "HOMA-IR": l.homaIr ?? null,
    "Инсулин": l.fastingInsulin ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Тракер на показатели</h1>
        <p className="mt-2 text-slate-600">
          Въвеждай кръвните си показатели месечно. Инсулинът на гладно и HOMA-IR
          реагират най-рано — често преди глюкозата.
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
          <Num
            label="HOMA-IR"
            value={homaIr}
            onChange={setHomaIr}
            min={0}
            max={50}
            step={0.1}
          />
          <Num
            label="Инсулин на гладно (µU/mL)"
            value={fastingInsulin}
            onChange={setFastingInsulin}
            min={0}
            max={500}
            step={0.1}
          />
          <Num
            label="HbA1c (%)"
            value={hba1c}
            onChange={setHba1c}
            min={3}
            max={20}
            step={0.1}
          />
          <div />
          <Num
            label="Триглицериди (mg/dL)"
            value={tg}
            onChange={setTg}
            min={0}
            max={2000}
            step={1}
          />
          <Num
            label="HDL (mg/dL)"
            value={hdl}
            onChange={setHdl}
            min={0}
            max={200}
            step={1}
          />
        </div>
        <button
          onClick={save}
          className="mt-4 w-full rounded-xl bg-teal-500 py-3 font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Запиши показателите
        </button>
      </div>

      {/* Empty / encouragement states (until chart is meaningful) */}
      {mounted && logs.length === 0 && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-center text-sm text-slate-600">
          🧪 Въведи първите си показатели — обикновено месечно. Графиката се
          активира след втория запис.
        </div>
      )}
      {mounted && logs.length === 1 && (
        <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-center text-sm text-slate-600">
          Имаш baseline. Запиши още един месец, за да видиш тренда.
        </div>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            HOMA-IR и инсулин на гладно
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F5F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="HOMA-IR" stroke="#1B7A6E" strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="Инсулин" stroke="#06b6d4" strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent entries */}
      {logs.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Записи</h2>
          <div className="space-y-2">
            {[...logs].reverse().map((l) => {
              const ratio =
                l.triglycerides && l.hdl ? l.triglycerides / l.hdl : null;
              return (
                <div
                  key={l.date}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-teal-100 bg-white p-3 text-sm"
                >
                  <span className="font-medium text-slate-700">{l.date}</span>
                  {l.homaIr != null && <span className="text-slate-500">HOMA {l.homaIr}</span>}
                  {l.fastingInsulin != null && (
                    <span className="text-slate-500">инсулин {l.fastingInsulin}</span>
                  )}
                  {l.hba1c != null && <span className="text-slate-500">HbA1c {l.hba1c}%</span>}
                  {ratio != null && (
                    <span
                      className={ratio < 2 ? "text-teal-600" : "text-rose-600"}
                    >
                      TG/HDL {ratio.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
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
