import Link from "next/link";

// Minimal shared nav across content pages until the full app shell lands.
const LINKS = [
  { href: "/", label: "Начало" },
  { href: "/education", label: "Образование" },
  { href: "/foods", label: "Храни" },
  { href: "/onboarding", label: "Тест" },
];

export default function ModuleNav({ active }: { active: string }) {
  return (
    <nav className="mx-auto mb-6 flex w-full max-w-3xl flex-wrap gap-2 px-5 pt-6">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === active ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            l.href === active
              ? "bg-teal-500 text-white"
              : "bg-white text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
