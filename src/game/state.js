import { loadState, saveState } from './persistence.js';
import {
  certificateStatus,
  nextCertificate,
  localDateString,
  isCertificateRecord,
} from './certificate.js';

// Чернетки лежать у тому самому ключі localStorage, що й прогрес. Без обмеження
// одна вставлена величезна чернетка могла б вичерпати квоту сховища — saveState
// тоді тихо ловить QuotaExceededError, і прогрес перестає зберігатися взагалі.
const MAX_DRAFT_LENGTH = 10000;
const MAX_NOTE_LENGTH = 10000;

function emptyState() {
  return { solved: {}, drafts: {}, notes: {}, certificate: null };
}

// Зі сховища беремо лише `solved`, `drafts`, `notes` і `certificate` — старі збереження
// містять поля прибраної гейміфікації (бали, серія, відзнаки), і тягнути їх далі немає
// сенсу. `certificate` — запис отриманого сертифіката.
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
    certificate: isCertificateRecord(loaded.certificate) ? loaded.certificate : null,
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

  // Слід підглядання не стирається розв'язанням: інакше «спершу подивитися
  // відповідь, потім ввести її» нічим не відрізнялося б від самостійного
  // розв'язання, і сертифікат з відзнакою нічого б не означав.
  registerSolved(task, today = localDateString()) {
    const peeked = this.data.solved[task.id]?.peeked === true;
    this.data.solved[task.id] = { status: 'solved', level: task.level, ...(peeked && { peeked }) };
    const change = this.updateCertificate(today);
    this.persist();
    return change;
  }

  // peeked ставиться й на вже розв'язаному: подивитися еталон після власного
  // розв'язання — теж підглядання, і на майбутню відзнаку воно впливає.
  registerGaveUp(task) {
    const record = this.data.solved[task.id];
    this.data.solved[task.id] = this.isSolved(task.id)
      ? { ...record, peeked: true }
      : { status: 'revealed', level: task.level, peeked: true };
    this.persist();
  }

  get certificate() {
    return this.data.certificate;
  }

  certificateStatus() {
    return certificateStatus(this.tasks, this.data.solved);
  }

  // Повертає, що сталося, — вікну успіху треба знати, чи показати кнопку
  // «Отримати сертифікат».
  updateCertificate(today) {
    const before = this.data.certificate;
    const after = nextCertificate(before, this.certificateStatus().tier, today);
    if (after === before) return null;
    this.data.certificate = after;
    return before ? 'upgraded' : 'awarded';
  }

  // «Почати заново»: знімає проходження курсу, але лишає нотатки. Вони —
  // власні висновки користувача, а не прогрес, і відновити їх нізвідки,
  // тоді як розв'язати завдання можна вдруге. Сертифікат скидається разом
  // із прогресом: новий прохід — новий сертифікат.
  resetProgress() {
    this.data = { ...emptyState(), notes: this.data.notes };
    this.persist();
  }

  persist() {
    saveState(this.data);
  }
}
