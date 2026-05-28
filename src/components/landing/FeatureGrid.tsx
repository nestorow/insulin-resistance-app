"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Calendar,
  BookOpen,
  Activity,
  Utensils,
  Dumbbell,
  Clock,
  Pill,
  GraduationCap,
  Check,
  X,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// Mirrors the thyroid-rehab landing pattern: each card is a tap-to-preview
// for one of the 8 modules — modal explains what's inside before the user
// commits to clicking through.
interface Feature {
  id: string;
  href: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}

const FEATURES: Feature[] = [
  {
    id: "plan",
    href: "/plan",
    Icon: Calendar,
    title: "Дневен план",
    description:
      "90-дневен план с конкретни ежедневни навици, които свалят инсулина — храна, движение и гладуване, адаптирани към теста ти.",
    bullets: [
      "Сутрин / ден / вечер чеклист с отмятане",
      "Брояч Ден N / 90",
      "Въглехидратен таван спрямо tier-а ти",
    ],
  },
  {
    id: "journal",
    href: "/journal",
    Icon: BookOpen,
    title: "Дневник",
    description:
      "Проследявай как се чувстваш всеки ден и виж тенденциите с графики. Енергията се качва, brain fog-ът пада — това са първите признаци.",
    bullets: [
      "Енергия, brain fog, тегло, талия, кр. захар",
      "Графика на 90-те дни",
      "Записи по дата",
    ],
  },
  {
    id: "markers",
    href: "/markers",
    Icon: Activity,
    title: "Показатели",
    description:
      "HOMA-IR, инсулин на гладно, HbA1c, TG/HDL — кръвните маркери, които наистина показват напредъка.",
    bullets: [
      "Месечни записи",
      "Графика на тренда",
      "TG/HDL индикация (Pattern A/B)",
    ],
  },
  {
    id: "foods",
    href: "/foods",
    Icon: Utensils,
    title: "Хранителен справочник",
    description:
      "Над 75 храни с гликемичен товар и макроси, разделени на зелени, жълти и червени, плюс ферментирали, подсладители и мазнини.",
    bullets: [
      "GL + макроси + размер на порция",
      "Търсене и филтър по категория",
      "Ферментирали · подсладители · мазнини",
    ],
  },
  {
    id: "exercise",
    href: "/exercise",
    Icon: Dumbbell,
    title: "Тренировки",
    description:
      "Силови тренировки и разходки след хранене — най-мощният „insulin sink&rdquo;. Мускулите поглъщат глюкоза почти без инсулин.",
    bullets: [
      "6 принципа на Bikman",
      "Седмичен план (силови / HIIT / студ)",
      "Защо интензивността > продължителността",
    ],
  },
  {
    id: "fasting",
    href: "/fasting",
    Icon: Clock,
    title: "Гладуване",
    description:
      "Времето без храна е най-прекият път да свалиш инсулина. Прогресия от 12ч ежедневно към периодични 24ч.",
    bullets: [
      "6-фазна физиология (0-24 часа)",
      "90-дневна прогресия 12ч → 24ч",
      "Кога се активира автофагията",
    ],
  },
  {
    id: "supplements",
    href: "/supplements",
    Icon: Pill,
    title: "Добавки",
    description:
      "Evidence-graded справочник за добавки, които може да подпомогнат инсулиновата чувствителност. С ясни предупреждения за взаимодействия.",
    bullets: [
      "Берберин, магнезий, ALA, инозитол…",
      "A/B/C класификация по сила на данните",
      "Предупреждения за лекарствени взаимодействия",
    ],
  },
  {
    id: "education",
    href: "/education",
    Icon: GraduationCap,
    title: "Образование",
    description:
      "Защо инсулиновата резистентност е в основата на 30+ хронични болести — по книгата на д-р Benjamin Bikman „Why We Get Sick&rdquo;.",
    bullets: [
      "30+ заболявания, картирани на тялото",
      "15 глави от книгата + ключови факти",
      "4-те стълба на Bikman",
    ],
  },
];

export default function FeatureGrid() {
  const [active, setActive] = useState<Feature | null>(null);

  return (
    <>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f)}
            aria-haspopup="dialog"
            className="flex flex-col items-center justify-center rounded-xl border border-teal-100 bg-white p-4 shadow-sm transition-all hover:scale-105 hover:border-teal-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <f.Icon className="mb-2 h-7 w-7 text-teal-600" />
            <span className="text-sm font-medium text-slate-700">{f.title}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Натисни функция, за да видиш какво включва
      </p>

      <Dialog.Root
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
            {active && (
              <>
                <Dialog.Close
                  aria-label="Затвори"
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-teal-100 p-2.5 text-teal-600">
                    <active.Icon className="h-5 w-5" />
                  </span>
                  <Dialog.Title className="text-lg font-bold text-slate-800">
                    {active.title}
                  </Dialog.Title>
                </div>
                <Dialog.Description className="mt-3 text-sm leading-relaxed text-slate-600">
                  {active.description}
                </Dialog.Description>
                <ul className="mt-4 space-y-2">
                  {active.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={active.href}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  Към модула <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
