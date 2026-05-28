"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Send, AlertCircle, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

// AI food assistant — single-turn Q&A at the top of /foods.
// Server action is lazy-imported so the Anthropic SDK chunk doesn't
// load on every /foods render (anonymous visitors don't see this card
// at all; signed-in users only load the chunk on first ask).

const MAX_QUERY_LENGTH = 200;

const SUGGESTIONS = [
  "Мога ли да ям банан?",
  "Какво да закусвам без въглехидрати?",
  "Колко въглехидрати има в баница?",
];

async function actions() {
  return import("@/lib/actions/food-ai");
}

export default function FoodAiAssistant() {
  const { status } = useSession();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [busy, setBusy] = useState(false);

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      const { askFoodAssistantAction } = await actions();
      const res = await askFoodAssistantAction(text);
      if (res.ok) {
        setAnswer(res.text);
        setCached(res.cached);
      } else {
        const msg = friendlyError(res.reason, res.message);
        showToast(msg);
      }
    } catch {
      showToast("Грешка при заявката. Опитай отново.");
    } finally {
      setBusy(false);
    }
  }

  // Anonymous → don't render; AI requires auth (rate-limit + audit need user_id)
  if (status !== "authenticated") {
    return (
      <section className="mb-6 rounded-2xl border border-teal-100 bg-teal-50/40 p-4 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
          <span>
            <strong>Имаш въпрос за храна?</strong>{" "}
            <a href="/onboarding" className="font-semibold text-teal-700 underline">
              Влез
            </a>{" "}
            и питай AI асистента — отговаря според твоя tier.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Sparkles className="h-5 w-5 text-teal-600" />
        AI асистент за храни
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        Питай за конкретна храна, рецепта или ситуация. Отговорът се
        съобразява с твоя tier.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, MAX_QUERY_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask(query);
          }}
          placeholder="напр. „Мога ли да ям киноа?"
          maxLength={MAX_QUERY_LENGTH}
          disabled={busy}
          className="flex-1 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => ask(query)}
          disabled={busy || query.trim().length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Питай
        </button>
      </div>

      {!answer && !busy && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                ask(s);
              }}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700 transition-colors hover:bg-teal-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Отговор
            </span>
            {cached && (
              <span className="text-[10px] text-slate-400">от cache</span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {answer}
          </p>
          <p className="mt-3 flex items-start gap-1.5 border-t border-teal-100 pt-2 text-[11px] leading-relaxed text-slate-400">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            AI отговор — не е медицински съвет. За индивидуални препоръки
            консултирай се с лекар.
          </p>
        </div>
      )}
    </section>
  );
}

function friendlyError(
  reason: "auth" | "rate" | "config" | "too-long" | "error",
  message?: string
): string {
  switch (reason) {
    case "auth":
      return "Влез в акаунта си, за да използваш асистента.";
    case "rate":
      return "Твърде много заявки — изчакай малко и опитай отново.";
    case "config":
      return "AI асистентът не е конфигуриран на сървъра.";
    case "too-long":
      return message ?? "Въпросът е твърде дълъг.";
    case "error":
      return message ?? "Грешка от AI услугата.";
  }
}
