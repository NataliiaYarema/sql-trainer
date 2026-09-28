import { icon, escapeHtml } from '../utils/dom.js';
import { isLang, getLanguage, t, LANGS, LANG_NAMES } from '../i18n/index.js';

// Маршрути в hash, а не в шляху: сайт роздається як статика без сервера, і
// /notes новою вкладкою дав би 404. Hash обробляє сама сторінка.
//
// Мова — перший сегмент: посиланням на конкретну мову можна поділитися, і
// перезавантаження її не губить. Другий сегмент — екран, і назви лишилися ті
// самі, що були до появи мови, тому стара закладка виду #/notes не ламається.
const SEGMENTS = { home: '', sandbox: 'sandbox', dashboard: 'progress', notes: 'notes' };

const SCREEN_BY_SEGMENT = {
  '': 'home',
  sandbox: 'sandbox',
  progress: 'dashboard',
  notes: 'notes',
};

export function routeFor(lang, screen) {
  return `#/${lang}/${SEGMENTS[screen] ?? ''}`;
}

// Віддає мову окремо від екрана й не вигадує її сам: коли в адресі мови немає
// (стара закладка) або вона невідома, тут null, а вибір роблять сховище й
// DEFAULT_LANG у main.js.
//
// Невідома мова веде на головну разом з усім рештою рядка: витягувати екран
// з-під зламаного префікса (#/fr/notes) означало б окрему гілку заради
// випадку, який виникає лише з описки в адресному рядку.
export function parseRoute(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/');
  const lang = isLang(parts[0]) ? parts[0] : null;
  const segment = lang ? (parts[1] ?? '') : parts[0];
  return { lang, screen: SCREEN_BY_SEGMENT[segment] ?? 'home' };
}

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

// Нативний <select>, а не власний попап: клавіатура, вибір на телефоні й
// доступність працюють самі. Власний список вимагав би коду на відкривання,
// закривання, Escape і клік поза межами — і все це заради тієї самої дії.
//
// Мови підписані самоназвами, а не перекладом на поточну: так свою мову
// знаходить той, хто поточної не розуміє.
export function languageSelectHtml(currentLang) {
  const options = LANGS.map(
    (lang) =>
      `<option value="${lang}"${lang === currentLang ? ' selected' : ''}>${escapeHtml(LANG_NAMES[lang])}</option>`
  ).join('');

  return `
    <select class="lang-select" data-action="lang" aria-label="${escapeHtml(t('nav.language'))}">
      ${options}
    </select>
  `;
}

export function bindLanguageSelect(root, onPick) {
  root.querySelector('[data-action="lang"]')?.addEventListener('change', (event) => {
    onPick(event.target.value);
  });
}

export function progressHtml({ levelName, showBack, active }) {
  const lang = getLanguage();

  return `
    <div class="progress">
      ${levelName ? `<span class="progress__level">${escapeHtml(levelName)}</span>` : ''}
      <div class="progress__nav">
        ${active === 'sandbox' ? '' : navLink(routeFor(lang, 'sandbox'), 'sandbox', 'i-table', t('nav.sandbox'))}
        ${
          active === 'dashboard'
            ? ''
            : navLink(routeFor(lang, 'dashboard'), 'dashboard', 'i-award', t('nav.progress'))
        }
        ${active === 'notes' ? '' : navLink(routeFor(lang, 'notes'), 'notes', 'i-note', t('nav.notes'))}
        ${
          showBack
            ? `
              <a class="btn btn--ghost btn--back" href="${routeFor(lang, 'home')}" data-action="to-home">
                ${icon('i-arrow-left')}${escapeHtml(t('nav.home'))}
              </a>
            `
            : ''
        }
        ${languageSelectHtml(lang)}
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

  // Перемикач мови — не посилання, а <select>, тому йде окремо від bindNav:
  // у нього подія change, і скасовувати default нема чого.
  bindLanguageSelect(root, (lang) => handlers.onPickLanguage?.(lang));
}

export function bindBackHome(root, onBack) {
  bindNav(root.querySelector('[data-action="to-home"]'), onBack);
}
