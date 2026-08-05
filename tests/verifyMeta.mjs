// Перевірка розмітки, яку не видно на екрані: іконка вкладки й теги прев'ю.
// Найтиповіша поломка тут тиха — файл перейменували, картинка зникла, і
// жодної помилки в консолі немає. Тому головна перевірка не «тег присутній»,
// а «файл, на який він показує, справді існує».
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');

// Атрибути в теге можуть стояти в будь-якому порядку, тому спершу розбираємо
// кожен тег у словник, а вже потім шукаємо потрібний.
function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) result[match[1]] = match[2];
  return result;
}

const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));

function metaContent(key) {
  const tag = metaTags.find((t) => t.property === key || t.name === key);
  return tag ? tag.content : null;
}

function linkHref(rel) {
  const tag = linkTags.find((t) => t.rel === rel);
  return tag ? tag.href : null;
}

// Файл із public/ потрапляє в корінь зібраного сайту, тому href виду
// "/favicon.svg" на диску лежить у public/favicon.svg.
function publicFileExists(href) {
  const name = href.split('/').pop();
  return existsSync(fileURLToPath(new URL(`public/${name}`, root)));
}

// Іконка вкладки
const iconHref = linkHref('icon');
check('у index.html є <link rel="icon">', typeof iconHref === 'string' && iconHref !== '');
check('файл іконки існує в public/', iconHref !== null && publicFileExists(iconHref));

// Теги прев'ю. og:image мусить бути абсолютним URL: SVG месенджери не
// рендерять, а відносний шлях більшість із них не розгортає.
for (const key of ['og:title', 'og:description', 'og:image', 'og:url']) {
  const value = metaContent(key);
  check(`${key} присутній і не порожній`, typeof value === 'string' && value.trim() !== '');
}

check('twitter:card заповнено', metaContent('twitter:card') === 'summary_large_image');

const image = metaContent('og:image');
check('og:image — абсолютний URL', image !== null && image.startsWith('https://'));
// Подвійні лапки навмисно: усередині апостроф, і Prettier із singleQuote
// однаково переписав би цей рядок на них — format:check став би червоним.
check("картинка прев'ю існує в public/", image !== null && publicFileExists(image));

const url = metaContent('og:url');
check('og:url — абсолютний URL', url !== null && url.startsWith('https://'));

console.log(
  failures === 0 ? '\nУсі перевірки розмітки пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
