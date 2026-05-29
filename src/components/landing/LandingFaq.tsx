"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// FAQ section — directly addresses the most common objections that
// block sign-up. Order matters: most common concern first (medical
// safety), most niche last (offline use). Native <details>-like
// accordion built on useState so we control animation + can render
// SSR-friendly with multiple sections open simultaneously.

interface QA {
  q: string;
  a: string;
}

const ITEMS: QA[] = [
  {
    q: "Това медицински съвет ли е?",
    a: "Не. InsulinReset е образователно средство — събира поведения, които д-р Benjamin Bikman препоръчва (контрол на въглехидратите, протеин, мазнини, гладуване). Ако имаш диагноза диабет тип 2, преддиабет или приемаш медикаменти за глюкоза, говори с лекуващия си лекар преди да започнеш — особено за гладуването и въглехидратния таван.",
  },
  {
    q: "Трябва ли да си купя CGM, везна или нещо друго?",
    a: "Не. Базовият протокол работи с нула устройства — дневник на симптомите и стандартни кръвни маркери (HOMA-IR, HbA1c) от обикновено изследване. CGM модулът е опционален — за биохакери, които вече имат FreeStyle Libre или Dexcom. AI асистентът за храни също е опционален и изисква собствен Anthropic API ключ.",
  },
  {
    q: "Какво правите с данните ми?",
    a: "Държим ги в Turso (база данни в EU). Кръвните маркери и CGM стойностите са криптирани AES-256-GCM в покой — само с твоя сесия могат да се прочетат. Никога не продаваме данни, нямаме реклами, нямаме tracker-и. Можеш да изтеглиш JSON експорт от Настройки по всяко време (право на преносимост по GDPR). Виж пълната политика в /privacy.",
  },
  {
    q: "Защо 90 дни?",
    a: "Това е минималното време, в което се вижда промяна в инсулина на гладно и HOMA-IR. Първите 14 дни са адаптация (12-часов нощен прозорец без храна). Дни 15-30 стесняват. Дни 31-60 въвеждат 16:8 и силови тренировки. Дни 61-90 закотвят навика. Цикълът може да се рестартира — в Настройки → „Преоцени теста\".",
  },
  {
    q: "Работи ли офлайн?",
    a: "Да — приложението е PWA и можеш да го инсталираш на телефона си. Данните се пазят локално като cache; ако влезеш с Google, се синхронизират със сървъра при следваща връзка. Дневният план, чек-листите и графиките работят без интернет.",
  },
];

export default function LandingFaq() {
  return (
    <section className="w-full bg-white px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-teal-700 sm:text-3xl">
          Често задавани въпроси
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          Бързи отговори на най-честите опасения.
        </p>
        <div className="space-y-3">
          {ITEMS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-teal-100 bg-teal-50/30">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-teal-50"
      >
        <span className="text-sm font-semibold text-slate-800 sm:text-base">
          {q}
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-teal-100 bg-white px-4 py-3">
          <p className="text-sm leading-relaxed text-slate-600">{a}</p>
        </div>
      )}
    </div>
  );
}
