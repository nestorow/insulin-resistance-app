import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <Logo size={64} className="mx-auto mb-6" />
        <p className="text-7xl font-extrabold leading-none text-teal-200">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-teal-700">
          Страницата не е намерена
        </h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          Адресът, който търсиш, не съществува. Може да е остарял линк или
          печатна грешка.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600"
        >
          <ArrowLeft className="h-4 w-4" /> Към началото
        </Link>
      </div>
    </main>
  );
}
