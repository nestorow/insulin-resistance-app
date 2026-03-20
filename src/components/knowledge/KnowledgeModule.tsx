'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { keyFacts, chapters, fourPillars } from '@/data/knowledge';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, Lightbulb, BookOpen } from 'lucide-react';

/* ---------- Dynamic Lucide Icon ---------- */
const DynamicIcon = ({ name, ...props }: { name: string } & any) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon {...props} /> : null;
};

/* ========================================== */
/*            FOUR PILLARS HERO               */
/* ========================================== */
function PillarsHero() {
  return (
    <section className="mb-12">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-3xl sm:text-4xl font-extrabold text-teal-400 mb-2 tracking-tight"
      >
        4-те стълба на метаболичното здраве
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center text-slate-400 mb-8 text-sm sm:text-base max-w-xl mx-auto"
      >
        Фундаментът на програмата — контролирай тези четири области и инсулиновата резистентност отстъпва.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {fourPillars.map((pillar, i) => (
          <motion.div
            key={pillar.number}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15 * i, duration: 0.5, type: 'spring', stiffness: 120 }}
            className="relative rounded-2xl p-6 backdrop-blur-md bg-slate-800/70 border-2 overflow-hidden group hover:scale-[1.03] transition-transform duration-300"
            style={{ borderColor: pillar.color + '60' }}
          >
            {/* Glow background */}
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-2xl"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${pillar.color}44, transparent 70%)`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <span className="text-5xl">{pillar.icon}</span>
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest rounded-full px-3 py-0.5"
                style={{ color: pillar.color, backgroundColor: pillar.color + '20' }}
              >
                Стълб {pillar.number}
              </span>
              <h3 className="text-lg font-bold text-slate-100 leading-snug">
                {pillar.title_bg}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {pillar.description_bg}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ========================================== */
/*          KEY FACTS SCROLLER                */
/* ========================================== */
function KeyFactsScroller() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;
    const speed = 0.6; // px per frame

    const step = () => {
      if (!isPaused && el) {
        el.scrollLeft += speed;
        // Loop back when reaching end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <section className="mb-12">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="text-2xl font-bold text-teal-400 mb-5 flex items-center gap-2"
      >
        <Lightbulb className="w-6 h-6" />
        Ключови факти
      </motion.h2>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent snap-x snap-mandatory"
        style={{ scrollBehavior: 'auto' }}
      >
        {keyFacts.map((fact, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i }}
            className="flex-shrink-0 w-72 snap-center rounded-xl p-5 backdrop-blur-md bg-slate-800/70 border border-teal-400/30 shadow-[0_0_15px_rgba(20,184,166,0.08)] hover:shadow-[0_0_25px_rgba(20,184,166,0.18)] transition-shadow duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-teal-400/10 p-2 flex-shrink-0">
                <DynamicIcon name={fact.icon} className="w-5 h-5 text-teal-400" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed">
                {fact.text_bg}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ========================================== */
/*       CHAPTER ACCORDION CARD               */
/* ========================================== */
function ChapterCard({
  chapter,
  isOpen,
  onToggle,
}: {
  chapter: (typeof chapters)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="rounded-xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-md overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left group hover:bg-slate-700/30 transition-colors duration-200"
      >
        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-400/15 text-teal-400 font-bold text-sm flex items-center justify-center">
          {chapter.number}
        </span>
        <span className="flex-1 text-base font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
          {chapter.title_bg}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 text-slate-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Takeaways */}
              <ul className="space-y-2">
                {chapter.takeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>

              {/* Fun fact */}
              {chapter.funFact && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-900/30 p-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Знаете ли?
                    </span>
                    <p className="text-sm text-amber-100/90 mt-1 leading-relaxed">
                      {chapter.funFact}
                    </p>
                  </div>
                </div>
              )}

              {/* Related diseases */}
              {chapter.relatedDiseases.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {chapter.relatedDiseases.map((d) => (
                    <span
                      key={d}
                      className="inline-block text-xs rounded-full px-3 py-1 bg-slate-700/60 text-slate-300 border border-slate-600/40 hover:border-teal-400/50 hover:text-teal-300 cursor-pointer transition-colors duration-200"
                    >
                      {d.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ========================================== */
/*          CHAPTER SUMMARIES                 */
/* ========================================== */
function ChapterSummaries() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="text-2xl font-bold text-teal-400 mb-5 flex items-center gap-2"
      >
        <BookOpen className="w-6 h-6" />
        Резюмета по глави
      </motion.h2>

      <div className="space-y-3">
        {chapters.map((ch) => (
          <ChapterCard
            key={ch.number}
            chapter={ch}
            isOpen={openIndex === ch.number}
            onToggle={() => setOpenIndex(openIndex === ch.number ? null : ch.number)}
          />
        ))}
      </div>
    </section>
  );
}

/* ========================================== */
/*           MAIN EXPORT                      */
/* ========================================== */
export default function KnowledgeModule() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <PillarsHero />
      <KeyFactsScroller />
      <ChapterSummaries />
    </div>
  );
}
