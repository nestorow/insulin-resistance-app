"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Key, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { showToast } from "@/lib/toast";

// Per-user Anthropic API key management. Lives in /settings. The
// plaintext key is sent over the wire (HTTPS) on save, encrypted
// server-side, and never returned to the client again — the UI shows
// only a derived mask ("key-…abc123").

async function actions() {
  return import("@/lib/actions/anthropic-key");
}

const KEY_FORMAT = /^sk-ant-api[0-9]{1,3}-[A-Za-z0-9_-]{20,}$/;

export default function AnthropicKeyCard() {
  const { status } = useSession();
  const [masked, setMasked] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const { maskedAnthropicKeyAction } = await actions();
        const m = await maskedAnthropicKeyAction();
        if (!cancelled) {
          setMasked(m);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function save() {
    const key = input.trim();
    if (!KEY_FORMAT.test(key)) {
      showToast("Невалиден формат. Очаквам „sk-ant-api03-…“.");
      return;
    }
    setBusy(true);
    try {
      const { setAnthropicKeyAction, maskedAnthropicKeyAction } =
        await actions();
      const res = await setAnthropicKeyAction(key);
      if (!res.ok) {
        showToast(
          res.reason === "invalid"
            ? "Невалиден формат."
            : res.reason === "rate"
            ? "Твърде много заявки — изчакай малко."
            : "Грешка при запис."
        );
        return;
      }
      const m = await maskedAnthropicKeyAction();
      setMasked(m);
      setInput("");
      setShowForm(false);
      showToast("API ключът е запазен.");
    } catch {
      showToast("Грешка при запис.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const { clearAnthropicKeyAction } = await actions();
      await clearAnthropicKeyAction();
      setMasked(null);
      showToast("API ключът е премахнат.");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Sparkles className="h-5 w-5 text-teal-600" />
        AI асистент — твоят API ключ
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        AI асистентът в{" "}
        <a href="/foods" className="text-teal-600 underline">/foods</a>{" "}
        работи с твой собствен Anthropic API ключ — ти плащаш само за
        собствените си нови въпроси (кешираните отговори от други потребители
        са безплатни). Ключът се пази{" "}
        <strong>криптиран в покой</strong> (AES-256-GCM, същият като за
        кръвните маркери) и не се връща обратно към браузъра след запис.
      </p>

      {!loaded ? (
        <p className="text-sm text-slate-400">Зареждане…</p>
      ) : masked && !showForm ? (
        // Configured state
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 font-mono text-xs font-semibold text-teal-700">
            <Key className="h-3.5 w-3.5" /> {masked}
          </span>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setInput("");
            }}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50 disabled:opacity-50"
          >
            Смени
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Премахни
          </button>
        </div>
      ) : (
        // Set / replace form
        <div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              API ключ (sk-ant-api03-…)
            </span>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              <Key className="h-4 w-4" />
              {busy ? "Запазвам…" : "Запази"}
            </button>
            {masked && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setInput("");
                }}
                disabled={busy}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                Отказ
              </button>
            )}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            Вземи ключ от{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-teal-600 underline"
            >
              console.anthropic.com/settings/keys
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            . Препоръчвам да зададеш и месечен лимит на разходите в акаунта си
            — Anthropic има настройка за автоматично спиране при достигане на
            лимита.
          </p>
        </div>
      )}
    </section>
  );
}
