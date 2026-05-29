"use client";

import { useEffect, useState } from "react";
import {
  AnnotationMap,
  MAX_ANNOTATION_LEN,
  getDayAnnotations,
  setDayAnnotation,
} from "@/lib/day-annotations";
import { showToast } from "@/lib/toast";

// Annotation editor — collapsed by default; opens an inline form for
// adding/removing date labels. Saved annotations appear as amber chips
// the user can click to remove. Designed to be unobtrusive: a single
// "+ Анотация" link when collapsed, so the main view stays clean.

interface Props {
  onChange: (map: AnnotationMap) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TrendsAnnotationsEditor({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<AnnotationMap>({});
  const [date, setDate] = useState<string>(todayIso());
  const [label, setLabel] = useState("");

  useEffect(() => {
    const m = getDayAnnotations();
    setMap(m);
    onChange(m);
    // We intentionally don't depend on onChange to avoid re-running on
    // every parent re-render — the initial sync is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit() {
    const text = label.trim();
    if (!text) return;
    const { local } = setDayAnnotation(date, text);
    setMap(local);
    onChange(local);
    setLabel("");
    showToast("Анотация добавена.");
  }

  function remove(d: string) {
    const { local } = setDayAnnotation(d, "");
    setMap(local);
    onChange(local);
  }

  const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));

  if (!open && entries.length === 0) {
    return (
      <div className="mb-3 text-right">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-teal-700 underline-offset-2 hover:underline"
        >
          + Анотация (отбележи събитие)
        </button>
      </div>
    );
  }

  return (
    <section className="mb-3 rounded-2xl border border-teal-100 bg-teal-50/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-800">
          Анотации
        </h3>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-teal-700 underline-offset-2 hover:underline"
        >
          {open ? "Скрий" : "Покажи"}
        </button>
      </div>

      {open && (
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-teal-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-teal-400"
          />
          <input
            type="text"
            value={label}
            maxLength={MAX_ANNOTATION_LEN}
            placeholder="напр. „започнах кето"
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="flex-1 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-teal-400"
          />
          <button
            onClick={commit}
            disabled={!label.trim()}
            className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-200"
          >
            Добави
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([d, text]) => (
            <button
              key={d}
              onClick={() => remove(d)}
              aria-label={`Премахни анотация „${text}" от ${d}`}
              title={`Премахни „${text}" от ${d}`}
              className="group flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200"
            >
              <span className="font-medium">{d.slice(5)}</span>
              <span>·</span>
              <span>{text}</span>
              <span className="text-amber-600 group-hover:text-amber-900">✕</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
