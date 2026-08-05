import { computeMetrics } from '../src/analytics/metrics.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

// Дні будуються локальним конструктором, а не UTC: метрики ріжуть історію за
// календарними днями машини, і тест має говорити тією самою мовою.
const day = (offsetDays, hour = 12, minute = 0) =>
  new Date(2026, 6, 20 + offsetDays, hour, minute).getTime();

const tasks = [
  { id: 'L1-01', level: 1, title: 'Перше', topic: ['select', 'where'] },
  { id: 'L1-02', level: 1, title: 'Друге', topic: ['select', 'order-by'] },
  { id: 'L1-03', level: 1, title: 'Третє', topic: ['where'] },
  { id: 'L2-01', level: 2, title: 'Четверте', topic: ['group-by'] },
];

// --- Зведення ---

const summary = computeMetrics({
  tasks,
  statuses: { 'L1-01': 'solved', 'L1-02': 'revealed' },
  events: [
    { t: day(8, 10), id: 'L1-01', k: 'open' },
    { t: day(9, 10), id: 'L1-02', k: 'open' },
    { t: day(9, 11), id: 'L1-02', k: 'attempt', r: 'data-mismatch' },
  ],
}).summary;

check("розв'язане рахується зі статусів", summary.solved === 1);
check("підглянуте не рахується розв'язаним", summary.solved === 1);
check('загальна кількість — з банку', summary.total === 4);
check('днів активності — два', summary.activeDays === 2);

// --- Остання активність ---

const activity = computeMetrics({
  tasks,
  statuses: {},
  events: [
    { t: day(8, 10), id: 'L1-01', k: 'open' },
    { t: day(9, 10), id: 'L2-01', k: 'attempt', r: 'data-mismatch' },
  ],
}).lastActivity;

check('остання активність — найпізніша подія', activity.taskId === 'L2-01');
check('остання активність знає рівень', activity.level === 2);
check('остання активність знає позицію в рівні', activity.index === 0);
check('остання активність несе назву завдання', activity.title === 'Четверте');

check(
  'події не в порядку не збивають останню активність',
  computeMetrics({
    tasks,
    statuses: {},
    events: [
      { t: day(9, 10), id: 'L2-01', k: 'open' },
      { t: day(8, 10), id: 'L1-01', k: 'open' },
    ],
  }).lastActivity.taskId === 'L2-01'
);
check(
  'подія про зникле завдання пропускається',
  computeMetrics({
    tasks,
    statuses: {},
    events: [
      { t: day(8, 10), id: 'L1-01', k: 'open' },
      { t: day(9, 10), id: 'L9-99', k: 'open' },
    ],
  }).lastActivity.taskId === 'L1-01'
);
check(
  'без журналу останньої активності немає',
  computeMetrics({ tasks, statuses: {}, events: [] }).lastActivity === null
);

// --- Освоєні навички ---

const mastered = (statuses) => computeMetrics({ tasks, statuses, events: [] }).masteredSkills;

check("без розв'язаних навичок немає", mastered({}).length === 0);
check("частково розв'язана тема не освоєна", mastered({ 'L1-01': 'solved' }).length === 0);
check(
  "тема освоєна, коли розв'язані всі її завдання",
  mastered({ 'L1-01': 'solved', 'L1-03': 'solved' })[0].topics.join(',') === 'WHERE'
);
check(
  'підглянуте завдання тему не закриває',
  mastered({ 'L1-01': 'solved', 'L1-03': 'revealed' }).length === 0
);
check(
  'навички згруповані за рівнями',
  mastered({ 'L1-01': 'solved', 'L1-03': 'solved', 'L2-01': 'solved' })
    .map((g) => g.level)
    .join(',') === '1,2'
);
check(
  'назва теми виводиться великими літерами',
  mastered({ 'L2-01': 'solved' })[0].topics[0] === 'GROUP BY'
);

// --- Типові помилки ---

const fail = (id, count, minute = 0) =>
  Array.from({ length: count }, (_, i) => ({
    t: day(9, 10, minute + i),
    id,
    k: 'attempt',
    r: 'data-mismatch',
  }));

const errorMetrics = computeMetrics({
  tasks,
  statuses: { 'L1-01': 'solved' },
  events: [...fail('L1-01', 5), ...fail('L1-03', 2, 10), ...fail('L2-01', 4, 20)],
});

check('теми відсортовані за кількістю помилок', errorMetrics.errorTopics[0].label === 'WHERE');
check('кількість помилок теми — сума по завданнях', errorMetrics.errorTopics[0].fails === 7);
check(
  'середнє рахується на завдання, яких торкалися',
  errorMetrics.errorTopics[0].failsPerTask === 3.5
);
check(
  'тема без помилок у список не потрапляє',
  !errorMetrics.errorTopics.some((t) => t.label === 'ORDER BY')
);
check('тем не більше пʼяти', errorMetrics.errorTopics.length <= 5);
check(
  'потренувати веде до першого нерозвʼязаного завдання теми',
  errorMetrics.errorTopics[0].practice.index === 2
);
check(
  'коли всі завдання теми розвʼязані, веде до найпроблемнішого',
  computeMetrics({
    tasks,
    statuses: { 'L1-01': 'solved', 'L1-03': 'solved' },
    events: [...fail('L1-01', 5), ...fail('L1-03', 2, 10)],
  }).errorTopics[0].practice.index === 0
);

// --- Найважчі завдання ---

check('найважчі завдання лишилися', errorMetrics.hardTasks[0].id === 'L1-01');
check('кількість невдач збережена', errorMetrics.hardTasks[0].fails === 5);
check('статус береться зі станів', errorMetrics.hardTasks[0].status === 'solved');
check(
  'завдання без статусу вважається непройденим',
  errorMetrics.hardTasks.find((t) => t.id === 'L1-03').status === 'new'
);

console.log(
  failures === 0 ? '\nУсі перевірки метрик пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
