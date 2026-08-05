import { icon, escapeHtml } from '../utils/dom.js';

// Скільки показувати підтвердження після натискання «Зберегти».
const SAVED_LABEL_MS = 2000;

let savedTimer = null;

// Підпис кнопки збереження. Винесений окремо, бо підтвердження ставиться
// точковою заміною тексту кнопки, а не перерендером панелі — інакше поле
// нотатки втрачало б фокус і позицію курсора просто під час набору.
export function saveButtonLabel(justSaved) {
  return `${icon('i-check')}${justSaved ? 'Збережено' : 'Зберегти'}`;
}

// Нативний <details> дає згортання й доступність без власного JS — стан
// «розгорнуто» приходить ззовні, бо панель перерендерюється при зміні завдання.
export function notePanelHtml({ text, isOpen }) {
  return `
    <details class="note-panel"${isOpen ? ' open' : ''}>
      <summary class="note-panel__summary">
        ${icon('i-note')}Моя нотатка${text === '' ? '' : '<span class="note-panel__dot"></span>'}
      </summary>
      <textarea
        class="note-panel__text"
        rows="6"
        placeholder="Коментар, висновок або альтернативне рішення…"
      >${escapeHtml(text)}</textarea>
      <div class="note-panel__actions">
        <button class="btn btn--ghost" data-action="save-note">
          ${saveButtonLabel(false)}
        </button>
        <button class="btn btn--ghost" data-action="insert-query">
          ${icon('i-play')}Вставити мій запит
        </button>
      </div>
    </details>
  `;
}

export function renderNotePanel(root, state, handlers) {
  // Панель перемальовується при зміні завдання, тож таймер від попередньої
  // кнопки треба зняти: інакше він смикав би вузол, якого вже немає в DOM.
  clearTimeout(savedTimer);
  root.innerHTML = notePanelHtml(state);

  const details = root.querySelector('.note-panel');
  const textarea = root.querySelector('.note-panel__text');
  const saveButton = root.querySelector('[data-action="save-note"]');

  textarea.addEventListener('input', () => {
    // Текст змінився — підтвердження більше не відповідає дійсності.
    clearTimeout(savedTimer);
    saveButton.innerHTML = saveButtonLabel(false);
    saveButton.classList.remove('btn--saved');
    handlers.onInput(textarea.value);
  });
  details.addEventListener('toggle', () => handlers.onToggle(details.open));
  root
    .querySelector('[data-action="insert-query"]')
    .addEventListener('click', handlers.onInsertQuery);

  saveButton.addEventListener('click', () => {
    handlers.onSave();
    saveButton.innerHTML = saveButtonLabel(true);
    saveButton.classList.add('btn--saved');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      saveButton.innerHTML = saveButtonLabel(false);
      saveButton.classList.remove('btn--saved');
    }, SAVED_LABEL_MS);
  });
}
