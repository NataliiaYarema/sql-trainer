import { icon, escapeHtml, dedent } from '../utils/dom.js';
import { highlightSql } from './sqlHighlight.js';
import { t } from '../i18n/index.js';
import { openLinkHtml } from './certificate.js';
import { bindNav } from './progressBar.js';

// Фрази беруться зі словника при кожному показі, а не один раз на завантаження
// модуля: інакше після зміни мови вікно перевірки лишалося б попередньою.
//
// Жодна фраза не відсилає «нижче» й не обіцяє розбору: під нею порожньо,
// а розв'язок показує лише кнопка «Показати відповідь».
export function successPhrases() {
  return t('feedback.success');
}

export function failurePhrases() {
  return t('feedback.failure');
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function solutionBlock(task) {
  return `
    <div class="feedback__section">
      <div class="section-label">${icon('i-book')}${escapeHtml(t('feedback.solution'))}</div>
      <pre class="solution-sql"><code>${highlightSql(dedent(task.referenceSql))}</code></pre>
      <div class="feedback__section">
        <div class="section-label">${icon('i-bulb')}${escapeHtml(t('feedback.explanation'))}</div>
        <p class="feedback__explanation">${escapeHtml(task.explanation)}</p>
      </div>
    </div>
  `;
}

// Вікно перевірки — це вирок, а не розбір: сама фраза й нічого більше.
// Пояснення завдання й еталонний запит лишилися там, де користувач просить їх
// свідомо: у renderGiveUp. Через це обидві функції не потребують task.
//
// Кнопка сертифіката — єдине, що може з'явитися під фразою, і лише в момент
// видачі (onOpenCertificate приходить тільки тоді, коли registerSolved щойно
// видав чи підвищив сертифікат).
export function renderSuccess(root, { onOpenCertificate } = {}) {
  root.innerHTML = `
    <div class="feedback feedback--success">
      <div class="feedback__head">${icon('i-check')}${escapeHtml(pick(successPhrases()))}</div>
      ${onOpenCertificate ? `<div class="feedback__action">${openLinkHtml(t('certificate.get'))}</div>` : ''}
    </div>
  `;
  if (onOpenCertificate)
    bindNav(root.querySelector('[data-action="certificate"]'), onOpenCertificate);
}

export function renderFailure(root) {
  root.innerHTML = `
    <div class="feedback feedback--error">
      <div class="feedback__head">${icon('i-x')}${escapeHtml(pick(failurePhrases()))}</div>
    </div>
  `;
}

export function renderSqlError(root, message) {
  root.innerHTML = `
    <div class="feedback feedback--warning">
      <div class="feedback__head">${icon('i-x')}${escapeHtml(t('feedback.queryFailed'))}</div>
      <p class="feedback__text">${escapeHtml(message)}</p>
    </div>
  `;
}

export function renderGiveUp(root, task) {
  root.innerHTML = `
    <div class="feedback feedback--warning">
      <div class="feedback__head">${icon('i-flag')}${escapeHtml(t('feedback.giveUpHead'))}</div>
      <p class="feedback__text">${escapeHtml(t('feedback.giveUpText'))}</p>
      ${solutionBlock(task)}
    </div>
  `;
}

export function clearFeedback(root) {
  root.innerHTML = '';
}
