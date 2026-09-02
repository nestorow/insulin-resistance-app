import { AlertTriangle, Clock, Pill } from "lucide-react";
import {
  supplements,
  GRADE_LEGEND,
  type EvidenceGrade,
} from "@/data/supplements";

const GRADE_CLS: Record<EvidenceGrade, string> = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-teal-100 text-teal-700",
  C: "bg-amber-100 text-amber-700",
};

// Sort by evidence strength A -> B -> C.
const ORDER: EvidenceGrade[] = ["A", "B", "C"];
const sorted = [...supplements].sort(
  (a, b) => ORDER.indexOf(a.grade) - ORDER.indexOf(b.grade)
);

export default function SupplementsModule() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Добавки</h1>
        <p className="mt-2 text-slate-600">
          Добавки, които могат да подпомогнат инсулиновата чувствителност.
          Основата винаги е храненето, движението и гладуването — добавките са
          само допълнение.
        </p>
      </header>

      {/* Disclaimer */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900">
          <strong>Това не е медицински съвет.</strong> Информацията е само с
          образователна цел. Консултирай се с лекар преди прием на добавки —
          особено ако приемаш лекарства (напр. берберин + лекарства за диабет
          може да причини хипогликемия) или си бременна.
        </p>
      </div>

      {/* Grade legend */}
      <div className="mb-8 flex flex-wrap gap-3 text-xs text-slate-600">
        {ORDER.map((g) => (
          <span key={g} className="inline-flex items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 font-bold ${GRADE_CLS[g]}`}>{g}</span>
            {GRADE_LEGEND[g]}
          </span>
        ))}
      </div>

      {/* Supplement cards */}
      <div className="space-y-3">
        {sorted.map((s) => (
          <div key={s.id} className="rounded-2xl border border-teal-100 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-teal-100 p-1.5 text-teal-600">
                  <Pill className="h-4 w-4" />
                </span>
                <div>
                  <span className="font-semibold text-slate-800">{s.name_bg}</span>
                  <span className="ml-2 text-xs text-slate-600">{s.name_en}</span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${GRADE_CLS[s.grade]}`}
                title={GRADE_LEGEND[s.grade]}
              >
                Данни: {s.grade}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{s.benefit_bg}</p>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-teal-50 p-2.5">
                <span className="block text-xs font-medium text-teal-700">Доза</span>
                <span className="text-slate-700">{s.dose_bg}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Clock className="h-3 w-3" /> Кога
                </span>
                <span className="text-slate-700">{s.timing_bg}</span>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-rose-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {s.caution_bg}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
