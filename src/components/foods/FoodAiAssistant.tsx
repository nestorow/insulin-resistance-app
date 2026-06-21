"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Send,
  AlertCircle,
  Loader2,
  RotateCcw,
  User,
  Bot,
  Key,
} from "lucide-react";
import { showToast } from "@/lib/toast";

// AI food assistant — multi-turn chat in /foods. Conversation history
// lives in component state only (not persisted) — each conversation is
// ephemeral, resets on page nav OR via the "Започни нов" button.
//
// Server action is lazy-imported so the Anthropic SDK chunk doesn't
// load on every /foods render.

const MAX_QUERY_LENGTH = 200;
const MAX_CONVERSATION_TURNS = 10;

const SUGGESTIONS = [
  "Мога ли да ям банан?",
  "Какво да закусвам без въглехидрати?",
  "Колко въглехидрати има в баница?",
];

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  /** True iff this assistant turn came from the cache. */
  cached?: boolean;
}

async function actions() {
  return import("@/lib/actions/food-ai");
}

async function keyActions() {
  return import("@/lib/actions/anthropic-key");
}

export default function FoodAiAssistant() {
  const { status } = useSession();
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  // null = unknown/loading, false = no key configured, true = key present.
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest turn when one arrives.
  useEffect(() => {
    if (turns.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  // Detect up-front whether the user has their own Anthropic key so we can
  // flag "изисква настройка" BEFORE a question is spent — instead of only
  // surfacing a toast after a failed ask. Cached answers still work keyless.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const { maskedAnthropicKeyAction } = await keyActions();
        const m = await maskedAnthropicKeyAction();
        if (!cancelled) setHasKey(!!m);
      } catch {
        if (!cancelled) setHasKey(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    // Hard cap: stop the user before another round-trip.
    if (turns.length >= MAX_CONVERSATION_TURNS * 2) {
      showToast("Разговорът стана дълъг — започни нов.");
      return;
    }

    // Optimistic: render the user turn immediately, hide the input.
    const userTurn: ChatTurn = { role: "user", content: trimmed };
    const history = turns;
    setTurns([...history, userTurn]);
    setQuery("");
    setBusy(true);

    try {
      const { askFoodAssistantAction } = await actions();
      // Send the prior turns AS the conversation history; the server
      // appends the latest user message itself.
      const res = await askFoodAssistantAction(
        trimmed,
        history.map((t) => ({ role: t.role, content: t.content }))
      );
      if (res.ok) {
        setTurns((prev) => [
          ...prev,
          { role: "assistant", content: res.text, cached: res.cached },
        ]);
      } else {
        // Rollback the optimistic user turn so the input clears nicely
        // for a retry — don't leave a question dangling without an answer.
        setTurns(history);
        showToast(friendlyError(res.reason, res.message));
      }
    } catch {
      setTurns(history);
      showToast("Грешка при заявката. Опитай отново.");
    } finally {
      setBusy(false);
    }
  }

  function resetConversation() {
    setTurns([]);
    setQuery("");
  }

  // — Render —
  if (status !== "authenticated") {
    return (
      <section className="mb-6 rounded-2xl border border-teal-100 bg-teal-50/40 p-4 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
          <span>
            <strong>Имаш въпрос за храна?</strong>{" "}
            <a
              href="/onboarding"
              className="font-semibold text-teal-700 underline"
            >
              Влез
            </a>{" "}
            и питай AI асистента — отговаря според твоето ниво на риск.
          </span>
        </div>
      </section>
    );
  }

  const isEmpty = turns.length === 0;

  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Sparkles className="h-5 w-5 text-teal-600" />
            AI асистент за храни
          </h2>
          <p className="text-sm text-slate-500">
            {isEmpty
              ? "Питай за конкретна храна, рецепта или ситуация."
              : `Разговор · ${Math.ceil(turns.length / 2)}/${MAX_CONVERSATION_TURNS}`}
          </p>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={resetConversation}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Започни нов
          </button>
        )}
      </div>

      {/* Up-front "needs setup" notice when no personal key is configured. */}
      {hasKey === false && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            <Key className="h-3 w-3" /> Изисква настройка
          </span>
          <p className="mt-1.5">
            Новите въпроси изискват твой собствен Anthropic API ключ. Добави го в{" "}
            <a href="/settings" className="font-semibold text-teal-700 underline">
              Настройки
            </a>
            . Кешираните отговори от други потребители остават безплатни.
          </p>
        </div>
      )}

      {/* Conversation history — scrollable on long chats */}
      {!isEmpty && (
        <div
          ref={scrollRef}
          className="mb-3 max-h-[420px] space-y-3 overflow-y-auto pr-1"
        >
          {turns.map((t, i) => (
            <Turn key={i} turn={t} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Мисля…
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, MAX_QUERY_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask(query);
          }}
          placeholder={
            isEmpty ? "напр. „Мога ли да ям киноа?“" : "Follow-up въпрос…"
          }
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

      {/* Suggestions — only on empty state */}
      {isEmpty && !busy && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700 transition-colors hover:bg-teal-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Persistent disclaimer on every non-empty chat — once a real
          answer is on screen, the user needs the safety hint nearby. */}
      {!isEmpty && (
        <p className="mt-3 flex items-start gap-1.5 border-t border-teal-100 pt-2 text-[11px] leading-relaxed text-slate-400">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          AI отговори — не са медицински съвет. За индивидуални препоръки
          консултирай се с лекар.
        </p>
      )}
    </section>
  );
}

function Turn({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === "user";
  return (
    <div
      className={`flex items-start gap-2.5 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-700"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-teal-500 text-white"
            : "bg-teal-50/70 text-slate-700"
        }`}
      >
        <p className="whitespace-pre-wrap">{turn.content}</p>
        {!isUser && turn.cached && (
          <span className="mt-1 block text-[10px] text-slate-400">
            от кеша
          </span>
        )}
      </div>
    </div>
  );
}

function friendlyError(
  reason:
    | "auth"
    | "rate"
    | "no-key"
    | "too-long"
    | "too-many-turns"
    | "error",
  message?: string
): string {
  switch (reason) {
    case "auth":
      return "Влез в акаунта си, за да използваш асистента.";
    case "rate":
      return "Твърде много заявки — изчакай малко и опитай отново.";
    case "no-key":
      return (
        message ??
        "Добави Anthropic API key в Настройки, за да задаваш нови въпроси."
      );
    case "too-long":
      return message ?? "Въпросът е твърде дълъг.";
    case "too-many-turns":
      return message ?? "Разговорът стана дълъг — започни нов.";
    case "error":
      return message ?? "Грешка от AI услугата.";
  }
}
