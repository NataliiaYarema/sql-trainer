import { loadState, saveState } from './persistence.js';

// Чернетки лежать у тому самому ключі localStorage, що й прогрес. Без обмеження
// одна вставлена величезна чернетка могла б вичерпати квоту сховища — saveState
// тоді тихо ловить QuotaExceededError, і прогрес перестає зберігатися взагалі.
const MAX_DRAFT_LENGTH = 10000;
const MAX_NOTE_LENGTH = 10000;

function emptyState() {
  return { solved: {}, drafts: {}, notes: {} };
}

// Зі сховища беремо лише `solved`, `drafts` і `notes` — старі збереження містять поля
// прибраної гейміфікації (бали, серія, відзнаки), і тягнути їх далі немає сенсу.
//
// Заразом відкидаємо записи, чиїх id більше немає в банку. Після
// перенумерації завдань такі записи лишаються, і solvedCountForLevel
// порахував би їх за вцілілим полем level — картка рівня показала б
// прогрес по завданнях, яких не існує.
function keepKnown(entries, knownIds) {
  return Object.fromEntries(Object.entries(entries).filter(([id]) => knownIds.has(id)));
}

function normalize(loaded, knownIds) {
  if (!loaded?.solved) return emptyState();
  return {
    solved: keepKnown(loaded.solved, knownIds),
    drafts: keepKnown(loaded.drafts ?? {}, knownIds),
    notes: keepKnown(loaded.notes ?? {}, knownIds),
  };
}

export class GameState {
  constructor(tasks) {
    this.tasks = tasks;
    this.data = normalize(loadState(), new Set(tasks.map((task) => task.id)));
  }

  get solvedCount() {
    return Object.values(this.data.solved).filter((r) => r.status === 'solved').length;
  }

  solvedCountForLevel(level) {
    return Object.values(this.data.solved).filter((r) => r.status === 'solved' && r.level === level)
      .length;
  }

  isSolved(taskId) {
    return this.data.solved[taskId]?.status === 'solved';
  }

  // 'new' — до завдання ще не поверталися з результатом; статус потрібен смужці
  // навігації, щоб розрізняти розв'язане й підглянуте.
  statusOf(taskId) {
    return this.data.solved[taskId]?.status ?? 'new';
  }

  getDraft(taskId) {
    return this.data.drafts[taskId] ?? '';
  }

  // Порожню чернетку не зберігаємо: інакше сховище накопичувало б записи
  // з самих пробілів для кожного відкритого завдання.
  saveDraft(taskId, sql) {
    if (sql.trim() === '') {
      delete this.data.drafts[taskId];
    } else {
      this.data.drafts[taskId] = sql.slice(0, MAX_DRAFT_LENGTH);
    }
    this.persist();
  }

  getNote(taskId) {
    return this.data.notes[taskId] ?? '';
  }

  // Порожня нотатка — це і є видалення: окремої кнопки «Видалити» немає,
  // а тримати в сховищі записи з самих пробілів немає сенсу.
  saveNote(taskId, text) {
    if (text.trim() === '') {
      delete this.data.notes[taskId];
    } else {
      this.data.notes[taskId] = text.slice(0, MAX_NOTE_LENGTH);
    }
    this.persist();
  }

  hasNote(taskId) {
    return this.getNote(taskId) !== '';
  }

  // Нотатки живуть окремо від прогресу, тому й прибираються окремо. Поштучно
  // це робить saveNote з порожнім текстом — окремого deleteNote немає навмисно,
  // щоб не було двох шляхів до однієї дії.
  clearNotes() {
    this.data.notes = {};
    this.persist();
  }

  // Сам запис нотатки рівня не містить, тому рівень беремо з банку завдань.
  notedCountForLevel(level) {
    return this.tasks.filter((task) => task.level === level && this.hasNote(task.id)).length;
  }

  registerSolved(task) {
    this.data.solved[task.id] = { status: 'solved', level: task.level };
    this.persist();
  }

  registerGaveUp(task) {
    if (!this.isSolved(task.id)) {
      this.data.solved[task.id] = { status: 'revealed', level: task.level };
    }
    this.persist();
  }

  // «Почати заново»: знімає проходження курсу, але лишає нотатки. Вони —
  // власні висновки користувача, а не прогрес, і відновити їх нізвідки,
  // тоді як розв'язати завдання можна вдруге.
  resetProgress() {
    this.data = { ...emptyState(), notes: this.data.notes };
    this.persist();
  }

  persist() {
    saveState(this.data);
  }
}
