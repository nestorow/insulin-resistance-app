export interface ChecklistItem {
  id: string;
  text_bg: string;
  category: 'morning' | 'day' | 'evening' | 'weekly' | 'monthly';
}

export const checklistItems: ChecklistItem[] = [
  // Morning
  { id: 'morning_acv', text_bg: 'Ябълков оцет: 1-2 с.л. в чаша вода', category: 'morning' },
  { id: 'morning_meal', text_bg: 'Без закуска (18ч гладуване) ИЛИ нискоВХ закуска', category: 'morning' },
  { id: 'morning_supps', text_bg: 'Суплементи: Магнезий, Витамин D3 (4000 IU)', category: 'morning' },
  { id: 'morning_exercise', text_bg: 'Движение / тренировка (ако е тренировъчен ден)', category: 'morning' },
  // Day
  { id: 'day_breaks', text_bg: 'Прекъсване на седенето на всеки 20-30 мин', category: 'day' },
  { id: 'day_meals', text_bg: 'Хранения: протеин + мазнини + нискоGL зеленчуци', category: 'day' },
  { id: 'day_carbs_last', text_bg: 'Въглехидратите ПОСЛЕДНИ в хранението', category: 'day' },
  { id: 'day_fermented', text_bg: 'Ферментирала храна с поне 1 хранене', category: 'day' },
  { id: 'day_no_juice', text_bg: 'Без сокове — яж плодовете цели', category: 'day' },
  { id: 'day_no_seed_oils', text_bg: 'Без семенни олиа', category: 'day' },
  { id: 'day_water', text_bg: 'Достатъчно вода', category: 'day' },
  // Evening
  { id: 'eve_acv', text_bg: 'Ябълков оцет: 1-2 с.л. в чаша вода', category: 'evening' },
  { id: 'eve_dinner', text_bg: 'Вечеря преди 19:00 (начало на 12ч гладуване)', category: 'evening' },
  { id: 'eve_supps', text_bg: 'Суплементи: Хром (400 µg), Цинк (30 mg)', category: 'evening' },
  { id: 'eve_screens', text_bg: 'Без екрани 1 час преди сън', category: 'evening' },
  { id: 'eve_cold', text_bg: 'Студен душ (по избор)', category: 'evening' },
  { id: 'eve_sleep', text_bg: '7-9 часа сън', category: 'evening' },
  // Weekly
  { id: 'week_fasting', text_bg: '2-3 дни с 18-часово гладуване', category: 'weekly' },
  { id: 'week_exercise', text_bg: 'Минимум 2.5 часа тренировки', category: 'weekly' },
  { id: 'week_sweets', text_bg: 'Максимум 1 сладко/десерт за седмицата', category: 'weekly' },
  { id: 'week_waist', text_bg: 'Измерване: обиколка на талията', category: 'weekly' },
  // Monthly
  { id: 'month_24h', text_bg: '1x 24-часово гладуване', category: 'monthly' },
  { id: 'month_tghdl', text_bg: 'Преглед на TG/HDL (ако има кръвни резултати)', category: 'monthly' },
];
