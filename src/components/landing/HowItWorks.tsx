import { ClipboardList, ListChecks, LineChart } from "lucide-react";

// "How it works in 3 steps" — placed between FourPillars (the WHAT) and the
// modules preview grid (the WHERE), so a first-time visitor sees the path
// before the menu. Mirrors thyroid-rehab's 3-step pattern.

const STEPS = [
  {
    Icon: ClipboardList,
    badge: "1",
    title: "Тест (3 мин)",
    body: "8 въпроса + опционално TG/HDL и съотношение талия/ханш — намираме твоя профил и нужния въглехидратен таван.",
  },
  {
    Icon: ListChecks,
    badge: "2",
    title: "Персонален план",
    body: "Дневен чеклист с конкретни действия — закуска, движение, прозорец на хранене — адаптирани към теста ти.",
  },
  {
    Icon: LineChart,
    badge: "3",
    title: "Проследяване",
    body: "Симптоми всеки ден, кръвни маркери (HOMA-IR, инсулин, HbA1c) при изследване — графика показва тренда.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-teal-700 sm:text-3xl">
          Как работи за 90 дни
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          Три стъпки — без приложение за изтегляне, без абонамент.
        </p>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.badge}
              className="relative flex flex-col rounded-2xl border border-teal-100 bg-white p-6 shadow-sm"
            >
              <span className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white shadow">
                {s.badge}
              </span>
              <s.Icon
                className="mb-3 h-8 w-8 text-teal-600"
                strokeWidth={1.6}
              />
              <h3 className="mb-2 text-base font-semibold text-slate-800 sm:text-lg">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
