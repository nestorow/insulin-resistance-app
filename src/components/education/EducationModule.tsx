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
  Search,
  X,
  Lightbulb,
  WheatOff,
  Beef,
  EggFried,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { keyFacts, fourPillars, chapters } from "@/data/knowledge";
import { diseases, bodySystemNames } from "@/data/diseases";
import { buildSearchBlob, matchesQuery } from "@/lib/education-search";

// Pillar icons mirror the landing FourPillars set, keyed by pillar number.
const PILLAR_ICONS: Record<number, LucideIcon> = {
  1: WheatOff,
  2: Beef,
  3: EggFried,
  4: Clock,
};
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

// Pre-compute search blobs once at module load — the data is static so
// there's no point re-normalising per keystroke. Each disease + chapter
// gets a single concatenated, normalised text field that the query
// scans against.
const DISEASE_BLOBS = diseases.map((d) =>
  buildSearchBlob([d.name_bg, d.name_en, d.description_bg, ...d.keyStats])
);
const CHAPTER_BLOBS = chapters.map((c) =>
  buildSearchBlob([c.title_bg, c.funFact ?? "", ...c.takeaways])
);

export default function EducationModule() {
  const [system, setSystem] = useState<string>("all");
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  // Filter diseases by both body-system chip AND search query — chip
  // narrows the category, query narrows the text. Empty query passes
  // everything (matchesQuery returns true for empty).
  const shown = useMemo(() => {
    const base = system === "all"
      ? diseases
      : diseases.filter((d) => d.bodySystem === system);
    if (!query.trim()) return base;
    return base.filter((d) => {
      const idx = diseases.indexOf(d);
      return matchesQuery(DISEASE_BLOBS[idx], query);
    });
  }, [system, query]);

  const matchingChapters = useMemo(() => {
    if (!query.trim()) return chapters;
    return chapters.filter((_, i) => matchesQuery(CHAPTER_BLOBS[i], query));
  }, [query]);

  // When the user searches, auto-expand any single matching chapter so
  // they don't have to click through. Multiple matches stay collapsed
  // (user picks). Cleared query restores the previous explicit state.
  const effectiveOpenChapter =
    query.trim() && matchingChapters.length === 1
      ? matchingChapters[0].number
      : openChapter;

  const totalMatches = shown.length + matchingChapters.length;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Образование</h1>
        <p className="mt-2 text-slate-600">
          Защо инсулиновата резистентност е в основата на толкова болести —
          по книгата на д-р Benjamin Bikman.
        </p>
      </header>

      {/* Search — scans diseases + chapters in one box. Body-system chip
          remains independent so users can scope first then filter. */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Търси в съдържанието (напр. PCOS, мозък, гладуване)…"
          aria-label="Търсене в образованието"
          className="w-full rounded-xl border border-teal-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Изчисти търсенето"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hasQuery && (
        <p
          className="mb-6 text-xs text-slate-500"
          role="status"
          aria-live="polite"
        >
          {totalMatches === 0
            ? "Няма съвпадения."
            : `${totalMatches} ${totalMatches === 1 ? "съвпадение" : "съвпадения"} · ${shown.length} болест${
                shown.length === 1 ? "" : "и"
              } · ${matchingChapters.length} глав${matchingChapters.length === 1 ? "а" : "и"}`}
        </p>
      )}

      {/* Key facts — hidden during search so the user focuses on matches */}
      {!hasQuery && <>
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
          {fourPillars.map((p) => {
            const Icon = PILLAR_ICONS[p.number];
            return (
              <div
                key={p.number}
                className="rounded-2xl border border-teal-100 bg-white p-4"
                style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-2">
                  {Icon && (
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{ color: p.color }}
                      strokeWidth={1.8}
                    />
                  )}
                  <span className="font-semibold text-slate-800">
                    {p.number}. {p.title_bg}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{p.description_bg}</p>
              </div>
            );
          })}
        </div>
      </section>
      </>}

      {/* Diseases */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-teal-700">
          {hasQuery ? "Намерени заболявания" : "Заболявания, свързани с ИР"}
        </h2>
        {!hasQuery && (
          <p className="mb-4 text-sm text-slate-500">
            Кликни регион от тялото или избери система — за да видиш свързаните
            заболявания.
          </p>
        )}

        {/* Interactive body map + chip filter — hidden during search so the
            user isn't navigating two filters at once. */}
        {!hasQuery && (
          <>
            <div className="mb-5 rounded-2xl border border-teal-100 bg-white p-4">
              <BodySilhouette
                activeSystem={system}
                onRegionClick={(s) => setSystem(s)}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-2.5">
              <Chip active={system === "all"} onClick={() => setSystem("all")}>
                Всички
              </Chip>
              {SYSTEM_ORDER.map((key) => (
                <Chip
                  key={key}
                  active={system === key}
                  onClick={() => setSystem(key)}
                >
                  {bodySystemNames[key]}
                </Chip>
              ))}
            </div>
          </>
        )}

        {shown.length === 0 ? (
          <p className="text-sm text-slate-500">
            {hasQuery
              ? "Няма заболявания с тази дума. Опитай по-обща (напр. „мозък“, „жени“, „възпаление“)."
              : "Няма заболявания в тази категория."}
          </p>
        ) : (
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
        )}
      </section>

      {/* Chapters */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-teal-700">
          {hasQuery ? "Намерени глави" : "Глави от книгата"}
        </h2>
        {matchingChapters.length === 0 && hasQuery ? (
          <p className="text-sm text-slate-500">
            Няма глави с тази дума.
          </p>
        ) : (
        <div className="space-y-2">
          {matchingChapters.map((c) => {
            const open = effectiveOpenChapter === c.number;
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
                          <p className="mt-3 flex items-start gap-2 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
                            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{c.funFact}</span>
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
        )}
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
      className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
        active
          ? "bg-teal-500 text-white"
          : "bg-white text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50"
      }`}
    >
      {children}
    </button>
  );
}
