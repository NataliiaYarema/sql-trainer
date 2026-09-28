import en from './en/ui.js';
import uk from './uk/ui.js';
import es from './es/ui.js';

// Порядок = порядок у випадному списку шапки.
export const LANGS = ['en', 'uk', 'es'];

// Самоназвами, а не перекладом на поточну мову: так свою мову знаходить той,
// хто поточної не розуміє.
export const LANG_NAMES = { en: 'English', uk: 'Українська', es: 'Español' };

export const DEFAULT_LANG = 'en';

const DICTS = { en, uk, es };

let current = DEFAULT_LANG;

export function isLang(value) {
  return LANGS.includes(value);
}

export function getLanguage() {
  return current;
}

// Валідація живе тут, а не в місцях виклику: мова приходить і з адреси, і зі
// сховища, і зі списку — три різні джерела, кожне з яких може дати дурницю.
export function setLanguage(lang) {
  current = isLang(lang) ? lang : DEFAULT_LANG;
  return current;
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : whole
  );
}

// Кількість форм множини вирішує сама мова: українська має three, англійська
// та іспанська — two. Через це формою керує Intl.PluralRules, а не власний if.
// 'other' узято запасним варіантом: українською його дають дробові числа.
function pluralForm(entry, lang, count) {
  const rule = new Intl.PluralRules(lang).select(count);
  return entry[rule] ?? entry.other ?? entry.many;
}

export function t(key, vars = {}) {
  // Падіння на англійську — підстраховка, щоб користувач не побачив сирий
  // ключ. Вона мусить лишатися невикористаною: паритет ключів перевіряє
  // tests/verifyI18n.mjs.
  const entry = DICTS[current][key] ?? DICTS[DEFAULT_LANG][key];
  if (entry === undefined) return key;
  const template = typeof entry === 'string' ? entry : pluralForm(entry, current, vars.count ?? 0);
  return fill(template, vars);
}

// Обгортка, щоб ключ рівня не збирався рядком у п'яти місцях.
export function levelName(level) {
  return t(`level.${level}.name`);
}

// Десятковий роздільник теж залежить від мови: 1.5 англійською, 1,5
// українською та іспанською. Власна заміна точки на кому знала б лише про
// одну мову.
export function formatNumber(value, digits) {
  return new Intl.NumberFormat(current, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
