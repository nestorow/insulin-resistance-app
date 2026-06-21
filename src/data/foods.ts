export interface Food {
  id: string;
  name_bg: string;
  name_en: string;
  category: 'green' | 'yellow' | 'red';
  gl: number;
  macros: { fat: number; protein: number; carbs: number; fiber: number };
  servingSize: string;
  notes_bg?: string;
}

export const foods: Food[] = [
  // GREEN (GL < 15)
  { id: 'spinach', name_bg: 'Спанак', name_en: 'Spinach', category: 'green', gl: 1, macros: { fat: 0.4, protein: 2.9, carbs: 3.6, fiber: 2.2 }, servingSize: '100g' },
  { id: 'kale', name_bg: 'Кейл', name_en: 'Kale', category: 'green', gl: 2, macros: { fat: 0.9, protein: 4.3, carbs: 8.8, fiber: 3.6 }, servingSize: '100g' },
  { id: 'lettuce', name_bg: 'Маруля', name_en: 'Lettuce', category: 'green', gl: 1, macros: { fat: 0.1, protein: 1.4, carbs: 2.9, fiber: 1.3 }, servingSize: '100g' },
  { id: 'broccoli', name_bg: 'Броколи', name_en: 'Broccoli', category: 'green', gl: 3, macros: { fat: 0.4, protein: 2.8, carbs: 7, fiber: 2.6 }, servingSize: '100g' },
  { id: 'cauliflower', name_bg: 'Карфиол', name_en: 'Cauliflower', category: 'green', gl: 2, macros: { fat: 0.3, protein: 1.9, carbs: 5, fiber: 2 }, servingSize: '100g' },
  { id: 'peppers', name_bg: 'Пиперки', name_en: 'Bell Peppers', category: 'green', gl: 4, macros: { fat: 0.3, protein: 1, carbs: 6, fiber: 2.1 }, servingSize: '100g' },
  { id: 'cucumber', name_bg: 'Краставици', name_en: 'Cucumber', category: 'green', gl: 1, macros: { fat: 0.1, protein: 0.7, carbs: 3.6, fiber: 0.5 }, servingSize: '100g' },
  { id: 'celery', name_bg: 'Целина', name_en: 'Celery', category: 'green', gl: 1, macros: { fat: 0.2, protein: 0.7, carbs: 3, fiber: 1.6 }, servingSize: '100g' },
  { id: 'avocado', name_bg: 'Авокадо', name_en: 'Avocado', category: 'green', gl: 1, macros: { fat: 15, protein: 2, carbs: 9, fiber: 7 }, servingSize: '100g', notes_bg: 'Богато на мононенаситени мазнини и калий' },
  { id: 'olives', name_bg: 'Маслини', name_en: 'Olives', category: 'green', gl: 1, macros: { fat: 11, protein: 0.8, carbs: 6, fiber: 3.2 }, servingSize: '100g' },
  { id: 'eggs', name_bg: 'Яйца', name_en: 'Eggs', category: 'green', gl: 0, macros: { fat: 11, protein: 13, carbs: 1.1, fiber: 0 }, servingSize: '2 яйца (~100g)' },
  { id: 'chicken', name_bg: 'Пилешко месо', name_en: 'Chicken', category: 'green', gl: 0, macros: { fat: 3.6, protein: 31, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'pork', name_bg: 'Свинско месо', name_en: 'Pork', category: 'green', gl: 0, macros: { fat: 14, protein: 27, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'beef', name_bg: 'Говеждо месо', name_en: 'Beef', category: 'green', gl: 0, macros: { fat: 15, protein: 26, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'lamb', name_bg: 'Агнешко месо', name_en: 'Lamb', category: 'green', gl: 0, macros: { fat: 21, protein: 25, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'salmon', name_bg: 'Сьомга', name_en: 'Salmon', category: 'green', gl: 0, macros: { fat: 13, protein: 20, carbs: 0, fiber: 0 }, servingSize: '100g', notes_bg: 'Богата на Omega-3 мастни киселини' },
  { id: 'tuna', name_bg: 'Тон', name_en: 'Tuna', category: 'green', gl: 0, macros: { fat: 1, protein: 30, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'mackerel', name_bg: 'Скумрия', name_en: 'Mackerel', category: 'green', gl: 0, macros: { fat: 14, protein: 19, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'sardines', name_bg: 'Сардини', name_en: 'Sardines', category: 'green', gl: 0, macros: { fat: 11, protein: 25, carbs: 0, fiber: 0 }, servingSize: '100g' },
  { id: 'butter', name_bg: 'Масло', name_en: 'Butter', category: 'green', gl: 0, macros: { fat: 81, protein: 0.9, carbs: 0.1, fiber: 0 }, servingSize: '14g (1 с.л.)' },
  { id: 'cream', name_bg: 'Сметана', name_en: 'Heavy Cream', category: 'green', gl: 0, macros: { fat: 37, protein: 2.1, carbs: 2.8, fiber: 0 }, servingSize: '30ml' },
  { id: 'aged_cheese', name_bg: 'Зряло сирене', name_en: 'Aged Cheese', category: 'green', gl: 0, macros: { fat: 33, protein: 25, carbs: 1.3, fiber: 0 }, servingSize: '30g' },
  { id: 'olive_oil', name_bg: 'Зехтин', name_en: 'Olive Oil', category: 'green', gl: 0, macros: { fat: 100, protein: 0, carbs: 0, fiber: 0 }, servingSize: '14ml (1 с.л.)', notes_bg: 'За дресинг, не за готвене на висока температура' },
  { id: 'coconut_oil', name_bg: 'Кокосово масло', name_en: 'Coconut Oil', category: 'green', gl: 0, macros: { fat: 100, protein: 0, carbs: 0, fiber: 0 }, servingSize: '14ml (1 с.л.)', notes_bg: 'Идеално за готвене на висока температура' },
  { id: 'animal_fat', name_bg: 'Животински мазнини (свинска мас, лой)', name_en: 'Animal Fat (Lard, Tallow)', category: 'green', gl: 0, macros: { fat: 100, protein: 0, carbs: 0, fiber: 0 }, servingSize: '14g (1 с.л.)' },
  { id: 'macadamia', name_bg: 'Макадамия', name_en: 'Macadamia Nuts', category: 'green', gl: 1, macros: { fat: 76, protein: 8, carbs: 14, fiber: 9 }, servingSize: '30g', notes_bg: 'Най-ниски въглехидрати от всички ядки' },
  { id: 'pecan', name_bg: 'Пекан', name_en: 'Pecans', category: 'green', gl: 1, macros: { fat: 72, protein: 9, carbs: 14, fiber: 10 }, servingSize: '30g' },
  { id: 'mushrooms', name_bg: 'Гъби', name_en: 'Mushrooms', category: 'green', gl: 1, macros: { fat: 0.3, protein: 3.1, carbs: 3.3, fiber: 1 }, servingSize: '100g' },
  { id: 'zucchini', name_bg: 'Тиквички', name_en: 'Zucchini', category: 'green', gl: 2, macros: { fat: 0.3, protein: 1.2, carbs: 3.1, fiber: 1 }, servingSize: '100g' },
  { id: 'mayo', name_bg: 'Майонеза (домашна)', name_en: 'Mayonnaise (homemade)', category: 'green', gl: 0, macros: { fat: 75, protein: 1, carbs: 1, fiber: 0 }, servingSize: '14g (1 с.л.)', notes_bg: 'Само домашна — фабричната съдържа семенни масла' },
  // YELLOW (GL 16-30)
  { id: 'almonds', name_bg: 'Бадеми', name_en: 'Almonds', category: 'yellow', gl: 18, macros: { fat: 50, protein: 21, carbs: 22, fiber: 12 }, servingSize: '30g' },
  { id: 'walnuts', name_bg: 'Орехи', name_en: 'Walnuts', category: 'yellow', gl: 16, macros: { fat: 65, protein: 15, carbs: 14, fiber: 7 }, servingSize: '30g' },
  { id: 'peanuts', name_bg: 'Фъстъци', name_en: 'Peanuts', category: 'yellow', gl: 18, macros: { fat: 49, protein: 26, carbs: 16, fiber: 9 }, servingSize: '30g' },
  { id: 'strawberries', name_bg: 'Ягоди', name_en: 'Strawberries', category: 'yellow', gl: 16, macros: { fat: 0.3, protein: 0.7, carbs: 7.7, fiber: 2 }, servingSize: '150g' },
  { id: 'raspberries', name_bg: 'Малини', name_en: 'Raspberries', category: 'yellow', gl: 16, macros: { fat: 0.7, protein: 1.2, carbs: 12, fiber: 6.5 }, servingSize: '150g' },
  { id: 'blueberries', name_bg: 'Боровинки', name_en: 'Blueberries', category: 'yellow', gl: 22, macros: { fat: 0.3, protein: 0.7, carbs: 14, fiber: 2.4 }, servingSize: '150g' },
  { id: 'citrus', name_bg: 'Цитруси (портокал, грейпфрут)', name_en: 'Citrus', category: 'yellow', gl: 22, macros: { fat: 0.1, protein: 0.9, carbs: 12, fiber: 2.4 }, servingSize: '1 плод' },
  { id: 'carrots', name_bg: 'Моркови', name_en: 'Carrots', category: 'yellow', gl: 20, macros: { fat: 0.2, protein: 0.9, carbs: 10, fiber: 2.8 }, servingSize: '100g' },
  { id: 'peas', name_bg: 'Грах', name_en: 'Peas', category: 'yellow', gl: 22, macros: { fat: 0.4, protein: 5, carbs: 14, fiber: 5 }, servingSize: '100g' },
  { id: 'lentils', name_bg: 'Леща', name_en: 'Lentils', category: 'yellow', gl: 18, macros: { fat: 0.4, protein: 9, carbs: 20, fiber: 8 }, servingSize: '100g (сварена)' },
  { id: 'beans', name_bg: 'Боб / бобови', name_en: 'Beans', category: 'yellow', gl: 22, macros: { fat: 0.5, protein: 8, carbs: 22, fiber: 7 }, servingSize: '100g (сварени)' },
  { id: 'full_fat_yogurt', name_bg: 'Кисело мляко (пълна масленост)', name_en: 'Full-Fat Yogurt', category: 'yellow', gl: 17, macros: { fat: 5, protein: 9, carbs: 4, fiber: 0 }, servingSize: '200g' },
  { id: 'milk', name_bg: 'Прясно мляко', name_en: 'Whole Milk', category: 'yellow', gl: 20, macros: { fat: 3.3, protein: 3.2, carbs: 5, fiber: 0 }, servingSize: '250ml' },
  { id: 'dark_chocolate', name_bg: 'Тъмен шоколад (>85%)', name_en: 'Dark Chocolate (>85%)', category: 'yellow', gl: 20, macros: { fat: 46, protein: 8, carbs: 25, fiber: 11 }, servingSize: '30g', notes_bg: 'Над 85% какао — в малки количества' },
  // RED (GL > 30)
  { id: 'bread', name_bg: 'Хляб (бял, пълнозърнест)', name_en: 'Bread', category: 'red', gl: 45, macros: { fat: 3, protein: 9, carbs: 49, fiber: 2.7 }, servingSize: '2 филии' },
  { id: 'crackers', name_bg: 'Крекери', name_en: 'Crackers', category: 'red', gl: 55, macros: { fat: 10, protein: 7, carbs: 68, fiber: 3 }, servingSize: '30g' },
  { id: 'cereal', name_bg: 'Зърнени закуски', name_en: 'Cereal', category: 'red', gl: 65, macros: { fat: 2, protein: 7, carbs: 84, fiber: 3 }, servingSize: '40g' },
  { id: 'rice', name_bg: 'Ориз', name_en: 'Rice', category: 'red', gl: 50, macros: { fat: 0.3, protein: 2.7, carbs: 28, fiber: 0.4 }, servingSize: '150g (сварен)' },
  { id: 'pasta', name_bg: 'Паста', name_en: 'Pasta', category: 'red', gl: 45, macros: { fat: 1.1, protein: 5.8, carbs: 31, fiber: 1.8 }, servingSize: '150g (сварена)' },
  { id: 'potatoes', name_bg: 'Картофи', name_en: 'Potatoes', category: 'red', gl: 55, macros: { fat: 0.1, protein: 2, carbs: 17, fiber: 2.2 }, servingSize: '150g' },
  { id: 'juice', name_bg: 'Сокове (включително натурални!)', name_en: 'Fruit Juice', category: 'red', gl: 60, macros: { fat: 0, protein: 0.5, carbs: 11, fiber: 0.2 }, servingSize: '250ml', notes_bg: 'Дори натуралните — без фибрите, захарта се усвоява мигновено' },
  { id: 'ice_cream', name_bg: 'Сладолед', name_en: 'Ice Cream', category: 'red', gl: 50, macros: { fat: 11, protein: 3.5, carbs: 24, fiber: 0 }, servingSize: '100g' },
  { id: 'cake', name_bg: 'Торти, бисквити', name_en: 'Cake / Cookies', category: 'red', gl: 65, macros: { fat: 20, protein: 5, carbs: 55, fiber: 1 }, servingSize: '1 парче' },
  { id: 'banana', name_bg: 'Банани', name_en: 'Banana', category: 'red', gl: 42, macros: { fat: 0.3, protein: 1.1, carbs: 23, fiber: 2.6 }, servingSize: '1 банан (~120g)' },
  { id: 'pineapple', name_bg: 'Ананас', name_en: 'Pineapple', category: 'red', gl: 45, macros: { fat: 0.1, protein: 0.5, carbs: 13, fiber: 1.4 }, servingSize: '150g' },
  { id: 'grapes', name_bg: 'Грозде', name_en: 'Grapes', category: 'red', gl: 43, macros: { fat: 0.2, protein: 0.7, carbs: 18, fiber: 0.9 }, servingSize: '150g' },
  { id: 'soda', name_bg: 'Газирани напитки / безалкохолни', name_en: 'Soda / Soft Drinks', category: 'red', gl: 70, macros: { fat: 0, protein: 0, carbs: 11, fiber: 0 }, servingSize: '330ml', notes_bg: 'Чист HFCS — един от най-лошите избори' },
  { id: 'candy', name_bg: 'Бонбони, захарни изделия', name_en: 'Candy', category: 'red', gl: 75, macros: { fat: 5, protein: 2, carbs: 80, fiber: 0 }, servingSize: '50g' },
  { id: 'processed_food', name_bg: 'Обработени храни (чипс, снаксове)', name_en: 'Processed Snacks', category: 'red', gl: 60, macros: { fat: 30, protein: 5, carbs: 55, fiber: 2 }, servingSize: '50g', notes_bg: 'Комбинация от семенни масла + рафинирани ВХ — двоен удар' },
  { id: 'corn_syrup', name_bg: 'Храни с добавен HFCS', name_en: 'High-Fructose Corn Syrup foods', category: 'red', gl: 70, macros: { fat: 0, protein: 0, carbs: 76, fiber: 0 }, servingSize: 'варира', notes_bg: 'Фруктозата прави черния дроб мазен за 1 седмица' },
];

export interface FermentedFood {
  id: string;
  name_bg: string;
  name_en: string;
  benefit_bg: string;
}

export const fermentedFoods: FermentedFood[] = [
  { id: 'acv', name_bg: 'Суров ябълков оцет', name_en: 'Raw Apple Cider Vinegar', benefit_bg: '1-2 с.л. преди хранене — подобрява инсулиновата чувствителност' },
  { id: 'sauerkraut', name_bg: 'Кисело зеле (сурово)', name_en: 'Sauerkraut (raw)', benefit_bg: 'Богат пробиотик, бактериите изяждат захарите' },
  { id: 'kimchi', name_bg: 'Кимчи', name_en: 'Kimchi', benefit_bg: 'Пробиотик + капсаицин — двойна полза' },
  { id: 'kefir', name_bg: 'Кефир', name_en: 'Kefir', benefit_bg: 'По-богат на пробиотици от киселото мляко' },
  { id: 'sourdough', name_bg: 'Квасен хляб (истински, с квас)', name_en: 'Sourdough Bread (real)', benefit_bg: 'По-нисък GL от обикновения хляб — НО все пак внимателно' },
  { id: 'yogurt_live', name_bg: 'Кисело мляко (с живи култури)', name_en: 'Live Culture Yogurt', benefit_bg: 'Пълна масленост + живи култури = оптимален избор' },
];

export interface Sweetener {
  name_bg: string;
  name_en: string;
  effectAlone: string;
  effectWithFood: string;
  safe: boolean;
}

export const sweeteners: Sweetener[] = [
  { name_bg: 'Стевия', name_en: 'Stevia', effectAlone: 'Няма', effectWithFood: 'Няма', safe: true },
  { name_bg: 'Еритритол', name_en: 'Erythritol', effectAlone: 'Няма', effectWithFood: 'Няма', safe: true },
  { name_bg: 'Монк фрут', name_en: 'Monk Fruit', effectAlone: 'Няма', effectWithFood: 'Няма', safe: true },
  { name_bg: 'Ксилитол', name_en: 'Xylitol', effectAlone: 'Минимален', effectWithFood: 'Минимален', safe: true },
  { name_bg: 'Сукралоза', name_en: 'Sucralose', effectAlone: 'Няма', effectWithFood: 'Повишен', safe: false },
  { name_bg: 'Аспартам', name_en: 'Aspartame', effectAlone: 'Няма', effectWithFood: 'Вероятно повишен', safe: false },
  { name_bg: 'Ацесулфам-K', name_en: 'Acesulfame-K', effectAlone: 'Неясен', effectWithFood: 'Вероятно повишен', safe: false },
];

export interface FatGuide {
  category: string;
  category_bg: string;
  items: { name_bg: string; use_bg: string }[];
  color: string;
}

export const fatGuides: FatGuide[] = [
  {
    category: 'good_saturated',
    category_bg: 'ДОБРИ наситени мазнини',
    items: [
      { name_bg: 'Масло, гхи', use_bg: 'За готвене на висока температура' },
      { name_bg: 'Кокосово масло', use_bg: 'За готвене на висока температура' },
      { name_bg: 'Свинска мас, лой', use_bg: 'За готвене на висока температура' },
    ],
    color: '#22C55E',
  },
  {
    category: 'good_mono',
    category_bg: 'ДОБРИ мононенаситени мазнини',
    items: [
      { name_bg: 'Зехтин', use_bg: 'За дресинг (не загряване)' },
      { name_bg: 'Авокадово масло', use_bg: 'За дресинг и леко готвене' },
    ],
    color: '#14B8A6',
  },
  {
    category: 'caution_poly',
    category_bg: 'ВНИМАНИЕ: полиненаситени (от естествени източници)',
    items: [
      { name_bg: 'В месо, ядки', use_bg: 'OK в малки количества (естествени)' },
    ],
    color: '#EAB308',
  },
  {
    category: 'avoid_seed',
    category_bg: 'ИЗБЯГВАЙ: преработени семенни масла',
    items: [
      { name_bg: 'Соево, царевично, слънчогледово, рапично олио', use_bg: 'Съдържат линолова киселина — най-лесно окислима' },
    ],
    color: '#EF4444',
  },
];
