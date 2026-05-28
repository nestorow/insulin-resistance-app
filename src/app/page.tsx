import Logo from "@/components/Logo";
import LandingCTA from "@/components/LandingCTA";
import FeatureGrid from "@/components/landing/FeatureGrid";

// Landing page — mirrors thyroidrehab.bg structure: centered hero, brand,
// descriptive subtitles, feature preview cards, single big CTA, disclaimer.

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Logo size={120} className="mb-6 drop-shadow-sm" />

        <h1 className="mb-4 text-4xl font-bold text-teal-700 md:text-5xl">
          ИР Протокол
        </h1>
        <p className="mb-2 max-w-xl text-xl text-slate-600 md:text-2xl">
          Персонализиран асистент за
        </p>
        <p className="mb-8 text-2xl font-semibold text-teal-600 md:text-3xl">
          90-дневно обръщане на инсулиновата резистентност
        </p>

        <p className="mx-auto mb-10 max-w-lg leading-relaxed text-slate-500">
          Базирано на работата на д-р Benjamin Bikman. 4-те стълба — хранене,
          движение, гладуване и проследяване на показателите — всичко на едно
          място.
        </p>

        <FeatureGrid />

        <div className="mt-10">
          <LandingCTA />
        </div>
      </section>

      <footer className="border-t border-teal-100 px-6 py-6 text-center text-xs text-slate-400">
        ⚕️ Информацията е с образователна цел и не е медицински съвет.
        Консултирай се с лекар.
      </footer>
    </main>
  );
}
