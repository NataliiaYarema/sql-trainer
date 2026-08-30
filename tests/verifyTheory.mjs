import tasks, { LEVELS, LEVEL_NAMES } from '../src/tasks/index.js';
import topics, { topicByLevel, topicKeywords } from '../src/theory/topics.js';
import { escapeHtml } from '../src/utils/dom.js';
import { theoryListHtml } from '../src/ui/theoryList.js';
import { theoryTopicHtml } from '../src/ui/theoryTopic.js';
import { highlightSql } from '../src/ui/sqlHighlight.js';
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

// --- склад блоку -----------------------------------------------------------

check('тем стільки ж, скільки рівнів практики', topics.length === LEVELS.length);
check(
  'кожна тема прив’язана до наявного рівня',
  topics.map((t) => t.level).join() === LEVELS.join()
);
check(
  'назва теми збігається з назвою рівня',
  topics.every((t) => t.title === LEVEL_NAMES[t.level])
);
// Опціональний доступ (?.) тут навмисний: якщо для рівня немає теми,
// topicByLevel поверне undefined, і без ?. читання .level впало б винятком
// TypeError, зупинивши весь скрипт — решта перевірок теорії просто не
// виконалася б. З ?. відсутня тема дає зрозумілий FAIL і скрипт іде далі.
check(
  'topicByLevel знаходить тему свого рівня',
  LEVELS.every((level) => topicByLevel(level)?.level === level)
);
check('невідомий рівень не має теми', topicByLevel(99) === undefined);

check(
  'кожна тема має пояснення',
  topics.every((t) => typeof t.summary === 'string' && t.summary.trim().length > 40)
);
check(
  'у теми або приклади, або кейси — рівно одне з двох',
  topics.every((t) => Boolean(t.examples) !== Boolean(t.cases))
);
check(
  'у кожної теми 4–7 прикладів або 4–7 кейсів',
  topics.every((t) => {
    const items = t.examples ?? t.cases;
    return items.length >= 4 && items.length <= 7;
  })
);
check(
  'кожен приклад має підпис, SQL і опис результату',
  topics
    .filter((t) => t.examples)
    .every((t) => t.examples.every((e) => e.label?.trim() && e.sql?.trim() && e.result?.trim()))
);
check(
  'кожен кейс має повну форму',
  topics
    .filter((t) => t.cases)
    .every((t) =>
      t.cases.every(
        (c) =>
          c.title?.trim() &&
          c.about?.trim() &&
          c.whenNeeded?.trim() &&
          c.question?.trim() &&
          c.sql?.trim() &&
          c.reading?.trim() &&
          Array.isArray(c.steps) &&
          c.steps.length > 0 &&
          Array.isArray(c.result?.columns) &&
          Array.isArray(c.result?.values)
      )
    )
);
// Кейс показує один запит — правильний. Поля хибного запиту прибрані свідомо,
// тож їхні залишки в даних означали б недоведений до кінця перенос.
check(
  'у кейсі не лишилося полів хибного запиту',
  topics.filter((t) => t.cases).every((t) => t.cases.every((c) => !c.wrong && !c.right))
);
check(
  'кожен кейс каже, на що звернути увагу',
  topics
    .filter((t) => t.cases)
    .every((t) =>
      t.cases.every(
        (c) =>
          Array.isArray(c.watchOut) &&
          c.watchOut.length >= 2 &&
          c.watchOut.every((w) => typeof w === 'string' && w.trim().length > 40)
      )
    )
);
// Застереження — це текст, а не другий запит. Урок хибного підходу переказано
// словами навмисно: показувати хибний SQL поруч із правильним ми перестали.
check(
  'застереження кейса не містять SQL-запиту',
  topics
    .filter((t) => t.cases)
    .every((t) => t.cases.every((c) => (c.watchOut ?? []).every((w) => !/\bSELECT\b/.test(w))))
);
check(
  'у кожної теми 3–8 типових помилок',
  topics.every((t) => t.pitfalls.length >= 3 && t.pitfalls.length <= 8)
);
check(
  'кожна типова помилка має заголовок і пояснення',
  topics.every((t) => t.pitfalls.every((p) => p.title && p.text))
);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isValidSummaryBlock = (b) =>
  isNonEmptyString(b) || (Array.isArray(b) && b.length > 0 && b.every(isNonEmptyString));
check(
  'якщо в темі є summaryBlocks — це непорожній масив валідних блоків',
  topics.every(
    (t) =>
      t.summaryBlocks === undefined ||
      (Array.isArray(t.summaryBlocks) &&
        t.summaryBlocks.length > 0 &&
        t.summaryBlocks.every(isValidSummaryBlock))
  )
);
check(
  'кожна тема має структурований вступ через summaryBlocks',
  topics.every((t) => Array.isArray(t.summaryBlocks))
);
// Рівень 6 складається з двох різних половин (дати й рядки), і кожна половина
// має власний список — інакше вступ читався б як один суцільний перелік.
//
// Рівень 7 теж двоскладовий (умовна логіка й операції з множинами), але його
// половини розділені інакше: умовну логіку розписано абзацами, бо CASE,
// COALESCE і NULLIF потребують пояснення в кілька речень кожен, а пункт списку
// такого не витримує. Список лишився там, де він природний, — чотири операції
// з множинами, які саме й читаються як перелік. Тому вимога тут мʼякша:
// щонайменше один список.
check(
  'тема рівня 6 має два окремі списки в summaryBlocks',
  (topicByLevel(6)?.summaryBlocks ?? []).filter((b) => Array.isArray(b)).length >= 2
);
check(
  'тема рівня 7 має список операцій з множинами',
  (topicByLevel(7)?.summaryBlocks ?? []).filter((b) => Array.isArray(b)).length >= 1
);

// --- ключові конструкції в назві теми --------------------------------------

check(
  'кожна тема перелічує свої конструкції',
  topics.every((t) => Array.isArray(t.keywords) && t.keywords.length >= 4)
);
check(
  'перелік конструкцій — це keywords через кому',
  topics.every((t) => topicKeywords(t) === t.keywords.join(', '))
);

// Перелік має описувати саме те, що в темі, а не бути окремим списком, який
// живе своїм життям: кожна названа конструкція має трапитися в її текстах.
const topicText = (t) =>
  [
    t.summary,
    ...(t.summaryBlocks ?? []).flatMap((b) => (Array.isArray(b) ? b : [b])),
    ...(t.examples ?? []).map((e) => `${e.label} ${e.sql} ${e.result}`),
    ...(t.cases ?? []).map(
      (c) =>
        `${c.title} ${c.about} ${c.whenNeeded} ${c.question} ` +
        `${c.sql} ${c.steps.join(' ')} ${c.reading}`
    ),
    ...t.pitfalls.map((p) => `${p.title} ${p.text} ${p.wrongSql ?? ''} ${p.rightSql ?? ''}`),
    ...(t.tips ?? []).map((tip) => `${tip.text} ${tip.sql ?? ''}`),
  ].join(' ');
check(
  'кожна названа конструкція справді розглядається в темі',
  topics.every((t) => t.keywords.every((k) => topicText(t).includes(k)))
);

// Згадки в тексті мало: конструкцію, винесену в назву теми, користувач має
// побачити в роботі. Перевірка суворіша за попередню й дивиться лише в SQL
// прикладів та кейсів.
//
// Тема 8 сюди не входить: у неї є subtitle, тож у назві стоять не конструкції,
// а поняття («когорти», «воронки», «LTV»), і вимагати їх у тексті запиту
// означало б вимагати коментаря з потрібним словом.
const demoSql = (t) => [...(t.examples ?? []), ...(t.cases ?? [])].map((b) => b.sql).join(' ');
const namedTopics = topics.filter((t) => !t.subtitle);
namedTopics.forEach((t) => {
  const missing = t.keywords.filter((k) => !demoSql(t).includes(k));
  check(
    `рівень ${t.level}: кожна конструкція з назви має приклад${
      missing.length ? ' — немає: ' + missing.join(', ') : ''
    }`,
    missing.length === 0
  );
});

// --- форматування прикладів ------------------------------------------------

const allExamples = topics.flatMap((t) =>
  (t.examples ?? []).map((e, i) => ({ name: `рівень ${t.level}, приклад ${i + 1}`, sql: e.sql }))
);
const allCaseSql = topics.flatMap((t) =>
  (t.cases ?? []).map((c, i) => ({ name: `рівень ${t.level}, кейс ${i + 1}`, sql: c.sql }))
);
const allSnippetSql = topics.flatMap((t) => [
  ...t.pitfalls.flatMap((p, i) =>
    [p.wrongSql, p.rightSql].filter(Boolean).map((sql) => ({
      name: `рівень ${t.level}, пастка ${i + 1}`,
      sql,
    }))
  ),
  ...(t.tips ?? [])
    .filter((tip) => tip.sql)
    .map((tip, i) => ({ name: `рівень ${t.level}, порада ${i + 1}`, sql: tip.sql })),
]);
checkSqlFormatting(
  [...allExamples, ...allCaseSql, ...allSnippetSql],
  check,
  'приклади записані як робочий SQL'
);
// Кнопка «Виконати запит» кидає приклад і кейс у пісочницю, а там запит
// проходить той самий захист «лише SELECT / WITH», що й у завданнях. Слово
// з переліку забороненого означає приклад, який покаже помилку замість
// результату. Пастки й поради під це не підпадають: їх не виконують.
const guardHits = [...allExamples, ...allCaseSql]
  .map(({ name, sql }) => ({ name, word: forbiddenStatementIn(sql) }))
  .filter((item) => item.word);
for (const hit of guardHits) {
  console.error(`     ${hit.name}: SQL містить «${hit.word}»`);
}
check('приклади й кейси не спотикаються об захист «лише SELECT»', guardHits.length === 0);

check(
  'аргументи секцій мають відступ',
  topics.every((t) => (t.examples ?? []).every((e) => /^ {2,}\S/m.test(e.sql)))
);

// --- приклади мають реально працювати --------------------------------------

for (const topic of topics) {
  for (const [i, example] of (topic.examples ?? []).entries()) {
    let rows = 0;
    try {
      const result = await runQuery(topic.setupSql, example.sql);
      rows = result.values.length;
    } catch (err) {
      console.error(`     ${err.message}`);
    }
    check(`рівень ${topic.level}, приклад ${i + 1} повертає рядки`, rows > 0);
  }
}

// --- кейси мають давати записані результати ---------------------------------

// Кейси статичні в інтерфейсі — користувач їх не виконує. Але записані в них
// числа мусять відповідати даним, інакше теорія розійдеться з практикою
// мовчки. За під-етап B5 двічі траплялося, що «виміряне» число виявлялося
// вигаданим, і ловила це лише рецензія людини.
const sameResult = (a, b) =>
  a.columns.join() === b.columns.join() && JSON.stringify(a.values) === JSON.stringify(b.values);

for (const topic of topics.filter((t) => t.cases)) {
  for (const [i, item] of topic.cases.entries()) {
    const label = `рівень ${topic.level}, кейс ${i + 1}`;

    let ok = false;
    try {
      const actual = await runQuery(topic.setupSql, item.sql);
      ok = sameResult(actual, item.result);
      if (!ok) {
        console.error(`     фактично: ${JSON.stringify(actual)}`);
        console.error(`     записано: ${JSON.stringify(item.result)}`);
      }
    } catch (err) {
      console.error(`     ${err.message}`);
    }
    check(`${label}: запит дає записаний результат`, ok);
  }
}

await closeAll();

// --- приклади не дублюють завдання -----------------------------------------

const normalize = (sql) => sql.toLowerCase().replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();

const taskSql = new Set(tasks.map((t) => normalize(t.referenceSql)));
check(
  'жоден приклад теорії не повторює еталонний запит завдання',
  topics.every(
    (t) =>
      (t.examples ?? []).every((e) => !taskSql.has(normalize(e.sql))) &&
      (t.cases ?? []).every((c) => !taskSql.has(normalize(c.sql)))
  )
);

// --- розмітка списку тем ---------------------------------------------------

const listHtml = theoryListHtml(topics);
check('список показує всі теми', (listHtml.match(/data-theory="/g) ?? []).length === topics.length);
check(
  'список називає кожну тему',
  topics.every((t) => listHtml.includes(escapeHtml(t.title)))
);
check('тема веде на свій рівень', listHtml.includes(`data-theory="${LEVELS.at(-1)}"`));
// Тема з підзаголовком показує його, решта — перелік конструкцій. Саме тому
// тут не можна вимагати keywords від усіх: тема 8 їх свідомо не показує.
check(
  'список показує конструкції кожної теми або її підзаголовок',
  topics.every((t) => listHtml.includes(escapeHtml(t.subtitle ?? topicKeywords(t))))
);
check(
  'у списку конструкції відділені від назви власним стилем',
  (listHtml.match(/theory-item__keywords/g) ?? []).length === topics.length
);
check('список не пояснює, що таке теорія', !listHtml.includes('theory-list__hint'));

// --- розмітка екрана теми --------------------------------------------------

const topic = topicByLevel(2);
const topicHtml = theoryTopicHtml(topic);
check('екран теми показує назву', topicHtml.includes(escapeHtml(topic.title)));
check('екран теми показує конструкції теми', topicHtml.includes(escapeHtml(topicKeywords(topic))));
check(
  'на екрані теми конструкції відділені від назви власним стилем',
  topicHtml.includes('theory-topic__keywords')
);
check('екран теми показує пояснення', topicHtml.includes(escapeHtml(topic.summary)));
check(
  'екран теми показує SQL усіх прикладів',
  topic.examples.every((e) => topicHtml.includes(highlightSql(e.sql)))
);
check('SQL на екрані теми підсвічено', topicHtml.includes('class="sql-keyword"'));
check(
  'екран теми пояснює результат кожного прикладу',
  topic.examples.every((e) => topicHtml.includes(escapeHtml(e.result)))
);
check(
  'екран теми перелічує типові помилки',
  topic.pitfalls.every((p) => topicHtml.includes(escapeHtml(p.title)))
);
// Кнопка «Виконати запит» біля кожного прикладу. SQL передається індексом
// блоку, а не текстом в атрибуті: інакше запит довелося б екранувати в HTML
// і розбирати назад, а індекс однозначно вказує на місце в темі.
check(
  'кожен приклад має кнопку виконання',
  (topicHtml.match(/data-action="run-example"/g) ?? []).length === topic.examples.length
);
check(
  'кнопка виконання знає свій приклад',
  topic.examples.every((_, i) => topicHtml.includes(`data-example-index="${i}"`))
);
check('кнопка виконання підписана', topicHtml.includes('Виконати запит'));

// Кейси рівня 8 показують SQL так само, тому кнопка потрібна й там.
const caseTopic = topicByLevel(8);
const caseTopicHtml = theoryTopicHtml(caseTopic);
check(
  'кожен кейс має кнопку виконання',
  (caseTopicHtml.match(/data-action="run-case"/g) ?? []).length === caseTopic.cases.length
);
check(
  'кнопка виконання знає свій кейс',
  caseTopic.cases.every((_, i) => caseTopicHtml.includes(`data-case-index="${i}"`))
);

check('екран теми веде до практики', topicHtml.includes('data-action="to-practice"'));
check('екран теми веде на головну', topicHtml.includes('data-action="to-home"'));
check('екран теми називає вихід «На головну»', topicHtml.includes('На головну'));
check('екран теми називає рівень практики', topicHtml.includes(`Рівень ${topic.level}`));

// Усі реальні теми мають summaryBlocks, тому негативний контроль — синтетична
// тема без цього поля: розмітка не повинна містити ні порожнього переліку,
// ні порожньої примітки.
const topicWithoutSummaryBlocks = { ...topic };
delete topicWithoutSummaryBlocks.summaryBlocks;
const topicWithoutSummaryBlocksHtml = theoryTopicHtml(topicWithoutSummaryBlocks);
check(
  'тема без summaryBlocks не показує порожній список',
  !topicWithoutSummaryBlocksHtml.includes('theory-topic__points')
);
check(
  'тема без summaryBlocks не показує порожню примітку',
  !topicWithoutSummaryBlocksHtml.includes('theory-topic__note')
);

// Три блоки поспіль (список, абзац-перехід, ще список) — саме такий патерн
// потрібен темам рівнів 6 і 7, де вступ складається з двох половин.
const topicWithSummaryExtras = {
  ...topic,
  summaryBlocks: [
    ['Перший пункт першого переліку.', 'Другий пункт першого переліку.'],
    'Перехідний абзац між двома переліками.',
    ['Пункт другого переліку.'],
  ],
};
const extrasHtml = theoryTopicHtml(topicWithSummaryExtras);
check(
  'екран теми показує кожен пункт кожного списку summaryBlocks',
  topicWithSummaryExtras.summaryBlocks
    .flatMap((b) => (Array.isArray(b) ? b : []))
    .every((p) => extrasHtml.includes(escapeHtml(p)))
);
check(
  'екран теми показує кожен абзац summaryBlocks',
  topicWithSummaryExtras.summaryBlocks
    .filter((b) => typeof b === 'string')
    .every((p) => extrasHtml.includes(escapeHtml(p)))
);
check(
  'кожен список summaryBlocks має власний стиль',
  (extrasHtml.match(/theory-topic__points/g) ?? []).length === 2
);
check(
  'кожен абзац summaryBlocks має власний стиль',
  (extrasHtml.match(/theory-topic__note/g) ?? []).length === 1
);

// --- кейси: форма й розмітка ------------------------------------------------

// Кейс перевіряється на синтетичному обʼєкті, а не на темі 8: так тест
// описує форму кейса сам по собі й не завалиться від правки контенту.
const sampleCase = {
  title: 'Синтетичний кейс',
  about: 'Про що цей кейс',
  whenNeeded: 'Коли він потрібен',
  question: 'Бізнес-питання прямою мовою',
  sql: 'SELECT 2;',
  steps: ['Крок 1: перший', 'Крок 2: другий'],
  result: { columns: ['n'], values: [[2]] },
  reading: 'Що з цього видно',
  watchOut: ['Перше застереження', 'Друге застереження'],
};

const caseHtml = theoryTopicHtml({ ...topicByLevel(2), cases: [sampleCase] });

check('екран теми показує назву кейса', caseHtml.includes(escapeHtml(sampleCase.title)));
check(
  'екран теми показує «про що», «коли потрібен» і бізнес-питання',
  [sampleCase.about, sampleCase.whenNeeded, sampleCase.question].every((t) =>
    caseHtml.includes(escapeHtml(t))
  )
);
check('екран теми показує запит кейса', caseHtml.includes(highlightSql(sampleCase.sql)));
check(
  'екран теми перелічує кроки запиту',
  sampleCase.steps.every((s) => caseHtml.includes(escapeHtml(s)))
);
check('екран теми показує висновок кейса', caseHtml.includes(escapeHtml(sampleCase.reading)));
check(
  'екран теми показує, на що звернути увагу',
  sampleCase.watchOut.every((w) => caseHtml.includes(escapeHtml(w)))
);
check(
  'екран теми показує таблицю результату кейса',
  (caseHtml.match(/result-table/g) ?? []).length === 1
);
// Негативний контроль: блоків «помилка / правильно» більше не існує ніде.
check(
  'кейс не має блоку хибного запиту',
  !caseHtml.includes('case-block--wrong') && !caseHtml.includes('case-block--right')
);
// Негативний контроль: тема без кейсів не має отримати порожніх блоків.
const plainHtml = theoryTopicHtml(topicByLevel(2));
check('тема без кейсів не показує блоків кейса', !plainHtml.includes('theory-cases'));

// --- підзаголовок теми ------------------------------------------------------

const subtitled = { ...topicByLevel(2), subtitle: 'когорти, воронки, LTV' };

check(
  'екран теми показує підзаголовок замість конструкцій',
  theoryTopicHtml(subtitled).includes(escapeHtml(subtitled.subtitle)) &&
    !theoryTopicHtml(subtitled).includes(escapeHtml(topicKeywords(subtitled)))
);
check(
  'список тем показує підзаголовок замість конструкцій',
  theoryListHtml([subtitled]).includes(escapeHtml(subtitled.subtitle)) &&
    !theoryListHtml([subtitled]).includes(escapeHtml(topicKeywords(subtitled)))
);
check(
  'тема без підзаголовка й далі показує конструкції',
  theoryTopicHtml(topicByLevel(2)).includes(escapeHtml(topicKeywords(topicByLevel(2))))
);

// --- вставки в пастках і поради ---------------------------------------------

const pitfallSample = {
  ...topicByLevel(2),
  pitfalls: [
    {
      title: 'Пастка зі вставками',
      text: 'Пояснення пастки',
      wrongSql: 'SELECT COUNT(*) FROM app_events;',
      rightSql: 'SELECT COUNT(DISTINCT user_id) FROM app_events;',
    },
  ],
  tips: [
    { text: 'Порада без запиту' },
    { text: 'Порада із запитом', sql: 'WITH step1 AS (SELECT 1)\nSELECT * FROM step1;' },
  ],
};
const tipsHtml = theoryTopicHtml(pitfallSample);

check(
  'пастка показує обидві вставки SQL',
  tipsHtml.includes(highlightSql(pitfallSample.pitfalls[0].wrongSql)) &&
    tipsHtml.includes(highlightSql(pitfallSample.pitfalls[0].rightSql))
);
check(
  'екран теми показує всі поради',
  pitfallSample.tips.every((t) => tipsHtml.includes(escapeHtml(t.text)))
);
check('порада може містити запит', tipsHtml.includes(highlightSql(pitfallSample.tips[1].sql)));
check(
  'тема без порад не показує порожнього розділу',
  !theoryTopicHtml(topicByLevel(2)).includes('theory-tips')
);

console.log(
  failures === 0 ? '\nУсі перевірки теорії пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
