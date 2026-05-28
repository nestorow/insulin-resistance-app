"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Lightbulb,
  Activity,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Sunrise,
  Sun,
  Moon,
  PartyPopper,
} from "lucide-react";
import {
  LENSES,
  QUIZ_QUESTIONS,
  tierFromYesCount,
  DAY1_TASKS,
  LENS_DAY1_FOCUS,
  type Lens,
} from "@/lib/onboarding";
import { saveOnboarding, loadOnboarding } from "@/lib/onboarding-storage";

type Step = "welcome" | "lens" | "quiz" | "result" | "day1";
const STEPS: Step[] = ["welcome", "lens", "quiz", "result", "day1"];

const LENS_ICON: Record<Lens, typeof Stethoscope> = {
  medical: Stethoscope,
  educational: Lightbulb,
  biohacker: Activity,
};

const PERIODS = [
  { key: "morning", label: "Сутрин", Icon: Sunrise },
  { key: "day", label: "През деня", Icon: Sun },
  { key: "evening", label: "Вечер", Icon: Moon },
] as const;

export default function OnboardingFlow() {
  const router = useRouter();
  // Onboarding is a one-time setup. If the user already completed it,
  // bounce them to the daily plan instead of letting them re-take here.
  // `checking` prevents a flash of the welcome screen during the redirect.
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("welcome");
  const [lens, setLens] = useState<Lens | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(QUIZ_QUESTIONS.length).fill(null)
  );
  const [tg, setTg] = useState("");
  const [hdl, setHdl] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  useEffect(() => {
    if (loadOnboarding()) {
      router.replace("/plan");
    } else {
      setChecking(false);
    }
  }, [router]);

  const yesCount = answers.filter((a) => a === true).length;
  const allAnswered = answers.every((a) => a !== null);
  const tierInfo = useMemo(() => tierFromYesCount(yesCount), [yesCount]);

  const tgHdlRatio = useMemo(() => {
    const t = parseFloat(tg);
    const h = parseFloat(hdl);
    return t > 0 && h > 0 ? t / h : null;
  }, [tg, hdl]);

  const whr = useMemo(() => {
    const w = parseFloat(waist);
    const h = parseFloat(hip);
    return w > 0 && h > 0 ? w / h : null;
  }, [waist, hip]);

  const stepIndex = STEPS.indexOf(step);

  function setAnswer(i: number, value: boolean) {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  if (checking) return null;

  function finishToDay1() {
    if (!lens) return;
    saveOnboarding({
      lens,
      quizAnswers: answers.map((a) => a === true),
      quizYesCount: yesCount,
      tier: tierInfo.tier,
      tgHdlRatio,
      whr,
      completedAt: new Date().toISOString(),
    });
    setStep("day1");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              i <= stepIndex ? "w-8 bg-teal-500" : "w-4 bg-teal-100"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === "welcome" && (
            <Card>
              <h1 className="text-3xl font-extrabold text-teal-700">
                Добре дошъл
              </h1>
              <p className="mt-4 text-slate-600">
                Следващите 1-2 минути ще настроят твоя 90-дневен протокол. Ще
                те питаме как искаш да го преживееш и ще направим кратък тест за
                инсулинова резистентност.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Информацията не е медицински съвет.
              </p>
              <PrimaryButton onClick={() => setStep("lens")}>
                Започни <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </Card>
          )}

          {step === "lens" && (
            <Card>
              <h2 className="text-2xl font-bold text-teal-700">
                Кое те описва най-добре?
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Това настройва тона и подредбата — имаш достъп до всичко.
              </p>
              <div className="mt-6 space-y-3">
                {LENSES.map((l) => {
                  const Icon = LENS_ICON[l.id];
                  const active = lens === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLens(l.id)}
                      className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                        active
                          ? "border-teal-500 bg-teal-50"
                          : "border-teal-100 bg-white hover:border-teal-300"
                      }`}
                    >
                      <span
                        className={`mt-0.5 rounded-xl p-2 ${
                          active ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-800">
                          {l.title_bg}
                        </span>
                        <span className="block text-sm text-slate-500">
                          {l.blurb_bg}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <BackButton onClick={() => setStep("welcome")} />
                <PrimaryButton onClick={() => setStep("quiz")} disabled={!lens}>
                  Към теста <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </div>
            </Card>
          )}

          {step === "quiz" && (
            <Card>
              <h2 className="text-2xl font-bold text-teal-700">
                Тест за инсулинова резистентност
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Отговори с „Да&rdquo; или „Не&rdquo; на всеки въпрос.
              </p>

              <div className="mt-5 space-y-2.5">
                {QUIZ_QUESTIONS.map((q, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-teal-100 bg-white p-3.5"
                  >
                    <p className="text-sm text-slate-700">{q}</p>
                    <div className="mt-2.5 flex gap-2">
                      <YesNo
                        active={answers[i] === true}
                        tone="yes"
                        onClick={() => setAnswer(i, true)}
                      >
                        <Check className="h-4 w-4" /> Да
                      </YesNo>
                      <YesNo
                        active={answers[i] === false}
                        tone="no"
                        onClick={() => setAnswer(i, false)}
                      >
                        <X className="h-4 w-4" /> Не
                      </YesNo>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional blood / body values */}
              <details className="mt-5 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-teal-700">
                  Кръвни и телесни стойности (по избор)
                </summary>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <NumField label="Триглицериди (mg/dL)" value={tg} onChange={setTg} />
                  <NumField label="HDL (mg/dL)" value={hdl} onChange={setHdl} />
                  <NumField label="Талия (cm)" value={waist} onChange={setWaist} />
                  <NumField label="Ханш (cm)" value={hip} onChange={setHip} />
                </div>
              </details>

              <div className="mt-6 flex items-center justify-between">
                <BackButton onClick={() => setStep("lens")} />
                <PrimaryButton
                  onClick={() => setStep("result")}
                  disabled={!allAnswered}
                >
                  Виж резултата <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </div>
            </Card>
          )}

          {step === "result" && (
            <Card>
              <h2 className="text-2xl font-bold text-teal-700">Твоят резултат</h2>
              <p className="mt-2 text-sm text-slate-500">
                Отговори „Да&rdquo; на <strong>{yesCount}</strong> от{" "}
                {QUIZ_QUESTIONS.length} въпроса.
              </p>

              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  tierInfo.tier === "none"
                    ? "border-teal-200 bg-teal-50"
                    : tierInfo.tier === "moderate"
                    ? "border-amber-200 bg-amber-50"
                    : "border-rose-200 bg-rose-50"
                }`}
              >
                <p className="font-semibold text-slate-800">{tierInfo.risk_bg}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {tierInfo.recommendation_bg}
                </p>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {tierInfo.macros_bg}
                </p>
              </div>

              {(tgHdlRatio !== null || whr !== null) && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {tgHdlRatio !== null && (
                    <Metric
                      label="TG / HDL"
                      value={tgHdlRatio.toFixed(2)}
                      good={tgHdlRatio < 2.0}
                      hint={tgHdlRatio < 2.0 ? "Pattern A — добре" : "Pattern B — риск"}
                    />
                  )}
                  {whr !== null && (
                    <Metric
                      label="Талия / ханш"
                      value={whr.toFixed(2)}
                      good={whr < 0.9}
                      hint={whr < 0.9 ? "В норма" : "Повишен риск"}
                    />
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <BackButton onClick={() => setStep("quiz")} />
                <PrimaryButton onClick={finishToDay1}>
                  Виж плана за Ден 1 <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </div>
            </Card>
          )}

          {step === "day1" && lens && (
            <Card>
              <div className="flex items-center gap-2 text-teal-600">
                <PartyPopper className="h-6 w-6" />
                <h2 className="text-2xl font-bold text-teal-700">Ден 1</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {LENS_DAY1_FOCUS[lens]}
              </p>
              {tierInfo.carbCap && (
                <p className="mt-2 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                  Въглехидратен таван днес: под {tierInfo.carbCap} г
                </p>
              )}

              <div className="mt-5 space-y-4">
                {PERIODS.map(({ key, label, Icon }) => {
                  const tasks = DAY1_TASKS.filter((t) => t.period === key);
                  if (tasks.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Icon className="h-4 w-4 text-teal-500" />
                        {label}
                      </div>
                      <ul className="space-y-1.5">
                        {tasks.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-start gap-2 rounded-lg border border-teal-100 bg-white p-3 text-sm text-slate-700"
                          >
                            <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-teal-300" />
                            {t.text_bg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl bg-teal-50 p-4 text-sm text-slate-600">
                Планът е запазен локално. Влизане с профил и пълно проследяване
                идват в следваща фаза.
              </div>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                <ArrowLeft className="h-4 w-4" /> Към началото
              </Link>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── small UI helpers ─────────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-teal-100 bg-white/70 p-7 shadow-sm backdrop-blur">
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-slate-600"
    >
      <ArrowLeft className="h-4 w-4" /> Назад
    </button>
  );
}

function YesNo({
  children,
  active,
  tone,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  tone: "yes" | "no";
  onClick: () => void;
}) {
  const activeCls =
    tone === "yes" ? "bg-rose-500 text-white" : "bg-teal-500 text-white";
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
        active ? activeCls : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
      />
    </label>
  );
}

function Metric({
  label,
  value,
  good,
  hint,
}: {
  label: string;
  value: string;
  good: boolean;
  hint: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        good ? "border-teal-200 bg-teal-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className={`text-xs ${good ? "text-teal-600" : "text-rose-600"}`}>{hint}</p>
    </div>
  );
}
