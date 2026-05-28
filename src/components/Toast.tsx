"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { subscribeToast } from "@/lib/toast";

const DURATION_MS = 2200;

// Single-slot toast pinned to the bottom of the viewport. Replaces (not
// stacks) when multiple messages arrive in quick succession — fine for our
// "saved" feedback use case.
export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeToast((m) => {
      setMsg(m);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), DURATION_MS);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg"
    >
      <Check className="h-4 w-4" />
      {msg}
    </div>
  );
}
