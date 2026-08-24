import { icon, escapeHtml } from '../utils/dom.js';
import { LEVELS } from '../tasks/index.js';

// Відмітка стоїть лише там, де вміння справді здобуте; решта показується
// приглушено. Екран не має стверджувати «ви вмієте» тому, хто пʼять разів
// натиснув «Здатися».
function skillsHtml(skills) {
  if (skills.length === 0) return '';

  return `
    <div class="final-screen__skills">
      <h3 class="final-screen__skills-title">Ти тепер вмієш</h3>
      <ul class="skill-items">
        ${skills
          .map(
            ({ text, done }) => `
          <li class="skill-item ${done ? 'skill-item--done' : ''}">
            <span class="skill-item__mark">${done ? '✓' : '·'}</span>
            ${escapeHtml(text)}
          </li>`
          )
          .join('')}
      </ul>
    </div>
  `;
}

export function levelCompleteHtml({ level, name, solved, total, skills = [] }) {
  const hasNextLevel = level !== LEVELS.at(-1);
  const allSolved = solved === total;

  return `
    <div class="final-screen">
      <div class="final-screen__icon">${icon('i-award')}</div>
      <h2 class="final-screen__title">Рівень ${level} пройдено</h2>
      <p class="final-screen__text">
        ${escapeHtml(name)} — розв'язано ${solved} з ${total} завдань.
        ${allSolved ? '' : 'До решти можна повернутися будь-коли.'}
      </p>
      ${skillsHtml(skills)}
      <div class="final-screen__actions">
        ${
          hasNextLevel
            ? `<button class="btn btn--primary" data-action="next-level">
                Рівень ${level + 1}${icon('i-arrow-right')}
              </button>`
            : ''
        }
        <button class="btn btn--ghost" data-action="to-home">
          ${icon('i-arrow-left')}На головну
        </button>
      </div>
    </div>
  `;
}

export function renderLevelComplete(root, summary, handlers) {
  root.innerHTML = levelCompleteHtml(summary);

  root.querySelector('[data-action="next-level"]')?.addEventListener('click', handlers.onNextLevel);
  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
