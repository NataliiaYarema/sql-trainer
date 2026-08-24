import { icon, escapeHtml } from '../utils/dom.js';
import { topicKeywords } from '../theory/topics.js';
import { highlightSql } from './sqlHighlight.js';
import { resultTableHtml } from './resultTable.js';

// Кнопка «Виконати запит» переносить SQL у пісочницю. Запит передається
// індексом блоку в темі, а не текстом у data-атрибуті: SQL довелося б
// екранувати в HTML і розбирати назад, а індекс однозначний і короткий.
function runButtonHtml(action, indexAttr, index) {
  return `
    <div class="theory-run">
      <button class="btn btn--ghost" data-action="${action}" ${indexAttr}="${index}">
        ${icon('i-play')}Виконати запит
      </button>
    </div>
  `;
}

function caseHtml(item, index) {
  return `
    <article class="theory-case">
      <h3 class="theory-case__title">${escapeHtml(item.title)}</h3>
      <dl class="theory-case__meta">
        <dt>Про що</dt>
        <dd>${escapeHtml(item.about)}</dd>
        <dt>Коли потрібен</dt>
        <dd>${escapeHtml(item.whenNeeded)}</dd>
      </dl>
      <blockquote class="theory-case__question">
        ${escapeHtml(item.question)}
      </blockquote>

      <pre class="sql-block"><code>${highlightSql(item.sql)}</code></pre>
      ${runButtonHtml('run-case', 'data-case-index', index)}
      <ol class="theory-case__steps">
        ${item.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
      </ol>
      ${resultTableHtml(item.result, { label: 'Результат' })}
      <p class="theory-case__reading">${escapeHtml(item.reading)}</p>

      <div class="theory-case__watch">
        <div class="theory-case__watch-label">На що звернути увагу</div>
        <ul>
          ${item.watchOut.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
        </ul>
      </div>
    </article>
  `;
}

export function theoryTopicHtml(topic) {
  return `
    <div class="theory-topic">
      <div class="theory-topic__head">
        <span class="level-pill">${icon('i-book')}Теорія · рівень ${topic.level}</span>
      </div>

      <h2 class="theory-topic__title">
        ${escapeHtml(topic.title)}:
        <span class="theory-topic__keywords">${escapeHtml(topic.subtitle ?? topicKeywords(topic))}</span>
      </h2>
      <p class="theory-topic__summary">${escapeHtml(topic.summary)}</p>
      ${summaryExtrasHtml(topic)}

      ${
        topic.cases
          ? `<div class="task-section">
        <div class="section-label">${icon('i-play')}Як це розбирають на роботі</div>
        <div class="theory-cases">
          ${topic.cases.map(caseHtml).join('')}
        </div>
      </div>`
          : `<div class="task-section">
        <div class="section-label">${icon('i-play')}Як це виглядає</div>
        <div class="theory-examples">
          ${topic.examples.map(exampleHtml).join('')}
        </div>
      </div>`
      }

      <div class="task-section">
        <div class="section-label">${icon('i-bulb')}На чому спотикаються</div>
        <div class="theory-pitfalls">
          ${topic.pitfalls.map(pitfallHtml).join('')}
        </div>
      </div>

      ${
        topic.tips
          ? `<div class="task-section">
        <div class="section-label">${icon('i-bulb')}Практичні поради</div>
        <ul class="theory-tips">
          ${topic.tips
            .map(
              (tip) => `<li>
                ${escapeHtml(tip.text)}
                ${
                  tip.sql
                    ? `<pre class="sql-block"><code>${highlightSql(tip.sql)}</code></pre>`
                    : ''
                }
              </li>`
            )
            .join('')}
        </ul>
      </div>`
          : ''
      }

      <div class="theory-topic__actions">
        <button class="btn btn--primary" data-action="to-practice">
          Практика: Рівень ${topic.level}${icon('i-arrow-right')}
        </button>
        <button class="btn btn--ghost" data-action="to-home">
          ${icon('i-arrow-left')}На головну
        </button>
      </div>
    </div>
  `;
}

function summaryExtrasHtml(topic) {
  if (!topic.summaryBlocks) return '';
  return topic.summaryBlocks.map(summaryBlockHtml).join('');
}

function summaryBlockHtml(block) {
  if (Array.isArray(block)) {
    return `
      <ul class="theory-topic__points">
        ${block.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
      </ul>
    `;
  }
  return `<p class="theory-topic__note">${escapeHtml(block)}</p>`;
}

function exampleHtml({ label, sql, result }, index) {
  return `
    <div class="theory-example">
      <div class="theory-example__label">${escapeHtml(label)}</div>
      <pre class="theory-example__sql"><code>${highlightSql(sql)}</code></pre>
      ${runButtonHtml('run-example', 'data-example-index', index)}
      <div class="theory-example__result">${escapeHtml(result)}</div>
    </div>
  `;
}

function pitfallHtml({ title, text, wrongSql, rightSql }) {
  return `
    <div class="theory-pitfall">
      <div class="theory-pitfall__title">${escapeHtml(title)}</div>
      <div class="theory-pitfall__text">${escapeHtml(text)}</div>
      ${
        wrongSql
          ? `<div class="pitfall-snippet pitfall-snippet--wrong">
               <pre class="sql-block"><code>${highlightSql(wrongSql)}</code></pre>
             </div>`
          : ''
      }
      ${
        rightSql
          ? `<div class="pitfall-snippet pitfall-snippet--right">
               <pre class="sql-block"><code>${highlightSql(rightSql)}</code></pre>
             </div>`
          : ''
      }
    </div>
  `;
}

export function renderTheoryTopic(root, topic, handlers) {
  root.innerHTML = theoryTopicHtml(topic);

  // Тема або з прикладами, або з кейсами — беремо той список, який є.
  root.querySelectorAll('[data-action="run-example"]').forEach((button) => {
    button.addEventListener('click', () =>
      handlers.onRunInSandbox(topic.examples[Number(button.dataset.exampleIndex)].sql)
    );
  });
  root.querySelectorAll('[data-action="run-case"]').forEach((button) => {
    button.addEventListener('click', () =>
      handlers.onRunInSandbox(topic.cases[Number(button.dataset.caseIndex)].sql)
    );
  });

  root
    .querySelector('[data-action="to-practice"]')
    .addEventListener('click', handlers.onToPractice);
  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
