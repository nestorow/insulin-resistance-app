import Link from "next/link";
import {
  Users,
  Clock,
  TrendingUp,
  Moon,
  Armchair,
  AlertTriangle,
  Target,
  Ear,
  Volume2,
  AlertOctagon,
  Award,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import LandingCTA from "@/components/LandingCTA";
import Logo from "@/components/Logo";
import { keyFacts } from "@/data/knowledge";

const FACT_ICON: Record<string, LucideIcon> = {
  Users,
  Clock,
  TrendingUp,
  Moon,
  Armchair,
  AlertTriangle,
  Target,
  Ear,
  Volume2,
  AlertOctagon,
  Award,
};

export default function Home() {
  return (
    <main className="min-h-dvh">
      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <Logo size={56} className="mx-auto mb-6" />

          <p className="mb-4 inline-block rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700">
            Базирано на д-р Benjamin Bikman · „Why We Get Sick&rdquo;
          </p>

          <h1 className="text-4xl font-extrabold leading-tight text-teal-700 sm:text-5xl">
            Обърни инсулиновата
            <br />
            резистентност за 90 дни
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Персонализиран протокол с 4-те стълба на Bikman — хранене, движение,
            гладуване и проследяване на показателите ти. Един продукт, адаптиран
            към твоя профил.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <LandingCTA />
          </div>
        </div>
      </section>

      {/* Why this matters — educational hook */}
      <section className="border-t border-teal-100 bg-teal-50 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-extrabold text-teal-700">
            Защо това има значение
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Инсулиновата резистентност е тихият двигател зад повечето хронични
            болести. 11 факта, които вероятно не знаеш.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {keyFacts.map((f, i) => {
              const Icon = FACT_ICON[f.icon] ?? Sparkles;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-teal-100 bg-white p-3.5 text-sm text-slate-700"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                  {f.text_bg}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/education"
              className="inline-block rounded-xl bg-teal-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600"
            >
              Виж всички заболявания и глави →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-400">
        Без регистрация · информацията не е медицински съвет
      </footer>
    </main>
  );
}
