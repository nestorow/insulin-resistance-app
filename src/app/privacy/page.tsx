import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Политика за поверителност — InsulinReset",
  description:
    "Каква информация събираме, как я пазим, и какви права имаш по GDPR.",
};

// Update this when the policy changes substantively (data flows, third
// parties, retention). Plain ISO string — easy to diff in git.
const LAST_UPDATED = "2026-06-10";
const CONTACT_EMAIL = "nestorow@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" /> Към началото
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-teal-700">
          Политика за поверителност
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Последна редакция: {LAST_UPDATED}
        </p>
      </header>

      <Intro />
      <Section title="1. Кои сме">
        <p>
          <strong>InsulinReset</strong> е персонално приложение, разработвано от
          {" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-teal-600 underline hover:text-teal-700"
          >
            {CONTACT_EMAIL}
          </a>
          . Приложението е безплатно, без реклами и без продажба на данни.
          Деплойнато е на Vercel; базата данни е в Turso (EU регион).
        </p>
      </Section>

      <Section title="2. Какви данни събираме">
        <List
          items={[
            <>
              <strong>Профил от Google</strong> — име, email, аватар. Само
              когато избереш да се логнеш с Google.
            </>,
            <>
              <strong>Отговори от теста</strong> — 8-те „Да/Не“ въпроса от
              onboarding-а, опционални стойности за TG/HDL и обиколка
              талия/ханш.
            </>,
            <>
              <strong>Дневник на симптомите</strong> — енергия, brain fog,
              тегло, талия, кръвна захар, дата и бележка.
            </>,
            <>
              <strong>Кръвни маркери</strong> — HOMA-IR, инсулин на гладно,
              HbA1c, триглицериди, HDL и дата. <em>Тези данни са криптирани
              в покой</em> с AES-256-GCM преди да достигнат базата (виж
              т. 6).
            </>,
            <>
              <strong>CGM данни</strong> — ако качиш CSV от FreeStyle
              LibreView или Dexcom Clarity: timestamp + стойност в mg/dL
              за всеки sensor reading, плюс твои кратки бележки върху
              открити пикове (напр. „банан + кафе“). <em>И стойностите, и
              бележките са криптирани в покой</em> със същия AES-256-GCM.
              Файловете се обработват в браузъра — суровият CSV не се
              качва на сървъра.
            </>,
            <>
              <strong>Прогрес</strong> — поредни дни (streak), XP, спечелени
              значки и история на отметките в дневния план.
            </>,
            <>
              <strong>Push абонамент</strong> — само ако включиш push
              известия в Настройки. Пазим браузърния endpoint + криптографски
              ключове за изпращане.
            </>,
            <>
              <strong>Email преглед</strong> — флаг „включен/изключен“ на
              профила ти.
            </>,
            <>
              <strong>Audit log</strong> — записи кой потребител и кога
              записва/променя данни. Не съдържа стойностите — само факт
              и дата.
            </>,
            <>
              <strong>Anthropic API key</strong> — само ако сам го въведеш
              в Настройки за AI асистента. Пази се{" "}
              <em>криптиран в покой</em> със същия AES-256-GCM като кръвните
              маркери и никога не се връща обратно към браузъра след запис.
              Виж т. 6.
            </>,
          ]}
        />
      </Section>

      <Section title="3. Как ги използваме">
        <List
          items={[
            "Персонализиране на 90-дневния план според твоя профил (lens + tier).",
            "Проследяване на прогреса ти през 4-те фази на протокола.",
            "Сутрешен push reminder (ако си го включил).",
            "Седмичен email преглед с обобщение (ако си го включил).",
            "Изчисляване на streak, ниво и значки.",
            "AI асистент за храни — въпросът ти се изпраща към Anthropic Claude (без твоето user ID).",
          ]}
        />
        <p className="mt-3">
          <strong>Правно основание (GDPR):</strong>
        </p>
        <List
          items={[
            <>
              <strong>Съгласие (чл. 6, пар. 1, б. „а“)</strong> — за създаване на
              акаунт и предоставяне на услугата.
            </>,
            <>
              <strong>
                Изрично съгласие за специална категория (чл. 9, пар. 2, б. „а“)
              </strong>{" "}
              — здравните данни (кръвни маркери, HOMA-IR, дневник на симптомите,
              CGM) се обработват само въз основа на твоето изрично съгласие, което
              можеш да оттеглиш по всяко време.
            </>,
            <>
              <strong>Изпълнение на услугата (чл. 6, пар. 1, б. „б“)</strong> — за
              функционирането на 90-дневния протокол.
            </>,
          ]}
        />
      </Section>

      <Section title="4. Анонимни потребители">
        <p>
          Ако не се логнеш, всичко се пази <strong>само локално</strong> в
          твоя браузър (localStorage). Нищо не отива на сървъра. Сменяш ли
          браузър или устройство — данните не пътуват с теб. Това е твой
          избор и съзнателно поддържан режим.
        </p>
      </Section>

      <Section title="5. Кои трети страни имат достъп">
        <List
          items={[
            <>
              <strong>Google</strong> — само за вход (OAuth). Виж Google&apos;s
              privacy policy.
            </>,
            <>
              <strong>Turso (libsql)</strong> — нашата база данни.
              EU region.
            </>,
            <>
              <strong>Vercel</strong> — hosting и cron jobs.
            </>,
            <>
              <strong>Anthropic</strong> — само когато използваш AI
              асистента <em>и</em> въпросът не е в общия cache (т.е.
              никой друг потребител не го е задавал преди). Изпращаме{" "}
              <em>само въпроса ти</em> + tier-а ти, с{" "}
              <strong>твоя собствен API key</strong> (виж Настройки) —
              ти плащаш на Anthropic директно. Anthropic не тренира
              модели върху API заявки (политика на компанията).
            </>,
            <>
              <strong>Resend</strong> — само ако си включил email преглед.
              Изпращаме адреса и съдържанието на писмото.
            </>,
            <>
              <strong>Upstash Redis</strong> — counter за rate limiting.
              Само user ID (без съдържание).
            </>,
            <>
              <strong>Push провайдери</strong> (Apple/Google/Mozilla) — за
              да доставят push известия. Виждат само endpoint-а ти, не
              съдържанието.
            </>,
          ]}
        />
        <p className="mt-3">
          <strong>Не продаваме данни. Не показваме реклами. Не правим
          tracking за маркетинг.</strong>
        </p>
        <p className="mt-3">
          <strong>Международно предаване:</strong> някои доставчици (Vercel,
          Anthropic, Resend, Upstash, Google) са базирани в САЩ. Предаването на
          данни се извършва въз основа на стандартни договорни клаузи (SCC)
          съгласно чл. 46 от GDPR и/или Рамката за защита на данните ЕС–САЩ
          (EU-US Data Privacy Framework).
        </p>
      </Section>

      <Section title="6. Как защитаваме данните">
        <List
          items={[
            <>
              <strong>Encryption-at-rest</strong> за кръвните маркери —
              AES-256-GCM преди да напуснат сървърния процес.
            </>,
            <>
              <strong>HTTPS</strong> навсякъде. Самият Vercel го налага.
            </>,
            <>
              <strong>Session JWT</strong> подписан с NEXTAUTH_SECRET; всеки
              cookie е HttpOnly + Secure.
            </>,
            <>
              <strong>User scoping</strong> — всяка SQL заявка филтрира по
              твоето user ID; не можеш да четеш данни на друг потребител.
            </>,
            <>
              <strong>Rate limiting</strong> на всички server actions —
              30 заявки/мин на потребител; 5/мин за AI асистента.
            </>,
            <>
              <strong>Audit log</strong> — appendable, който записва кой/кога
              променя профил, маркери или дневник.
            </>,
          ]}
        />
      </Section>

      <Section title="7. Колко дълго пазим данните">
        <p>
          Докато имаш активен акаунт. Преоценка на теста (от Настройки)
          нулира профила, но <em>запазва</em> историята на дневника и
          маркерите. Пълно изтриване — пиши на{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-teal-600 underline hover:text-teal-700"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          и ще изтрием всичките ти данни в рамките на 30 дни (вкл. audit
          log след стандартен retention период).
        </p>
      </Section>

      <Section title="8. Твоите права по GDPR">
        <List
          items={[
            <>
              <strong>Достъп</strong> — да получиш копие на всичките си
              данни.
            </>,
            <>
              <strong>Корекция</strong> — да поправиш неточни записи (директно
              в приложението или чрез email).
            </>,
            <>
              <strong>Изтриване</strong> — „правото да бъдеш забравен“.
            </>,
            <>
              <strong>Преносимост</strong> — да получиш данните си в JSON
              формат.
            </>,
            <>
              <strong>Възражение</strong> — да оттеглиш съгласието за email/push.
            </>,
            <>
              <strong>Жалба до КЗЛД</strong> — Комисията за защита на
              личните данни на Република България,{" "}
              <a
                href="https://www.cpdp.bg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline hover:text-teal-700"
              >
                cpdp.bg
              </a>
              .
            </>,
          ]}
        />
        <p className="mt-3">
          За всяко от тези права пиши на{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-teal-600 underline hover:text-teal-700"
          >
            {CONTACT_EMAIL}
          </a>
          . Отговаряме до 30 дни.
        </p>
      </Section>

      <Section title="9. Бисквитки и localStorage">
        <p>
          Не използваме маркетингови или tracking бисквитки. Технически
          необходимите:
        </p>
        <List
          items={[
            <>
              <strong>NextAuth session cookie</strong> — за да си логнат.
              HttpOnly, Secure, изтича заедно с сесията.
            </>,
            <>
              <strong>localStorage</strong> — кешираме теста и
              дневника локално за бързо зареждане и offline режим.
              Изчистват се при изход от профила.
            </>,
          ]}
        />
      </Section>

      <Section title="10. Деца">
        <p>
          Приложението е за лица над 18 години. Не събираме съзнателно
          данни от деца.
        </p>
      </Section>

      <Section title="11. Промени">
        <p>
          При значими промени ще видиш notice в приложението. Дребни
          уточнения отбелязваме само с дата по-горе.
        </p>
      </Section>

      <Section title="12. Контакт">
        <p>
          Имаш въпрос или искаш да упражниш правата си?{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-teal-600 underline hover:text-teal-700"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </main>
  );
}

function Intro() {
  return (
    <section className="mb-8 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-sm text-slate-700">
      <p className="leading-relaxed">
        <strong>Кратката версия:</strong> приложението е безплатно, без
        реклами, не продава данни. Кръвните маркери са{" "}
        <strong>криптирани в покой</strong>. Имаш пълно право да изтриеш
        всичко по всяко време.
      </p>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 text-sm leading-relaxed text-slate-700">
      <h2 className="mb-3 text-lg font-semibold text-teal-700">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
