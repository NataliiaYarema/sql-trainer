import { icon, escapeHtml } from '../utils/dom.js';

// Маршрути в hash, а не в шляху: сайт роздається як статика без сервера, і
// /notes новою вкладкою дав би 404. Hash обробляє сама сторінка.
export const NAV_ROUTES = {
  home: '#/',
  sandbox: '#/sandbox',
  dashboard: '#/progress',
  notes: '#/notes',
};

// Лічильник розв'язаних із шапки прибрано: його місце зайняла навігація.
// Кнопки «Мій прогрес» і «Мої нотатки» показуються на всіх екранах, щоб із
// завдання можна було зазирнути в дашборд, не виходячи спершу на головну.
// Кнопку виходу вмикає окремий showBack: вона потрібна не лише в режимі
// завдань, а й на теорії та нотатках, і не потрібна на головній.
// active — екран, на якому ми зараз ('dashboard' | 'notes' | 'sandbox'). Його
// кнопка в шапці не малюється: вона вела б туди, де користувач уже є.
//
// Пункти шапки — <a href>, а не <button>: лише посилання браузер уміє
// відкрити правою кнопкою в новій вкладці чи вікні. Перехід усередині
// сторінки все одно робить JS (див. bindNav), href потрібен новій вкладці.
function navLink(route, action, iconId, label) {
  return `
    <a class="btn btn--ghost" href="${route}" data-action="${action}">
      ${icon(iconId)}${label}
    </a>
  `;
}

export function progressHtml({ levelName, showBack, active }) {
  return `
    <div class="progress">
      ${levelName ? `<span class="progress__level">${escapeHtml(levelName)}</span>` : ''}
      <div class="progress__nav">
        ${active === 'sandbox' ? '' : navLink(NAV_ROUTES.sandbox, 'sandbox', 'i-table', 'Пісочниця')}
        ${
          active === 'dashboard'
            ? ''
            : navLink(NAV_ROUTES.dashboard, 'dashboard', 'i-award', 'Мій прогрес')
        }
        ${active === 'notes' ? '' : navLink(NAV_ROUTES.notes, 'notes', 'i-note', 'Мої нотатки')}
        ${
          showBack
            ? `
              <a class="btn btn--ghost btn--back" href="${NAV_ROUTES.home}" data-action="to-home">
                ${icon('i-arrow-left')}На головну
              </a>
            `
            : ''
        }
      </div>
    </div>
  `;
}

// Звичайний клік обробляє застосунок, тому default скасовуємо. А клік із
// Ctrl/Shift/Alt/⌘ або середньою кнопкою лишаємо браузеру — саме ним
// відкривають нову вкладку чи вікно, і preventDefault це вбив би.
export function bindNav(element, handler) {
  element?.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    handler();
  });
}

export function renderProgress(root, options, handlers = {}) {
  root.innerHTML = progressHtml(options);

  // Пункту може не бути — на своєму ж екрані він не малюється, тому bindNav
  // мовчки приймає null.
  bindNav(root.querySelector('[data-action="dashboard"]'), () => handlers.onOpenDashboard?.());
  bindNav(root.querySelector('[data-action="notes"]'), () => handlers.onOpenNotes?.());
  bindNav(root.querySelector('[data-action="sandbox"]'), () => handlers.onOpenSandbox?.());
}

export function bindBackHome(root, onBack) {
  bindNav(root.querySelector('[data-action="to-home"]'), onBack);
}
