import { icon, escapeHtml } from '../utils/dom.js';
import { askConfirm } from './confirmDialog.js';

// entries: [{ taskId, level, levelName, index, title, context, taskText, note }] —
// уже відсортовані за рівнем і номером завдання, модуль лише групує.
export function notesScreenHtml(entries) {
  const body =
    entries.length === 0
      ? `<p class="notes-screen__empty">Тут поки що порожньо. Додавай нотатки до завдань, щоб легко повертатися до власних ідей! Відкрий будь-яке завдання, розгорни блок «Моя нотатка» — і запиши свій висновок або альтернативне рішення.</p>`
      : groupsOf(entries).map(groupHtml).join('');

  // Видаляти всі нема сенсу пропонувати, коли видаляти нічого.
  const dangerZone =
    entries.length === 0
      ? ''
      : `
      <div class="notes-screen__danger">
        <button class="btn btn--danger" data-action="delete-all-notes">
          ${icon('i-x')}Видалити всі
        </button>
      </div>`;

  return `
    <div class="notes-screen">
      <div class="notes-screen__head">
        <span class="level-pill">${icon('i-note')}Мої нотатки</span>
      </div>
      <h2 class="notes-screen__title">Нотатки до завдань</h2>
      ${body}
      <div class="notes-screen__actions">
        <button class="btn btn--ghost" data-action="to-home">
          ${icon('i-arrow-left')}На головну
        </button>
      </div>
      ${dangerZone}
    </div>
  `;
}

// Записи вже впорядковані, тому групувати достатньо послідовним проходом.
function groupsOf(entries) {
  const groups = [];
  entries.forEach((entry) => {
    const last = groups.at(-1);
    if (last && last.level === entry.level) {
      last.items.push(entry);
    } else {
      groups.push({ level: entry.level, levelName: entry.levelName, items: [entry] });
    }
  });
  return groups;
}

function groupHtml({ level, levelName, items }) {
  return `
    <section class="notes-group">
      <h3 class="notes-group__title">Рівень ${level} · ${escapeHtml(levelName)}</h3>
      ${items.map(entryHtml).join('')}
    </section>
  `;
}

function entryHtml({ taskId, level, index, title, context, taskText, note }) {
  return `
    <article class="note-entry">
      <div class="note-entry__head">
        <span>Завдання ${index + 1} · ${escapeHtml(title)}</span>
        <button
          class="note-entry__delete"
          data-action="delete-note"
          data-note-id="${escapeHtml(taskId)}"
          title="Видалити цю нотатку"
          aria-label="Видалити нотатку до завдання ${index + 1}"
        >${icon('i-x')}</button>
      </div>
      <div class="note-entry__note">${escapeHtml(note)}</div>
      <details class="note-entry__condition">
        <summary>Показати умову</summary>
        <div class="note-entry__block">
          <div class="section-label">${icon('i-briefcase')}Бізнес-контекст</div>
          <div class="note-entry__text">${escapeHtml(context)}</div>
        </div>
        <div class="note-entry__block">
          <div class="section-label">${icon('i-target')}Завдання</div>
          <div class="note-entry__text">${escapeHtml(taskText)}</div>
        </div>
      </details>
      <button class="btn btn--primary" data-level="${level}" data-index="${index}">
        Перейти до завдання${icon('i-arrow-right')}
      </button>
    </article>
  `;
}

export function renderNotesScreen(root, entries, handlers) {
  root.innerHTML = notesScreenHtml(entries);

  root.querySelectorAll('[data-index]').forEach((button) => {
    button.addEventListener('click', () =>
      handlers.onOpenTask(Number(button.dataset.level), Number(button.dataset.index))
    );
  });

  // Одну нотатку прибираємо без підтвердження: втрата невелика й очевидна,
  // а зайве вікно на кожен хрестик дратувало б. Усі разом — питаємо.
  root.querySelectorAll('[data-action="delete-note"]').forEach((button) => {
    button.addEventListener('click', () => handlers.onDeleteNote(button.dataset.noteId));
  });

  root.querySelector('[data-action="delete-all-notes"]')?.addEventListener('click', async () => {
    const confirmed = await askConfirm({
      title: 'Видалити всі нотатки?',
      note: 'Цю дію не можна буде скасувати.',
      confirmLabel: 'Видалити',
    });
    if (confirmed) handlers.onDeleteAllNotes();
  });

  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
