import { PGlite } from '@electric-sql/pglite';
import { toResult } from '../src/db/pgResult.js';

// Свіжий інстанс PGlite коштує ~850 мс — на 125 завданнях (95 було
// на рівнях 1-6, рівень 7 додав ще 15: тринадцять нових і два, що вже
// лежали в level7.js, але були невидимі банку, поки файл не підключили
// в index.js; рівень 8 додав ще 15) це перетворило б npm test на кілька
// хвилин. Тому базу кешуємо за текстом setupSql: різних комбінацій
// таблиць у банку всього вісімнадцять.
//
// Одна база на завдання все одно була б зайвою, але одна база на весь банк —
// вже небезпечна: тоді б ніщо не ловило завдання, чий еталонний запит
// звертається до таблиці, якої користувачу не показали в schemaDescription.
// Кешування саме за setupSql зберігає цю перевірку й лишається швидким.
//
// Кеш обмежений, і це не мікрооптимізація. Виміряно: один інстанс PGlite
// коштує ~260 МБ, тож усі комбінації живими давали 2,8 ГБ, і прогін
// одного разу впав із «Array buffer allocation failed». Виміряно й друге:
// після close() зі скиданням посилання памʼять справді повертається
// (1265 МБ із 1610 МБ), а шість баз послідовно, по одній живій, дають
// нульовий приріст. Тому ліміт розвʼязує проблему повністю.
//
// Ліміт саме 2, а не 1: запас на випадок, коли викликач чергує дві
// комбінації поспіль. Платити за нього доводиться лише памʼяттю однієї бази.
//
// Двадцять чотири — це вісімнадцять комбінацій у банку завдань і вісім у
// прикладах теорії, дві з них спільні з банком (одна давня, друга —
// ANALYTICS_SQL рівня 8). Комбінація з tests/verifyAnalytics.mjs
// (PRODUCTS_SQL + ANALYTICS_SQL) окремою не рахується: рівень 8 завів у
// банку завдання з тим самим setupSql, тож вона вже серед вісімнадцяти.
export const CACHE_LIMIT = 2;

// Map зберігає порядок вставляння, тому сам по собі є чергою: найдавніша
// база — перша, і саме її витісняємо.
const databases = new Map();

async function evictOldest() {
  const oldest = databases.keys().next().value;
  const promise = databases.get(oldest);
  databases.delete(oldest);
  const db = await promise;
  await db.close();
}

async function getDb(setupSql) {
  const cached = databases.get(setupSql);
  if (cached) {
    // Перевставляння пересуває базу в кінець черги — так витісняється саме
    // та, якою давно не користувалися, а не та, яку створили першою.
    databases.delete(setupSql);
    databases.set(setupSql, cached);
    return cached;
  }

  while (databases.size >= CACHE_LIMIT) await evictOldest();

  const created = (async () => {
    const db = new PGlite();
    await db.query("SET timezone = 'UTC'");
    await db.exec(setupSql);
    return db;
  })();
  databases.set(setupSql, created);
  return created;
}

// Потрібен tests/verifyPgHarness.mjs: без нього ліміт нічим перевірити,
// а мовчки зламаний ліміт повернув би прогін до 2,8 ГБ непомітно.
export function openDatabaseCount() {
  return databases.size;
}

export async function runQuery(setupSql, sql) {
  const db = await getDb(setupSql);
  return toResult(await db.query(sql, [], { rowMode: 'array' }));
}

export async function closeAll() {
  for (const promise of databases.values()) {
    const db = await promise;
    await db.close();
  }
  databases.clear();
}
