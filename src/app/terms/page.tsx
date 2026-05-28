import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Условия за ползване — InsulinReset",
  description:
    "Условия за ползване на InsulinReset — медицински дисклеймер, отговорност, прекратяване.",
};

const LAST_UPDATED = "2026-05-28";
const CONTACT_EMAIL = "nestorow@gmail.com";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <header className="mb-8">
        <Link href="/" className="text-sm text-teal-600 hover:text-teal-700">
          ← Към началото
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-teal-700">
          Условия за ползване
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Последна редакция: {LAST_UPDATED}
        </p>
      </header>

      {/* The medical disclaimer comes FIRST and lives in a high-contrast
          card — this is the single most important thing on the page. */}
      <section className="mb-8 rounded-2xl border-2 border-warning/40 bg-warm-light/50 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-warning">
          ⚠️ Медицински дисклеймер — прочети първо
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-800">
          <p>
            <strong>InsulinReset не е медицинско устройство, не е лекарство
            и не замества консултация с лекар.</strong>
          </p>
          <p>
            Приложението предоставя образователно съдържание базирано на
            публикувана работа на д-р Benjamin Bikman. Конкретните насоки —
            хранене, гладуване, тренировки, добавки — са общи и може да не
            са подходящи за теб лично.
          </p>
          <p>
            <strong>Преди да правиш промени се консултирай с лекар, ако:</strong>
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Имаш диабет или преддиабет</li>
            <li>Приемаш медикаменти за глюкоза, кръвно налягане или други</li>
            <li>Си бременна или кърмиш</li>
            <li>Имаш бъбречно, сърдечно или чернодробно заболяване</li>
            <li>Имаш разстройство на хранителното поведение</li>
            <li>Си под 18 години</li>
          </ul>
          <p>
            При спешно влошаване — потърси медицинска помощ незабавно.
            Приложението не е заместител на спешна помощ.
          </p>
        </div>
      </section>

      <Section title="1. Какво е InsulinReset">
        <p>
          90-дневен интерактивен протокол за подобряване на инсулиновата
          чувствителност, базиран на работата на д-р Benjamin Bikman.
          Включва персонализиран план, дневник на симптоми и кръвни
          маркери, образователно съдържание и AI асистент за храни.
          Безплатно е и без реклами.
        </p>
      </Section>

      <Section title="2. Кой може да го ползва">
        <p>
          Лица над 18 години. С регистрация (или с продължаване на ползване
          като анонимен потребител) потвърждаваш, че си съгласен с тези
          условия и с{" "}
          <Link href="/privacy" className="text-teal-600 underline hover:text-teal-700">
            политиката за поверителност
          </Link>
          .
        </p>
      </Section>

      <Section title="3. Точност на информацията">
        <p>
          Стойностите на гликемичен товар, макроси и препоръчителни
          въглехидратни прагове са <strong>приблизителни</strong>. Не
          разчитай на тях за дозировка на медикаменти (напр. инсулин).
          Цитираните факти за инсулиновата резистентност са от рецензирани
          източници, но не са медицински съвет за твоята лична ситуация.
        </p>
        <p>
          AI асистентът за храни използва Anthropic Claude и може да допусне
          грешки. Кръстосвай отговорите с лекар при съмнение.
        </p>
      </Section>

      <Section title="4. Твоят профил">
        <p>
          Логнат потребител е отговорен за достъпа до акаунта си. Не
          споделяй login-а си. Преоценка на теста (от Настройки) нулира
          tier-а и стартира нов 90-дневен цикъл — историята остава.
        </p>
      </Section>

      <Section title="5. Допустимо ползване">
        <p>Не правиш следните неща с приложението:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Reverse engineering, scraping, или автоматизирани масови заявки</li>
          <li>Атаки срещу инфраструктурата (DDoS, инжекции, бот спам)</li>
          <li>Заобикаляне на rate limit-овете или security защитите</li>
          <li>Препродажба на достъп или съдържание</li>
          <li>Подаване на чужди медицински данни без съгласие</li>
        </ul>
        <p>
          При нарушение запазваме правото да блокираме акаунта без
          предизвестие.
        </p>
      </Section>

      <Section title="6. Интелектуална собственост">
        <p>
          Кодът, дизайнът, копито и оригиналното съдържание са собственост
          на разработчика. Цитати от книгата на д-р Bikman („Why We Get Sick“)
          са под fair-use за образователна цел. Данните, които ти въвеждаш
          (дневник, маркери), остават твои.
        </p>
      </Section>

      <Section title="7. Отговорност">
        <p>
          Приложението се предоставя <strong>„както е“ (AS IS)</strong>,
          без гаранции за непрекъсваемост, точност или подходящост за
          конкретна цел.
        </p>
        <p>
          В максималната степен, разрешена от закона:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Разработчикът не носи отговорност за здравословни резултати
            от прилагане на съдържанието
          </li>
          <li>
            Не носи отговорност за загуба на данни (макар че правим всичко
            разумно за защитата им — виж Privacy Policy)
          </li>
          <li>
            Общата отговорност е ограничена до сумите, които си платил за
            услугата (засега 0 лв., тъй като приложението е безплатно)
          </li>
        </ul>
      </Section>

      <Section title="8. Прекратяване">
        <p>
          Можеш да изтриеш акаунта си по всяко време — пиши на{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-teal-600 underline hover:text-teal-700"
          >
            {CONTACT_EMAIL}
          </a>
          . Разработчикът може да прекрати или промени услугата с разумно
          предизвестие.
        </p>
      </Section>

      <Section title="9. Приложимо право">
        <p>
          Тези условия се тълкуват по българското право. Спорове, които
          не могат да бъдат решени по разумен начин, са компетентност на
          съда по седалището на разработчика.
        </p>
      </Section>

      <Section title="10. Промени в условията">
        <p>
          При промени ще видиш notice в приложението. Продължаване на
          ползване след промяната означава съгласие. Ако не си съгласен —
          можеш да прекратиш акаунта си.
        </p>
      </Section>

      <Section title="11. Контакт">
        <p>
          За всичко, свързано с тези условия:{" "}
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
