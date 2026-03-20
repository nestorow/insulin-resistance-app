'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { diseases, bodySystemNames } from '@/data/diseases';
import * as LucideIcons from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Disease {
  id: string;
  name_bg: string;
  name_en: string;
  bodySystem: string;
  description_bg: string;
  keyStats: string[];
  icon: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const DynamicIcon = ({ name, ...props }: { name: string } & any) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon {...props} /> : null;
};

/** Colour palette per body‑system */
const systemColors: Record<string, { text: string; bg: string; border: string; badge: string }> = {
  heart:             { text: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30',    badge: 'bg-red-400/20 text-red-300'    },
  brain:             { text: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/30',  badge: 'bg-purple-400/20 text-purple-300'  },
  reproductive:      { text: 'text-pink-400',    bg: 'bg-pink-400/10',    border: 'border-pink-400/30',    badge: 'bg-pink-400/20 text-pink-300'    },
  cancer:            { text: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  badge: 'bg-orange-400/20 text-orange-300'  },
  skin_muscle_bone:  { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30',   badge: 'bg-amber-400/20 text-amber-300'   },
  gi_liver_kidney:   { text: 'text-green-400',   bg: 'bg-green-400/10',   border: 'border-green-400/30',   badge: 'bg-green-400/20 text-green-300'   },
  metabolic:         { text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/30',    badge: 'bg-cyan-400/20 text-cyan-300'    },
};

const defaultColor = { text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/30', badge: 'bg-teal-400/20 text-teal-300' };

function getColor(system: string) {
  return systemColors[system] ?? defaultColor;
}

/** Icons shown in the filter tabs per system */
const systemIcons: Record<string, string> = {
  heart:            'Heart',
  brain:            'Brain',
  reproductive:     'Baby',
  cancer:           'Radiation',
  skin_muscle_bone: 'Bone',
  gi_liver_kidney:  'Stethoscope',
  metabolic:        'Activity',
};

/** Map body‑system ids to SVG region ids */
const regionToSystems: Record<string, string[]> = {
  head:        ['brain'],
  chest:       ['heart'],
  abdomen:     ['gi_liver_kidney', 'metabolic'],
  pelvis:      ['reproductive'],
  limbs:       ['skin_muscle_bone'],
  general:     ['cancer'],
};

/* -------------------------------------------------------------------------- */
/*  Body Silhouette SVG                                                       */
/* -------------------------------------------------------------------------- */

function BodySilhouette({
  activeSystem,
  onRegionClick,
}: {
  activeSystem: string | null;
  onRegionClick: (systems: string[]) => void;
}) {
  const regionFill = (systems: string[]) => {
    if (activeSystem && systems.includes(activeSystem)) return 'fill-teal-400/40 stroke-teal-400';
    return 'fill-slate-700/30 stroke-slate-500/40';
  };

  return (
    <svg
      viewBox="0 0 200 440"
      className="w-full max-w-[220px] mx-auto select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Full body silhouette outline */}
      <path
        d="
          M100 8
          C 82 8, 70 20, 70 38
          C 70 56, 82 68, 100 68
          C 118 68, 130 56, 130 38
          C 130 20, 118 8, 100 8
          Z
        "
        className="fill-slate-800/60 stroke-slate-500/50"
        strokeWidth="1.2"
      />
      <path
        d="
          M 85 68
          L 78 74 L 50 80 L 28 110 L 16 160 L 22 164 L 34 130
          L 46 100 L 60 88 L 72 82 L 80 100
          L 76 140 L 72 200 L 70 280 L 72 340 L 68 390 L 66 430
          L 80 432 L 86 400 L 90 340 L 96 280 L 100 260
          L 104 280 L 110 340 L 114 400 L 120 432 L 134 430
          L 132 390 L 128 340 L 130 280 L 128 200 L 124 140
          L 120 100 L 128 82 L 140 88 L 154 100 L 166 130
          L 178 164 L 184 160 L 172 110 L 150 80 L 122 74
          L 115 68
          Z
        "
        className="fill-slate-800/60 stroke-slate-500/50"
        strokeWidth="1.2"
      />

      {/* ---- Clickable Regions ---- */}

      {/* Head / Brain */}
      <ellipse
        cx="100" cy="38" rx="26" ry="26"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.head)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.head)}
      />
      <text x="100" y="42" textAnchor="middle" className="fill-slate-300 text-[9px] pointer-events-none font-medium">
        Мозък
      </text>

      {/* Chest / Heart */}
      <ellipse
        cx="100" cy="108" rx="28" ry="20"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.chest)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.chest)}
      />
      <text x="100" y="112" textAnchor="middle" className="fill-slate-300 text-[9px] pointer-events-none font-medium">
        Сърце
      </text>

      {/* Abdomen – GI / Metabolic */}
      <ellipse
        cx="100" cy="165" rx="30" ry="28"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.abdomen)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.abdomen)}
      />
      <text x="100" y="162" textAnchor="middle" className="fill-slate-300 text-[9px] pointer-events-none font-medium">
        Корем
      </text>
      <text x="100" y="174" textAnchor="middle" className="fill-slate-400 text-[7px] pointer-events-none">
        ГИТ / Метаб.
      </text>

      {/* Pelvis – Reproductive */}
      <ellipse
        cx="100" cy="215" rx="24" ry="16"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.pelvis)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.pelvis)}
      />
      <text x="100" y="219" textAnchor="middle" className="fill-slate-300 text-[9px] pointer-events-none font-medium">
        Репрод.
      </text>

      {/* Limbs – Skin / Muscle / Bone */}
      <rect
        x="18" y="120" width="28" height="44" rx="10"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.limbs)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.limbs)}
      />
      <text x="32" y="146" textAnchor="middle" className="fill-slate-300 text-[7px] pointer-events-none font-medium">
        Кожа
      </text>

      <rect
        x="154" y="120" width="28" height="44" rx="10"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.limbs)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.limbs)}
      />
      <text x="168" y="146" textAnchor="middle" className="fill-slate-300 text-[7px] pointer-events-none font-medium">
        Кости
      </text>

      {/* General – Cancer (small indicator near shoulder) */}
      <circle
        cx="100" cy="260" r="14"
        className={`body-region cursor-pointer transition-all duration-300 hover:fill-teal-400/30 hover:stroke-teal-400 ${regionFill(regionToSystems.general)}`}
        strokeWidth="1.5"
        onClick={() => onRegionClick(regionToSystems.general)}
      />
      <text x="100" y="264" textAnchor="middle" className="fill-slate-300 text-[7px] pointer-events-none font-medium">
        Рак
      </text>

      {/* Glow filter for hover effect */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        .body-region:hover {
          filter: url(#glow);
        }
      `}</style>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Disease Card                                                              */
/* -------------------------------------------------------------------------- */

function DiseaseCard({ disease }: { disease: Disease }) {
  const [expanded, setExpanded] = useState(false);
  const color = getColor(disease.bodySystem);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className={`bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden cursor-pointer hover:border-teal-500/40 transition-colors duration-200`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 mt-0.5 p-2 rounded-xl ${color.bg} ${color.text}`}>
          <DynamicIcon name={disease.icon} size={20} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-100 leading-tight">
            {disease.name_bg}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{disease.name_en}</p>

          {/* Badge */}
          <span
            className={`inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${color.badge}`}
          >
            {bodySystemNames[disease.bodySystem] ?? disease.bodySystem}
          </span>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1 text-slate-500"
        >
          <LucideIcons.ChevronDown size={18} />
        </motion.div>
      </div>

      {/* Expandable section */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-700/40">
              <p className="text-sm text-slate-300 leading-relaxed mt-2">
                {disease.description_bg}
              </p>

              {disease.keyStats.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {disease.keyStats.map((stat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <LucideIcons.TrendingUp
                        size={14}
                        className="shrink-0 mt-0.5 text-teal-400"
                      />
                      <span>{stat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export default function DiseaseMapModule() {
  const [activeSystem, setActiveSystem] = useState<string | null>(null);

  const systems = Object.keys(bodySystemNames);

  const filteredDiseases = activeSystem
    ? diseases.filter((d) => d.bodySystem === activeSystem)
    : diseases;

  /** Handle click from body silhouette – may map to multiple systems */
  const handleRegionClick = (regionSystems: string[]) => {
    if (regionSystems.length === 1 && activeSystem === regionSystems[0]) {
      setActiveSystem(null);
    } else {
      setActiveSystem(regionSystems[0]);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
          Карта на заболяванията
        </h2>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-base">
          Инсулиновата резистентност е свързана с множество заболявания в различни системи на тялото.
          Кликнете върху областите на тялото или филтрите, за да научите повече.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {/* "All" tab */}
        <button
          onClick={() => setActiveSystem(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
            activeSystem === null
              ? 'bg-teal-500/20 border-teal-400/50 text-teal-300'
              : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <LucideIcons.LayoutGrid size={14} />
          Всички
        </button>

        {systems.map((sys) => {
          const color = getColor(sys);
          const isActive = activeSystem === sys;
          return (
            <button
              key={sys}
              onClick={() => setActiveSystem(isActive ? null : sys)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? `${color.bg} ${color.border} ${color.text}`
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <DynamicIcon name={systemIcons[sys] ?? 'Circle'} size={14} />
              {bodySystemNames[sys]}
            </button>
          );
        })}
      </div>

      {/* Main content: silhouette + cards */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Body Silhouette – hidden on mobile, shown on lg+ */}
        <div className="hidden lg:block lg:w-[280px] shrink-0 sticky top-24">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 text-center mb-4">
              Кликнете върху област
            </h3>
            <BodySilhouette
              activeSystem={activeSystem}
              onRegionClick={handleRegionClick}
            />
            {activeSystem && (
              <button
                onClick={() => setActiveSystem(null)}
                className="mt-4 w-full text-center text-xs text-slate-400 hover:text-teal-400 transition-colors"
              >
                ← Покажи всички
              </button>
            )}
          </div>
        </div>

        {/* Disease Cards Grid */}
        <div className="flex-1 min-w-0">
          {/* Count indicator */}
          <p className="text-sm text-slate-500 mb-4">
            {filteredDiseases.length} заболявания
            {activeSystem && (
              <>
                {' '}
                в{' '}
                <span className={getColor(activeSystem).text}>
                  {bodySystemNames[activeSystem]}
                </span>
              </>
            )}
          </p>

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredDiseases.map((disease) => (
                <DiseaseCard key={disease.id} disease={disease} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredDiseases.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <LucideIcons.SearchX size={40} className="mx-auto mb-3 opacity-40" />
              <p>Няма намерени заболявания за тази категория.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
