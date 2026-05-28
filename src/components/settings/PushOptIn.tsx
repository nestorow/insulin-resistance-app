"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, Send, AlertCircle } from "lucide-react";
import { showToast } from "@/lib/toast";

// Server actions are dynamically imported on first use so the web-push
// + libsql chunk doesn't load on every /settings render (and so jest
// component tests don't drag the Node-only push module into jsdom).
async function actions() {
  return import("@/lib/actions/push");
}

// Push notification opt-in card. Renders inside SettingsModule.
// Three states:
//   1. unsupported          — browser has no Notification / ServiceWorker
//   2. signed-out           — sign in to receive (push needs a user_id)
//   3. signed-in            — toggle on/off + "send test" button
//
// SW registration is local to this component (lazy) so the manifest/SW
// chunks only load when the user navigates to /settings.

type State = "loading" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  // Allocate a fresh ArrayBuffer so the resulting view is BufferSource-
  // compatible across the stricter TS lib variants (which split
  // ArrayBuffer / SharedArrayBuffer in Uint8Array's generic).
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushOptIn() {
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  // Detect capabilities + current subscription on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const existing = await reg?.pushManager.getSubscription();
        if (!cancelled) setState(existing ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const { getVapidPublicKeyAction, savePushSubscriptionAction } =
        await actions();
      const vapidKey = await getVapidPublicKeyAction();
      if (!vapidKey) {
        showToast("Push не е конфигуриран на сървъра.");
        setBusy(false);
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Разрешението е отказано.");
        setState(permission === "denied" ? "denied" : "off");
        setBusy(false);
        return;
      }
      // Register SW (idempotent), then subscribe.
      const reg =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js"));
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      const saved = await savePushSubscriptionAction(
        {
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
        },
        navigator.userAgent
      );
      if (!saved) {
        showToast("Неуспешен запис на сървъра.");
        setBusy(false);
        return;
      }
      setState("on");
      showToast("Включи push известията 🎉");
    } catch {
      showToast("Грешка при включване на push.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const { deletePushSubscriptionAction } = await actions();
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      showToast("Push известията са изключени.");
    } catch {
      showToast("Грешка при изключване.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      const { sendTestPushAction } = await actions();
      const res = await sendTestPushAction();
      if (res?.ok) {
        showToast(`Изпратени ${res.sent} test push(а). Виж нотификацията.`);
      } else {
        showToast("Test push неуспешен.");
      }
    } finally {
      setBusy(false);
    }
  }

  // — Render —
  if (sessionStatus === "loading" || state === "loading") {
    return (
      <Card>
        <Header />
        <p className="text-sm text-slate-400">Зареждане…</p>
      </Card>
    );
  }

  if (state === "unsupported") {
    return (
      <Card>
        <Header />
        <Hint icon={AlertCircle}>
          Браузърът ти не поддържа push известия (iOS Safari в обикновен таб
          напр.). Добави приложението към началния екран за поддръжка на iOS.
        </Hint>
      </Card>
    );
  }

  if (state === "denied") {
    return (
      <Card>
        <Header />
        <Hint icon={BellOff}>
          Си отказал разрешението за известия. Възстанови от настройките на
          браузъра (заключето в адресната лента → Разрешения).
        </Hint>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <Header />
        <Hint icon={Bell}>
          Push изисква акаунт — влез с Google, за да можем да изпращаме
          сутрешния reminder към твоето устройство.
        </Hint>
      </Card>
    );
  }

  return (
    <Card>
      <Header />
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        Получавай сутрешен reminder за дневния чеклист (около 7-8 ч.
        българско време). Можеш да изключиш по всяко време.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {state === "off" ? (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {busy ? "Включвам…" : "Включи известията"}
          </button>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              <Bell className="h-3.5 w-3.5" /> Включено на това устройство
            </span>
            <button
              type="button"
              onClick={sendTest}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Изпрати test push
            </button>
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <BellOff className="h-4 w-4" /> Изключи
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      {children}
    </section>
  );
}

function Header() {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800">
      <Bell className="h-5 w-5 text-teal-600" />
      Push известия
    </h2>
  );
}

function Hint({
  icon: Icon,
  children,
}: {
  icon: typeof Bell;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-500">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span>{children}</span>
    </p>
  );
}
