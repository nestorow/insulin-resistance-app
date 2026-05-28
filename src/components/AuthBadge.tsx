"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

// Floating top-right auth pill: shows "Влез" when signed out, name+logout when in.
// Hidden while session is loading to avoid flicker.
export default function AuthBadge() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  const base =
    "fixed right-4 top-4 z-50 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-colors";

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className={`${base} bg-white text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50`}
      >
        <LogIn className="h-3.5 w-3.5" /> Влез
      </button>
    );
  }

  const name = session.user?.name || session.user?.email || "Потребител";

  return (
    <div className={`${base} bg-teal-500 text-white`}>
      <span className="max-w-[120px] truncate">{name}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Излез"
        className="ml-1 rounded-full bg-teal-600 p-1 hover:bg-teal-700"
      >
        <LogOut className="h-3 w-3" />
      </button>
    </div>
  );
}
