import { icon, escapeHtml, dedent } from '../utils/dom.js';
import { highlightSql } from './sqlHighlight.js';

export const SUCCESS_PHRASES = [
  'Точно в ціль!',
  'Саме так це і роблять аналітики.',
  'Чудова робота!',
  'Запит правильний — рухаємось далі.',
  'Ідеально. Наступний рівень чекає.',
];

// Жодна фраза не відсилає «нижче» й не обіцяє розбору: під нею тепер порожньо,
// а розв'язок показує лише кнопка «Показати відповідь».
export const FAILURE_PHRASES = [
  'Ще не те — але ти вже близько.',
  'Не зовсім. Спробуй ще раз або відкрий відповідь.',
  'Результат не збігається з очікуваним.',
  'Помилка — це нормальна частина навчання.',
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function solutionBlock(task) {
  return `
    <div class="feedback__section">
      <div class="section-label">${icon('i-book')}Правильний запит</div>
      <pre class="solution-sql"><code>${highlightSql(dedent(task.referenceSql))}</code></pre>
      <div class="feedback__section">
        <div class="section-label">${icon('i-bulb')}Пояснення</div>
        <p class="feedback__explanation">${escapeHtml(task.explanation)}</p>
      </div>
    </div>
  `;
}

// Вікно перевірки — це вирок, а не розбір: сама фраза й нічого більше.
// Пояснення завдання й еталонний запит лишилися там, де користувач просить їх
// свідомо: у renderGiveUp. Через це обидві функції не потребують task.
export function renderSuccess(root) {
  root.innerHTML = `
    <div class="feedback feedback--success">
      <div class="feedback__head">${icon('i-check')}${escapeHtml(pick(SUCCESS_PHRASES))}</div>
    </div>
  `;
}

export function renderFailure(root) {
  root.innerHTML = `
    <div class="feedback feedback--error">
      <div class="feedback__head">${icon('i-x')}${escapeHtml(pick(FAILURE_PHRASES))}</div>
    </div>
  `;
}

export function renderSqlError(root, message) {
  root.innerHTML = `
    <div class="feedback feedback--warning">
      <div class="feedback__head">${icon('i-x')}Запит не виконався</div>
      <p class="feedback__text">${escapeHtml(message)}</p>
    </div>
  `;
}

export function renderGiveUp(root, task) {
  root.innerHTML = `
    <div class="feedback feedback--warning">
      <div class="feedback__head">${icon('i-flag')}Ось розв'язок цього завдання</div>
      <p class="feedback__text">Розбери запит нижче — і спробуй написати його самостійно на схожому завданні.</p>
      ${solutionBlock(task)}
    </div>
  `;
}

export function clearFeedback(root) {
  root.innerHTML = '';
}
