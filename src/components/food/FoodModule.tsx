'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { foods, fermentedFoods, sweeteners, fatGuides } from '@/data/foods';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Droplets,
  FlaskConical,
  Cookie,
} from 'lucide-react';

type CategoryFilter = 'all' | 'green' | 'yellow' | 'red' | 'bookmarked';
type SpecialSection = 'fermented' | 'fats' | 'sweeteners' | null;

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'Всички',
  green: 'Свободно',
  yellow: 'Внимателно',
  red: 'Опасност',
  bookmarked: 'Отметки',
};

const categoryBorder: Record<string, string> = {
  green: 'border-l-green-500',
  yellow: 'border-l-yellow-500',
  red: 'border-l-red-500',
};

const categoryTabStyle: Record<CategoryFilter, string> = {
  all: 'data-[active=true]:bg-slate-600 data-[active=true]:text-white',
  green:
    'data-[active=true]:bg-green-500/20 data-[active=true]:text-green-400 data-[active=true]:ring-1 data-[active=true]:ring-green-500/50',
  yellow:
    'data-[active=true]:bg-yellow-500/20 data-[active=true]:text-yellow-400 data-[active=true]:ring-1 data-[active=true]:ring-yellow-500/50',
  red: 'data-[active=true]:bg-red-500/20 data-[active=true]:text-red-400 data-[active=true]:ring-1 data-[active=true]:ring-red-500/50',
  bookmarked:
    'data-[active=true]:bg-pink-500/20 data-[active=true]:text-pink-400 data-[active=true]:ring-1 data-[active=true]:ring-pink-500/50',
};

const glBadgeColor: Record<string, string> = {
  green: 'bg-green-500/20 text-green-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
  red: 'bg-red-500/20 text-red-400',
};

const macroColors = {
  fat: 'bg-amber-400',
  protein: 'bg-blue-400',
  carbs: 'bg-rose-400',
  fiber: 'bg-emerald-400',
};

const macroLabels: Record<string, string> = {
  fat: 'Мазнини',
  protein: 'Протеин',
  carbs: 'Въглехидрати',
  fiber: 'Фибри',
};

export default function FoodModule() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedFood, setExpandedFood] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SpecialSection>(null);

  const { bookmarkedFoods, toggleBookmark } = useStore();

  const filteredFoods = useMemo(() => {
    const query = search.toLowerCase().trim();

    return foods.filter((food) => {
      // Category / bookmark filter
      if (categoryFilter === 'bookmarked') {
        if (!bookmarkedFoods.includes(food.id)) return false;
      } else if (categoryFilter !== 'all') {
        if (food.category !== categoryFilter) return false;
      }

      // Text search
      if (query) {
        const matchName =
          food.name_bg.toLowerCase().includes(query) ||
          food.name_en.toLowerCase().includes(query);
        if (!matchName) return false;
      }

      return true;
    });
  }, [search, categoryFilter, bookmarkedFoods]);

  const toggleExpand = (id: string) => {
    setExpandedFood((prev) => (prev === id ? null : id));
  };

  const toggleSection = (section: SpecialSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсене на храна..."
          className="w-full pl-10 pr-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            data-active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${categoryFilter !== cat ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50' : ''}
              ${categoryTabStyle[cat]}`}
          >
            {categoryLabels[cat]}
            {cat === 'bookmarked' && bookmarkedFoods.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">
                ({bookmarkedFoods.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Food cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredFoods.map((food) => {
            const isExpanded = expandedFood === food.id;
            const isBookmarked = bookmarkedFoods.includes(food.id);
            const total =
              food.macros.fat + food.macros.protein + food.macros.carbs + food.macros.fiber;

            return (
              <motion.div
                key={food.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-slate-800/70 border border-slate-700/50 rounded-2xl border-l-4 ${categoryBorder[food.category]} overflow-hidden cursor-pointer`}
                onClick={() => toggleExpand(food.id)}
              >
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-slate-100 font-semibold truncate">
                        {food.name_bg}
                      </h3>
                      <p className="text-slate-400 text-sm truncate">
                        {food.name_en}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* GL badge */}
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${glBadgeColor[food.category]}`}
                      >
                        GL {food.gl}
                      </span>
                      {/* Bookmark button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(food.id);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-5 w-5 text-pink-400" />
                        ) : (
                          <Bookmark className="h-5 w-5 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Macros bar */}
                  {total > 0 && (
                    <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-slate-700/50">
                      {food.macros.fat > 0 && (
                        <div
                          className={`${macroColors.fat}`}
                          style={{ width: `${(food.macros.fat / total) * 100}%` }}
                        />
                      )}
                      {food.macros.protein > 0 && (
                        <div
                          className={`${macroColors.protein}`}
                          style={{ width: `${(food.macros.protein / total) * 100}%` }}
                        />
                      )}
                      {food.macros.carbs > 0 && (
                        <div
                          className={`${macroColors.carbs}`}
                          style={{ width: `${(food.macros.carbs / total) * 100}%` }}
                        />
                      )}
                      {food.macros.fiber > 0 && (
                        <div
                          className={`${macroColors.fiber}`}
                          style={{ width: `${(food.macros.fiber / total) * 100}%` }}
                        />
                      )}
                    </div>
                  )}

                  {/* Serving size */}
                  <p className="mt-2 text-xs text-slate-500">
                    Порция: {food.servingSize}
                  </p>

                  {/* Notes */}
                  {food.notes_bg && (
                    <p className="mt-1 text-xs text-slate-400 italic">
                      {food.notes_bg}
                    </p>
                  )}

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-2">
                          {/* Macro legend */}
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              Object.entries(food.macros) as [
                                keyof typeof food.macros,
                                number,
                              ][]
                            ).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${macroColors[key]}`}
                                />
                                <span className="text-xs text-slate-400">
                                  {macroLabels[key]}
                                </span>
                                <span className="text-xs text-slate-300 font-medium ml-auto">
                                  {value}g
                                </span>
                              </div>
                            ))}
                          </div>
                          {total > 0 && (
                            <p className="text-xs text-slate-500 text-right">
                              Общо макро: {total.toFixed(1)}g / порция
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expand indicator */}
                  <div className="flex justify-center mt-2">
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredFoods.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg">Няма намерени храни</p>
          <p className="text-sm mt-1">Опитайте с друго търсене или филтър</p>
        </div>
      )}

      {/* Special sections */}
      <div className="space-y-3 pt-4">
        {/* Fermented foods */}
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('fermented')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <FlaskConical className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-slate-100 font-semibold">
                Ферментирали храни
              </span>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                activeSection === 'fermented' ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {activeSection === 'fermented' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {fermentedFoods.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-xl"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-purple-400 shrink-0" />
                      <div>
                        <p className="text-slate-200 font-medium">
                          {item.name_bg}{' '}
                          <span className="text-slate-500 text-sm">
                            ({item.name_en})
                          </span>
                        </p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          {item.benefit_bg}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fat guide */}
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('fats')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Droplets className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-slate-100 font-semibold">Мазнини</span>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                activeSection === 'fats' ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {activeSection === 'fats' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {fatGuides.map((guide) => {
                    const colorMap: Record<string, string> = {
                      green: 'border-l-green-500 bg-green-500/5',
                      teal: 'border-l-teal-500 bg-teal-500/5',
                      yellow: 'border-l-yellow-500 bg-yellow-500/5',
                      red: 'border-l-red-500 bg-red-500/5',
                    };
                    const dotMap: Record<string, string> = {
                      green: 'bg-green-400',
                      teal: 'bg-teal-400',
                      yellow: 'bg-yellow-400',
                      red: 'bg-red-400',
                    };
                    return (
                      <div
                        key={guide.category}
                        className={`border-l-4 rounded-xl p-3 ${colorMap[guide.color] || 'border-l-slate-500 bg-slate-700/20'}`}
                      >
                        <h4 className="text-slate-200 font-semibold text-sm mb-2">
                          {guide.category_bg}
                        </h4>
                        <div className="space-y-1.5">
                          {guide.items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div
                                className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${dotMap[guide.color] || 'bg-slate-400'}`}
                              />
                              <p className="text-sm text-slate-300">
                                <span className="font-medium">{item.name_bg}</span>
                                {item.use_bg && (
                                  <span className="text-slate-500">
                                    {' '}&mdash; {item.use_bg}
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sweeteners */}
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('sweeteners')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <Cookie className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-slate-100 font-semibold">Подсладители</span>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                activeSection === 'sweeteners' ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {activeSection === 'sweeteners' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left py-2 pr-3 text-slate-400 font-medium">
                            Подсладител
                          </th>
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">
                            Ефект сам
                          </th>
                          <th className="text-left py-2 pl-3 text-slate-400 font-medium">
                            Ефект с храна
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sweeteners.map((sw) => (
                          <tr
                            key={sw.name_en}
                            className={`border-b border-slate-700/30 ${
                              sw.safe
                                ? 'bg-green-500/5'
                                : 'bg-red-500/5'
                            }`}
                          >
                            <td className="py-2.5 pr-3">
                              <span
                                className={`font-medium ${
                                  sw.safe ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {sw.name_bg}
                              </span>
                              <br />
                              <span className="text-xs text-slate-500">
                                {sw.name_en}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {sw.effectAlone}
                            </td>
                            <td className="py-2.5 pl-3 text-slate-300">
                              {sw.effectWithFood}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
