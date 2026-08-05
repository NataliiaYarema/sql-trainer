import { icon, escapeHtml } from '../utils/dom.js';

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
        <button class="btn btn--ghost" data-action="insert-query">
          ${icon('i-play')}Вставити мій запит
        </button>
      </div>
    </details>
  `;
}

export function renderNotePanel(root, state, handlers) {
  root.innerHTML = notePanelHtml(state);

  const details = root.querySelector('.note-panel');
  const textarea = root.querySelector('.note-panel__text');

  textarea.addEventListener('input', () => handlers.onInput(textarea.value));
  details.addEventListener('toggle', () => handlers.onToggle(details.open));
  root
    .querySelector('[data-action="insert-query"]')
    .addEventListener('click', handlers.onInsertQuery);
}
