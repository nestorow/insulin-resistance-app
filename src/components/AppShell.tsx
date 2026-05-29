"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  NotebookPen,
  FlaskConical,
  Activity,
  TrendingUp,
  Utensils,
  Dumbbell,
  Timer,
  Pill,
  GraduationCap,
  Settings,
  MoreHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import Logo from "@/components/Logo";

type NavItem = { href: string; label: string; Icon: LucideIcon };

// Full module list in reading order — used as the desktop sidebar.
const NAV: NavItem[] = [
  { href: "/", label: "Начало", Icon: Home },
  { href: "/plan", label: "Дневен план", Icon: ClipboardList },
  { href: "/journal", label: "Дневник", Icon: NotebookPen },
  { href: "/markers", label: "Показатели", Icon: FlaskConical },
  { href: "/cgm", label: "CGM", Icon: Activity },
  { href: "/trends", label: "Тренд", Icon: TrendingUp },
  { href: "/foods", label: "Храни", Icon: Utensils },
  { href: "/exercise", label: "Тренировки", Icon: Dumbbell },
  { href: "/fasting", label: "Гладуване", Icon: Timer },
  { href: "/supplements", label: "Добавки", Icon: Pill },
  { href: "/education", label: "Образование", Icon: GraduationCap },
  { href: "/settings", label: "Настройки", Icon: Settings },
];

// The mobile bottom bar surfaces the four most-used destinations; the rest
// live behind "Още" so the bar never wraps or crowds.
const PRIMARY_HREFS = ["/plan", "/journal", "/markers", "/trends"];
const PRIMARY = PRIMARY_HREFS.map((h) => NAV.find((n) => n.href === h)!);
const SECONDARY = NAV.filter((n) => !PRIMARY_HREFS.includes(n.href));

// Marketing / funnel / print routes render without the app chrome.
const BARE_ROUTES = new Set(["/", "/onboarding", "/privacy", "/terms"]);
function isBareRoute(path: string): boolean {
  return BARE_ROUTES.has(path) || path.startsWith("/trends/print");
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * App chrome: a persistent desktop sidebar + a mobile bottom tab bar with an
 * "Още" sheet for the secondary modules. Replaces the old flat 12-pill nav.
 * Wraps the page content (and footer) so it can offset for the sidebar and
 * leave room above the fixed bottom bar.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [moreOpen, setMoreOpen] = useState(false);

  if (isBareRoute(pathname)) return <>{children}</>;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-teal-100 bg-white md:flex">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-5"
          aria-label="InsulinReset — начало"
        >
          <Logo size={32} />
          <span className="text-lg font-bold text-teal-700">InsulinReset</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Основна навигация">
          <ul className="space-y-1">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-500 text-white"
                        : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Page content + footer. pb-16 keeps the last content above the fixed
          mobile bar; md:pl-60 clears the desktop sidebar. */}
      <div className="flex min-h-dvh flex-col pb-16 md:pb-0 md:pl-60">
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-teal-100 bg-white/95 backdrop-blur md:hidden"
        aria-label="Основна навигация"
      >
        {PRIMARY.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-teal-600" : "text-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500"
        >
          <MoreHorizontal className="h-5 w-5" />
          Още
        </button>
      </nav>

      {/* "Още" sheet — the secondary modules */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Още модули"
        >
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                Още модули
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Затвори"
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SECONDARY.map(({ href, label, Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center text-xs font-medium ${
                      active
                        ? "border-teal-300 bg-teal-50 text-teal-700"
                        : "border-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
