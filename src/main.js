import './styles/main.css';
import tasks, { LEVELS, tasksByLevel, tasksByCaseStudy } from './tasks/index.js';
import { executeUserQuery, executeReferenceQuery, SqlUserError } from './db/sqlEngine.js';
import { compareResults } from './compare/resultComparer.js';
import { GameState } from './game/state.js';
import { EventLog } from './game/eventLog.js';
import { qs } from './utils/dom.js';
import { createEditor } from './ui/editor.js';
import { renderTaskCard } from './ui/taskCard.js';
import { renderHints } from './ui/hintPanel.js';
import { renderNotePanel } from './ui/notePanel.js';
import { renderControls } from './ui/controls.js';
import { renderTaskNav } from './ui/taskNav.js';
import { renderProgress, bindBackHome, routeFor, parseRoute } from './ui/progressBar.js';
import { getLanguage, setLanguage, t, levelName } from './i18n/index.js';
import { renderLevelSelect } from './ui/levelSelect.js';
import { renderNotesScreen } from './ui/notesScreen.js';
import { computeMetrics } from './analytics/metrics.js';
import { skillsForLevel } from './tasks/skills.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderLevelComplete } from './ui/levelComplete.js';
import topics, { topicByLevel } from './theory/topics.js';
import { renderTheoryList } from './ui/theoryList.js';
import { renderTheoryTopic } from './ui/theoryTopic.js';
import { renderResultTable, clearResultTable } from './ui/resultTable.js';
import * as schemas from './tasks/schemas.js';
import { renderSandboxSchema, renderSandboxControls, sandboxInitialSql } from './ui/sandbox.js';
import {
  loadSandboxSql,
  saveSandboxSql,
  clearSandboxSql,
  loadLang,
  saveLang,
} from './game/persistence.js';
import {
  renderSuccess,
  renderFailure,
  renderSqlError,
  renderGiveUp,
  clearFeedback,
} from './ui/feedbackPanel.js';

const roots = {
  layout: qs('#layout-root'),
  workPanel: qs('#work-panel'),
  progress: qs('#progress-root'),
  taskNav: qs('#task-nav-root'),
  taskCard: qs('#task-card-root'),
  hints: qs('#hint-root'),
  note: qs('#note-root'),
  theory: qs('#theory-root'),
  editor: qs('#editor-root'),
  controls: qs('#controls-root'),
  feedback: qs('#feedback-root'),
  result: qs('#result-root'),
};

const gameState = new GameState(tasks);
const eventLog = new EventLog();

// Час відкриття завдання потрібен, щоб порахувати, скільки пішло на розв'язок.
// Живе в змінній, а не в журналі: до наступного 'solved' проміжних станів
// зберігати немає сенсу.
let taskOpenedAt = 0;

// null — показано екран вибору рівнів; число — режим завдань цього рівня.
let activeLevel = null;
let levelTasks = [];
let currentIndex = 0;
let hintsRevealed = 0;
let draftTimer = null;
let noteTimer = null;
let noteText = '';
let noteOpen = false;
let editor;

// Пісочниця ділить редактор і панель результату з режимом завдань, тому
// handleCheck має знати, що робити з натиснутим Ctrl+Enter.
let sandboxMode = false;

// Екран, на якому ми зараз: потрібен перемикачу мови, щоб зібрати ту саму
// адресу в новій мові. Пише його setRoute — там, де адреса вже й так
// визначається, тож розійтися вони не можуть.
let currentScreenName = 'home';

// Поточний екран як функція перемальовування. Перемикач мови малює саме її:
// вгадувати екран за станом означало б розбирати сім випадків — головна, тема
// теорії, завдання, завершення рівня, нотатки, дашборд, пісочниця.
let repaint = () => showLevelSelect();

function currentTask() {
  return levelTasks[currentIndex];
}

// Редактор шле подію на кожну літеру, а запис у localStorage синхронний — тому
// зберігаємо з паузою, а не на кожне натискання.
function scheduleDraftSave() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveCurrentDraft, 400);
}

function saveCurrentDraft() {
  clearTimeout(draftTimer);
  if (sandboxMode) {
    saveSandboxSql(editor.getValue());
    return;
  }
  const task = currentTask();
  if (task) gameState.saveDraft(task.id, editor.getValue());
}

// Нотатка зберігається тим самим прийомом, що й чернетка: подія на кожну літеру,
// запис у localStorage синхронний — тому з паузою.
function scheduleNoteSave(text) {
  noteText = text;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(saveCurrentNote, 400);
}

function saveCurrentNote() {
  clearTimeout(noteTimer);
  const task = currentTask();
  if (!task) return;
  const hadNote = gameState.hasNote(task.id);
  gameState.saveNote(task.id, noteText);
  if (gameState.hasNote(task.id) !== hadNote) renderTaskNavPanel();
}

// Єдина точка «дописати все незбережене». Таймерів тепер два, а точок виходу
// з завдання шість — тримати в кожній по два виклики означає рано чи пізно
// забути один із них і загубити текст.
function flushPending() {
  saveCurrentDraft();
  saveCurrentNote();
  saveNotesScreenNote();
}

// Розділ, у якому ми зараз, пишемо в hash. Всередині сторінки переходи, як і
// раніше, робить JS — hash потрібен новій вкладці: пункт шапки тепер посилання,
// і правий клік «Відкрити в новій вкладці» стартує застосунок із нуля саме за
// цією адресою. Шлях (/notes) не годиться: сайт роздається як статика, сервер
// про такий маршрут не знає й віддав би 404.
// replaceState, а не location.hash = …: присвоєння додає запис в історію, і
// кнопка «назад» ходила б по вже показаних екранах замість виходу зі сторінки.
function setRoute(screen) {
  currentScreenName = screen;
  const route = routeFor(getLanguage(), screen);
  if (window.location.hash === route) return;
  window.history.replaceState(null, '', route);
}

// Екрани завдань і теорії власної адреси не мають — усі вони під головною,
// тому невідомий hash так само веде на головну. Мову з адреси розбирає
// parseRoute; сюди приходить уже лише назва екрана.
function screenForRoute(screen) {
  if (screen === 'sandbox') return showSandbox;
  if (screen === 'dashboard') return showDashboard;
  if (screen === 'notes') return showNotes;
  return showLevelSelect;
}

// Текст, який лежить просто в index.html: його не малює жоден рендер, тому
// після зміни мови його треба підмінити руками. Атрибут lang на <html> — теж
// частина цього: за ним браузер вибирає переноси й голос читалки.
function applyStaticText() {
  document.documentElement.lang = getLanguage();
  document.title = t('app.title');
  qs('#brand-title').textContent = t('app.brand');
  qs('#brand-subtitle').textContent = t('app.subtitle');
  qs('#editor-label').textContent = t('editor.label');
  qs('#editor-hint').textContent = t('editor.hint');
}

// Мова змінюється в пам'яті, без перезавантаження: перезапуск сторінки означав
// би ще ~1,2 с на завантаження wasm PGlite при кожному кліку по списку.
//
// flushPending спершу — інакше незбережена чернетка чи нотатка загубилася б на
// перемальовуванні. Вікно перевірки й таблицю результату не перемальовуємо
// свідомо: вони лишаються тією мовою, якою їх намалювали. Інакше довелося б
// або підмінити показану випадкову фразу новою, або зберігати її індекс
// заради випадку, що трапляється раз на сеанс.
function applyLanguage(lang) {
  flushPending();
  setLanguage(lang);
  saveLang(getLanguage());
  setRoute(currentScreenName);
  applyStaticText();
  repaint();
}

// Навігація в шапці однакова на всіх екранах, тому обробники живуть в одному
// місці. Стрілки навмисні: showDashboard і showNotes оголошені нижче, і пряме
// посилання читалося б до ініціалізації.
const navHandlers = {
  onOpenDashboard: () => showDashboard(),
  onOpenNotes: () => showNotes(),
  onOpenSandbox: () => showSandbox(),
  onPickLanguage: applyLanguage,
};

function pickStartIndex() {
  const firstUnsolved = levelTasks.findIndex((t) => !gameState.isSolved(t.id));
  return firstUnsolved === -1 ? 0 : firstUnsolved;
}

function renderTaskHeader() {
  const task = currentTask();
  renderTaskCard(roots.taskCard, {
    task,
    index: currentIndex,
    total: levelTasks.length,
    isSolved: gameState.isSolved(task.id),
    caseStudySteps: task.caseStudy ? tasksByCaseStudy(task.caseStudy.id).length : 0,
  });
}

function renderNoteBlock() {
  renderNotePanel(
    roots.note,
    { text: noteText, isOpen: noteOpen },
    {
      onInput: scheduleNoteSave,
      onToggle: (open) => {
        noteOpen = open;
      },
      // Нотатка й так зберігається сама через 400 мс після набору. Кнопка
      // потрібна не для збереження, а для підтвердження: без неї користувач
      // не має жодної ознаки, що текст уже в сховищі.
      onSave: saveCurrentNote,
      onInsertQuery: handleInsertQuery,
    }
  );
}

// Нотатка «альтернативне рішення» майже завжди — це щойно написаний запит,
// тож переписувати його руками не доводиться.
function handleInsertQuery() {
  const sql = editor.getValue().trim();
  if (sql === '') return;
  noteText = noteText === '' ? sql : `${noteText}\n\n${sql}`;
  gameState.saveNote(currentTask().id, noteText);
  noteOpen = true;
  renderNoteBlock();
  renderTaskNavPanel();
}

function renderLevelProgress() {
  renderProgress(
    roots.progress,
    {
      levelName: t('taskCard.levelPill', {
        level: activeLevel,
        name: levelName(activeLevel),
      }),
      showBack: true,
    },
    navHandlers
  );
  bindBackHome(roots.progress, showLevelSelect);
}

function renderTaskNavPanel() {
  renderTaskNav(
    roots.taskNav,
    levelTasks.map((task, index) => ({
      index,
      status: gameState.statusOf(task.id),
      hasNote: gameState.hasNote(task.id),
    })),
    currentIndex,
    goToTask
  );
}

function renderControlsPanel() {
  renderControls(
    roots.controls,
    {
      hintsRevealed,
      totalHints: currentTask().hints.length,
      isFirstTask: currentIndex === 0,
      isLastTask: currentIndex === levelTasks.length - 1,
    },
    {
      onCheck: handleCheck,
      onHint: handleHint,
      onGiveUp: handleGiveUp,
      onPrev: handlePrev,
      onNext: handleNext,
      onToHome: showLevelSelect,
    }
  );
}

async function handleCheck() {
  if (sandboxMode) {
    await runSandboxQuery();
    return;
  }

  const task = currentTask();
  // Запам'ятовуємо, яке завдання перевіряємо: перевірка асинхронна (PGlite
  // ще й вантажить wasm на перший виклик), а смужка навігації тепер завжди
  // клікабельна — за час очікування користувач міг перейти на інше завдання.
  // Якщо так і сталося, рендер нижче стосувався б уже не того завдання.
  const startedAt = currentIndex;

  let userResult;
  try {
    userResult = await executeUserQuery(task.setupSql, editor.getValue());
  } catch (err) {
    if (err instanceof SqlUserError) {
      eventLog.record('attempt', task.id, { r: 'sql-error' });
      if (currentIndex !== startedAt) return;
      clearResultTable(roots.result);
      renderSqlError(roots.feedback, err.message);
      return;
    }
    throw err;
  }

  if (currentIndex === startedAt) {
    renderResultTable(roots.result, userResult);
  }

  // Еталон теж проходить через захист «лише SELECT» і теж може впасти —
  // не через користувача, а через хибу в самому банку завдань. Без цієї
  // гілки виняток летів би нагору, і перевірка мовчки не давала б жодного
  // вердикту: таблиця результату вже намальована, а «правильно/неправильно»
  // не з'являється ніколи. Спробу в такому разі не зараховуємо.
  let referenceResult;
  try {
    referenceResult = await executeReferenceQuery(task.setupSql, task.referenceSql);
  } catch (err) {
    if (err instanceof SqlUserError) {
      if (currentIndex !== startedAt) return;
      renderSqlError(roots.feedback, t('feedback.checkFailed', { message: err.message }));
      return;
    }
    throw err;
  }

  const comparison = compareResults(userResult, referenceResult, task);

  if (comparison.ok) {
    // Час рахуємо лише для першого розв'язання: повторний прогін уже
    // розв'язаного завдання не каже нічого про складність.
    if (!gameState.isSolved(task.id)) {
      eventLog.record('solved', task.id, { ms: Date.now() - taskOpenedAt });
    }
    gameState.registerSolved(task);
    if (currentIndex === startedAt) renderSuccess(roots.feedback);
  } else {
    eventLog.record('attempt', task.id, { r: comparison.code });
    if (currentIndex === startedAt) renderFailure(roots.feedback);
  }

  flushPending();

  // Рендеримо показники рівня (лічильник і смужку) незалежно від навігації:
  // вони мають відобразити щойно збережений результат, навіть якщо користувач
  // тим часом перейшов на інше завдання. Рендер завдання ж — лише якщо те само.
  renderLevelProgress();
  renderTaskNavPanel();

  if (currentIndex !== startedAt) return;

  renderTaskHeader();
  renderControlsPanel();
}

// Пісочниця не пише подій у журнал: вільний запит — не спроба й не
// розв'язання, і зараховувати його як активність означало б показувати
// прогрес там, де його не було.
async function runSandboxQuery() {
  saveCurrentDraft();

  let result;
  try {
    result = await executeUserQuery(null, editor.getValue());
  } catch (err) {
    if (err instanceof SqlUserError) {
      clearResultTable(roots.result);
      renderSqlError(roots.feedback, err.message);
      return;
    }
    throw err;
  }

  clearFeedback(roots.feedback);
  renderResultTable(roots.result, result);
}

function handleHint() {
  const task = currentTask();
  if (hintsRevealed >= task.hints.length) return;
  hintsRevealed += 1;
  eventLog.record('hint', task.id, { n: hintsRevealed });
  renderHints(roots.hints, task.hints, hintsRevealed);
  renderControlsPanel();
}

function handleGiveUp() {
  const task = currentTask();
  if (!gameState.isSolved(task.id)) eventLog.record('gave-up', task.id);
  gameState.registerGaveUp(task);
  clearResultTable(roots.result);
  renderGiveUp(roots.feedback, task);
  renderControlsPanel();
  renderLevelProgress();
  renderTaskNavPanel();
}

function handleNext() {
  if (currentIndex === levelTasks.length - 1) {
    flushPending();
    renderLevelDone();
    return;
  }
  goToTask(currentIndex + 1);
}

function handlePrev() {
  if (currentIndex > 0) goToTask(currentIndex - 1);
}

// Єдина точка переходу між завданнями: спершу зберігаємо те, що написано зараз,
// і лише потім міняємо завдання — інакше чернетка загубилась би.
function goToTask(index) {
  flushPending();
  currentIndex = index;
  startTask();
}

// Тільки рендер, без скидання стану завдання. Цю саму функцію викликає
// перемикач мови, а він не має ні згортати вже відкриті підказки, ні обнуляти
// час розв'язання, ні писати в журнал нову подію «завдання відкрито».
function renderTaskScreen() {
  renderTaskHeader();
  renderTaskNavPanel();
  renderHints(roots.hints, currentTask().hints, hintsRevealed);
  renderNoteBlock();
  renderControlsPanel();
  renderLevelProgress();
}

function startTask() {
  // Свіжовідкрите завдання не має успадковувати відкладений запис чернетки,
  // запланований ще для попереднього завдання (навіть якщо десь порядок
  // "спершу зберегти, потім перемкнути" колись зламають).
  clearTimeout(draftTimer);
  clearTimeout(noteTimer);
  hintsRevealed = 0;
  taskOpenedAt = Date.now();
  eventLog.record('open', currentTask().id);
  editor.setValue(gameState.getDraft(currentTask().id));
  noteText = gameState.getNote(currentTask().id);
  noteOpen = noteText !== '';
  clearFeedback(roots.feedback);
  clearResultTable(roots.result);
  renderTaskScreen();
  // Не () => startTask(): він скидав би підказки, таймер і журнал.
  repaint = renderTaskScreen;
  editor.focus();
}

function clearTaskPanels() {
  // Прапорець скидаємо тут, а не в кожному show*: clearTaskPanels викликає
  // кожен перехід на інший екран, і забути одне місце з п'яти було б лише
  // питанням часу. showSandbox через це вмикає режим уже після виклику.
  sandboxMode = false;
  roots.taskNav.innerHTML = '';
  roots.hints.innerHTML = '';
  roots.note.innerHTML = '';
  roots.theory.innerHTML = '';
  roots.controls.innerHTML = '';
  clearFeedback(roots.feedback);
  clearResultTable(roots.result);
}

function renderLevelDone() {
  clearTaskPanels();
  roots.workPanel.hidden = true;
  roots.layout.classList.add('layout--single');

  renderLevelComplete(
    roots.taskCard,
    {
      level: activeLevel,
      name: levelName(activeLevel),
      solved: gameState.solvedCountForLevel(activeLevel),
      total: levelTasks.length,
      skills: skillsForLevel(activeLevel, currentStatuses(), tasks),
    },
    { onNextLevel: () => openLevel(activeLevel + 1), onToHome: showLevelSelect }
  );
  renderLevelProgress();
  repaint = () => renderLevelDone();
}

function showLevelSelect() {
  flushPending();
  setRoute('home');
  activeLevel = null;
  levelTasks = [];
  clearTaskPanels();
  roots.workPanel.hidden = true;
  roots.layout.classList.add('layout--single');

  renderProgress(roots.progress, {}, navHandlers);
  renderLevelSelect(
    roots.taskCard,
    LEVELS.map((level) => ({
      level,
      name: levelName(level),
      total: tasksByLevel(level).length,
      solved: gameState.solvedCountForLevel(level),
      noteCount: gameState.notedCountForLevel(level),
    })),
    openLevel
  );
  renderTheoryList(roots.theory, topics, showTheory);
  repaint = () => showLevelSelect();
}

// Екран однієї теми теорії: та сама панель, що й вибір рівнів, але замість
// сітки — текст теми з переходом на практику відповідного рівня.
function showTheory(level) {
  flushPending();
  setRoute('home');
  activeLevel = null;
  levelTasks = [];
  clearTaskPanels();
  roots.workPanel.hidden = true;
  roots.layout.classList.add('layout--single');

  renderProgress(roots.progress, { showBack: true }, navHandlers);
  bindBackHome(roots.progress, showLevelSelect);
  renderTheoryTopic(roots.taskCard, topicByLevel(level), {
    onToPractice: () => openLevel(level),
    onToHome: showLevelSelect,
    onRunInSandbox: showSandboxWithQuery,
  });
  repaint = () => showTheory(level);
}

// Нотатка зберігає лише текст, тому назву, контекст і умову беремо з банку
// завдань за id — так список ніколи не показує застарілу редакцію завдання.
function noteEntries() {
  return LEVELS.flatMap((level) =>
    tasksByLevel(level)
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => gameState.hasNote(task.id))
      .map(({ task, index }) => ({
        taskId: task.id,
        level,
        levelName: levelName(level),
        index,
        title: task.title,
        context: task.context,
        taskText: task.taskText,
        note: gameState.getNote(task.id),
      }))
  );
}

// Запис із екрана нотаток. Пара «яку нотатку правимо / який текст» лежить
// поруч, бо на цьому екрані записів багато: одна змінна тексту, як у режимі
// завдання, приписала б правку не тому завданню.
let notesScreenEdit = null;
let notesScreenTimer = null;

function scheduleNotesScreenSave(taskId, text) {
  notesScreenEdit = { taskId, text };
  clearTimeout(notesScreenTimer);
  notesScreenTimer = setTimeout(saveNotesScreenNote, 400);
}

function saveNotesScreenNote() {
  clearTimeout(notesScreenTimer);
  if (!notesScreenEdit) return;
  gameState.saveNote(notesScreenEdit.taskId, notesScreenEdit.text);
  notesScreenEdit = null;
}

// Окремий екран за зразком showTheory: та сама панель, робоча панель схована.
function showNotes() {
  flushPending();
  setRoute('notes');
  activeLevel = null;
  levelTasks = [];
  clearTaskPanels();
  roots.workPanel.hidden = true;
  roots.layout.classList.add('layout--single');

  renderProgress(roots.progress, { showBack: true, active: 'notes' }, navHandlers);
  bindBackHome(roots.progress, showLevelSelect);
  renderNotesScreen(roots.taskCard, noteEntries(), {
    onOpenTask: openLevel,
    onToHome: showLevelSelect,
    // Правка на екрані нотаток іде повз noteText: та змінна належить
    // відкритому завданню, а тут завдання не відкрите — редагувати можна
    // будь-який запис зі списку.
    onEditNote: scheduleNotesScreenSave,
    onSaveNote: saveNotesScreenNote,
    // Порожній текст — це і є видалення: окремого методу немає навмисно.
    onDeleteNote: (taskId) => {
      gameState.saveNote(taskId, '');
      showNotes();
    },
    onDeleteAllNotes: () => {
      gameState.clearNotes();
      showNotes();
    },
  });
  repaint = () => showNotes();
}

// Статуси беремо зі стану, а час і помилки — з журналу: журнал увімкнений лише
// з етапу A, і рахувати за ним розв'язані означало б показати менше, ніж на
// картках рівнів.
// Плоский знімок статусів. Його чекають і метрики, і уміння рівня: обидва —
// чисті функції, яким не місце знати про GameState.
function currentStatuses() {
  return Object.fromEntries(tasks.map((task) => [task.id, gameState.statusOf(task.id)]));
}

function currentMetrics() {
  return computeMetrics({ tasks, statuses: currentStatuses(), events: eventLog.all() });
}

// Ще один екран за зразком showNotes: та сама панель, робоча панель схована.
function showDashboard() {
  flushPending();
  setRoute('dashboard');
  activeLevel = null;
  levelTasks = [];
  clearTaskPanels();
  roots.workPanel.hidden = true;
  roots.layout.classList.add('layout--single');

  renderProgress(roots.progress, { showBack: true, active: 'dashboard' }, navHandlers);
  bindBackHome(roots.progress, showLevelSelect);
  renderDashboard(roots.taskCard, currentMetrics(), {
    onOpenTask: openLevel,
    // Історію чистимо разом із прогресом: залишена, вона показувала б помилки
    // й час по завданнях, які тепер знову вважаються нерозв'язаними.
    onClearAll: () => {
      gameState.resetProgress();
      eventLog.clear();
      clearSandboxSql();
      showDashboard();
    },
    onToHome: showLevelSelect,
  });
  repaint = () => showDashboard();
}

// На відміну від нотаток і дашборда, робоча панель лишається видимою: саме в
// ній живуть редактор і таблиця результату.
function showSandbox() {
  flushPending();
  setRoute('sandbox');
  activeLevel = null;
  levelTasks = [];
  clearTaskPanels();
  roots.workPanel.hidden = false;
  roots.layout.classList.remove('layout--single');
  sandboxMode = true;

  renderProgress(roots.progress, { showBack: true, active: 'sandbox' }, navHandlers);
  bindBackHome(roots.progress, showLevelSelect);
  renderSandboxSchema(roots.taskCard, Object.values(schemas));
  renderSandboxControls(roots.controls, {
    onRun: runSandboxQuery,
    onToHome: showLevelSelect,
  });

  editor.setValue(sandboxInitialSql(loadSandboxSql()));
  editor.focus();
  repaint = () => showSandbox();
}

// Приклад із теорії відкривається виконаним: користувач натиснув «Виконати
// запит», а не «Показати запит», тож другого кліку від нього не чекають.
//
// Запит потрапляє і в сховище пісочниці — так само, як будь-який інший текст
// у її редакторі. Тобто попередня чернетка пісочниці заміщується прикладом;
// це і є «перенести в пісочницю».
async function showSandboxWithQuery(sql) {
  showSandbox();
  editor.setValue(sql);
  await runSandboxQuery();
}

// startIndex приходить з екрана нотаток: там потрібне саме те завдання,
// а не перше нерозв'язане на рівні.
function openLevel(level, startIndex) {
  // Єдиний вхід у завдання, що не проходить через clearTaskPanels.
  setRoute('home');
  sandboxMode = false;
  activeLevel = level;
  levelTasks = tasksByLevel(level);
  currentIndex = startIndex ?? pickStartIndex();
  roots.theory.innerHTML = '';
  roots.workPanel.hidden = false;
  roots.layout.classList.remove('layout--single');
  startTask();
}

editor = createEditor(roots.editor, handleCheck, scheduleDraftSave);

// Порядок такий: що в адресі → що збережено → англійська. Адреса має
// пріоритет, бо саме за нею приходять по посиланню. setLanguage(undefined)
// дає DEFAULT_LANG — тому валідація живе в ньому, а не тут.
const startRoute = parseRoute(window.location.hash);
setLanguage(startRoute.lang ?? loadLang() ?? undefined);
applyStaticText();
screenForRoute(startRoute.screen)();

// Клік по пункту шапки hash не міняє (його перехоплює bindNav), тож сюди
// потрапляє лише ручна правка адреси — але тоді рядку мусять відповідати
// і екран, і мова.
window.addEventListener('hashchange', () => {
  const route = parseRoute(window.location.hash);
  if (route.lang && route.lang !== getLanguage()) {
    setLanguage(route.lang);
    saveLang(getLanguage());
    applyStaticText();
  }
  screenForRoute(route.screen)();
});

// Автозбереження чернетки відкладене на 400 мс: перезавантаження сторінки в
// цьому вікні губило б останню серію натискань, якщо її не дописати примусово.
window.addEventListener('beforeunload', flushPending);
