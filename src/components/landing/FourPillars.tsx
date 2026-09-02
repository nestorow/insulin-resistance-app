import { WheatOff, Beef, EggFried, Clock } from "lucide-react";

// The 4 pillars of Bikman's protocol — shown right under the hero so the
// visitor immediately understands *what we actually do* before they scroll
// to the modules grid. Visual answer to "what's inside?".

const PILLARS = [
  {
    Icon: WheatOff,
    title: "Контрол на въглехидратите",
    body: "По-малко скокове на кръвната захар — по-нисък инсулин на гладно.",
  },
  {
    Icon: Beef,
    title: "Приоритет на протеина",
    body: "Запазва мускулната маса — главната „insulin sink“ на тялото.",
  },
  {
    Icon: EggFried,
    title: "Естествени мазнини",
    body: "Засищане без инсулинов отговор — обърнат гръб на seed oils.",
  },
  {
    Icon: Clock,
    title: "Гладуване с прогресия",
    body: "От 12ч ежедневно към 18:6 — времето без храна сваля инсулина.",
  },
];

export default function FourPillars() {
  return (
    <section className="w-full bg-mint/40 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-teal-700 sm:text-3xl">
          4-те стълба на протокола
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-600 sm:text-base">
          От д-р Benjamin Bikman, „Why We Get Sick“ — всеки от тях работи в
          различна посока, заедно свалят инсулина.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="flex flex-col items-center rounded-2xl border border-teal-100 bg-white p-5 text-center shadow-sm"
            >
              <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <p.Icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="mb-1.5 text-sm font-semibold text-slate-800 sm:text-base">
                {p.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
