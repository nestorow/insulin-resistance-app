"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";
import Logo from "@/components/Logo";

// Root-level error boundary for any route under app/. App Router segment
// convention — receives the caught error and a `reset` to retry the segment.
// Layout-level errors fall through to global-error (not implemented here).

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[insulin-reset] uncaught:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <Logo size={64} className="mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-teal-700">Нещо се обърка</h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          Получи се неочаквана грешка. Опитай отново — ако се повтори, върни се
          в началото и кажи какво си правил.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-slate-400">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600"
          >
            <RefreshCw className="h-4 w-4" /> Опитай пак
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-50"
          >
            <Home className="h-4 w-4" /> Към началото
          </Link>
        </div>
      </div>
    </main>
  );
}
