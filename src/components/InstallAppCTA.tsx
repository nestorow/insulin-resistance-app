"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";

// PWA install call-to-action.
//   - Android / desktop Chrome & Edge: captures the `beforeinstallprompt`
//     event and shows a native install button.
//   - iOS Safari: that event never fires, so we show the manual
//     "Сподели → Добави към началния екран" steps instead.
//   - Already installed (standalone) or previously dismissed: renders nothing.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ir-install-dismissed-v1";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ reports as "Macintosh" but is touch-capable.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

export default function InstallAppCTA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [variant, setVariant] = useState<"hidden" | "prompt" | "ios">("hidden");

  useEffect(() => {
    if (isStandalone()) return; // already installed — nothing to offer
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // ignore storage errors — just show the CTA
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVariant("prompt");
    };
    const onInstalled = () => {
      setVariant("hidden");
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — offer manual instructions.
    if (isIos()) setVariant("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (variant === "hidden") return null;

  function dismiss() {
    setVariant("hidden");
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — dismissal just won't persist
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setVariant("hidden");
  }

  return (
    <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-teal-100 bg-teal-50/60 p-5 text-left shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Затвори"
        className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
          <Download className="h-5 w-5" />
        </span>
        <div className="pr-4">
          <p className="font-semibold text-teal-800">Инсталирай InsulinReset</p>

          {variant === "prompt" ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Добави го на началния си екран — отваря се на цял екран като
                приложение, с пряк път до дневния чеклист.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-teal-600"
              >
                <Download className="h-4 w-4" /> Инсталирай приложението
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Добави приложението на началния екран: натисни{" "}
              <Share className="inline h-4 w-4 -translate-y-0.5 text-teal-600" />{" "}
              <span className="font-medium">Сподели</span>, после{" "}
              <Plus className="inline h-4 w-4 -translate-y-0.5 text-teal-600" />{" "}
              <span className="font-medium">„Добави към началния екран&quot;.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
