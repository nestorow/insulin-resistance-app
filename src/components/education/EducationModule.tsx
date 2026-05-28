"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Brain,
  Baby,
  Ribbon,
  Bone,
  Droplet,
  Gauge,
  Sparkles,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { keyFacts, fourPillars, chapters } from "@/data/knowledge";
import { diseases, bodySystemNames } from "@/data/diseases";
import BodySilhouette from "./BodySilhouette";

const SYSTEM_ICON: Record<string, LucideIcon> = {
  heart: Heart,
  brain: Brain,
  reproductive: Baby,
  cancer: Ribbon,
  skin_muscle_bone: Bone,
  gi_liver_kidney: Droplet,
  metabolic: Gauge,
};

const SYSTEM_ORDER = Object.keys(bodySystemNames);

export default function EducationModule() {
  const [system, setSystem] = useState<string>("all");
  const [openChapter, setOpenChapter] = useState<number | null>(null);

  const shown = useMemo(
    () => (system === "all" ? diseases : diseases.filter((d) => d.bodySystem === system)),
    [system]
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-teal-700">Образование</h1>
        <p className="mt-2 text-slate-600">
          Защо инсулиновата резистентност е в основата на толкова болести —
          по книгата на д-р Benjamin Bikman.
        </p>
      </header>

      {/* Key facts */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {keyFacts.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl border border-teal-100 bg-white p-3.5 text-sm text-slate-700"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              {f.text_bg}
            </div>
          ))}
        </div>
      </section>

      {/* Four pillars */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-teal-700">4-те стълба</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fourPillars.map((p) => (
            <div
              key={p.number}
              className="rounded-2xl border border-teal-100 bg-white p-4"
              style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.icon}</span>
                <span className="font-semibold text-slate-800">
                  {p.number}. {p.title_bg}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{p.description_bg}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diseases */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-teal-700">
          Заболявания, свързани с ИР
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Кликни регион от тялото или избери система — за да видиш свързаните
          заболявания.
        </p>

        {/* Interactive body map */}
        <div className="mb-5 rounded-2xl border border-teal-100 bg-white p-4">
          <BodySilhouette
            activeSystem={system}
            onRegionClick={(s) => setSystem(s)}
          />
        </div>

        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip active={system === "all"} onClick={() => setSystem("all")}>
            Всички
          </Chip>
          {SYSTEM_ORDER.map((key) => (
            <Chip key={key} active={system === key} onClick={() => setSystem(key)}>
              {bodySystemNames[key]}
            </Chip>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shown.map((d) => {
            const Icon = SYSTEM_ICON[d.bodySystem] ?? Sparkles;
            return (
              <div
                key={d.id}
                className="rounded-2xl border border-teal-100 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-teal-100 p-1.5 text-teal-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-slate-800">{d.name_bg}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{d.description_bg}</p>
                {d.keyStats.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {d.keyStats.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Chapters */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-teal-700">Глави от книгата</h2>
        <div className="space-y-2">
          {chapters.map((c) => {
            const open = openChapter === c.number;
            return (
              <div
                key={c.number}
                className="overflow-hidden rounded-xl border border-teal-100 bg-white"
              >
                <button
                  onClick={() => setOpenChapter(open ? null : c.number)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {c.number}. {c.title_bg}
                  </span>
                  <motion.span animate={{ rotate: open ? 180 : 0 }}>
                    <ChevronDown className="h-4 w-4 text-teal-500" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <ul className="space-y-1.5">
                          {c.takeaways.map((t, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                              {t}
                            </li>
                          ))}
                        </ul>
                        {c.funFact && (
                          <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
                            💡 {c.funFact}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-teal-500 text-white"
          : "bg-white text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50"
      }`}
    >
      {children}
    </button>
  );
}
