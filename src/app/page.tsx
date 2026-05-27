import Link from "next/link";

export default function Home() {
  // Server-side: only route into NextAuth once it's actually configured,
  // otherwise the sign-in flow 500s with a "server configuration" error.
  // When the env vars are set, the working CTA appears automatically.
  const authReady = Boolean(
    process.env.NEXTAUTH_SECRET && process.env.GOOGLE_CLIENT_ID
  );

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
          {authReady ? (
            <Link
              href="/api/auth/signin"
              className="w-full rounded-xl bg-teal-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600 sm:w-auto"
            >
              Влез / Започни
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="w-full cursor-not-allowed rounded-xl bg-teal-100 px-8 py-3.5 font-semibold text-teal-600 sm:w-auto"
            >
              Влизането идва скоро
            </span>
          )}
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Phase 0 · информацията не е медицински съвет
        </p>
      </div>
    </main>
  );
}
