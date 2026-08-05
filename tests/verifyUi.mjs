import tasks, { LEVELS, LEVEL_NAMES, tasksByLevel } from '../src/tasks/index.js';
import { escapeHtml, dedent } from '../src/utils/dom.js';
import { highlightSql } from '../src/ui/sqlHighlight.js';
import { levelSelectHtml } from '../src/ui/levelSelect.js';
import { levelCompleteHtml } from '../src/ui/levelComplete.js';
import { taskNavHtml } from '../src/ui/taskNav.js';
import { controlsHtml } from '../src/ui/controls.js';
import { renderTaskCard } from '../src/ui/taskCard.js';
import { renderHints } from '../src/ui/hintPanel.js';
import { renderResultTable } from '../src/ui/resultTable.js';
import { progressHtml } from '../src/ui/progressBar.js';
import { notePanelHtml } from '../src/ui/notePanel.js';
import { notesScreenHtml } from '../src/ui/notesScreen.js';
import { sandboxControlsHtml } from '../src/ui/sandbox.js';
import { confirmDialogHtml } from '../src/ui/confirmDialog.js';
import { dashboardHtml } from '../src/ui/dashboard.js';
import { theoryTopicHtml } from '../src/ui/theoryTopic.js';
import topics from '../src/theory/topics.js';
import {
  renderSuccess,
  renderFailure,
  renderGiveUp,
  renderSqlError,
} from '../src/ui/feedbackPanel.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const fakeRoot = () => ({ innerHTML: '' });

// Завдання добираємо за формою схеми, а не за id: банк завдань змінюється,
// і тести не мають ламатися щоразу, коли завдання переставили місцями.
const schemaLines = (t) => t.schemaDescription.split('\n').filter(Boolean);
const columnsIn = (line) => line.slice(line.indexOf('(') + 1, line.lastIndexOf(')')).split(',');

const task = tasks.find((t) => schemaLines(t).length === 1);
const singleTable = schemaLines(task)[0];
const tableName = singleTable.slice(0, singleTable.indexOf('('));

const cardRoot = fakeRoot();
renderTaskCard(cardRoot, { task, index: 1, total: 4, isSolved: false });
check('картка містить заголовок завдання', cardRoot.innerHTML.includes(task.title));
check('картка містить бізнес-контекст', cardRoot.innerHTML.includes('Бізнес-контекст'));
check('картка містить назву таблиці', cardRoot.innerHTML.includes(`>${tableName}</div>`));
check(
  'кожна колонка схеми — окремий рядок',
  (cardRoot.innerHTML.match(/schema-column"/g) ?? []).length === columnsIn(singleTable).length
);
check(
  'колонка схеми показує свій тип',
  /class="schema-column__type">\w+</.test(cardRoot.innerHTML)
);
check('схема більше не виводиться одним рядком', !cardRoot.innerHTML.includes(`${tableName}(`));
check(
  'картка перелічує очікувані колонки',
  task.expectedOutputColumns.every((c) => cardRoot.innerHTML.includes(c))
);
check('картка рахує завдання в межах рівня', cardRoot.innerHTML.includes('Завдання 2 з 4'));

const twoTableRoot = fakeRoot();
const joinTask = tasks.find((t) => schemaLines(t).length === 2);
const joinColumns = schemaLines(joinTask).reduce((sum, l) => sum + columnsIn(l).length, 0);
renderTaskCard(twoTableRoot, { task: joinTask, index: 8, total: 10, isSolved: false });
check(
  'обидві таблиці JOIN-завдання відображені',
  (twoTableRoot.innerHTML.match(/schema-table__name/g) ?? []).length === 2
);
check(
  'колонки обох таблиць розібрані',
  (twoTableRoot.innerHTML.match(/schema-column"/g) ?? []).length === joinColumns
);

const complexRoot = fakeRoot();
const complexTask = tasks.find((t) => t.tier === 'complex');
renderTaskCard(complexRoot, { task: complexTask, index: 9, total: 10, isSolved: false });
check('картка позначає комплексне завдання', complexRoot.innerHTML.includes('Комплексне'));
const basicRoot = fakeRoot();
renderTaskCard(basicRoot, {
  task: tasks.find((t) => t.tier === 'basic'),
  index: 0,
  total: 10,
  isSolved: false,
});
check('базове завдання не позначається як комплексне', !basicRoot.innerHTML.includes('Комплексне'));
check('картка позначає базове завдання', basicRoot.innerHTML.includes('Базове'));
check('картка не містить emoji-префіксів', !/[\u{1F300}-\u{1FAFF}]/u.test(cardRoot.innerHTML));

// Завдань із кейсом у банку ще немає — вони приїдуть з рівнем 8. Тому картку
// перевіряємо на власноруч зібраному завданні: renderTaskCard навмисно не
// звертається до банку сам, і саме це робить таку перевірку можливою.
const caseRoot = fakeRoot();
renderTaskCard(caseRoot, {
  task: { ...task, caseStudy: { id: 'conversion', title: 'Аналіз конверсії', step: 2 } },
  index: 1,
  total: 4,
  isSolved: false,
  caseStudySteps: 4,
});
check(
  'картка показує назву кейса й номер кроку',
  caseRoot.innerHTML.includes('Аналіз конверсії') && caseRoot.innerHTML.includes('крок 2 з 4')
);
check('бейдж кейса має власний клас', caseRoot.innerHTML.includes('case-pill'));
check('звичайне завдання бейджа кейса не показує', !cardRoot.innerHTML.includes('case-pill'));

const hintRoot = fakeRoot();
renderHints(hintRoot, task.hints, 0);
check('без відкритих підказок панель порожня', hintRoot.innerHTML === '');
renderHints(hintRoot, task.hints, 2);
check('відкрито рівно 2 підказки', (hintRoot.innerHTML.match(/hint-item"/g) ?? []).length === 2);
check('перша підказка присутня', hintRoot.innerHTML.includes(task.hints[0]));
check('третя підказка прихована', !hintRoot.innerHTML.includes(task.hints[2]));

const tableRoot = fakeRoot();
renderResultTable(tableRoot, {
  columns: ['dept', 'avg'],
  values: [
    ['IT', 6700],
    ['HR', null],
  ],
});
check('таблиця містить заголовки колонок', tableRoot.innerHTML.includes('<th>dept</th>'));
check('таблиця показує NULL окремим стилем', tableRoot.innerHTML.includes('cell--null'));
check('числа отримують окремий клас', tableRoot.innerHTML.includes('cell--number'));

const levels = LEVELS.map((level) => ({
  level,
  name: LEVEL_NAMES[level],
  total: tasksByLevel(level).length,
  solved: level === 1 ? 2 : 0,
}));
const selectHtml = levelSelectHtml(levels);
check(
  'екран вибору показує всі рівні',
  (selectHtml.match(/data-level="/g) ?? []).length === LEVELS.length
);
check('картка рівня показує назву теми', selectHtml.includes('Основи вибірки'));
check(
  'картка рівня показує відсоток',
  selectHtml.includes(`${Math.round((2 / tasksByLevel(1).length) * 100)}%`)
);
check('картка рівня більше не показує дріб', !selectHtml.includes("розв'язано"));
check('екран вибору більше не має кнопки нотаток', !selectHtml.includes('data-action="notes"'));
check(
  'екран вибору більше не має кнопки прогресу',
  !selectHtml.includes('data-action="dashboard"')
);
check('картку рівня можна відрізнити для кліку', selectHtml.includes('data-level="3"'));
check('екран вибору не пояснює, що всі рівні відкриті', !selectHtml.includes('level-select__hint'));

const levelsWithNotes = levels.map((entry) => ({
  ...entry,
  noteCount: entry.level === 2 ? 3 : 0,
}));
const notedSelectHtml = levelSelectHtml(levelsWithNotes);
check('картка рівня показує кількість нотаток', notedSelectHtml.includes('Нотаток: 3'));
check(
  'рівень без нотаток не показує лічильник',
  (notedSelectHtml.match(/level-card__notes/g) ?? []).length === 1
);
check('екран вибору без даних про нотатки не ламається', !selectHtml.includes('level-card__notes'));

const doneHtml = levelCompleteHtml({ level: 3, name: LEVEL_NAMES[3], solved: 4, total: 4 });
check('екран завершення називає рівень', doneHtml.includes("Об'єднання таблиць"));
check('екран завершення показує прогрес', doneHtml.includes('4 з 4'));
check('екран завершення веде до наступного рівня', doneHtml.includes('data-action="next-level"'));
check('екран завершення веде на головну', doneHtml.includes('data-action="to-home"'));
check('екран завершення називає вихід «На головну»', doneHtml.includes('На головну'));

const lastLevelHtml = levelCompleteHtml({
  level: LEVELS.at(-1),
  name: LEVEL_NAMES[LEVELS.at(-1)],
  solved: 2,
  total: 4,
});
const doneWithSkills = levelCompleteHtml({
  level: 3,
  name: LEVEL_NAMES[3],
  solved: 4,
  total: 4,
  skills: [
    { text: 'зʼєднувати таблиці', done: true },
    { text: 'знаходити записи без відповідності', done: false },
  ],
});
check('екран завершення називає вміння', doneWithSkills.includes('Ви тепер вмієте'));
check('здобуте вміння позначене відміткою', doneWithSkills.includes('skill-item--done'));
check('нездобуте вміння теж показане', doneWithSkills.includes('знаходити записи'));
check(
  'позначене лише здобуте вміння',
  (doneWithSkills.match(/skill-item--done/g) ?? []).length === 1
);
check('без умінь блок не малюється', !doneHtml.includes('Ви тепер вмієте'));

check('на останньому рівні немає кнопки наступного', !lastLevelHtml.includes('next-level'));
check('екран завершення показує фактичний прогрес', lastLevelHtml.includes('2 з 4'));

const headerHtml = progressHtml({ levelName: "Рівень 3 · Об'єднання таблиць", showBack: true });
check('шапка більше не показує лічильник', !headerHtml.includes("розв'язано"));
check('шапка веде до дашборда', headerHtml.includes('data-action="dashboard"'));
check('шапка веде до нотаток', headerHtml.includes('data-action="notes"'));
check('шапка показує назву рівня', headerHtml.includes('Рівень 3'));
check('шапка має вихід на головну', headerHtml.includes('data-action="to-home"'));
check('верхня кнопка називається «На головну»', headerHtml.includes('На головну'));
check(
  'вихід на головну стоїть праворуч від навігації',
  headerHtml.indexOf('data-action="notes"') < headerHtml.indexOf('data-action="to-home"')
);

const homeHeader = progressHtml({});
check('на головній кнопки навігації теж є', homeHeader.includes('data-action="dashboard"'));
check('на головній виходу немає', !homeHeader.includes('data-action="to-home"'));
check('на екрані без рівня немає назви рівня', !homeHeader.includes('progress__level'));
check('шапка не показує бали', !homeHeader.includes('балів'));
check('шапка не показує серію', !homeHeader.includes('серія'));
check('шапка не показує відзнаки', !homeHeader.includes('badge-chip'));

// Теорія й нотатки — окремі екрани без назви рівня, але кнопка виходу
// нагорі має бути там само, де в режимі завдань.
const plainBackHeader = progressHtml({ showBack: true });
check('на екрані без рівня кнопка виходу є', plainBackHeader.includes('data-action="to-home"'));

// Кнопка, що веде на поточний екран, у шапці не потрібна: вона нікуди не веде.
const dashboardHeader = progressHtml({ showBack: true, active: 'dashboard' });
check(
  'на дашборді кнопки «Мій прогрес» немає',
  !dashboardHeader.includes('data-action="dashboard"')
);
check('на дашборді кнопка нотаток лишається', dashboardHeader.includes('data-action="notes"'));

const notesHeader = progressHtml({ showBack: true, active: 'notes' });
check('на нотатках кнопки «Мої нотатки» немає', !notesHeader.includes('data-action="notes"'));
check('на нотатках кнопка прогресу лишається', notesHeader.includes('data-action="dashboard"'));

check('на решті екранів обидві кнопки на місці', headerHtml.includes('data-action="dashboard"'));

const fbRoot = fakeRoot();
renderSuccess(fbRoot, { task });
check('успіх містить пояснення завдання', fbRoot.innerHTML.includes(escapeHtml(task.explanation)));
check('успіх не показує бали', !fbRoot.innerHTML.includes('балів'));
check('успіх не показує відзнаки', !fbRoot.innerHTML.includes('new-badges'));
check('успіх не розкриває еталонний SQL', !fbRoot.innerHTML.includes('solution-sql'));

renderFailure(fbRoot, { task, reason: 'Дані не збігаються.' });
check('невдача розкриває правильний запит', fbRoot.innerHTML.includes('solution-sql'));
check('невдача містить пояснення', fbRoot.innerHTML.includes('Пояснення'));
check("розв'язок підсвічено", fbRoot.innerHTML.includes('class="sql-keyword"'));
check(
  "розв'язок показано без втрати символів",
  fbRoot.innerHTML.includes(highlightSql(dedent(task.referenceSql)))
);

renderGiveUp(fbRoot, task);
check("здача показує розв'язок", fbRoot.innerHTML.includes('solution-sql'));

renderSqlError(fbRoot, 'Помилка SQL: no such column: foo');
check('SQL-помилка показується користувачу', fbRoot.innerHTML.includes('no such column'));

const navItems = [
  { index: 0, status: 'solved' },
  { index: 1, status: 'revealed' },
  { index: 2, status: 'new' },
  { index: 3, status: 'new' },
];
const navHtml = taskNavHtml(navItems, 2);
check('смужка показує всі завдання рівня', (navHtml.match(/data-index="/g) ?? []).length === 4);
check('смужка нумерує завдання з одиниці', navHtml.includes('>1</button>'));
check('смужка нумерує до останнього', navHtml.includes('>4</button>'));
check(
  'поточне завдання позначене рівно одне',
  (navHtml.match(/task-nav__item--current/g) ?? []).length === 1
);
check(
  'поточним позначене саме третє завдання',
  /data-index="2"\s+aria-current="step"/.test(navHtml)
);
check("смужка позначає розв'язане", navHtml.includes('task-nav__item--solved'));
check('смужка позначає підглянуте', navHtml.includes('task-nav__item--revealed'));
check(
  "нерозв'язане не отримує позначки статусу",
  (navHtml.match(/task-nav__item--solved|task-nav__item--revealed/g) ?? []).length === 2
);

const notedNavHtml = taskNavHtml(
  [
    { index: 0, status: 'solved', hasNote: true },
    { index: 1, status: 'new', hasNote: false },
  ],
  1
);
check('смужка позначає завдання з нотаткою', notedNavHtml.includes('task-nav__item--noted'));
check(
  'позначку нотатки отримує рівно одне завдання',
  (notedNavHtml.match(/task-nav__item--noted/g) ?? []).length === 1
);
check(
  'позначка нотатки не заміняє статус',
  /task-nav__item--solved[^"]*task-nav__item--noted/.test(notedNavHtml)
);
check(
  'смужка без даних про нотатки не ламається',
  !taskNavHtml([{ index: 0, status: 'new' }], 0).includes('task-nav__item--noted')
);

const firstControls = controlsHtml({
  hintsRevealed: 0,
  totalHints: 3,
  isFirstTask: true,
  isLastTask: false,
});
check(
  'на першому завданні кнопка "Попереднє" вимкнена',
  /data-action="prev"[^>]*disabled/.test(firstControls)
);
check(
  'кнопка переходу вперед показується без перевірки',
  firstControls.includes('data-action="next"')
);
check(
  'на не останньому завданні напис "Наступне"',
  firstControls.includes('Наступне') && !firstControls.includes('Наступне завдання')
);
check('доступна підказка не вимкнена', !/data-action="hint"[^>]*disabled/.test(firstControls));

// Обидві кнопки переходу мають лежати в одному ряду: вони загорнуті в спільну
// групу, і закривальний </div> після неї — це кінець самої групи.
const navStart = firstControls.indexOf('controls__nav');
const navGroup = firstControls.slice(navStart, firstControls.indexOf('</div>', navStart));
check(
  'кнопки переходу в одному ряду',
  navStart !== -1 &&
    navGroup.includes('data-action="prev"') &&
    navGroup.includes('data-action="next"')
);

const prevTag = firstControls.match(/<button[^>]*data-action="prev"[^>]*>/)[0];
const nextTag = firstControls.match(/<button[^>]*data-action="next"[^>]*>/)[0];
check(
  'кнопки переходу мають спільний стиль',
  prevTag.includes('btn--nav') && nextTag.includes('btn--nav')
);
check('кнопка "Попереднє" без зеленої підсвітки', !prevTag.includes('btn--next'));
check('кнопка "Наступне" лишається зеленою', nextTag.includes('btn--next'));
check('під завданням є вихід на головну', firstControls.includes('data-action="to-home"'));
check('вихід під завданням називається «На головну»', firstControls.includes('На головну'));
check(
  'вихід на головну — окремий ряд, а не частина кнопок переходу',
  !navGroup.includes('data-action="to-home"')
);

const lastControls = controlsHtml({
  hintsRevealed: 3,
  totalHints: 3,
  isFirstTask: false,
  isLastTask: true,
});
check(
  'не на першому завданні "Попереднє" активна',
  !/data-action="prev"[^>]*disabled/.test(lastControls)
);
check('на останньому завданні напис "Завершити"', lastControls.includes('Завершити'));
check(
  'коли підказки вичерпані, кнопка вимкнена',
  /data-action="hint"[^>]*disabled/.test(lastControls)
);

const emptyNote = notePanelHtml({ text: '', isOpen: false });
check('порожня нотатка згорнута', !/<details[^>]*\bopen\b/.test(emptyNote));
check('порожня нотатка не має позначки', !emptyNote.includes('note-panel__dot'));
check('панель нотатки має поле вводу', emptyNote.includes('note-panel__text'));
check('панель нотатки має кнопку вставки запиту', emptyNote.includes('data-action="insert-query"'));

const filledNote = notePanelHtml({ text: '1 < 2 & "лапки"', isOpen: true });
check('нотатка розгортається', /<details[^>]*\bopen\b/.test(filledNote));
check('нотатка показує збережений текст', filledNote.includes('1 &lt; 2 &amp; &quot;лапки&quot;'));
check('нотатка не вставляє сирий HTML', !filledNote.includes('1 < 2 & "лапки"'));
check('непорожня нотатка має позначку', filledNote.includes('note-panel__dot'));

const noteEntries = [
  {
    taskId: 'L1-01',
    level: 1,
    levelName: 'Основи вибірки',
    index: 0,
    title: 'Перше завдання',
    context: 'Контекст першого',
    taskText: 'Умова першого',
    note: 'моя думка',
  },
  {
    taskId: 'L1-04',
    level: 1,
    levelName: 'Основи вибірки',
    index: 3,
    title: 'Четверте завдання',
    context: 'Контекст четвертого',
    taskText: 'Умова четвертого',
    note: 'через <b>JOIN</b>',
  },
  {
    taskId: 'L3-03',
    level: 3,
    levelName: "Об'єднання таблиць",
    index: 2,
    title: 'Третє завдання',
    context: 'Контекст третього',
    taskText: 'Умова третього',
    note: 'варіант із CTE',
  },
];
const notesHtml = notesScreenHtml(noteEntries);
check('екран нотаток групує за рівнями', (notesHtml.match(/notes-group"/g) ?? []).length === 2);
check('екран нотаток показує всі записи', (notesHtml.match(/note-entry"/g) ?? []).length === 3);
check('запис нумерує завдання з одиниці', notesHtml.includes('Завдання 4 · Четверте завдання'));
check('запис показує текст нотатки', notesHtml.includes('моя думка'));
check('нотатка не вставляє сирий HTML', notesHtml.includes('через &lt;b&gt;JOIN&lt;/b&gt;'));
check('запис ховає умову під розгортанням', notesHtml.includes('Показати умову'));
check('запис містить бізнес-контекст', notesHtml.includes('Контекст четвертого'));
check('запис містить текст завдання', notesHtml.includes('Умова четвертого'));
check('запис веде до свого завдання', /data-level="3"\s+data-index="2"/.test(notesHtml));
check('порядок рівнів збережено', notesHtml.indexOf('Рівень 1') < notesHtml.indexOf('Рівень 3'));

// Видалення: по одній кнопці на запис плюс одна на весь екран.
check(
  'кожен запис має кнопку видалення',
  (notesHtml.match(/data-action="delete-note"/g) ?? []).length === 3
);
check('кнопка видалення знає свою нотатку', /data-note-id="L3-03"/.test(notesHtml));
check('екран має видалення всіх нотаток', notesHtml.includes('data-action="delete-all-notes"'));
check('видалення всіх — небезпечного вигляду', notesHtml.includes('btn--danger'));

const emptyNotesHtml = notesScreenHtml([]);
check('без нотаток показується пояснення', emptyNotesHtml.includes('Нотаток поки немає'));
check('порожній екран не має записів', !emptyNotesHtml.includes('note-entry"'));
check('порожній екран веде на головну', emptyNotesHtml.includes('data-action="to-home"'));
check('без нотаток немає що видаляти', !emptyNotesHtml.includes('data-action="delete-all-notes"'));
check('екран нотаток називає вихід «На головну»', notesHtml.includes('На головну'));

const dashMetrics = {
  summary: { solved: 42, total: 125, activeDays: 9 },
  lastActivity: { taskId: 'L5-02', title: 'Ковзне середнє', level: 5, index: 7, at: 1 },
  masteredSkills: [
    { level: 1, topics: ['SELECT', 'WHERE', 'ORDER BY'] },
    { level: 2, topics: ['COUNT'] },
  ],
  errorTopics: [],
  hardTasks: [],
};

const dashHtml = dashboardHtml(dashMetrics);
check("дашборд показує кількість розв'язаних", dashHtml.includes('>42<'));
check('дашборд показує загальну кількість завдань', dashHtml.includes('зі 125'));
check('дашборд показує днів активності', dashHtml.includes('Днів активності'));
check('зведення більше не показує серію днів', !dashHtml.includes('Серія днів'));
check('зведення більше не показує загальний час', !dashHtml.includes('Загальний час'));
check('зведення більше не показує медіану', !dashHtml.includes('Медіана'));
check(
  'плитка останньої активності називає рівень і завдання',
  dashHtml.includes('Рівень 5 · Завдання 8')
);
check('є кнопка продовжити', dashHtml.includes('Продовжити'));
check('кнопка продовжити веде до того завдання', /data-level="5"\s+data-index="7"/.test(dashHtml));

check('панель освоєних навичок є', dashHtml.includes('Освоєні навички'));
check('навички згруповані за рівнями', dashHtml.includes('Рівень 1'));
check('навичка показується великими літерами', dashHtml.includes('ORDER BY'));
check('календаря більше немає', !dashHtml.includes('class="heat"'));
check('дашборд має кнопку на головну', dashHtml.includes('data-action="to-home"'));
// Кнопка очищення одна: дві сусідні (історія окремо, прогрес окремо) плутали
// б, а різниця між ними видно лише з тексту підтвердження.
check('дашборд має кнопку очищення', dashHtml.includes('data-action="clear-all"'));
check('окремої кнопки історії більше немає', !dashHtml.includes('data-action="clear-history"'));
check('кнопка очищення небезпечного вигляду', dashHtml.includes('btn--danger'));
check(
  'очищення відокремлене від решти дій',
  dashHtml.includes('dashboard__danger') &&
    dashHtml.indexOf('data-action="clear-all"') > dashHtml.indexOf('data-action="to-home"')
);
// Власне вікно підтвердження замість нативного confirm: у того кнопки
// називаються OK і Cancel, і перейменувати їх неможливо.
const dialog = confirmDialogHtml({
  title: 'Очистити весь прогрес?',
  note: 'Цю дію не можна буде скасувати.',
  confirmLabel: 'Очистити',
});
check('вікно показує запитання', dialog.includes('Очистити весь прогрес?'));
check('вікно попереджає про необоротність', dialog.includes('Цю дію не можна буде скасувати.'));
check('кнопка підтвердження названа своїм словом', />Очистити\s*<\/button>/.test(dialog));
check('кнопка відмови називається «Скасувати»', />Скасувати\s*<\/button>/.test(dialog));
check('підтвердження небезпечного вигляду', dialog.includes('btn--danger'));
check('відмова звичайного вигляду', dialog.includes('btn--ghost'));
check('вікно позначене як діалог', dialog.includes('role="dialog"'));
check(
  'у вікні немає OK і Cancel',
  !dialog.includes('>OK<') && !dialog.toLowerCase().includes('cancel<')
);
check(
  'текст вікна екранується',
  confirmDialogHtml({ title: '<b>x</b>', note: 'n', confirmLabel: 'y' }).includes('&lt;b&gt;')
);

// Наслідки пояснює вікно підтвердження, а не підпис під кнопкою: тримати
// довгий текст на екрані означало б лякати ним щоразу, коли відкриваєш дашборд.
check('кнопка очищення названа коротко', />Очистити\s*<\/button>/.test(dashHtml));
check('під кнопкою немає полотна тексту', !dashHtml.includes('dashboard__danger-note'));

const freshDash = dashboardHtml({
  summary: { solved: 0, total: 125, activeDays: 0 },
  lastActivity: null,
  masteredSkills: [],
  errorTopics: [],
  hardTasks: [],
});
check('без журналу плитка каже, що ще не починали', freshDash.includes('Ще не починали'));
check(
  'без журналу кнопка веде на перше завдання',
  /data-level="1"\s+data-index="0"/.test(freshDash)
);
check('без навичок пояснюється умова відмітки', freshDash.includes('коли всі завдання теми'));
check('на чистому дашборді нема чого очищати', !freshDash.includes('data-action="clear-all"'));
check('на чистому дашборді немає й самого блоку', !freshDash.includes('dashboard__danger'));

// Одних лише подій достатньо, щоб кнопка з'явилася: відкрите завдання вже
// лишає слід у журналі, навіть якщо його не розв'язали.
const touchedDash = dashboardHtml({
  summary: { solved: 0, total: 125, activeDays: 1 },
  lastActivity: null,
  masteredSkills: [],
  errorTopics: [],
  hardTasks: [],
});
check('після першої активності кнопка є', touchedDash.includes('data-action="clear-all"'));

const topicsDash = dashboardHtml({
  ...dashMetrics,
  errorTopics: [
    {
      topic: 'where',
      label: 'WHERE',
      fails: 9,
      tasksTouched: 7,
      failsPerTask: 1.4285,
      practice: { level: 1, index: 4 },
    },
    {
      topic: 'group-by',
      label: 'GROUP BY',
      fails: 6,
      tasksTouched: 3,
      failsPerTask: 2,
      practice: { level: 2, index: 1 },
    },
  ],
  hardTasks: [
    {
      id: 'L3-07',
      title: 'Звіт <b>по регіонах</b>',
      level: 3,
      index: 6,
      fails: 7,
      status: 'solved',
    },
    { id: 'L5-02', title: 'Ковзне середнє', level: 5, index: 1, fails: 4, status: 'revealed' },
  ],
});

check('панель типових помилок є', topicsDash.includes('Типові помилки'));
check('тема показується великими літерами', topicsDash.includes('WHERE'));
check('поруч із темою кількість помилок', topicsDash.includes('>9<'));
check('перший рядок показує кількість задач', topicsDash.includes('7 задач'));
check('перший рядок показує середнє', topicsDash.includes('1,4'));
check('перший рядок має кнопку потренувати', topicsDash.includes('потренувати'));
check('кнопка веде до завдання теми', /data-level="1"\s+data-index="4"/.test(topicsDash));
check('решта рядків кнопки не мають', (topicsDash.match(/потренувати/g) ?? []).length === 1);
check('панель найважчих називається інакше', topicsDash.includes('Потребують повторення'));
check('старої назви немає', !topicsDash.includes('Найважчі завдання'));
check('слабкої теми окремою панеллю немає', !topicsDash.includes('Що дається важко'));
check(
  'назва завдання не вставляє сирий HTML',
  topicsDash.includes('&lt;b&gt;по регіонах&lt;/b&gt;')
);
check('видно кількість невдалих спроб', topicsDash.includes('невдалих спроб: 7'));
check("статус розв'язаного підписано", topicsDash.includes("розв'язано"));
check('статус підгляданого підписано', topicsDash.includes('підглянуто'));
check('рядок веде до свого завдання', /data-level="5"\s+data-index="1"/.test(topicsDash));

const emptyTops = dashboardHtml({ ...dashMetrics, errorTopics: [], hardTasks: [] });
check(
  'обидві панелі без даних показують підпис',
  (emptyTops.match(/Даних поки немає/g) ?? []).length >= 2
);

// Колір кнопки «На головну» тримається на селекторі [data-action='to-home'],
// а не на окремому класі. Тому кожна така кнопка мусить нести цей атрибут —
// інакше вона мовчки лишиться сірою серед синіх.
[
  ['шапка', headerHtml],
  ['дашборд', dashboardHtml(dashMetrics)],
  ['нотатки', notesScreenHtml([])],
  ['пісочниця', sandboxControlsHtml()],
  ['завершення рівня', doneHtml],
  ['теорія', theoryTopicHtml(topics[0])],
  ['панель керування', controlsHtml({ hintsRevealed: 0, totalHints: 3 })],
].forEach(([where, html]) => {
  const homeButtons = (html.match(/На головну/g) ?? []).length;
  const hooked = (html.match(/data-action="to-home"/g) ?? []).length;
  check(`${where}: кожна кнопка «На головну» має гачок для кольору`, homeButtons === hooked);
});

console.log(failures === 0 ? '\nУсі перевірки UI пройдено.' : `\n${failures} перевірок провалено.`);
process.exit(failures === 0 ? 0 : 1);
