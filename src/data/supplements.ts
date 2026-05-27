// Supplement reference — INFORMATIONAL ONLY, not medical advice.
// Evidence grades reflect general consensus strength of human evidence for
// insulin sensitivity / glycemic control, not a clinical recommendation.
// Dosing ranges are commonly-cited typical ranges; always confirm with a
// clinician, especially when on medication. Content authored conservatively
// for the Bikman-protocol context — PENDING USER REVIEW before treated as final.

export type EvidenceGrade = "A" | "B" | "C";

export const GRADE_LEGEND: Record<EvidenceGrade, string> = {
  A: "Силни данни от множество качествени проучвания",
  B: "Умерени данни — обещаващи, но смесени или ограничени проучвания",
  C: "Ограничени/слаби данни — предварителни или противоречиви",
};

export interface Supplement {
  id: string;
  name_bg: string;
  name_en: string;
  grade: EvidenceGrade;
  dose_bg: string;
  benefit_bg: string;
  timing_bg: string;
  caution_bg: string;
}

export const supplements: Supplement[] = [
  {
    id: "berberine",
    name_bg: "Берберин",
    name_en: "Berberine",
    grade: "B",
    dose_bg: "500 mg, 2-3 пъти дневно (общо 1000-1500 mg)",
    benefit_bg:
      "Активира AMPK; данни сочат подобрение на кръвната захар и инсулиновата чувствителност, в някои проучвания съпоставимо с метформин.",
    timing_bg: "С хранене, за да се намали стомашният дискомфорт.",
    caution_bg:
      "Риск от хипогликемия при комбиниране с лекарства за диабет. Взаимодейства с много медикаменти (CYP3A4). Да се избягва при бременност и кърмене. Консултирай се с лекар.",
  },
  {
    id: "magnesium",
    name_bg: "Магнезий (глицинат)",
    name_en: "Magnesium glycinate",
    grade: "B",
    dose_bg: "200-400 mg елементарен магнезий дневно",
    benefit_bg:
      "Дефицитът на магнезий е свързан с инсулинова резистентност; коригирането му може умерено да подобри инсулиновата чувствителност. Глицинатът се понася добре.",
    timing_bg: "Вечер — може да подпомогне съня.",
    caution_bg:
      "Високи дози имат разхлабващ ефект. Внимание при бъбречно заболяване. Може да повлияе усвояването на някои антибиотици.",
  },
  {
    id: "ala",
    name_bg: "Алфа-липоева киселина (ALA)",
    name_en: "Alpha-lipoic acid",
    grade: "B",
    dose_bg: "300-600 mg дневно",
    benefit_bg:
      "Антиоксидант; най-добри данни за диабетна невропатия, с умерени данни за инсулинова чувствителност.",
    timing_bg: "На празен стомах (по-добро усвояване).",
    caution_bg:
      "Може да понижи кръвната захар — внимание при антидиабетни лекарства. Възможен стомашен дискомфорт.",
  },
  {
    id: "inositol",
    name_bg: "Мио-инозитол",
    name_en: "Myo-inositol",
    grade: "B",
    dose_bg: "2-4 g дневно (често 40:1 с D-хиро-инозитол)",
    benefit_bg:
      "Най-силни данни при PCOS — подобрява инсулиновата чувствителност и овулацията.",
    timing_bg: "Разделено на 2 приема, със или без храна.",
    caution_bg:
      "Като цяло добре поносим; високи дози може да причинят леко гадене. Консултирай се при бременност.",
  },
  {
    id: "vitamin_d",
    name_bg: "Витамин D3",
    name_en: "Vitamin D3",
    grade: "B",
    dose_bg: "1000-4000 IU дневно (според нивата в кръвта)",
    benefit_bg:
      "Дефицитът е свързан с инсулинова резистентност; коригирането му при дефицит може да помогне.",
    timing_bg: "С хранене, съдържащо мазнини (мастноразтворим).",
    caution_bg:
      "Не предозирай — мастноразтворим, натрупва се. Изследвай нивата преди високи дози.",
  },
  {
    id: "chromium",
    name_bg: "Хром (пиколинат)",
    name_en: "Chromium picolinate",
    grade: "C",
    dose_bg: "200-1000 µg дневно",
    benefit_bg:
      "Участва в действието на инсулина; данните за глюкозен контрол са смесени и като цяло слаби.",
    timing_bg: "С хранене.",
    caution_bg: "Внимание при бъбречно заболяване. Може да взаимодейства с някои лекарства.",
  },
  {
    id: "omega3",
    name_bg: "Омега-3 (рибено масло)",
    name_en: "Omega-3 (EPA/DHA)",
    grade: "C",
    dose_bg: "1-2 g EPA/DHA дневно",
    benefit_bg:
      "Противовъзпалително действие; ползата директно за инсулиновата чувствителност е по-скоро косвена.",
    timing_bg: "С хранене.",
    caution_bg:
      "Високи дози могат да разреждат кръвта — внимание при антикоагуланти и преди операция.",
  },
];
