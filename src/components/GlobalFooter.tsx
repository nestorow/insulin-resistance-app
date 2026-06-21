import Link from "next/link";

// Site-wide footer rendered from layout.tsx. Lives on every page —
// including the dashboard modules — so the medical disclaimer + the
// privacy/terms links are always one scroll away. Kept intentionally
// small so it doesn't compete with the page content.

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-teal-100 bg-white/60 px-6 py-6 text-center text-xs text-slate-500">
      <p className="mx-auto mb-3 max-w-xl leading-relaxed">
        Информацията е с образователна цел и не е медицински съвет.
        Консултирай се с лекар преди да правиш промени, особено ако имаш
        диагноза, приемаш лекарства или си бременна.
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-400">
        <Link href="/" className="hover:text-teal-600">
          Начало
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="hover:text-teal-600">
          Поверителност
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:text-teal-600">
          Условия
        </Link>
        <span aria-hidden>·</span>
        <Link href="/education" className="hover:text-teal-600">
          Образование
        </Link>
      </nav>
      <p className="mt-3 text-xs text-slate-400">
        © {new Date().getFullYear()} InsulinReset · Базирано на работата на д-р Benjamin Bikman
      </p>
    </footer>
  );
}
