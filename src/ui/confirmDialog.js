import { escapeHtml } from '../utils/dom.js';

// Власне вікно підтвердження замість нативного confirm(). Причина одна й
// вагома: у нативного кнопки називаються OK і Cancel, і перейменувати їх
// браузер не дозволяє. «OK» на питання «Очистити весь прогрес?» — найгірший
// момент, щоб змушувати людину здогадуватися, що вона підтверджує.
export function confirmDialogHtml({ title, note, confirmLabel }) {
  return `
    <div class="modal__box" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <h3 class="modal__title">${escapeHtml(title)}</h3>
      <p class="modal__note">${escapeHtml(note)}</p>
      <div class="modal__actions">
        <button class="btn btn--ghost" data-action="cancel">Скасувати</button>
        <button class="btn btn--danger" data-action="confirm">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>
  `;
}

// Повертає Promise<boolean>, тому виклик читається як звичайне питання:
// `if (await askConfirm(...))`. document чіпаємо лише всередині функції —
// модуль імпортується і в node-тестах, де DOM немає.
export function askConfirm({ title, note, confirmLabel }) {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    host.className = 'modal';
    host.innerHTML = confirmDialogHtml({ title, note, confirmLabel });
    document.body.appendChild(host);

    const previouslyFocused = document.activeElement;

    function close(result) {
      document.removeEventListener('keydown', onKeyDown);
      host.remove();
      previouslyFocused?.focus?.();
      resolve(result);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') close(false);
    }

    host.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    host.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));

    // Клік повз вікно — теж відмова: звичний спосіб вийти, і він безпечний,
    // бо веде до «нічого не сталося».
    host.addEventListener('click', (event) => {
      if (event.target === host) close(false);
    });

    document.addEventListener('keydown', onKeyDown);

    // Фокус на відмові, а не на підтвердженні: Enter одразу після відкриття
    // не має знищувати дані.
    host.querySelector('[data-action="cancel"]').focus();
  });
}
