import { icon, escapeHtml } from '../utils/dom.js';

// levels: [{ level, name, total, solved, noteCount }]
export function levelSelectHtml(levels) {
  return `
    <div class="level-select">
      <h2 class="level-select__title">Оберіть рівень</h2>
      <div class="level-select__grid">
        ${levels.map(levelCardHtml).join('')}
      </div>
    </div>
  `;
}

function levelCardHtml({ level, name, total, solved, noteCount }) {
  const done = total > 0 && solved === total;
  const fillPercent = total > 0 ? (solved / total) * 100 : 0;

  return `
    <button class="level-card ${done ? 'level-card--done' : ''}" data-level="${level}">
      <span class="level-card__head">
        <span class="level-card__number">${icon('i-target')}Рівень ${level}</span>
        ${done ? `<span class="level-card__done">${icon('i-check')}пройдено</span>` : ''}
      </span>
      <span class="level-card__name">${escapeHtml(name)}</span>
      <span class="level-card__bar">
        <span class="level-card__fill" style="width: ${fillPercent}%"></span>
      </span>
      <span class="level-card__progress">${Math.round(fillPercent)}%</span>
      ${noteCount > 0 ? `<span class="level-card__notes">Нотаток: ${noteCount}</span>` : ''}
    </button>
  `;
}

// Обробники приходять об'єктом, а не позиційними аргументами: кнопок на екрані
// вже три, і четвертий поспіль колбек читався б як загадка.
// Кнопки «Мій прогрес» і «Мої нотатки» переїхали в шапку, тож тут лишився
// єдиний обробник — вибір рівня.
export function renderLevelSelect(root, levels, onPick) {
  root.innerHTML = levelSelectHtml(levels);

  root.querySelectorAll('[data-level]').forEach((card) => {
    card.addEventListener('click', () => onPick(Number(card.dataset.level)));
  });
}
