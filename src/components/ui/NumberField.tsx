"use client";

import { useState } from "react";

// Shared numeric input with inline range validation, used by the journal +
// markers entry forms. Empty is always allowed (the fields are optional);
// a value outside [min, max] shows a red border + an inline message instead
// of being silently dropped on save.

/** Returns a Bulgarian error string for an out-of-range value, or null. */
export function rangeError(
  raw: string,
  min: number,
  max: number,
  unit?: string
): string | null {
  if (!raw.trim()) return null;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return "Въведи число.";
  if (n < min || n > max) {
    return `Допустимо: ${min}–${max}${unit ? " " + unit : ""}.`;
  }
  return null;
}

export default function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  /** When true (e.g. a blocked save), the error shows even if untouched. */
  forceShowError = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  forceShowError?: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const error = rangeError(value, min, max, unit);
  const show = (touched || forceShowError) && !!error;

  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        min={min}
        max={max}
        step={step}
        aria-invalid={show || undefined}
        className={`w-full rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
          show
            ? "border border-rose-300 focus:border-rose-400 focus:ring-rose-200"
            : "border border-teal-200 focus:border-teal-400 focus:ring-teal-200"
        }`}
      />
      {show && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
