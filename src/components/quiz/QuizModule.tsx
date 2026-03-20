'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import {
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Activity,
  Ruler,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

// ─── Questions ───────────────────────────────────────────────────────────────

const questions = [
  'Имате ли повече мазнини около корема, отколкото бихте искали?',
  'Имате ли високо кръвно налягане?',
  'Имате ли фамилна история на сърдечно заболяване?',
  'Имате ли високи нива на триглицериди в кръвта?',
  'Задържате ли лесно вода?',
  'Имате ли тъмни петна по кожата (акантозис нигриканс) или кожни тагове по шията/подмишниците?',
  'Имате ли роднина с инсулинова резистентност или диабет тип 2?',
  'Имате ли PCOS (за жени) или еректилна дисфункция (за мъже)?',
];

function getRecommendation(yesCount: number): string {
  if (yesCount === 0) {
    return 'Нисък риск — но продължавайте да се грижите за здравето си';
  }
  if (yesCount === 1) {
    return 'Вероятно имате инсулинова резистентност. Препоръка: ~55% мазнини, 25% протеин, 20% въглехидрати (под 100 г/ден)';
  }
  return 'Почти сигурно имате инсулинова резистентност. Препоръка: ~70% мазнини, 25% протеин, 5% въглехидрати (под 50 г/ден — кетогенен подход)';
}

function getRiskColor(yesCount: number): string {
  if (yesCount === 0) return 'text-emerald-400';
  if (yesCount === 1) return 'text-yellow-400';
  return 'text-red-400';
}

function getRiskIcon(yesCount: number) {
  if (yesCount === 0) return <ShieldCheck className="w-8 h-8 text-emerald-400" />;
  if (yesCount === 1) return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
  return <AlertTriangle className="w-8 h-8 text-red-400" />;
}

// ─── SVG Gauge ───────────────────────────────────────────────────────────────

function SemiCircleGauge({
  value,
  min,
  max,
  label,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
}) {
  const clampedValue = Math.min(Math.max(value, min), max);
  const fraction = (clampedValue - min) / (max - min);
  // Arc from 180 deg (left) to 0 deg (right)
  const angle = Math.PI - fraction * Math.PI;
  const cx = 100;
  const cy = 90;
  const r = 70;
  const needleX = cx + r * Math.cos(angle);
  const needleY = cy - r * Math.sin(angle);

  return (
    <svg viewBox="0 0 200 110" className="w-full max-w-[280px] mx-auto">
      {/* Background arc */}
      <path
        d="M 30 90 A 70 70 0 0 1 170 90"
        fill="none"
        stroke="#334155"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Green zone */}
      <path
        d="M 30 90 A 70 70 0 0 1 100 20"
        fill="none"
        stroke="#10b981"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Red zone */}
      <path
        d="M 100 20 A 70 70 0 0 1 170 90"
        fill="none"
        stroke="#ef4444"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#f8fafc"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="#2dd4bf" />
      {/* Value label */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="fill-slate-100 text-[11px] font-bold"
        dominantBaseline="hanging"
      >
        {value.toFixed(2)}
      </text>
      <text
        x={30}
        y={105}
        textAnchor="start"
        className="fill-slate-400 text-[9px]"
      >
        {min}
      </text>
      <text
        x={170}
        y={105}
        textAnchor="end"
        className="fill-slate-400 text-[9px]"
      >
        {max}
      </text>
      <text
        x={cx}
        y={105}
        textAnchor="middle"
        className="fill-slate-300 text-[9px]"
      >
        {label}
      </text>
    </svg>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

type Section = 'quiz' | 'tghdl' | 'whr';

function SectionCard({
  title,
  icon,
  children,
  id,
  openSection,
  setOpenSection,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  id: Section;
  openSection: Section | null;
  setOpenSection: (s: Section | null) => void;
}) {
  const isOpen = openSection === id;
  return (
    <motion.div
      layout
      className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpenSection(isOpen ? null : id)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Quiz Section ────────────────────────────────────────────────────────────

function QuizSection() {
  const { addQuizResult } = useStore();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(questions.length).fill(null)
  );
  const [showResult, setShowResult] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const yesCount = answers.filter((a) => a === true).length;

  function handleAnswer(value: boolean) {
    const next = [...answers];
    next[currentQ] = value;
    setAnswers(next);
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    }
  }

  function handleSubmit() {
    const recommendation = getRecommendation(yesCount);
    addQuizResult({
      date: new Date().toISOString(),
      yesCount,
      answers: answers as boolean[],
      recommendation,
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers(Array(questions.length).fill(null));
    setCurrentQ(0);
    setShowResult(false);
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        <div className="flex items-center gap-3 mb-2">
          {getRiskIcon(yesCount)}
          <div>
            <p className="text-sm text-slate-400">
              Отговорихте &quot;Да&quot; на{' '}
              <span className={`font-bold ${getRiskColor(yesCount)}`}>
                {yesCount}
              </span>{' '}
              от {questions.length} въпроса
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={`p-4 rounded-xl border ${
            yesCount === 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : yesCount === 1
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <p className={`text-sm font-medium ${getRiskColor(yesCount)}`}>
            {getRecommendation(yesCount)}
          </p>
        </motion.div>

        {/* Answer summary */}
        <div className="space-y-2 mt-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Вашите отговори
          </p>
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="flex items-start gap-2 text-sm"
            >
              {answers[i] ? (
                <CheckCircle2 className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              )}
              <span className="text-slate-300">{q}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Попълнете отново
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            Въпрос {currentQ + 1} / {questions.length}
          </span>
          <span>
            {answers.filter((a) => a !== null).length} отговорени
          </span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
            animate={{
              width: `${((answers.filter((a) => a !== null).length) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="min-h-[120px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-slate-200 text-base leading-relaxed">
              <span className="text-teal-400 font-bold mr-2">{currentQ + 1}.</span>
              {questions[currentQ]}
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => handleAnswer(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  answers[currentQ] === true
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Да
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  answers[currentQ] === false
                    ? 'bg-slate-600 text-white shadow-lg shadow-slate-600/25'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Не
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots + arrows */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQ
                  ? 'bg-teal-400 scale-125'
                  : answers[i] !== null
                  ? answers[i]
                    ? 'bg-red-400/70'
                    : 'bg-emerald-400/70'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentQ(Math.min(questions.length - 1, currentQ + 1))
          }
          disabled={currentQ === questions.length - 1}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Submit */}
      {allAnswered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-shadow"
        >
          Вижте резултата
        </motion.button>
      )}
    </div>
  );
}

// ─── TG/HDL Calculator ──────────────────────────────────────────────────────

function TgHdlSection() {
  const { addTgHdlResult } = useStore();
  const [tg, setTg] = useState('');
  const [hdl, setHdl] = useState('');
  const [result, setResult] = useState<{ ratio: number; good: boolean } | null>(
    null
  );

  function handleCalc() {
    const tgVal = parseFloat(tg);
    const hdlVal = parseFloat(hdl);
    if (isNaN(tgVal) || isNaN(hdlVal) || hdlVal <= 0) return;
    const ratio = tgVal / hdlVal;
    const good = ratio < 2.0;
    setResult({ ratio, good });
    addTgHdlResult({
      date: new Date().toISOString(),
      tg: tgVal,
      hdl: hdlVal,
      ratio,
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Въведете стойностите от кръвните ви изследвания (mg/dL).
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Триглицериди (mg/dL)
          </label>
          <input
            type="number"
            value={tg}
            onChange={(e) => setTg(e.target.value)}
            placeholder="напр. 150"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            HDL (mg/dL)
          </label>
          <input
            type="number"
            value={hdl}
            onChange={(e) => setHdl(e.target.value)}
            placeholder="напр. 60"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
          />
        </div>
      </div>

      <button
        onClick={handleCalc}
        disabled={!tg || !hdl}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Изчисли
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <SemiCircleGauge
              value={result.ratio}
              min={0}
              max={5}
              label="TG / HDL"
            />

            <div
              className={`p-4 rounded-xl border ${
                result.good
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  result.good ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                TG/HDL = {result.ratio.toFixed(2)}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {result.good
                  ? 'Преобладават големи, плаващи LDL частици (Pattern A) — добре'
                  : 'Преобладават малки, плътни LDL частици (Pattern B) — повишен сърдечно-съдов риск'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Waist-to-Hip Ratio Calculator ──────────────────────────────────────────

function WhrSection() {
  const { userSettings } = useStore();
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>(
    userSettings.gender || 'male'
  );
  const [result, setResult] = useState<{
    ratio: number;
    good: boolean;
  } | null>(null);

  function handleCalc() {
    const w = parseFloat(waist);
    const h = parseFloat(hip);
    if (isNaN(w) || isNaN(h) || h <= 0) return;
    const ratio = w / h;
    const threshold = gender === 'male' ? 0.9 : 0.8;
    setResult({ ratio, good: ratio < threshold });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Измерете обиколката на талията и ханша в сантиметри.
      </p>

      {/* Gender toggle */}
      <div className="flex gap-2">
        {(['male', 'female'] as const).map((g) => (
          <button
            key={g}
            onClick={() => {
              setGender(g);
              setResult(null);
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              gender === g
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {g === 'male' ? 'Мъж' : 'Жена'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Талия (cm)
          </label>
          <input
            type="number"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="напр. 85"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Ханш (cm)
          </label>
          <input
            type="number"
            value={hip}
            onChange={(e) => setHip(e.target.value)}
            placeholder="напр. 100"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition"
          />
        </div>
      </div>

      <button
        onClick={handleCalc}
        disabled={!waist || !hip}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Изчисли
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <div
              className={`p-4 rounded-xl border ${
                result.good
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {result.good ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
                <p
                  className={`text-sm font-medium ${
                    result.good ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  WHR = {result.ratio.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {result.good
                  ? 'Вашето съотношение талия/ханш е в нормални граници — добре.'
                  : 'Повишено съотношение талия/ханш — повишен риск от метаболитни заболявания.'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Праг за {gender === 'male' ? 'мъже' : 'жени'}:{' '}
                {gender === 'male' ? '0.90' : '0.80'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function QuizModule() {
  const [openSection, setOpenSection] = useState<Section | null>('quiz');

  return (
    <div className="space-y-4">
      <SectionCard
        id="quiz"
        title="Тест за инсулинова резистентност"
        icon={<ClipboardCheck className="w-5 h-5 text-teal-400" />}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <QuizSection />
      </SectionCard>

      <SectionCard
        id="tghdl"
        title="TG / HDL калкулатор"
        icon={<Activity className="w-5 h-5 text-teal-400" />}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <TgHdlSection />
      </SectionCard>

      <SectionCard
        id="whr"
        title="Съотношение талия / ханш"
        icon={<Ruler className="w-5 h-5 text-teal-400" />}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <WhrSection />
      </SectionCard>
    </div>
  );
}
