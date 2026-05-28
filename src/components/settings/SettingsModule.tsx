"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, AlertTriangle, X } from "lucide-react";
import { loadOnboarding, clearOnboarding } from "@/lib/onboarding-storage";
import { clearOnboardingAction } from "@/lib/actions/onboarding";
import { tierFromYesCount, LENSES } from "@/lib/onboarding";
import type { OnboardingResult } from "@/lib/onboarding";
import { showToast } from "@/lib/toast";

export default function SettingsModule() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setOnboarding(loadOnboarding());
    setMounted(true);
  }, []);

  const tier = onboarding ? tierFromYesCount(onboarding.quizYesCount) : null;
  const lens = onboarding
    ? LENSES.find((l) => l.id === onboarding.lens) ?? null
    : null;

  async function handleReset() {
    setResetting(true);
    // Order matters: clear local first so the next render of any UI doesn't
    // momentarily see the stale onboarding row.
    clearOnboarding();
    // Server clear is fire-and-forget — if it fails (network / no session)
    // the local clear is already sufficient for the user's current device.
    try {
      await clearOnboardingAction();
    } catch {
      // ignore — local is the working cache
    }
    showToast("Тестът е нулиран — започваме отначало.");
    setConfirmOpen(false);
    router.push("/onboarding");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-teal-700">Настройки</h1>
        <p className="mt-2 text-slate-600">
          Виж текущия си профил и управлявай 90-дневния цикъл.
        </p>
      </header>

      {/* Current profile */}
      <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Текущ профил
        </h2>
        {!mounted ? (
          <p className="text-sm text-slate-400">Зареждане…</p>
        ) : !onboarding ? (
          <p className="text-sm text-slate-500">
            Още не си направил теста.{" "}
            <a
              href="/onboarding"
              className="font-semibold text-teal-600 underline"
            >
              Започни сега
            </a>
            .
          </p>
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Профил (lens)</dt>
              <dd className="font-medium text-slate-800">
                {lens?.title_bg ?? onboarding.lens}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Резултат от теста</dt>
              <dd className="font-medium text-slate-800">
                {onboarding.quizYesCount} / 8 положителни отговора
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tier</dt>
              <dd className="font-medium text-slate-800">
                {tier?.risk_bg ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Започнато на</dt>
              <dd className="font-medium text-slate-800">
                {new Date(onboarding.completedAt).toLocaleDateString("bg-BG")}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {/* Re-test */}
      <section className="rounded-2xl border border-teal-100 bg-white p-5">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">
          Преоцени теста
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Стартира нов 90-дневен цикъл — броячът се връща на Ден 1, tier-ът
          и lens-ът се преизчисляват. <strong>Дневникът, кръвните маркери
          и историята на чеклиста се запазват</strong> — само профилът се
          опреснява.
        </p>

        <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              disabled={!mounted || !onboarding}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Преоцени теста
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
              <Dialog.Close
                aria-label="Затвори"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                disabled={resetting}
              >
                <X className="h-4 w-4" />
              </Dialog.Close>

              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-warm-light p-2.5 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <Dialog.Title className="text-lg font-bold text-slate-800">
                    Сигурен ли си?
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-relaxed text-slate-600">
                    Текущият tier и броячът „Ден N / 90“ ще се нулират.
                    Историята на дневника и кръвните маркери остават.
                  </Dialog.Description>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={resetting}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Отказ
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
                >
                  {resetting ? "Нулирам…" : "Да, преоцени"}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
    </div>
  );
}
