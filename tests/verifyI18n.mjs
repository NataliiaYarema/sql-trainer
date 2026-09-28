// Замок на паритет словників. Найтиповіша поломка i18n тиха: ключ додали в
// одну мову, і в решті інтерфейс показує англійський текст або сирий ключ.
// Очима це не видно — інтерфейс виглядає цілим, просто трьома мовами водночас.
import {
  t,
  setLanguage,
  getLanguage,
  formatNumber,
  LANGS,
  LANG_NAMES,
  DEFAULT_LANG,
} from '../src/i18n/index.js';
import en from '../src/i18n/en/ui.js';
import uk from '../src/i18n/uk/ui.js';
import es from '../src/i18n/es/ui.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const DICTS = { en, uk, es };

check('перелік мов саме такий', LANGS.join(',') === 'en,uk,es');
check('мова за замовчуванням — англійська', DEFAULT_LANG === 'en');
check(
  'кожна мова має самоназву',
  LANGS.every((lang) => typeof LANG_NAMES[lang] === 'string' && LANG_NAMES[lang] !== '')
);
check(
  'словник є для кожної мови',
  LANGS.every((lang) => DICTS[lang] !== undefined)
);

// Паритет ключів. Англійська — еталон, бо саме на неї падає підстраховка в t().
const enKeys = Object.keys(en).sort();
LANGS.filter((lang) => lang !== 'en').forEach((lang) => {
  const keys = Object.keys(DICTS[lang]).sort();
  const missing = enKeys.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !enKeys.includes(key));
  check(`${lang}: немає пропущених ключів (${missing.join(', ')})`, missing.length === 0);
  check(`${lang}: немає зайвих ключів (${extra.join(', ')})`, extra.length === 0);
});

// Порожній рядок у словнику дає порожню кнопку — це видно лише очима, тому
// ловимо тестом.
LANGS.forEach((lang) => {
  const empty = Object.entries(DICTS[lang])
    .filter(([, value]) =>
      typeof value === 'string'
        ? value.trim() === ''
        : Object.values(value).some((form) => form.trim() === '')
    )
    .map(([key]) => key);
  check(`${lang}: жодного порожнього значення (${empty.join(', ')})`, empty.length === 0);
});

// Форми множини: скільки їх потрібно, вирішує сама мова, а не ми. Українській
// треба one/few/many, англійській та іспанській — one/other.
//
// Масиви сюди не входять: це набори фраз, а не форми числа. Через це фільтр
// перевіряє саме Array.isArray, а не лише typeof === 'object' — масив у JS
// теж об'єкт, і без цього тест вимагав би від нього форму 'one'.
LANGS.forEach((lang) => {
  const rules = new Intl.PluralRules(lang);
  const needed = new Set([1, 2, 3, 5, 11, 21, 100].map((n) => rules.select(n)));
  const plurals = Object.entries(DICTS[lang]).filter(
    ([, value]) => typeof value === 'object' && !Array.isArray(value)
  );
  plurals.forEach(([key, value]) => {
    const missing = [...needed].filter((form) => value[form] === undefined);
    check(`${lang}: ${key} має всі потрібні форми (${missing.join(', ')})`, missing.length === 0);
  });
  check(`${lang}: відмінкові ключі знайдені`, plurals.length > 0);
});

// Підстановка, втрачена в одній мові, мовчки з'їдає число.
//
// Порівнюємо саме набір імен, а не кількість згадок: у відмінкового ключа
// {count} трапляється стільки разів, скільки в мови форм множини — тобто
// тричі українською й двічі англійською, і це правильно.
const placeholders = (value) =>
  [...new Set([...JSON.stringify(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]))]
    .sort()
    .join(',');

enKeys.forEach((key) => {
  LANGS.filter((lang) => lang !== 'en').forEach((lang) => {
    if (DICTS[lang][key] === undefined) return;
    check(
      `${lang}: ${key} зберігає підстановки`,
      placeholders(DICTS[lang][key]) === placeholders(en[key])
    );
  });
});

// Набір фраз, що загубив рядок в одній мові, звузив би різноманіття мовчки.
Object.entries(en)
  .filter(([, value]) => Array.isArray(value))
  .forEach(([key, value]) => {
    LANGS.filter((lang) => lang !== 'en').forEach((lang) => {
      check(
        `${lang}: ${key} має стільки ж фраз, скільки англійською`,
        Array.isArray(DICTS[lang][key]) && DICTS[lang][key].length === value.length
      );
    });
  });

// Поведінка t()
setLanguage('uk');
check('setLanguage перемикає мову', getLanguage() === 'uk');
check('t бере рядок із поточної мови', t('nav.sandbox') === uk['nav.sandbox']);
setLanguage('es');
check('t бере рядок з іспанської', t('nav.sandbox') === es['nav.sandbox']);
setLanguage('xx');
check('невідома мова падає на англійську', getLanguage() === 'en');

setLanguage('en');
check('підстановка працює', t('taskCard.counter', { current: 2, total: 4 }) === 'Task 2 of 4');
check('невідомий ключ віддає сам ключ', t('no.such.key') === 'no.such.key');
check('множина англійською: одна', t('result.rows', { count: 1 }) === '1 row');
check('множина англійською: багато', t('result.rows', { count: 5 }) === '5 rows');
setLanguage('uk');
check('множина українською: 1 рядок', t('result.rows', { count: 1 }) === '1 рядок');
check('множина українською: 3 рядки', t('result.rows', { count: 3 }) === '3 рядки');
check('множина українською: 5 рядків', t('result.rows', { count: 5 }) === '5 рядків');

// Десятковий роздільник теж мовний: 1.5 англійською, 1,5 українською.
setLanguage('en');
check('formatNumber англійською з точкою', formatNumber(1.5, 1) === '1.5');
setLanguage('uk');
check('formatNumber українською з комою', formatNumber(1.5, 1) === '1,5');
setLanguage('es');
check('formatNumber іспанською з комою', formatNumber(1.5, 1) === '1,5');

console.log(
  failures === 0 ? '\nУсі перевірки i18n пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
