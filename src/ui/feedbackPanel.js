import { icon, escapeHtml, dedent } from '../utils/dom.js';
import { highlightSql } from './sqlHighlight.js';

const SUCCESS_PHRASES = [
  'Точно в ціль!',
  'Саме так це і роблять аналітики.',
  'Чудова робота!',
  'Запит правильний — рухаємось далі.',
  'Ідеально. Наступний рівень чекає.',
];

const FAILURE_PHRASES = [
  'Ще не те — але ви вже близько.',
  'Не зовсім. Розберімо, як мало бути.',
  'Спробуйте ще раз, тепер з підказкою нижче.',
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

export function renderSuccess(root, { task }) {
  root.innerHTML = `
    <div class="feedback feedback--success">
      <div class="feedback__head">${icon('i-check')}${escapeHtml(pick(SUCCESS_PHRASES))}</div>
      <p class="feedback__text">${escapeHtml(task.explanation)}</p>
    </div>
  `;
}

export function renderFailure(root, { task, reason }) {
  root.innerHTML = `
    <div class="feedback feedback--error">
      <div class="feedback__head">${icon('i-x')}${escapeHtml(pick(FAILURE_PHRASES))}</div>
      <p class="feedback__text">${escapeHtml(reason)}</p>
      ${solutionBlock(task)}
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
      <p class="feedback__text">Розберіть запит нижче — і спробуйте написати його самостійно на схожому завданні.</p>
      ${solutionBlock(task)}
    </div>
  `;
}

export function clearFeedback(root) {
  root.innerHTML = '';
}
