import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-2xl">
        <p className="mb-4 inline-block rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700">
          Базирано на д-р Benjamin Bikman · „Why We Get Sick&rdquo;
        </p>

        <h1 className="text-4xl font-extrabold leading-tight text-teal-700 sm:text-5xl">
          Обърни инсулиновата
          <br />
          резистентност за 90 дни
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
          Персонализиран протокол с 4-те стълба на Bikman — хранене, движение,
          гладуване и проследяване на показателите ти. Един продукт, адаптиран
          към твоя профил.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="w-full rounded-xl bg-teal-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600 sm:w-auto"
          >
            Започни теста (1-2 мин)
          </Link>
          <Link
            href="/education"
            className="w-full rounded-xl px-8 py-3.5 font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-50 sm:w-auto"
          >
            Научи повече
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Без регистрация · информацията не е медицински съвет
        </p>
      </div>
    </main>
  );
}
