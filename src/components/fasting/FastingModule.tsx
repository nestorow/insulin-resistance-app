import { FASTING_PHASES, FASTING_TARGETS } from "@/data/training";

export default function FastingModule() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-teal-700">Гладуване</h1>
        <p className="mt-2 text-slate-600">
          Времето без храна е най-прекият начин да свалиш инсулина. През 90-те
          дни прогресираш от 12 часа дневно към периодични 24 часа.
        </p>
      </header>

      {/* Phase timeline */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-teal-700">
          Какво се случва в тялото
        </h2>
        <div className="space-y-2">
          {FASTING_PHASES.map((p) => (
            <div
              key={p.minHours}
              className="flex items-center gap-3 rounded-xl border border-teal-100 bg-white p-3.5"
            >
              <span
                className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.minHours}-{p.maxHours}ч
              </span>
              <p className="text-sm text-slate-700">{p.label_bg}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Progression targets */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-teal-700">
          Прогресия през 90 дни
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FASTING_TARGETS.map((t) => (
            <div
              key={t.hours}
              className="rounded-2xl border border-teal-100 bg-white p-4"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-teal-600">
                  {t.hours}ч
                </span>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  {t.cadence_bg}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{t.note_bg}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
