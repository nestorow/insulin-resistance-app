"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  foods,
  fermentedFoods,
  sweeteners,
  fatGuides,
  type Food,
} from "@/data/foods";

type Category = "all" | Food["category"];

const CATEGORY_META: Record<Food["category"], { label: string; dot: string; ring: string }> = {
  green: { label: "Зелено (GL < 15)", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  yellow: { label: "Жълто (GL 16-30)", dot: "bg-amber-500", ring: "ring-amber-200" },
  red: { label: "Червено (GL > 30)", dot: "bg-rose-500", ring: "ring-rose-200" },
};

export default function FoodsModule() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter((f) => {
      const matchCat = category === "all" || f.category === category;
      const matchQ =
        !q ||
        f.name_bg.toLowerCase().includes(q) ||
        f.name_en.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">
          Хранителен справочник
        </h1>
        <p className="mt-2 text-slate-600">
          Гликемичен товар (GL) и макроси за често срещани продукти. Зелено
          яж свободно, жълто умерено, червено избягвай.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Търси храна…"
          className="w-full rounded-xl border border-teal-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
        />
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          Всички
        </Chip>
        {(["green", "yellow", "red"] as const).map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_META[c].label}
          </Chip>
        ))}
      </div>

      {/* Food grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {shown.map((f) => {
          const meta = CATEGORY_META[f.category];
          return (
            <div
              key={f.id}
              className={`rounded-2xl border border-teal-100 bg-white p-4 ring-1 ${meta.ring}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <span className="font-semibold text-slate-800">{f.name_bg}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  GL {f.gl}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {f.name_en} · {f.servingSize}
              </p>
              <div className="mt-2 flex gap-3 text-xs text-slate-600">
                <span>М {f.macros.fat}г</span>
                <span>П {f.macros.protein}г</span>
                <span>В {f.macros.carbs}г</span>
                <span>Фибри {f.macros.fiber}г</span>
              </div>
              {f.notes_bg && (
                <p className="mt-2 text-xs text-teal-700">{f.notes_bg}</p>
              )}
            </div>
          );
        })}
      </div>
      {shown.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          Няма намерени храни.
        </p>
      )}

      {/* Fermented foods */}
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-bold text-teal-700">
          Ферментирали храни
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {fermentedFoods.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-teal-100 bg-white p-3.5"
            >
              <p className="font-medium text-slate-800">{f.name_bg}</p>
              <p className="mt-1 text-sm text-slate-600">{f.benefit_bg}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sweeteners */}
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-bold text-teal-700">Подсладители</h2>
        <div className="overflow-hidden rounded-xl border border-teal-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-teal-50 text-teal-800">
              <tr>
                <th className="p-3 font-semibold">Подсладител</th>
                <th className="p-3 font-semibold">Сам</th>
                <th className="p-3 font-semibold">С храна</th>
              </tr>
            </thead>
            <tbody>
              {sweeteners.map((s) => (
                <tr key={s.name_en} className="border-t border-teal-100">
                  <td className="p-3">
                    <span
                      className={`mr-2 inline-block h-2 w-2 rounded-full ${
                        s.safe ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {s.name_bg}
                  </td>
                  <td className="p-3 text-slate-600">{s.effectAlone}</td>
                  <td className="p-3 text-slate-600">{s.effectWithFood}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fat guide */}
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-bold text-teal-700">Мазнини</h2>
        <div className="space-y-3">
          {fatGuides.map((g) => (
            <div
              key={g.category}
              className="rounded-2xl border border-teal-100 bg-white p-4"
              style={{ borderLeftColor: g.color, borderLeftWidth: 4 }}
            >
              <p className="font-semibold text-slate-800">{g.category_bg}</p>
              <ul className="mt-2 space-y-1">
                {g.items.map((it, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">{it.name_bg}</span>
                    {" — "}
                    {it.use_bg}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
