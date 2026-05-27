import { Dumbbell, Zap, Wind, Snowflake } from "lucide-react";
import { EXERCISE_PRINCIPLES, WEEKLY_PLAN, type WeeklyDay } from "@/data/training";

const KIND_META: Record<WeeklyDay["kind"], { icon: typeof Dumbbell; cls: string }> = {
  strength: { icon: Dumbbell, cls: "text-orange-500 bg-orange-50" },
  hiit: { icon: Zap, cls: "text-amber-500 bg-amber-50" },
  rest: { icon: Wind, cls: "text-emerald-500 bg-emerald-50" },
  cold: { icon: Snowflake, cls: "text-cyan-500 bg-cyan-50" },
};

export default function ExerciseModule() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-teal-700">Тренировки</h1>
        <p className="mt-2 text-slate-600">
          Силови тренировки и разходки след хранене са най-мощният „insulin
          sink&rdquo; — мускулите поглъщат глюкоза без нужда от много инсулин.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-teal-700">Принципи</h2>
        <ul className="space-y-2">
          {EXERCISE_PRINCIPLES.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-xl border border-teal-100 bg-white p-3.5 text-sm text-slate-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-600">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-teal-700">Седмичен план</h2>
        <div className="space-y-2">
          {WEEKLY_PLAN.map((d) => {
            const meta = KIND_META[d.kind];
            const Icon = meta.icon;
            return (
              <div
                key={d.day_bg}
                className="flex items-center gap-3 rounded-xl border border-teal-100 bg-white p-3.5"
              >
                <span className={`rounded-lg p-2 ${meta.cls}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{d.day_bg}</p>
                  <p className="text-sm text-slate-600">{d.activity_bg}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
