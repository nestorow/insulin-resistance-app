import { Lock, Globe, ShieldCheck, BadgeEuro } from "lucide-react";

// Trust strip under the hero CTA — answers the silent objections that
// block sign-up for a Bulgarian medical-adjacent app:
//   "is this paid?" → "Безплатно"
//   "is the science real?" → "По д-р Bikman"
//   "where does my data go?" → "Криптирано · GDPR"
//   "is it in Bulgarian?" → "Изцяло на български"
// One row, no scroll, no clutter. Reads as fast as the CTA itself.

const SIGNALS = [
  { Icon: BadgeEuro, label: "Безплатно" },
  { Icon: Globe, label: "Изцяло на български" },
  { Icon: Lock, label: "Криптирано в покой" },
  { Icon: ShieldCheck, label: "GDPR-friendly" },
];

export default function TrustStrip() {
  return (
    <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600 sm:text-sm">
      {SIGNALS.map((s, i) => (
        <span key={s.label} className="flex items-center gap-2">
          <s.Icon className="h-3.5 w-3.5 text-teal-600" strokeWidth={2} />
          <span>{s.label}</span>
          {i < SIGNALS.length - 1 && (
            <span className="hidden text-slate-300 sm:inline">·</span>
          )}
        </span>
      ))}
    </div>
  );
}
