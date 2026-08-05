import { icon, escapeHtml } from '../utils/dom.js';

// Лічильник розв'язаних із шапки прибрано: його місце зайняла навігація.
// Кнопки «Мій прогрес» і «Мої нотатки» показуються на всіх екранах, щоб із
// завдання можна було зазирнути в дашборд, не виходячи спершу на головну.
// Кнопку виходу вмикає окремий showBack: вона потрібна не лише в режимі
// завдань, а й на теорії та нотатках, і не потрібна на головній.
// active — екран, на якому ми зараз ('dashboard' | 'notes' | 'sandbox'). Його
// кнопка в шапці не малюється: вона вела б туди, де користувач уже є.
export function progressHtml({ levelName, showBack, active }) {
  return `
    <div class="progress">
      ${levelName ? `<span class="progress__level">${escapeHtml(levelName)}</span>` : ''}
      <div class="progress__nav">
        ${
          active === 'sandbox'
            ? ''
            : `<button class="btn btn--ghost" data-action="sandbox">
                ${icon('i-table')}Пісочниця
              </button>`
        }
        ${
          active === 'dashboard'
            ? ''
            : `<button class="btn btn--ghost" data-action="dashboard">
                ${icon('i-award')}Мій прогрес
              </button>`
        }
        ${
          active === 'notes'
            ? ''
            : `<button class="btn btn--ghost" data-action="notes">
                ${icon('i-note')}Мої нотатки
              </button>`
        }
        ${
          showBack
            ? `<button class="btn btn--ghost btn--back" data-action="to-home">
                ${icon('i-arrow-left')}На головну
              </button>`
            : ''
        }
      </div>
    </div>
  `;
}

export function renderProgress(root, options, handlers = {}) {
  root.innerHTML = progressHtml(options);

  // Кнопки може не бути — на своєму ж екрані вона не малюється, тому ?.
  root
    .querySelector('[data-action="dashboard"]')
    ?.addEventListener('click', () => handlers.onOpenDashboard?.());
  root
    .querySelector('[data-action="notes"]')
    ?.addEventListener('click', () => handlers.onOpenNotes?.());
  root
    .querySelector('[data-action="sandbox"]')
    ?.addEventListener('click', () => handlers.onOpenSandbox?.());
}

export function bindBackHome(root, onBack) {
  root.querySelector('[data-action="to-home"]')?.addEventListener('click', onBack);
}
