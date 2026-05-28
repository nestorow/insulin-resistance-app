"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, MailX } from "lucide-react";
import { showToast } from "@/lib/toast";

// Weekly email digest opt-in card in /settings. Like PushOptIn, server
// actions are dynamically imported so the resend chunk doesn't load on
// every settings render (and component tests don't pull it in).

async function actions() {
  return import("@/lib/actions/email");
}

export default function EmailDigestOptIn() {
  const { data: session, status } = useSession();
  const [optIn, setOptIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const { getEmailDigestPreferenceAction } = await actions();
        const pref = await getEmailDigestPreferenceAction();
        if (!cancelled) setOptIn(pref);
      } catch {
        if (!cancelled) setOptIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      const { setEmailDigestPreferenceAction } = await actions();
      const res = await setEmailDigestPreferenceAction(next);
      if (res) {
        setOptIn(next);
        showToast(
          next
            ? "Включи седмичен email преглед."
            : "Изключи седмичен email преглед."
        );
      } else {
        showToast("Грешка при запис на настройката.");
      }
    } catch {
      showToast("Грешка при запис на настройката.");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
        <Header />
        <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-500">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            Email обобщенията изискват акаунт — влез с Google, за да можем да
            пращаме седмичния recap на адреса ти.
          </span>
        </p>
      </section>
    );
  }

  if (optIn === null) {
    return (
      <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
        <Header />
        <p className="text-sm text-slate-400">Зареждане…</p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      <Header />
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        Кратко обобщение всяка неделя на {session?.user?.email ?? "адреса ти"}:
        поредни дни, ниво, нови значки, броят на записите в дневника тази
        седмица.
      </p>
      {optIn ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
            <Mail className="h-3.5 w-3.5" /> Включено
          </span>
          <button
            type="button"
            onClick={() => toggle(false)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <MailX className="h-4 w-4" /> Изключи
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => toggle(true)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
          {busy ? "Включвам…" : "Включи email прегледа"}
        </button>
      )}
    </section>
  );
}

function Header() {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800">
      <Mail className="h-5 w-5 text-teal-600" />
      Седмичен email преглед
    </h2>
  );
}
