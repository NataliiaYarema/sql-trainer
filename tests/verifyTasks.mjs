import tasks, {
  LEVELS,
  LEVEL_PLAN,
  LEVEL_TOPICS,
  tasksByCaseStudy,
  tasksByLevel,
} from '../src/tasks/index.js';
import * as schemas from '../src/tasks/schemas.js';
import enTaskText from '../src/i18n/en/tasks/index.js';
import esTaskText from '../src/i18n/es/tasks/index.js';
import { levelName, setLanguage, LANGS } from '../src/i18n/index.js';
import { dedent } from '../src/utils/dom.js';
import { checkSqlFormatting } from './sqlFormat.mjs';
import { forbiddenStatementIn } from '../src/db/sqlGuard.js';
import { runQuery, closeAll } from './pgHarness.mjs';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const levelsInBank = [...new Set(tasks.map((t) => t.level))].sort();
check('LEVELS перелічує всі рівні з банку завдань', LEVELS.join() === levelsInBank.join());
check(
  'кожен рівень має назву в кожній мові',
  LANGS.every((lang) => {
    setLanguage(lang);
    // Порівняння з ключем не зайве: t() віддає сам ключ, коли назви немає,
    // тому перевірка «рядок і не порожній» пропустила б дірку у словнику.
    return LEVELS.every((level) => levelName(level) !== `level.${level}.name`);
  })
);
setLanguage('uk');
check(
  'tasksByLevel повертає лише завдання свого рівня',
  LEVELS.every((level) => tasksByLevel(level).every((t) => t.level === level))
);
check(
  'разом рівні покривають увесь банк завдань',
  LEVELS.reduce((sum, level) => sum + tasksByLevel(level).length, 0) === tasks.length
);
check('невідомий рівень дає порожній список', tasksByLevel(99).length === 0);
// Перевірка на наявність іде першою: без неї LEVEL_PLAN[level].total на
// неописаному рівні впав би винятком замість зрозумілого FAIL.
check(
  'кожен рівень описаний у LEVEL_PLAN',
  LEVELS.every((level) => LEVEL_PLAN[level] !== undefined)
);
check(
  'кількість завдань на рівні відповідає LEVEL_PLAN',
  LEVELS.every((level) => tasksByLevel(level).length === LEVEL_PLAN[level].total)
);
check('усі id завдань унікальні', new Set(tasks.map((t) => t.id)).size === tasks.length);
// Ловить друкарську помилку на кшталт L2-… у файлі рівня 3: після переїздів
// між рівнями такий id пройшов би непомітно, бо перевірка унікальності його
// не бачить.
check(
  'id має вигляд L<рівень>-<слаг>',
  tasks.every((t) => new RegExp(`^L${t.level}-[a-z0-9-]+$`).test(t.id))
);
check(
  'кожне завдання має тип складності',
  tasks.every((t) => ['basic', 'medium', 'complex'].includes(t.tier))
);
check(
  'склад рівня за складністю відповідає LEVEL_PLAN',
  LEVELS.every((level) => {
    const byTier = (tier) => tasksByLevel(level).filter((t) => t.tier === tier).length;
    const plan = LEVEL_PLAN[level];
    return (
      byTier('basic') === plan.basic &&
      byTier('medium') === plan.medium &&
      byTier('complex') === plan.complex
    );
  })
);
check(
  'складність не спадає всередині рівня',
  LEVELS.every((level) => {
    const order = { basic: 0, medium: 1, complex: 2 };
    const seq = tasksByLevel(level).map((t) => order[t.tier]);
    return seq.every((v, i) => i === 0 || seq[i - 1] <= v);
  })
);
check(
  'кожне завдання має 3 підказки й пояснення',
  tasks.every((t) => t.hints.length === 3 && typeof t.explanation === 'string')
);
// Перелік колонок картка показує окремим блоком «Очікувані колонки»,
// тому в тексті завдання він був би дублюванням.
check(
  'taskText не перелічує колонки повторно',
  tasks.every((t) => !/Колонк[аи]\s*:/.test(t.taskText))
);

// Два завдання з тим самим розв'язком — це не дві вправи, а одна, записана
// двічі. Нормалізуємо пробіли й крапку з комою, бо форматування різне.
const normalizeSql = (sql) => sql.toLowerCase().replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
const solutions = tasks.map((t) => normalizeSql(t.referenceSql));
check("жодні два завдання не мають однакового розв'язку", new Set(solutions).size === tasks.length);

// Однакові назви на різних рівнях збивають з пантелику на екрані нотаток,
// де завдання перелічені без прив'язки до рівня.
const titles = tasks.map((t) => t.title);
check('усі назви завдань унікальні', new Set(titles).size === tasks.length);

// Перевірки нижче ловлять биту структуру поля caseStudy: неправильний тип
// id/title/step, дірку чи повтор у нумерації кроків (два «кроки 2» або
// кейс без кроку 3), кейс, де завдання розходяться в назві. Написані вони
// наперед у B4, коли жодне завдання поля caseStudy ще не мало; рівень 8
// привіз перший кейс — conversion, кроки 1-4, — і саме на ньому ці
// перевірки тепер працюють по-справжньому, а не порожньо.
const caseTasks = tasks.filter((t) => t.caseStudy);
const caseIds = [...new Set(caseTasks.map((t) => t.caseStudy.id))];

check(
  'поле caseStudy має вигляд { id, title, step }',
  caseTasks.every(
    (t) =>
      typeof t.caseStudy.id === 'string' &&
      typeof t.caseStudy.title === 'string' &&
      Number.isInteger(t.caseStudy.step) &&
      t.caseStudy.step >= 1
  )
);
check(
  'кроки кожного кейса утворюють 1..N без дірок і повторів',
  caseIds.every((id) => {
    const steps = tasksByCaseStudy(id)
      .map((t) => t.caseStudy.step)
      .sort((a, b) => a - b);
    return steps.every((step, i) => step === i + 1);
  })
);
check(
  'усі завдання кейса мають однакову назву кейса',
  caseIds.every((id) => new Set(tasksByCaseStudy(id).map((t) => t.caseStudy.title)).size === 1)
);
check('невідомий кейс дає порожній список', tasksByCaseStudy('невідомий').length === 0);
// Дзеркало tasksByLevel(undefined) === []: caseStudy?.id === undefined істинне
// для кожного завдання БЕЗ кейса, тому без явної перевірки на undefined
// tasksByCaseStudy(undefined) мовчки повертав би весь банк.
check('tasksByCaseStudy(undefined) дає порожній список', tasksByCaseStudy(undefined).length === 0);

// Бейдж «крок 2 з 4» обіцяє послідовність, а навігація рівня йде за порядком
// у файлі банку — тому кроки кейса мають зростати саме в порядку банку, а не
// лише утворювати 1..N десь у ньому. Перевірка ловить кейс, чиї кроки
// пронумеровані правильно, але завдання в файлі банку переставлені —
// тоді бейдж показав би «крок 2 з 4» раніше «крок 1 з 4».
check(
  'кроки кожного кейса йдуть у банку за зростанням',
  caseIds.every((id) => {
    const steps = tasksByCaseStudy(id).map((t) => t.caseStudy.step);
    return steps.every((step, i) => i === 0 || steps[i - 1] < step);
  })
);

// Гарантія «завдання не звертається до таблиці, якої не показало» раніше
// трималася на pgHarness: він створював базу рівно з setupSql завдання.
// Для рівня 8 вона не працює — ANALYTICS_SQL один блок на три таблиці, тож
// завдання отримує app_users, app_events і app_purchases одразу, скільки б
// із них не було в schemaDescription. Тому перевіряємо текстом.

// Список таблиць виводимо з src/tasks/schemas.js, щоб нову таблицю неможливо
// було забути дописати: кожна константа там починається з назви таблиці й дужки.
// Явний масив міг би мовчазно застаритися й перестати ловити порушення.
const KNOWN_TABLES = Object.values(schemas).map((schemaStr) => {
  const match = schemaStr.match(/^(\w+)\(/);
  if (!match) {
    throw new Error(
      `Схема не розпочинається з назви таблиці й дужки: "${schemaStr.substring(0, 30)}…"`
    );
  }
  return match[1];
});

// Межа слова обовʼязкова: без неї таблиця, чия назва є префіксом іншої (наприклад,
// «order» для «order_id»), збігалася б усередину більшої й перевірка вважала б її
// згаданою в кожному запиті, хоча фактично йшлося про колонку. Прапорець i
// обовʼязковий так само: PostgreSQL регістронезалежний до ідентифікаторів
// без лапок, тож `FROM APP_USERS` виконається, а без i перевірка цього не побачить.
const mentions = (text, table) => new RegExp(`\\b${table}\\b`, 'i').test(text);

const undeclared = tasks.flatMap((task) =>
  KNOWN_TABLES.filter(
    (table) => mentions(task.referenceSql, table) && !mentions(task.schemaDescription, table)
  ).map((table) => `${task.id}: ${table}`)
);
for (const item of undeclared) {
  console.error(`     неоголошена таблиця — ${item}`);
}
check('кожна таблиця з referenceSql оголошена в schemaDescription', undeclared.length === 0);

check(
  'кожен рівень має перелік дозволених тем',
  LEVELS.every((level) => Array.isArray(LEVEL_TOPICS[level]))
);

// Головна перевірка проти накладок тем: тег завдання мусить належати
// своєму рівню. Без неї ніщо не заважає написати JOIN-завдання в рівні
// про групування — саме так накладки й накопичилися раніше.
const strayTags = tasks.flatMap((t) =>
  t.topic.filter((tag) => !LEVEL_TOPICS[t.level].includes(tag)).map((tag) => `${t.id}: ${tag}`)
);
for (const stray of strayTags) {
  console.error(`     чужий тег — ${stray}`);
}
check('усі теги завдань належать своєму рівню', strayTags.length === 0);

// Еталонний запит показується користувачу як розв'язок, тому тримаємо його
// в тому ж вигляді, що й приклади теорії.
checkSqlFormatting(
  tasks.map((t) => ({ name: t.id, sql: dedent(t.referenceSql) })),
  check,
  "еталонні розв'язки записані як робочий SQL"
);

// Захист «лише SELECT / WITH» бачить і еталонний запит (він виконується на
// кожній перевірці), і скелет із третьої підказки (його користувач вставляє
// в редактор). Слово з переліку забороненого всередині них означає завдання,
// яке неможливо розв'язати підказаним способом.
const guardHits = tasks.flatMap((t) => {
  const hits = [];
  const inReference = forbiddenStatementIn(t.referenceSql);
  if (inReference) hits.push(`${t.id}: referenceSql містить «${inReference}»`);
  // Дивимося лише на підказку-скелет: її користувач вставляє в редактор
  // як є. Решта підказок — проза, і назвати в них функцію словом можна.
  const skeleton = t.hints.find((hint) => /^Скелет:/.test(hint));
  const inSkeleton = skeleton && forbiddenStatementIn(skeleton);
  if (inSkeleton) hits.push(`${t.id}: скелет у підказці містить «${inSkeleton}»`);
  return hits;
});
for (const hit of guardHits) {
  console.error(`     ${hit}`);
}
check('еталони й підказки не спотикаються об захист «лише SELECT»', guardHits.length === 0);

// Обхід згрупований за setupSql, а друк — у порядку банку.
//
// Причина в памʼяті. У порядку банку setupSql перемикається 83 рази на 125
// завдань, хоча різних комбінацій лише вісімнадцять, — і кеш harness з його
// лімітом створював би ту саму базу знову й знову. Згруповано кожна база
// створюється рівно раз, і жива за раз одна: пік падає з 2,8 ГБ до ~0,5 ГБ.
//
// Порядок друку лишається банковим навмисно: коли завдання падає, шукати його
// рядок зручно там, де завдання стоїть у рівні, а не там, де випало за
// фікстурою.
const byFixture = new Map();
for (const task of tasks) {
  if (!byFixture.has(task.setupSql)) byFixture.set(task.setupSql, []);
  byFixture.get(task.setupSql).push(task);
}

const outcomes = new Map();
for (const group of byFixture.values()) {
  for (const task of group) {
    try {
      const { columns, values } = await runQuery(task.setupSql, task.referenceSql);
      if (values.length === 0) {
        outcomes.set(task.id, {
          ok: false,
          text: `FAIL ${task.id}: referenceSql повернув 0 рядків`,
        });
      } else if (columns.join() !== task.expectedOutputColumns.join()) {
        // Назви мають збігатися точно: expectedOutputColumns показуються
        // користувачу як «очікувані колонки», і розбіжність збиває з пантелику.
        outcomes.set(task.id, {
          ok: false,
          text: `FAIL ${task.id}: колонки результату [${columns.join(', ')}] не збігаються з expectedOutputColumns [${task.expectedOutputColumns.join(', ')}]`,
        });
      } else {
        outcomes.set(task.id, {
          ok: true,
          text: `OK   ${task.id} — ${values.length} рядків, колонки: ${columns.join(', ')}`,
        });
      }
    } catch (err) {
      outcomes.set(task.id, { ok: false, text: `FAIL ${task.id}: ${err.message}` });
    }
  }
}

for (const task of tasks) {
  const outcome = outcomes.get(task.id);
  if (outcome.ok) {
    console.log(outcome.text);
  } else {
    console.error(outcome.text);
    failures += 1;
  }
}

await closeAll();

// ─── Переклад завдань ───────────────────────────────────────────────────────
//
// Українська — джерело: вона лишається в src/tasks/level*.js поряд зі своїм
// referenceSql. Англійський та іспанський текст накладається поверх, тому тут
// перевіряється саме він.
const TRANSLATIONS = { en: enTaskText, es: esTaskText };

// Напівперекладений рівень — гірше за неперекладений: сім завдань англійською
// й вісім українською читаються як поломка. Переліку готових рівнів ніде не
// ведемо, правило виводиться з самих даних.
Object.entries(TRANSLATIONS).forEach(([lang, dict]) => {
  LEVELS.forEach((level) => {
    const ids = tasksByLevel(level).map((task) => task.id);
    const done = ids.filter((id) => dict[id] !== undefined).length;
    check(
      `${lang}: рівень ${level} перекладений повністю або ніяк (${done}/${ids.length})`,
      done === 0 || done === ids.length
    );
  });
});

// Ключ, якого немає в банку, — це або описка, або завдання, яке перейменували
// чи прибрали. Без цієї перевірки такий текст лежав би мертвим вантажем.
const bankIds = new Set(tasks.map((task) => task.id));
Object.entries(TRANSLATIONS).forEach(([lang, dict]) => {
  Object.keys(dict).forEach((id) => {
    check(`${lang}: ${id} існує в банку`, bankIds.has(id));
  });
});

// Повнота полів: у перекладеного завдання мусить бути все, що показує картка.
const filled = (value) => typeof value === 'string' && value.trim() !== '';
Object.entries(TRANSLATIONS).forEach(([lang, dict]) => {
  Object.entries(dict).forEach(([id, text]) => {
    check(
      `${lang}: ${id} має назву, контекст, умову й пояснення`,
      filled(text.title) &&
        filled(text.context) &&
        filled(text.taskText) &&
        filled(text.explanation)
    );
    check(
      `${lang}: ${id} має три непорожні підказки`,
      Array.isArray(text.hints) && text.hints.length === 3 && text.hints.every(filled)
    );
  });
});

// Скелет у третій підказці — це SQL, і він мовно незалежний. Перекладається
// лише слово перед двокрапкою.
const SKELETON_PREFIX = /^(Скелет|Skeleton|Plantilla):\s*/;
tasks.forEach((task) => {
  const source = task.hints[2];
  check(`${task.id}: третя підказка — скелет`, SKELETON_PREFIX.test(source));
  const sql = source.replace(SKELETON_PREFIX, '');
  Object.entries(TRANSLATIONS).forEach(([lang, dict]) => {
    const text = dict[task.id];
    if (!text) return;
    check(
      `${lang}: ${task.id} — скелет не змінився`,
      SKELETON_PREFIX.test(text.hints[2]) && text.hints[2].replace(SKELETON_PREFIX, '') === sql
    );
  });
});

// Набір SQL-конструкцій у тексті мусить бути той самий у трьох мовах: це ловить
// перекладений ключовий вислів (GROUP BY → AGRUPAR POR), чого прогін
// referenceSql не побачить ніколи — сам запит же не змінився.
//
// Регістр важливий. Шукаємо лише великими літерами, бо англійська проза рясніє
// словами in, on, as, all — і без урахування регістру тест захлинувся б у
// хибних спрацюваннях.
const SQL_WORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'HAVING',
  'ORDER BY',
  'LIMIT',
  'OFFSET',
  'DISTINCT',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL OUTER JOIN',
  'CROSS JOIN',
  'JOIN',
  'WITH',
  'UNION ALL',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'ROUND',
  'COALESCE',
  'NULLIF',
  'CAST',
  'EXTRACT',
  'DATE_TRUNC',
  'TO_CHAR',
  'AGE',
  'INTERVAL',
  'SPLIT_PART',
  'TRIM',
  'UPPER',
  'LOWER',
  'INITCAP',
  'REPLACE',
  'LENGTH',
  'CONCAT',
  'SUBSTRING',
  'POSITION',
  'LEAD',
  'LAG',
  'RANK',
  'DENSE_RANK',
  'ROW_NUMBER',
  'NTILE',
  'OVER',
  'PARTITION BY',
  'FILTER',
  'EXISTS',
  'NOT IN',
  'BETWEEN',
  'LIKE',
  'ILIKE',
  'IS NULL',
  'NULL',
  'CTE',
];

const sqlWordsIn = (text) =>
  [...new Set(SQL_WORDS.filter((word) => text.includes(word)))].sort().join(' ');

const textOf = (source) =>
  [source.title, source.context, source.taskText, ...source.hints, source.explanation].join(' ');

tasks.forEach((task) => {
  const expected = sqlWordsIn(textOf(task));
  Object.entries(TRANSLATIONS).forEach(([lang, dict]) => {
    const text = dict[task.id];
    if (!text) return;
    check(
      `${lang}: ${task.id} — ті самі конструкції SQL у тексті`,
      sqlWordsIn(textOf(text)) === expected
    );
  });
});

// Назва наскрізного кейса перекладається окремим полем, бо caseStudy.id і .step
// — структура.
tasks.forEach((task) => {
  Object.entries(TRANSLATIONS).forEach(([lang, dict]) => {
    const text = dict[task.id];
    if (!text) return;
    check(
      `${lang}: ${task.id} — назва кейса є тоді й лише тоді, коли є кейс`,
      Boolean(task.caseStudy) === Boolean(text.caseStudyTitle)
    );
  });
});

console.log(
  failures === 0
    ? `\nУсі ${tasks.length} завдань пройшли перевірку.`
    : `\n${failures} завдань з помилками.`
);
process.exit(failures === 0 ? 0 : 1);
