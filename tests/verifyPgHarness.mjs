// Harness тримає бази в кеші, і без обмеження їх стає стільки, скільки різних
// setupSql у банку. Один інстанс PGlite коштує ~260 МБ (виміряно), тож на 23
// комбінаціях прогін підходив до 2,8 ГБ і одного разу впав із
// «Array buffer allocation failed». Ці перевірки стережуть саме межу.
import { runQuery, closeAll, openDatabaseCount, CACHE_LIMIT } from './pgHarness.mjs';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const setupA = 'CREATE TABLE a (n INTEGER); INSERT INTO a (n) VALUES (1), (2);';
const setupB = 'CREATE TABLE b (n INTEGER); INSERT INTO b (n) VALUES (3);';
const setupC = 'CREATE TABLE c (n INTEGER); INSERT INTO c (n) VALUES (4), (5), (6);';
const setupD = 'CREATE TABLE d (n INTEGER); INSERT INTO d (n) VALUES (7);';

check('ліміт кешу додатний', Number.isInteger(CACHE_LIMIT) && CACHE_LIMIT >= 1);

const first = await runQuery(setupA, 'SELECT COUNT(*) AS n FROM a;');
check('перший запит працює', first.values[0][0] === 2);
check('після одного setupSql відкрита одна база', openDatabaseCount() === 1);

// Просимо більше різних баз, ніж дозволяє ліміт.
const setups = [setupA, setupB, setupC, setupD];
let overLimit = false;
for (const setupSql of setups) {
  await runQuery(setupSql, 'SELECT 1 AS one;');
  if (openDatabaseCount() > CACHE_LIMIT) overLimit = true;
}
check('кількість відкритих баз не перевищує ліміт', !overLimit);
check('після чотирьох різних setupSql баз не більше ліміту', openDatabaseCount() <= CACHE_LIMIT);

// Витіснена база мусить відновлюватися з тими самими даними, а не приходити
// порожньою чи з чужими таблицями: саме тут ховалася б найгірша помилка.
const again = await runQuery(setupA, 'SELECT COUNT(*) AS n FROM a;');
check('витіснена база відновлюється з тими самими даними', again.values[0][0] === 2);

// А таблиця з іншої комбінації не мусить бути видною — інакше кеш склеїв би
// бази й перевірка «завдання користується лише оголошеними таблицями» померла б.
let leaked = false;
try {
  await runQuery(setupA, 'SELECT COUNT(*) FROM b;');
  leaked = true;
} catch {
  // Очікувано: у базі setupA таблиці b немає. Порожній catch тут і є
  // очікуваним результатом, тому leaked лишається false.
}
check('чужа таблиця не видна після витіснення', !leaked);

await closeAll();
check('closeAll закриває все', openDatabaseCount() === 0);

console.log(
  failures === 0 ? '\nУсі перевірки harness пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
